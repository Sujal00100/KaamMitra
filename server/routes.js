import { createServer } from "http";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { insertJobSchema, insertApplicationSchema, insertRatingSchema, insertVerificationDocumentSchema } from "../shared/schema.js";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import migrateEmailFields from "./migrate-email-fields.js";
import { sendVerificationEmail, verifyEmail } from "./email-service.js";

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");
    // Make sure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_config });

export async function registerRoutes(app) {
  // Run email verification fields migration
  try {
    await migrateEmailFields();
    console.log("Email verification fields migration completed successfully");
  } catch (error) {
    console.error("Error during email verification migration:", error);
  }
  
  // Set up authentication routes
  setupAuth(app);

  // GET workers
  app.get("/api/workers", async (req, res) => {
    try {
      const skill = req.query.skill;
      let workers;
      
      if (skill) {
        workers = await storage.getWorkersBySkill(skill);
      } else {
        const topRated = req.query.topRated === "true";
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        
        if (topRated) {
          workers = await storage.getTopRatedWorkers(limit);
        } else {
          const workerUsers = await storage.getUsers("worker");
          workers = await Promise.all(workerUsers.map(async (user) => {
            const profile = await storage.getWorkerProfile(user.id);
            return { ...(profile || {}), user };
          }));
        }
      }
      res.json(workers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  // GET worker by ID
  app.get("/api/workers/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid worker ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "worker") {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      const profile = await storage.getWorkerProfile(userId);
      const ratings = await storage.getRatingsByWorker(userId);
      
      res.json({ user, profile, ratings });
    } catch (error) {
      console.error("Error fetching worker:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch worker", error: errorMessage });
    }
  });

  // GET jobs with optional filters
  app.get("/api/jobs", async (req, res) => {
    try {
      const filters = {};
      
      if (req.query.category) {
        filters.category = req.query.category;
      }
      
      if (req.query.location) {
        filters.location = req.query.location;
      }
      
      filters.isActive = req.query.isActive !== "false";
      
      const jobs = await storage.getJobs(filters);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // GET job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Get applications for this job
      const applications = await storage.getApplicationsByJob(jobId);
      
      res.json({ job, applications });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // POST create job
  app.post("/api/jobs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Only employers can post jobs" });
      }
      
      const validatedData = insertJobSchema.parse({
        ...req.body,
        employerId: req.user.id,
      });
      
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // PATCH update job
  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.employer.id !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own jobs" });
      }
      
      const updatedJob = await storage.updateJob(jobId, req.body);
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // GET applications by worker
  app.get("/api/workers/:id/applications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const workerId = parseInt(req.params.id);
      
      if (req.user.id !== workerId && req.user.userType !== "employer") {
        return res.status(403).json({ message: "You can only view your own applications" });
      }
      
      const applications = await storage.getApplicationsByWorker(workerId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // POST apply to job
  app.post("/api/jobs/:id/apply", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "worker") {
        return res.status(403).json({ message: "Only workers can apply for jobs" });
      }
      
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (!job.isActive) {
        return res.status(400).json({ message: "This job is no longer active" });
      }
      
      // Check if already applied
      const applications = await storage.getApplicationsByWorker(req.user.id);
      const alreadyApplied = applications.some(app => app.jobId === jobId);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }
      
      const validatedData = insertApplicationSchema.parse({
        jobId,
        workerId: req.user.id,
      });
      
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to apply for job" });
    }
  });

  // PATCH update application status
  app.patch("/api/applications/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Only the employer who posted the job can update application status
      if (job.employer.id !== req.user.id) {
        return res.status(403).json({ message: "You can only update applications for your own jobs" });
      }
      
      const { status } = req.body;
      if (!["pending", "accepted", "rejected", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // POST create rating
  app.post("/api/ratings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Only employers can rate workers" });
      }
      
      // Validate application completion
      const { workerId, jobId } = req.body;
      const applications = await storage.getApplicationsByJob(jobId);
      const workerApplication = applications.find(app => app.worker.id === workerId);
      
      if (!workerApplication || workerApplication.status !== "completed") {
        return res.status(400).json({ message: "Cannot rate a worker for an incomplete job" });
      }
      
      const validatedData = insertRatingSchema.parse({
        ...req.body,
        employerId: req.user.id,
      });
      
      const rating = await storage.createRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  // GET employer dashboard data
  app.get("/api/employers/dashboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Ensure we have a valid user ID (must be a number)
      const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(req.user.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log("Employer dashboard - authenticated user:", userId, req.user.username);
      
      const jobs = await storage.getJobsByEmployer(userId);
      console.log("Employer jobs found:", jobs.length);
      
      // Get applications for each job
      const jobsWithApplications = await Promise.all(jobs.map(async job => {
        const applications = await storage.getApplicationsByJob(job.id);
        return { ...job, applications };
      }));
      
      res.json({ jobs: jobsWithApplications });
    } catch (error) {
      console.error("Employer dashboard error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch dashboard data", error: errorMessage });
    }
  });

  // Simple worker profile test endpoint
  app.get("/api/workers/profile-test", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Just return basic info without any database calls
    return res.json({
      message: "Profile test endpoint is working",
      user: req.user
    });
  });

  // GET worker dashboard data
  app.get("/api/workers/dashboard", async (req, res) => {
    try {
      console.log("Worker dashboard - authentication check", req.isAuthenticated());
      console.log("Worker dashboard - user:", req.user);
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Just return a static response for testing
      return res.json({
        profile: {
          id: 1,
          userId: 8,
          primarySkill: "Carpentry",
          description: "Skilled carpenter with 8 years of experience",
          isAvailable: true,
          averageRating: 4.5,
          totalRatings: 15,
          verified: true
        },
        applications: [],
        ratings: []
      });
    } catch (error) {
      console.error("Worker dashboard error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch worker dashboard data", error: errorMessage });
    }
  });

  // POST submit verification
  app.post("/api/verification/submit", upload.single('document'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const verificationSchema = z.object({
        govtIdType: z.enum(["aadhar_card", "voter_id", "passport", "driving_license", "pan_card"], {
          required_error: "ID type is required"
        }),
        govtId: z.string().min(1, "Government ID is required"),
        dateOfBirth: z.string().transform(val => new Date(val)),
        address: z.string().min(1, "Address is required"),
      });
      
      // Validate the incoming data
      const data = verificationSchema.parse(req.body);
      
      // Calculate age from date of birth
      const dob = data.dateOfBirth;
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear() - 
        (today.getMonth() < dob.getMonth() || 
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
      
      // Check if age is at least 18
      if (age < 18) {
        return res.status(400).json({ message: "You must be at least 18 years old" });
      }
      
      // Verify document file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "ID document image is required" });
      }
      
      // Check file size (max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ message: "File size exceeds the 5MB limit" });
      }
      
      // Check file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Only JPEG, PNG, and WebP images are allowed" });
      }
      
      // Update user with verification status
      const updatedUser = await storage.updateUserVerification(
        req.user.id, 
        "pending"
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create verification document
      const document = await storage.createVerificationDocument({
        userId: req.user.id,
        documentPath: req.file.path,
        documentType: data.govtIdType,
        govtId: data.govtId,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
      });
      
      res.status(201).json({
        success: true,
        message: "Verification submitted successfully",
        document
      });
    } catch (error) {
      console.error("Verification submission error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification data",
          errors: error.errors
        });
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: "Failed to submit verification",
        error: errorMessage
      });
    }
  });

  // POST verify email
  app.post("/api/verify-email", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const verificationCode = req.body.code;
      
      if (!verificationCode) {
        return res.status(400).json({
          success: false,
          message: "Verification code is required"
        });
      }
      
      const success = await verifyEmail(req.user.id, verificationCode);
      
      if (success) {
        return res.status(200).json({
          success: true,
          message: "Email verified successfully"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification code"
        });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to verify email",
        error: errorMessage
      });
    }
  });

  // POST resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified"
        });
      }
      
      const success = await sendVerificationEmail(user);
      
      if (success) {
        return res.status(200).json({
          success: true,
          message: "Verification email sent successfully"
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email"
        });
      }
    } catch (error) {
      console.error("Resend verification email error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to resend verification email",
        error: errorMessage
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
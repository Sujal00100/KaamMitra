import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertJobSchema, 
  insertApplicationSchema, 
  insertRatingSchema, 
  insertVerificationDocumentSchema,
  insertConversationSchema,
  insertMessageSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import { eq, like, ilike, and, or } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema"; 
import migrateEmailFields from "./migrate-email-fields";
import { sendVerificationEmail, verifyEmail } from "./email-service";
import { getChatbotResponse, getJobRecommendations, getHiringTips } from "./services/openai-service";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Run email verification fields migration
  try {
    await migrateEmailFields();
    console.log("Email verification fields migration completed successfully");
  } catch (error) {
    console.error("Error during email verification migration:", error);
  }
  
  // Set up authentication routes
  setupAuth(app);
  
  // POST delete all users (be careful with this route!)
  app.post("/api/admin/delete-all-users", async (req, res) => {
    try {
      await storage.deleteAllUsers();
      res.json({ message: "All user data deleted successfully" });
    } catch (error) {
      console.error("Error during data deletion:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });
  
  // POST set UPI payment info (admin use)
  app.post("/api/payment/upi", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // In a real application, you'd want to restrict this to admins
      // if (req.user.userType !== "admin") {
      //   return res.status(403).json({ message: "Not authorized" });
      // }
      
      const { upiId } = req.body;
      
      if (!upiId || typeof upiId !== "string") {
        return res.status(400).json({ message: "Valid UPI ID is required" });
      }
      
      // In a real application, you would save this to the database
      // For now, just return success
      res.json({ 
        message: "UPI payment option saved successfully",
        upiId
      });
    } catch (error) {
      console.error("Error saving UPI payment info:", error);
      res.status(500).json({ message: "Failed to save UPI payment information" });
    }
  });
  
  // POST process UPI payment
  app.post("/api/payment/process", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { amount, upiId, recipientId, description } = req.body;
      
      // Validate inputs
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      if (!upiId || typeof upiId !== "string") {
        return res.status(400).json({ message: "Valid UPI ID is required" });
      }
      
      if (!description || typeof description !== "string") {
        return res.status(400).json({ message: "Description is required" });
      }
      
      // In a real application, you would process the payment and store the transaction
      // For now, simulate a successful payment
      
      // Create payment record
      const paymentRecord = {
        id: Date.now(),
        userId: req.user.id,
        amount,
        upiId,
        recipientId: recipientId || null,
        description,
        status: "completed",
        createdAt: new Date().toISOString()
      };
      
      // Return success
      res.json({ 
        message: "Payment processed successfully",
        transaction: paymentRecord
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // GET workers
  app.get("/api/workers", async (req, res) => {
    try {
      const skill = req.query.skill as string | undefined;
      let workers;
      
      if (skill) {
        workers = await storage.getWorkersBySkill(skill);
      } else {
        const topRated = req.query.topRated === "true";
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        
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
      const filters: {
        category?: string,
        location?: string,
        isActive?: boolean
      } = {};
      
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      
      if (req.query.location) {
        filters.location = req.query.location as string;
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
        documentType: data.govtIdType,
        documentNumber: data.govtId,
        documentImageUrl: req.file.path,
      });
      
      res.status(201).json({ 
        message: "Verification submitted successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Verification submission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid verification data", 
          errors: error.errors 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
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
      
      const schema = z.object({
        code: z.string().min(6).max(6)
      });
      
      const { code } = schema.parse(req.body);
      
      // Use our email verification function from email-service.ts
      const success = await verifyEmail(req.user.id, code);
      
      if (success) {
        return res.json({ 
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid verification code format", 
          errors: error.errors 
        });
      }
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
      
      // Get the user
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Check if the user has already verified their email
      if (user.emailVerified) {
        return res.json({
          success: true,
          message: "Email already verified"
        });
      }
      
      // Send a new verification email
      const emailSent = await sendVerificationEmail(user);
      
      if (emailSent) {
        return res.json({
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

  // Chatbot API endpoint
  app.post("/api/chatbot/message", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Message is required and must be a string" 
        });
      }
      
      const response = await getChatbotResponse(message);
      
      return res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to process chatbot message",
        error: errorMessage
      });
    }
  });
  
  // Job recommendations API endpoint
  app.post("/api/chatbot/job-recommendations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "worker") {
        return res.status(403).json({ message: "Only workers can get job recommendations" });
      }
      
      const { primarySkill, location, preferredJobTypes } = req.body;
      
      if (!primarySkill || !location) {
        return res.status(400).json({ 
          success: false, 
          message: "Primary skill and location are required" 
        });
      }
      
      const recommendations = await getJobRecommendations({
        primarySkill,
        location,
        preferredJobTypes
      });
      
      return res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error("Job recommendations error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to get job recommendations",
        error: errorMessage
      });
    }
  });
  
  // Hiring tips API endpoint
  app.post("/api/chatbot/hiring-tips", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Only employers can get hiring tips" });
      }
      
      const { jobTitle, requiredSkills, location } = req.body;
      
      if (!jobTitle || !requiredSkills || !location) {
        return res.status(400).json({ 
          success: false, 
          message: "Job title, required skills, and location are required" 
        });
      }
      
      const tips = await getHiringTips({
        jobTitle,
        requiredSkills,
        location
      });
      
      return res.json({
        success: true,
        tips
      });
    } catch (error) {
      console.error("Hiring tips error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to get hiring tips",
        error: errorMessage
      });
    }
  });

  // Messaging API Routes
  
  // GET conversations for current user
  app.get("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversations = await storage.getConversationsByUser(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch conversations", error: errorMessage });
    }
  });

  // GET single conversation with messages
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant in this conversation
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this conversation" });
      }
      
      // Mark messages as read for this user
      await storage.markMessagesAsRead(conversationId, req.user.id);
      
      // Get the other participant
      const otherParticipantId = conversation.participant1Id === req.user.id 
        ? conversation.participant2Id 
        : conversation.participant1Id;
      
      const otherParticipant = await storage.getUser(otherParticipantId);
      
      // Get messages
      const messages = await storage.getMessagesByConversation(conversationId);
      
      res.json({
        conversation,
        otherParticipant,
        messages
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch conversation", error: errorMessage });
    }
  });

  // POST start new conversation or get existing
  app.post("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { participantId, jobId } = req.body;
      
      if (!participantId) {
        return res.status(400).json({ message: "Participant ID is required" });
      }
      
      const participant = await storage.getUser(participantId);
      
      if (!participant) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if conversation already exists
      let conversation = await storage.getConversationByParticipants(req.user.id, participantId);
      
      if (!conversation) {
        // Create new conversation
        conversation = await storage.createConversation({
          participant1Id: req.user.id,
          participant2Id: participantId,
          jobId: jobId || null
        });
      }
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create conversation", error: errorMessage });
    }
  });

  // POST send message
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant in this conversation
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this conversation" });
      }
      
      const { content } = req.body;
      
      if (!content || typeof content !== "string" || content.trim() === "") {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const message = await storage.createMessage({
        conversationId,
        senderId: req.user.id,
        content,
        metadata: {}
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to send message", error: errorMessage });
    }
  });

  // PATCH mark messages as read
  app.patch("/api/conversations/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant in this conversation
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this conversation" });
      }
      
      await storage.markMessagesAsRead(conversationId, req.user.id);
      res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to mark messages as read", error: errorMessage });
    }
  });
  
  // Search users endpoint (used for messaging)
  app.get("/api/search/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const query = req.query.query as string;
      const userType = req.query.userType as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Perform search in the database using Drizzle ORM
      let conditions = [];
      
      // First condition: username or fullName contains the query string
      conditions.push(
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.fullName, `%${query}%`)
        )
      );
      
      // Second condition: exclude the current user
      conditions.push(
        (users.id != req.user.id)
      );
      
      // Optional third condition: filter by user type if provided
      if (userType === 'worker' || userType === 'employer') {
        conditions.push(
          eq(users.userType, userType)
        );
      }
      
      // Execute the query
      const foundUsers = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          location: users.location,
          userType: users.userType,
        })
        .from(users)
        .where(and(...conditions))
        .limit(10);
      
      res.json(foundUsers);
    } catch (error) {
      console.error("User search error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to search users", error: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

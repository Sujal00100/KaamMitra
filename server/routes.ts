import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertJobSchema, insertApplicationSchema, insertRatingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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

  // GET worker dashboard data
  app.get("/api/workers/dashboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "worker") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Ensure we have a valid user ID (must be a number)
      const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(req.user.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log("Worker dashboard - authenticated user:", userId, req.user.username);
      
      // Check if profile exists, if not create default profile
      let profile = await storage.getWorkerProfile(userId);
      console.log("Worker profile found:", profile ? "Yes" : "No");
      
      if (!profile) {
        console.log("Creating default worker profile for user ID:", userId);
        try {
          // Create a default profile for the worker
          profile = await storage.createWorkerProfile({
            userId,
            primarySkill: "general", // Default skill
            description: "",
            isAvailable: true
          });
          console.log("Created worker profile:", profile);
        } catch (profileError) {
          console.error("Error creating worker profile:", profileError);
          const errorMessage = profileError instanceof Error ? profileError.message : 'Unknown error';
          return res.status(500).json({ message: "Failed to create worker profile", error: errorMessage });
        }
      }
      
      const applications = await storage.getApplicationsByWorker(userId);
      console.log("Worker applications found:", applications.length);
      
      const ratings = await storage.getRatingsByWorker(userId);
      console.log("Worker ratings found:", ratings.length);
      
      res.json({ profile, applications, ratings });
    } catch (error) {
      console.error("Worker dashboard error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch worker dashboard data", error: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { createId } from '@paralleldrive/cuid2';
import { db } from './db.js';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import * as schema from '../shared/schema.js';
import { 
  users, jobs, applications, workerProfiles, ratings, verificationDocuments
} from '../shared/schema.js';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { Pool } from '@neondatabase/serverless';

// Storage interface
export class MemStorage {
  constructor() {
    this.users = new Map();
    this.workerProfiles = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.ratings = new Map();
    this.verificationDocuments = new Map();
    this.sessionStore = {};
    this.userIdCounter = 1;
    this.profileIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
    this.ratingIdCounter = 1;
    this.verificationDocumentIdCounter = 1;
  }

  // User operations
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUsers(userType) {
    let users = Array.from(this.users.values());
    if (userType) {
      users = users.filter((user) => user.userType === userType);
    }
    return users;
  }

  async createUser(insertUser) {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    
    const user = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    
    return user;
  }

  async updateUserVerification(id, verificationStatus) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const isVerified = verificationStatus === "verified";
    const updatedUser = { ...user, verificationStatus, isVerified };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserVerificationCode(userId, code, expires) {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      verification_code: code,
      verification_code_expires: expires 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserEmailVerification(userId, verified) {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, email_verified: verified };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Worker profile operations
  async getWorkerProfile(userId) {
    return Array.from(this.workerProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createWorkerProfile(profile) {
    const id = this.profileIdCounter++;
    const workerProfile = { 
      ...profile, 
      id, 
      averageRating: 0, 
      totalRatings: 0,
      verified: false 
    };
    this.workerProfiles.set(id, workerProfile);
    return workerProfile;
  }

  async updateWorkerProfile(userId, update) {
    const profile = await this.getWorkerProfile(userId);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...update };
    this.workerProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  async getWorkersBySkill(skill) {
    const profiles = Array.from(this.workerProfiles.values()).filter(
      (profile) => profile.primarySkill.toLowerCase().includes(skill.toLowerCase())
    );
    
    return Promise.all(
      profiles.map(async (profile) => {
        const user = await this.getUser(profile.userId);
        return { ...profile, user };
      })
    );
  }

  async getTopRatedWorkers(limit = 4) {
    const profiles = Array.from(this.workerProfiles.values())
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
    
    return Promise.all(
      profiles.map(async (profile) => {
        const user = await this.getUser(profile.userId);
        return { ...profile, user };
      })
    );
  }

  // Job operations
  async getJob(id) {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const employer = await this.getUser(job.employerId);
    return { ...job, employer };
  }

  async getJobs(filters) {
    let jobs = Array.from(this.jobs.values());
    
    if (filters) {
      if (filters.category) {
        jobs = jobs.filter(job => job.category === filters.category);
      }
      
      if (filters.location) {
        jobs = jobs.filter(job => job.location.includes(filters.location));
      }
      
      if (filters.isActive !== undefined) {
        jobs = jobs.filter(job => job.isActive === filters.isActive);
      }
    }
    
    return Promise.all(
      jobs.map(async (job) => {
        const employer = await this.getUser(job.employerId);
        return { ...job, employer };
      })
    );
  }

  async createJob(insertJob) {
    const id = this.jobIdCounter++;
    const createdAt = new Date();
    const job = { ...insertJob, id, createdAt, isActive: true };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id, update) {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...update };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async getJobsByEmployer(employerId) {
    return Array.from(this.jobs.values()).filter(
      (job) => job.employerId === employerId
    );
  }

  // Application operations
  async getApplication(id) {
    return this.applications.get(id);
  }

  async getApplicationsByWorker(workerId) {
    const workerApplications = Array.from(this.applications.values()).filter(
      (app) => app.workerId === workerId
    );
    
    return Promise.all(
      workerApplications.map(async (app) => {
        const job = await this.getJob(app.jobId);
        return { ...app, job };
      })
    );
  }

  async getApplicationsByJob(jobId) {
    const jobApplications = Array.from(this.applications.values()).filter(
      (app) => app.jobId === jobId
    );
    
    return Promise.all(
      jobApplications.map(async (app) => {
        const worker = await this.getUser(app.workerId);
        return { ...app, worker };
      })
    );
  }

  async createApplication(insertApplication) {
    const id = this.applicationIdCounter++;
    const createdAt = new Date();
    
    const application = { 
      ...insertApplication, 
      id, 
      createdAt,
      status: "pending" 
    };
    
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id, status) {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Rating operations
  async getRatingsByWorker(workerId) {
    return Array.from(this.ratings.values()).filter(
      (rating) => rating.workerId === workerId
    );
  }

  async createRating(insertRating) {
    const id = this.ratingIdCounter++;
    const createdAt = new Date();
    const rating = { ...insertRating, id, createdAt };
    this.ratings.set(id, rating);
    return rating;
  }

  // Verification operations
  async getVerificationDocuments(userId) {
    return Array.from(this.verificationDocuments.values()).filter(
      (doc) => doc.userId === userId
    );
  }

  async createVerificationDocument(document) {
    const id = this.verificationDocumentIdCounter++;
    const uploadedAt = new Date();
    
    const verificationDocument = {
      ...document,
      id,
      uploadedAt
    };
    
    this.verificationDocuments.set(id, verificationDocument);
    return verificationDocument;
  }

  async updateVerificationDocument(id, reviewNotes, reviewedAt) {
    const document = this.verificationDocuments.get(id);
    if (!document) return undefined;
    
    const updates = {};
    if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes;
    if (reviewedAt !== undefined) updates.reviewedAt = reviewedAt;
    
    const updatedDocument = { ...document, ...updates };
    this.verificationDocuments.set(id, updatedDocument);
    return updatedDocument;
  }
}

export class DatabaseStorage {
  constructor() {
    // Set up session store for PostgreSQL
    const PostgresSessionStore = connectPg(session);
    
    // Create a separate connection pool for session store
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error in getUser:", error);
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      throw error;
    }
  }

  async getUsers(userType) {
    try {
      if (userType) {
        return await db.select().from(users).where(eq(users.userType, userType));
      }
      return await db.select().from(users);
    } catch (error) {
      console.error("Error in getUsers:", error);
      throw error;
    }
  }

  async createUser(user) {
    try {
      const [createdUser] = await db.insert(users).values(user).returning();
      return createdUser;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  // Worker profile operations
  async getWorkerProfile(userId) {
    try {
      const [profile] = await db.select()
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, userId));
      return profile;
    } catch (error) {
      console.error("Error in getWorkerProfile:", error);
      throw error;
    }
  }

  async createWorkerProfile(profile) {
    try {
      const [createdProfile] = await db.insert(workerProfiles)
        .values(profile)
        .returning();
      return createdProfile;
    } catch (error) {
      console.error("Error in createWorkerProfile:", error);
      throw error;
    }
  }

  async updateWorkerProfile(userId, update) {
    try {
      const [profile] = await db.select()
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, userId));
      
      if (!profile) return undefined;
      
      const [updatedProfile] = await db.update(workerProfiles)
        .set(update)
        .where(eq(workerProfiles.userId, userId))
        .returning();
      
      return updatedProfile;
    } catch (error) {
      console.error("Error in updateWorkerProfile:", error);
      throw error;
    }
  }

  async getWorkersBySkill(skill) {
    try {
      const profiles = await db.select()
        .from(workerProfiles)
        .where(like(workerProfiles.primarySkill, `%${skill}%`));
      
      return Promise.all(profiles.map(async (profile) => {
        const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
        return { ...profile, user };
      }));
    } catch (error) {
      console.error("Error in getWorkersBySkill:", error);
      throw error;
    }
  }

  async getTopRatedWorkers(limit = 4) {
    try {
      const profiles = await db.select()
        .from(workerProfiles)
        .orderBy(desc(workerProfiles.averageRating))
        .limit(limit);
      
      return Promise.all(profiles.map(async (profile) => {
        const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
        return { ...profile, user };
      }));
    } catch (error) {
      console.error("Error in getTopRatedWorkers:", error);
      throw error;
    }
  }

  // Job operations
  async getJob(id) {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
      
      if (!job) return undefined;
      
      const [employer] = await db.select().from(users).where(eq(users.id, job.employerId));
      
      return { ...job, employer };
    } catch (error) {
      console.error("Error in getJob:", error);
      throw error;
    }
  }

  async getJobs(filters) {
    try {
      let query = db.select().from(jobs);
      
      if (filters) {
        const conditions = [];
        
        if (filters.category) {
          conditions.push(eq(jobs.category, filters.category));
        }
        
        if (filters.location) {
          conditions.push(like(jobs.location, `%${filters.location}%`));
        }
        
        if (filters.isActive !== undefined) {
          conditions.push(eq(jobs.isActive, filters.isActive));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const foundJobs = await query;
      
      return Promise.all(foundJobs.map(async (job) => {
        const [employer] = await db.select().from(users).where(eq(users.id, job.employerId));
        return { ...job, employer };
      }));
    } catch (error) {
      console.error("Error in getJobs:", error);
      throw error;
    }
  }

  async createJob(job) {
    try {
      const [createdJob] = await db.insert(jobs).values(job).returning();
      return createdJob;
    } catch (error) {
      console.error("Error in createJob:", error);
      throw error;
    }
  }

  async updateJob(id, update) {
    try {
      const [updatedJob] = await db.update(jobs)
        .set(update)
        .where(eq(jobs.id, id))
        .returning();
      
      return updatedJob;
    } catch (error) {
      console.error("Error in updateJob:", error);
      throw error;
    }
  }

  async getJobsByEmployer(employerId) {
    try {
      return await db.select()
        .from(jobs)
        .where(eq(jobs.employerId, employerId));
    } catch (error) {
      console.error("Error in getJobsByEmployer:", error);
      throw error;
    }
  }

  // Application operations
  async getApplication(id) {
    try {
      const [application] = await db.select()
        .from(applications)
        .where(eq(applications.id, id));
      
      return application;
    } catch (error) {
      console.error("Error in getApplication:", error);
      throw error;
    }
  }

  async getApplicationsByWorker(workerId) {
    try {
      const workerApplications = await db.select()
        .from(applications)
        .where(eq(applications.workerId, workerId));
      
      return Promise.all(workerApplications.map(async (app) => {
        const job = await this.getJob(app.jobId);
        return { ...app, job };
      }));
    } catch (error) {
      console.error("Error in getApplicationsByWorker:", error);
      throw error;
    }
  }

  async getApplicationsByJob(jobId) {
    try {
      const jobApplications = await db.select()
        .from(applications)
        .where(eq(applications.jobId, jobId));
      
      return Promise.all(jobApplications.map(async (app) => {
        const [worker] = await db.select().from(users).where(eq(users.id, app.workerId));
        return { ...app, worker };
      }));
    } catch (error) {
      console.error("Error in getApplicationsByJob:", error);
      throw error;
    }
  }

  async createApplication(application) {
    try {
      const [createdApplication] = await db.insert(applications)
        .values(application)
        .returning();
      
      return createdApplication;
    } catch (error) {
      console.error("Error in createApplication:", error);
      throw error;
    }
  }

  async updateApplicationStatus(id, status) {
    try {
      const [updatedApplication] = await db.update(applications)
        .set({ status })
        .where(eq(applications.id, id))
        .returning();
      
      return updatedApplication;
    } catch (error) {
      console.error("Error in updateApplicationStatus:", error);
      throw error;
    }
  }

  // Rating operations
  async getRatingsByWorker(workerId) {
    try {
      return await db.select()
        .from(ratings)
        .where(eq(ratings.workerId, workerId));
    } catch (error) {
      console.error("Error in getRatingsByWorker:", error);
      throw error;
    }
  }

  async createRating(rating) {
    try {
      const [createdRating] = await db.insert(ratings)
        .values(rating)
        .returning();
      
      return createdRating;
    } catch (error) {
      console.error("Error in createRating:", error);
      throw error;
    }
  }

  // Update user verification status
  async updateUserVerification(id, verificationStatus) {
    try {
      const isVerified = verificationStatus === "verified";
      
      const [updatedUser] = await db.update(users)
        .set({ 
          verificationStatus,
          isVerified
        })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error in updateUserVerification:", error);
      throw error;
    }
  }
  
  // Update user verification code
  async updateUserVerificationCode(userId, code, expires) {
    try {
      const [updatedUser] = await db.update(users)
        .set({ 
          verification_code: code,
          verification_code_expires: expires
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error in updateUserVerificationCode:", error);
      throw error;
    }
  }
  
  // Update email verification status
  async updateUserEmailVerification(userId, verified) {
    try {
      const [updatedUser] = await db.update(users)
        .set({ email_verified: verified })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error in updateUserEmailVerification:", error);
      throw error;
    }
  }
  
  // Get verification documents for a user
  async getVerificationDocuments(userId) {
    try {
      return await db.select()
        .from(verificationDocuments)
        .where(eq(verificationDocuments.userId, userId));
    } catch (error) {
      console.error("Error in getVerificationDocuments:", error);
      throw error;
    }
  }
  
  // Create a verification document
  async createVerificationDocument(document) {
    try {
      const [createdDocument] = await db.insert(verificationDocuments)
        .values(document)
        .returning();
      
      // Also update the user's verification status
      await this.updateUserVerification(document.userId, "pending");
      
      return createdDocument;
    } catch (error) {
      console.error("Error in createVerificationDocument:", error);
      throw error;
    }
  }
  
  // Update a verification document
  async updateVerificationDocument(id, reviewNotes, reviewedAt) {
    try {
      const updates = {};
      if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes;
      if (reviewedAt !== undefined) updates.reviewedAt = reviewedAt;
      
      const [updatedDocument] = await db.update(verificationDocuments)
        .set(updates)
        .where(eq(verificationDocuments.id, id))
        .returning();
      
      return updatedDocument;
    } catch (error) {
      console.error("Error in updateVerificationDocument:", error);
      throw error;
    }
  }
}

// Export the storage singleton
export const storage = new DatabaseStorage();
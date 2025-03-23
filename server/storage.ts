import { users, type User, type InsertUser } from "@shared/schema";
import { workerProfiles, type WorkerProfile, type InsertWorkerProfile } from "@shared/schema";
import { jobs, type Job, type InsertJob } from "@shared/schema";
import { applications, type Application, type InsertApplication } from "@shared/schema";
import { ratings, type Rating, type InsertRating } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, desc, and, like } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPgSimple(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(userType?: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Worker profile operations
  getWorkerProfile(userId: number): Promise<WorkerProfile | undefined>;
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;
  updateWorkerProfile(userId: number, profile: Partial<WorkerProfile>): Promise<WorkerProfile | undefined>;
  getWorkersBySkill(skill: string): Promise<(WorkerProfile & { user: User })[]>;
  getTopRatedWorkers(limit?: number): Promise<(WorkerProfile & { user: User })[]>;
  
  // Job operations
  getJob(id: number): Promise<(Job & { employer: User }) | undefined>;
  getJobs(filters?: {category?: string, location?: string, isActive?: boolean}): Promise<(Job & { employer: User })[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByWorker(workerId: number): Promise<(Application & { job: Job })[]>;
  getApplicationsByJob(jobId: number): Promise<(Application & { worker: User })[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: "pending" | "accepted" | "rejected" | "completed"): Promise<Application | undefined>;
  
  // Rating operations
  getRatingsByWorker(workerId: number): Promise<Rating[]>;
  createRating(rating: InsertRating): Promise<Rating>;
  
  // Session store for authentication
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workerProfiles: Map<number, WorkerProfile>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private ratings: Map<number, Rating>;
  public sessionStore: any;
  private userIdCounter: number;
  private profileIdCounter: number;
  private jobIdCounter: number;
  private applicationIdCounter: number;
  private ratingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.workerProfiles = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.ratings = new Map();
    this.userIdCounter = 1;
    this.profileIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
    this.ratingIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(userType?: string): Promise<User[]> {
    if (userType) {
      return Array.from(this.users.values()).filter(user => user.userType === userType);
    }
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Worker profile operations
  async getWorkerProfile(userId: number): Promise<WorkerProfile | undefined> {
    return Array.from(this.workerProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const id = this.profileIdCounter++;
    const workerProfile: WorkerProfile = { 
      ...profile, 
      id, 
      averageRating: 0, 
      totalRatings: 0,
      verified: false 
    };
    this.workerProfiles.set(id, workerProfile);
    return workerProfile;
  }

  async updateWorkerProfile(userId: number, update: Partial<WorkerProfile>): Promise<WorkerProfile | undefined> {
    const profile = await this.getWorkerProfile(userId);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...update };
    this.workerProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  async getWorkersBySkill(skill: string): Promise<(WorkerProfile & { user: User })[]> {
    const workers = Array.from(this.workerProfiles.values())
      .filter(profile => profile.primarySkill === skill);
    
    return Promise.all(workers.map(async profile => {
      const user = await this.getUser(profile.userId);
      return { ...profile, user: user! };
    }));
  }

  async getTopRatedWorkers(limit: number = 4): Promise<(WorkerProfile & { user: User })[]> {
    const workers = Array.from(this.workerProfiles.values())
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
    
    return Promise.all(workers.map(async profile => {
      const user = await this.getUser(profile.userId);
      return { ...profile, user: user! };
    }));
  }

  // Job operations
  async getJob(id: number): Promise<(Job & { employer: User }) | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const employer = await this.getUser(job.employerId);
    if (!employer) return undefined;
    
    return { ...job, employer };
  }

  async getJobs(filters?: {category?: string, location?: string, isActive?: boolean}): Promise<(Job & { employer: User })[]> {
    let jobs = Array.from(this.jobs.values());
    
    // Apply filters if provided
    if (filters) {
      if (filters.category) {
        jobs = jobs.filter(job => job.category === filters.category);
      }
      if (filters.location) {
        jobs = jobs.filter(job => job.location.toLowerCase().includes(filters.location.toLowerCase()));
      }
      if (filters.isActive !== undefined) {
        jobs = jobs.filter(job => job.isActive === filters.isActive);
      }
    }
    
    // Sort by most recent
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Fetch employer data for each job
    return Promise.all(jobs.map(async job => {
      const employer = await this.getUser(job.employerId);
      return { ...job, employer: employer! };
    }));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const createdAt = new Date();
    const job: Job = { ...insertJob, id, createdAt, isActive: true };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: number, update: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...update };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.employerId === employerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByWorker(workerId: number): Promise<(Application & { job: Job })[]> {
    const applications = Array.from(this.applications.values())
      .filter(app => app.workerId === workerId);
    
    return Promise.all(applications.map(async app => {
      const job = this.jobs.get(app.jobId);
      return { ...app, job: job! };
    }));
  }

  async getApplicationsByJob(jobId: number): Promise<(Application & { worker: User })[]> {
    const applications = Array.from(this.applications.values())
      .filter(app => app.jobId === jobId);
    
    return Promise.all(applications.map(async app => {
      const worker = await this.getUser(app.workerId);
      return { ...app, worker: worker! };
    }));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const appliedAt = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      status: "pending", 
      appliedAt 
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id: number, status: "pending" | "accepted" | "rejected" | "completed"): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Rating operations
  async getRatingsByWorker(workerId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(rating => rating.workerId === workerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = this.ratingIdCounter++;
    const createdAt = new Date();
    const rating: Rating = { ...insertRating, id, createdAt };
    this.ratings.set(id, rating);
    
    // Update worker profile average rating
    const workerProfile = await this.getWorkerProfile(rating.workerId);
    if (workerProfile) {
      const ratings = await this.getRatingsByWorker(rating.workerId);
      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = Math.round(totalRating / ratings.length);
      
      await this.updateWorkerProfile(rating.workerId, {
        averageRating,
        totalRatings: ratings.length
      });
    }
    
    return rating;
  }
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error("Error in getUser:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      throw error;
    }
  }

  async getUsers(userType?: string): Promise<User[]> {
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

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  // Worker profile operations
  async getWorkerProfile(userId: number): Promise<WorkerProfile | undefined> {
    try {
      console.log("Getting worker profile for userId:", userId);
      const result = await db.select().from(workerProfiles).where(eq(workerProfiles.userId, userId));
      console.log("Worker profile query result:", result);
      return result[0];
    } catch (error) {
      console.error("Error in getWorkerProfile:", error);
      throw error;
    }
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const result = await db.insert(workerProfiles).values({
      ...profile,
      averageRating: 0,
      totalRatings: 0,
      verified: false
    }).returning();
    return result[0];
  }

  async updateWorkerProfile(userId: number, update: Partial<WorkerProfile>): Promise<WorkerProfile | undefined> {
    const profile = await this.getWorkerProfile(userId);
    if (!profile) return undefined;
    
    const result = await db.update(workerProfiles)
      .set(update)
      .where(eq(workerProfiles.userId, userId))
      .returning();
    
    return result[0];
  }

  async getWorkersBySkill(skill: string): Promise<(WorkerProfile & { user: User })[]> {
    const workers = await db.select()
      .from(workerProfiles)
      .where(eq(workerProfiles.primarySkill, skill));
    
    return Promise.all(
      workers.map(async (profile) => {
        const user = await this.getUser(profile.userId);
        return { ...profile, user: user! };
      })
    );
  }

  async getTopRatedWorkers(limit: number = 4): Promise<(WorkerProfile & { user: User })[]> {
    const workers = await db.select()
      .from(workerProfiles)
      .orderBy(desc(workerProfiles.averageRating))
      .limit(limit);
    
    return Promise.all(
      workers.map(async (profile) => {
        const user = await this.getUser(profile.userId);
        return { ...profile, user: user! };
      })
    );
  }

  // Job operations
  async getJob(id: number): Promise<(Job & { employer: User }) | undefined> {
    const jobResult = await db.select().from(jobs).where(eq(jobs.id, id));
    const job = jobResult[0];
    if (!job) return undefined;
    
    const employer = await this.getUser(job.employerId);
    if (!employer) return undefined;
    
    return { ...job, employer };
  }

  async getJobs(filters?: {category?: string, location?: string, isActive?: boolean}): Promise<(Job & { employer: User })[]> {
    let query = db.select().from(jobs);
    
    if (filters) {
      if (filters.category) {
        query = query.where(eq(jobs.category, filters.category));
      }
      
      if (filters.location) {
        query = query.where(like(jobs.location, `%${filters.location}%`));
      }
      
      if (filters.isActive !== undefined) {
        query = query.where(eq(jobs.isActive, filters.isActive));
      }
    }
    
    query = query.orderBy(desc(jobs.createdAt));
    const jobsList = await query;
    
    return Promise.all(
      jobsList.map(async (job) => {
        const employer = await this.getUser(job.employerId);
        return { ...job, employer: employer! };
      })
    );
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values({
      ...job,
      isActive: true
    }).returning();
    return result[0];
  }

  async updateJob(id: number, update: Partial<Job>): Promise<Job | undefined> {
    const result = await db.update(jobs)
      .set(update)
      .where(eq(jobs.id, id))
      .returning();
    
    return result[0];
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return db.select()
      .from(jobs)
      .where(eq(jobs.employerId, employerId))
      .orderBy(desc(jobs.createdAt));
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const result = await db.select().from(applications).where(eq(applications.id, id));
    return result[0];
  }

  async getApplicationsByWorker(workerId: number): Promise<(Application & { job: Job })[]> {
    const appResults = await db.select()
      .from(applications)
      .where(eq(applications.workerId, workerId));
    
    return Promise.all(
      appResults.map(async (app) => {
        const jobResult = await db.select().from(jobs).where(eq(jobs.id, app.jobId));
        return { ...app, job: jobResult[0] };
      })
    );
  }

  async getApplicationsByJob(jobId: number): Promise<(Application & { worker: User })[]> {
    const appResults = await db.select()
      .from(applications)
      .where(eq(applications.jobId, jobId));
    
    return Promise.all(
      appResults.map(async (app) => {
        const worker = await this.getUser(app.workerId);
        return { ...app, worker: worker! };
      })
    );
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const result = await db.insert(applications).values({
      ...application,
      status: "pending"
    }).returning();
    return result[0];
  }

  async updateApplicationStatus(id: number, status: "pending" | "accepted" | "rejected" | "completed"): Promise<Application | undefined> {
    const result = await db.update(applications)
      .set({ status })
      .where(eq(applications.id, id))
      .returning();
    
    return result[0];
  }

  // Rating operations
  async getRatingsByWorker(workerId: number): Promise<Rating[]> {
    return db.select()
      .from(ratings)
      .where(eq(ratings.workerId, workerId))
      .orderBy(desc(ratings.createdAt));
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const result = await db.insert(ratings).values({
      ...rating,
      comment: rating.comment || null
    }).returning();
    
    // Update worker profile average rating
    const workerProfile = await this.getWorkerProfile(rating.workerId);
    if (workerProfile) {
      const ratings = await this.getRatingsByWorker(rating.workerId);
      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / ratings.length;
      
      await this.updateWorkerProfile(rating.workerId, {
        averageRating,
        totalRatings: ratings.length
      });
    }
    
    return result[0];
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();

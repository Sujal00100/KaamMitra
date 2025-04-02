import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table that can be either a worker or an employer
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  userType: text("user_type", { enum: ["worker", "employer"] }).notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Verification fields
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  isVerified: boolean("is_verified").default(false),
  // Use varchar instead of text for enum to prevent type conversion issues
  verificationStatus: text("verification_status", { 
    enum: ["not_submitted", "pending", "verified", "rejected"] 
  }).default("not_submitted").notNull(),
  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  verificationCode: text("verification_code"),
  verificationCodeExpires: timestamp("verification_code_expires"),
});

// Worker profiles with skills and ratings
export const workerProfiles = pgTable("worker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  primarySkill: text("primary_skill").notNull(),
  description: text("description").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  averageRating: integer("average_rating").default(0).notNull(),
  totalRatings: integer("total_ratings").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
});

// Job postings by employers
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  budget: integer("budget").notNull(),
  category: text("category").notNull(),
  duration: text("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Job applications by workers
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  workerId: integer("worker_id").notNull().references(() => users.id),
  coverLetter: text("cover_letter"),
  bidAmount: integer("bid_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status", { 
    enum: ["pending", "accepted", "rejected", "completed"] 
  }).default("pending").notNull(),
});

// Ratings for workers
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => users.id),
  employerId: integer("employer_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Verification documents
export const verificationDocuments = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type", { 
    enum: ["aadhar_card", "pan_card", "voter_id", "driving_license", "passport"] 
  }).notNull(),
  documentNumber: text("document_number").notNull(),
  documentImage: text("document_image").notNull(), // File path
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
});

// Creating schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verificationStatus: true,
  emailVerified: true,
  verificationCode: true,
  verificationCodeExpires: true,
});

export const insertWorkerProfileSchema = createInsertSchema(workerProfiles).omit({
  id: true,
  averageRating: true,
  totalRatings: true,
  verified: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationDocumentSchema = createInsertSchema(verificationDocuments).omit({
  id: true,
  uploadedAt: true,
  reviewNotes: true,
  reviewedAt: true,
});

// Export schemas and types
export const User = users;
export const WorkerProfile = workerProfiles;
export const Job = jobs;
export const Application = applications;
export const Rating = ratings;
export const VerificationDocument = verificationDocuments;
export const InsertUser = insertUserSchema;
export const InsertWorkerProfile = insertWorkerProfileSchema;
export const InsertJob = insertJobSchema;
export const InsertApplication = insertApplicationSchema;
export const InsertRating = insertRatingSchema;
export const InsertVerificationDocument = insertVerificationDocumentSchema;
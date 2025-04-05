import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  description: text("description"),
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
  category: text("category").notNull(),
  wage: text("wage").notNull(),
  duration: text("duration"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Job applications from workers to jobs
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  workerId: integer("worker_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "rejected", "completed"] }).default("pending").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Ratings given to workers after job completion
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => users.id),
  employerId: integer("employer_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Government ID verification documents
export const verificationDocuments = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type", { 
    enum: ["aadhar_card", "voter_id", "passport", "driving_license", "pan_card", "other"] 
  }).notNull(),
  documentNumber: text("document_number").notNull(),
  documentImageUrl: text("document_image_url"), // URL or reference to where the document is stored
  verificationNotes: text("verification_notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// Chat conversations between users
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id").notNull().references(() => users.id),
  participant2Id: integer("participant2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Optional relation to job if conversation is about a specific job
  jobId: integer("job_id").references(() => jobs.id),
});

// Chat messages in conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
  // For additional features like attachments, we can use jsonb
  metadata: jsonb("metadata"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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
  status: true,
  appliedAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationDocumentSchema = createInsertSchema(verificationDocuments).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  readAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WorkerProfile = typeof workerProfiles.$inferSelect;
export type InsertWorkerProfile = z.infer<typeof insertWorkerProfileSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type InsertVerificationDocument = z.infer<typeof insertVerificationDocumentSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

import { db, pool } from "./db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { 
  users, 
  workerProfiles, 
  jobs, 
  insertUserSchema, 
  insertWorkerProfileSchema,
  insertJobSchema
} from "../shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  console.log("Seeding database...");
  
  try {
    // Check if we have users already
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already has users, skipping seed");
      return;
    }
    
    // Create some test employers
    console.log("Adding test employers...");
    const employer1 = await db.insert(users).values({
      username: "rajeev_builder",
      password: await hashPassword("password123"),
      fullName: "Rajeev Singh",
      phone: "+91 9876543210",
      email: "rajeev@example.com",
      userType: "employer",
      location: "Delhi, India",
      emailVerified: true,
      verificationStatus: "verified"
    }).returning();
    
    const employer2 = await db.insert(users).values({
      username: "mehra_construction",
      password: await hashPassword("password123"),
      fullName: "Anjali Mehra",
      phone: "+91 9871234567",
      email: "anjali@example.com",
      userType: "employer",
      location: "Mumbai, India",
      emailVerified: true,
      verificationStatus: "verified"
    }).returning();
    
    // Create some test workers
    console.log("Adding test workers...");
    const worker1 = await db.insert(users).values({
      username: "suresh_carpenter",
      password: await hashPassword("password123"),
      fullName: "Suresh Kumar",
      phone: "+91 8765432109",
      email: "suresh@example.com",
      userType: "worker",
      location: "Delhi, India",
      emailVerified: true,
      verificationStatus: "verified"
    }).returning();
    
    const worker2 = await db.insert(users).values({
      username: "priya_electrician",
      password: await hashPassword("password123"),
      fullName: "Priya Sharma",
      phone: "+91 8877665544",
      email: "priya@example.com",
      userType: "worker",
      location: "Gurgaon, India",
      emailVerified: true,
      verificationStatus: "verified"
    }).returning();
    
    const worker3 = await db.insert(users).values({
      username: "rajesh_plumber",
      password: await hashPassword("password123"),
      fullName: "Rajesh Verma",
      phone: "+91 7766554433",
      email: "rajesh@example.com",
      userType: "worker",
      location: "Noida, India",
      emailVerified: true,
      verificationStatus: "pending"
    }).returning();
    
    // Create worker profiles
    console.log("Adding worker profiles...");
    await db.insert(workerProfiles).values({
      userId: worker1[0].id,
      primarySkill: "Carpentry",
      description: "Skilled carpenter with 8 years of experience in residential and commercial projects.",
      isAvailable: true,
      averageRating: 4,
      totalRatings: 15,
      verified: true
    });
    
    await db.insert(workerProfiles).values({
      userId: worker2[0].id,
      primarySkill: "Electrical",
      description: "Certified electrician with expertise in wiring, installations, and repairs.",
      isAvailable: true,
      averageRating: 5,
      totalRatings: 24,
      verified: true
    });
    
    await db.insert(workerProfiles).values({
      userId: worker3[0].id,
      primarySkill: "Plumbing",
      description: "Experienced plumber specializing in repair and installation of fixtures and piping.",
      isAvailable: true,
      averageRating: 4,
      totalRatings: 10,
      verified: false
    });
    
    // Create jobs
    console.log("Adding test jobs...");
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    await db.insert(jobs).values({
      title: "Need a carpenter for kitchen renovation",
      description: "Looking for an experienced carpenter to renovate kitchen cabinets and install new countertops. The job will take approximately 5-7 days.",
      location: "Delhi, Vasant Kunj",
      category: "Carpentry",
      wage: "₹800 per day",
      duration: "1 week",
      employerId: employer1[0].id,
      isActive: true,
      createdAt: oneWeekAgo
    });
    
    await db.insert(jobs).values({
      title: "Urgent plumbing repair needed",
      description: "Water leakage issue in bathroom. Need a plumber who can fix pipes and install new fixtures.",
      location: "Delhi, Dwarka",
      category: "Plumbing",
      wage: "₹700 per day",
      duration: "2-3 days",
      employerId: employer1[0].id,
      isActive: true,
      createdAt: new Date()
    });
    
    await db.insert(jobs).values({
      title: "Electrical wiring for new office",
      description: "Need an electrician to complete wiring for a small office. Must have experience with commercial properties.",
      location: "Mumbai, Andheri",
      category: "Electrical",
      wage: "₹1000 per day",
      duration: "10 days",
      employerId: employer2[0].id,
      isActive: true,
      createdAt: new Date()
    });
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
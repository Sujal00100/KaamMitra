import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { initEmailService, sendVerificationEmail, verifyEmail } from "./email-service.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app) {
  // Initialize email service
  initEmailService();
  
  const sessionSecret = process.env.SESSION_SECRET || "kaammitra-session-secret";
  
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id, done) => {
    try {
      console.log("Deserializing user ID:", id, "type:", typeof id);
      
      // Ensure ID is a number
      const userId = typeof id === 'number' ? id : parseInt(id);
      
      if (isNaN(userId)) {
        console.error("Invalid user ID during deserialization:", id);
        return done(new Error("Invalid user ID"));
      }
      
      const user = await storage.getUser(userId);
      console.log("Deserialized user:", user ? "Found" : "Not found");
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Validate email is required
      if (!req.body.email) {
        return res.status(400).json({ message: "Email is required for registration" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Create worker profile if userType is worker
      if (user.userType === "worker" && req.body.primarySkill) {
        await storage.createWorkerProfile({
          userId: user.id,
          primarySkill: req.body.primarySkill,
          description: req.body.description || "",
          isAvailable: true
        });
      }
      
      // Send verification email
      try {
        const emailSent = await sendVerificationEmail(user);
        if (emailSent) {
          console.log("Verification email sent successfully to:", user.email);
        } else {
          console.warn("Failed to send verification email to:", user.email);
        }
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Continue the registration process even if email sending fails
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          message: "Registration successful. Please check your email for a verification code."
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Log user ID to debug session issues
        console.log("User logged in successfully:", {
          id: user.id,
          username: user.username,
          idType: typeof user.id
        });
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Email verification endpoint
  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({ message: "User ID and verification code are required" });
      }
      
      const isVerified = await verifyEmail(parseInt(userId), code);
      
      if (isVerified) {
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
      next(error);
    }
  });
  
  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = req.user;
      
      // Don't resend if already verified
      if (user.email_verified) {
        return res.status(400).json({ message: "Email already verified" });
      }
      
      const emailSent = await sendVerificationEmail(user);
      
      if (emailSent) {
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
      next(error);
    }
  });
}
import nodemailer from 'nodemailer';
import { storage } from './storage.js';

let transporter = null;

export async function initEmailService() {
  if (transporter) {
    return transporter;
  }

  // Default to Gmail settings if not explicitly provided
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const secure = process.env.EMAIL_SECURE === 'true' || false;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  // If no credentials provided, create test account
  if (!user || !pass) {
    console.log('No email credentials provided, creating test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('Test email account created:', testAccount.user);
      console.log('Test email password:', testAccount.pass);
      console.log('Test email SMTP server:', testAccount.smtp.host);

      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.error('Error creating test email account:', error);
      throw error;
    }
  } else {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      }
    });
    
    console.log(`Email service initialized with: ${user}`);
  }
  
  return transporter;
}

export function generateVerificationCode() {
  // Generate a 6-digit verification code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(user) {
  if (!user.email) {
    console.error('User has no email address');
    return false;
  }

  try {
    // Make sure transporter is initialized
    if (!transporter) {
      transporter = await initEmailService();
    }

    // Generate a verification code
    const code = generateVerificationCode();
    
    // Set expiration for 24 hours from now
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    // Store the verification code in the database
    await storage.updateUserVerificationCode(user.id, code, expires);
    
    console.log(`Generated verification code for user ${user.id}: ${code}`);
    
    // Send the email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"KaamMitra Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify your email address - KaamMitra',
      text: `Welcome to KaamMitra! Your verification code is: ${code}\n\nThis code will expire in 24 hours.\n\nThank you,\nThe KaamMitra Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4338ca; text-align: center;">Welcome to KaamMitra!</h2>
          <p>Thank you for registering with KaamMitra. To complete your registration, please verify your email address using the code below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f5f5f5; display: inline-block; border-radius: 5px;">${code}</div>
          </div>
          <p>This code will expire in 24 hours.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
          <p style="text-align: center; color: #666; font-size: 12px;">
            &copy; ${new Date().getFullYear()} KaamMitra. All rights reserved.
          </p>
        </div>
      `,
    });
    
    console.log('Verification email sent:', info.messageId);
    
    // If using ethereal, provide preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('=====================================================');
      console.log('EMAIL SENT TO ETHEREAL TEST ACCOUNT');
      console.log('EMAIL PREVIEW URL: %s', previewUrl);
      console.log('=====================================================');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function verifyEmail(userId, code) {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.error('User not found');
      return false;
    }
    
    // Check if the user already verified their email
    if (user.email_verified) {
      return true;
    }
    
    // Check if verification code exists and is not expired
    if (!user.verification_code || !user.verification_code_expires) {
      console.error('No verification code found for user');
      return false;
    }
    
    const now = new Date();
    
    if (now > user.verification_code_expires) {
      console.error('Verification code has expired');
      return false;
    }
    
    // Check if the code matches
    if (user.verification_code !== code) {
      console.error('Invalid verification code');
      return false;
    }
    
    // Update the user's email verification status
    const updated = await storage.updateUserEmailVerification(userId, true);
    
    return !!updated;
  } catch (error) {
    console.error('Error verifying email:', error);
    return false;
  }
}
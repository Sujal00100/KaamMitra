# Local Deployment Guide for KaamMitra

This guide will walk you through the steps to set up and run the KaamMitra application on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js and npm**: Version 16.x or higher
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify with `node -v` and `npm -v`

2. **PostgreSQL**: (Optional - can use Neon Cloud instead)
   - Only needed if you want to run PostgreSQL locally
   - Follow installation guide for your OS: [PostgreSQL Downloads](https://www.postgresql.org/download/)
   - Or use Neon Cloud (see [NEON_DATABASE_SETUP.md](NEON_DATABASE_SETUP.md))

3. **Git**: For cloning the repository
   - Download from [git-scm.com](https://git-scm.com/downloads)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/KaamMitra.git
cd KaamMitra
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and fill in the required information:
   ```
   # Database connection (required)
   DATABASE_URL=postgresql://username:password@localhost:5432/kaammitra
   
   # Email credentials for verification (required)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   
   # Session secret (required - can be any random string)
   SESSION_SECRET=your_random_secret_key
   
   # Server port (optional - defaults to 3000)
   PORT=3000
   ```

   **Notes:**
   - For Gmail, you'll need to generate an "App Password" instead of using your regular password
   - For DATABASE_URL, use your local PostgreSQL connection or Neon cloud connection

## Step 4: Set Up the Database

### Option A: Local PostgreSQL

1. Create a new database:
   ```bash
   psql -U postgres
   CREATE DATABASE kaammitra;
   \q
   ```

2. Run the database migrations:
   ```bash
   npm run db:push
   ```

### Option B: Neon Cloud (Recommended)

1. Follow the instructions in [NEON_DATABASE_SETUP.md](NEON_DATABASE_SETUP.md) to set up a free PostgreSQL database
2. Add your Neon connection string to the `.env` file
3. Run the database migrations:
   ```bash
   npm run db:push
   ```

## Step 5: Create Upload Directory

Create a directory for user uploads:

```bash
mkdir -p uploads/verification
```

## Step 6: Start the Application

```bash
node server/index.js
```

The application should now be running at http://localhost:3000 (or the port you specified in `.env`)

## Troubleshooting

### Module Import Issues

If you encounter errors related to ES modules:
- Check that `package.json` has `"type": "module"`
- Ensure all local imports include the `.js` extension
- See [ES_MODULE_CONVERSION.md](ES_MODULE_CONVERSION.md) for more help

### Database Connection Issues

- Verify your DATABASE_URL is correct
- Check that PostgreSQL service is running
- Try connecting with another client (like pgAdmin or psql)
- For Neon: Check that your IP is allowed in the Neon dashboard

### Email Service Issues

If verification emails aren't working:
- Make sure EMAIL_USER and EMAIL_PASSWORD are correct
- For Gmail, use App Password, not your regular password
- Check your email provider's security settings
- Try a test email using a simpler script:
  ```javascript
  import nodemailer from 'nodemailer';
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'This is a test email'
  }).then(info => {
    console.log('Email sent:', info.response);
  }).catch(err => {
    console.error('Error sending email:', err);
  });
  ```

### Path Issues on Windows

Windows users might encounter path-related issues:
- Use forward slashes (`/`) in file paths
- Avoid spaces in directory names
- Use the path module for file operations:
  ```javascript
  import { join } from 'path';
  const filePath = join(process.cwd(), 'uploads', 'verification');
  ```

## Accessing Different Parts of the Application

1. **Authentication**: http://localhost:3000/auth
2. **Worker Dashboard**: http://localhost:3000/worker/dashboard (after login as worker)
3. **Employer Dashboard**: http://localhost:3000/employer/dashboard (after login as employer)
4. **Job Listings**: http://localhost:3000/jobs

## Development Workflow

1. **Code Changes**: Modify files in the `client/src` or `server` directories
2. **Restart Server**: If you change server files, restart the Node.js process
3. **Client Changes**: Client changes will hot-reload automatically

## Running in Production Mode

For a production-like environment:

```bash
npm run build
NODE_ENV=production node server/index.js
```

This builds the client-side assets and runs the server in production mode.
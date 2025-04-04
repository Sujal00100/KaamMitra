# Setting Up Neon Cloud PostgreSQL for KaamMitra

This guide will walk you through setting up a free PostgreSQL database on Neon Cloud for your local development of KaamMitra.

## Why Neon Cloud?

Neon provides serverless PostgreSQL with a generous free tier, auto-scaling capabilities, and branching features that make it ideal for development and testing. It eliminates the need to install and manage PostgreSQL locally.

## Step 1: Create a Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account using GitHub, Google, or email

## Step 2: Create a New Project

1. After logging in, click on "New Project" button
2. Give your project a name (e.g., "KaamMitra Dev")
3. Select the region closest to your location
4. Choose "Single region" as the project type
5. Click "Create Project"

## Step 3: Get Your Connection String

After your project is created, you'll be taken to the project dashboard:

1. Look for the "Connection Details" section
2. Select "Passwordless" from the authentication method dropdown 
3. The connection string will be in this format:
   ```
   postgresql://[user]:[password]@[host]/[database]
   ```
4. Copy this connection string to use in your `.env` file

## Step 4: Configure KaamMitra to Use Your Database

1. In your KaamMitra project directory, create or edit the `.env` file
2. Add or update the DATABASE_URL variable:
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
   ```
   (Replace with your actual connection string from Neon)

## Step 5: Initialize the Database Schema

1. Run the schema migration to create all necessary tables:
   ```bash
   npm run db:push
   ```

2. Verify the tables were created:
   - Go back to the Neon dashboard
   - Click "Tables" in the sidebar
   - You should see all the KaamMitra tables (users, jobs, applications, etc.)

## Step 6: Optional - Explore Your Database

You can explore and manage your database directly from the Neon dashboard:

1. Click "SQL Editor" in the sidebar to run custom queries
2. Use the Tables view to browse table schemas and data
3. Check the "Connection Details" page for other connection options (for pgAdmin, etc.)

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the database:

1. **Connection timeout**: Check if your IP is allowed in the project settings
2. **Authentication failed**: Verify the password in your connection string
3. **SSL/TLS errors**: Make sure the WebSocket constructor is properly set up in `server/db.js`:
   ```javascript
   import ws from "ws";
   import { neonConfig } from '@neondatabase/serverless';
   neonConfig.webSocketConstructor = ws;
   ```

### Database Operation Errors

1. **Permission denied**: Ensure your database user has the necessary permissions
2. **Relation does not exist**: Run the migrations (`npm run db:push`) to create tables
3. **Connection pool exhausted**: Check for unclosed connections in your code

## Important Notes

1. **Free Tier Limitations**: 
   - The free tier has 3 concurrent connections
   - Projects may be subject to auto suspend after periods of inactivity
   - 10GB of storage is provided

2. **Security Best Practices**:
   - Never commit your `.env` file with the connection string to version control
   - Use environment variables on production deployments

For more information, visit the [Neon documentation](https://neon.tech/docs).
# KaamMitra - Hyperlocal Job Finder Platform

KaamMitra is a web platform connecting daily wage workers with nearby employers through an intelligent, location-based matching system. The platform provides secure, verified interactions and streamlined job discovery for both workers and employers.

## Features

- **Location-based job matching**: Connect workers with nearby job opportunities
- **ID verification system**: Government ID and email verification for security
- **Dual dashboard system**: Separate interfaces for workers and employers
- **Rating and review system**: Build trust through performance ratings
- **WhatsApp integration**: Easy communication without requiring app installation

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **File Storage**: Local storage for document uploads
- **Email Service**: Nodemailer for verification emails

## Project Structure

- `/client`: React frontend application
- `/server`: Express backend server
- `/shared`: Shared schema definitions and types
- `/uploads`: Storage for uploaded verification documents

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL database

### Installation

1. Clone the repository:
```
git clone https://github.com/Eshan-alt/KaamMitra.git
cd KaamMitra
```

2. Install dependencies:
```
npm install
```

3. Configure environment variables:
Create a `.env` file with:
```
DATABASE_URL=your_postgres_connection_string
EMAIL_USER=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_FROM=noreply@example.com
```

4. Start the development server:
```
npm run dev
```

## License

This project is licensed under the MIT License.
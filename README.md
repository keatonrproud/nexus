# 🔗 Nexus

A modern project management application built with React, TypeScript, Node.js, and Supabase. Central hub for tracking bugs and managing ideas across multiple projects with integrated analytics and KPI dashboards.

## Tech Stack

- **Frontend**: React + TypeScript + MaterialUI
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Google OAuth + Secure Cookies
- **Analytics**: GoatCounter (self-hosted or cloud)
- **Scheduler**: node-cron for background jobs
- **Deployment**: Docker + Fly.io

## Features

- 🔐 **Secure Authentication**: Google OAuth with JWT tokens
- 📊 **Project Management**: Link and manage multiple projects
- 🐛 **Bug Tracking**: Track bugs with priority levels and status
- 💡 **Idea Management**: Capture and organize project ideas
- 📈 **Analytics Dashboard**: View KPIs and project metrics
- 🔄 **Background Jobs**: Automated cleanup and reporting (production only)
- 📱 **Responsive Design**: Mobile-first UI that scales to desktop
- **Project Management**: Create and manage multiple projects with unique URLs
- **Bug & Idea Tracking**: Track bugs and ideas with status, priority, and metadata
- **Analytics Integration**: GoatCounter analytics integration for website tracking
- **Shared Analytics Dashboard**: Comparative analytics view across all projects with multiple visualization options
- **User Authentication**: Google OAuth integration with secure JWT tokens
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Optimistic UI updates for better user experience

## Analytics Dashboard

The shared analytics dashboard provides a comprehensive view of your website analytics across all projects:

### Features

- **Comparative Page Views**: Line chart showing page views over time for each project with different colors
- **Multiple Visualization Types**: Switch between different chart types using the button group:
  - **Page Views**: Time-series line chart comparing all projects
  - **Visitors**: Bar chart showing unique visitors per project
  - **Countries**: Aggregated view of top countries across all projects
  - **Devices**: Device type distribution (when available)
  - **Browsers**: Browser usage statistics (when available)

### Key Metrics

- **Total Page Views**: Aggregated across all projects
- **Total Visitors**: Unique visitors across all projects
- **Active Projects**: Number of projects with analytics enabled

### Project Breakdown

- Individual project cards showing key metrics
- Color-coded to match chart visualizations
- Direct links to project URLs

### Data Requirements

- Requires GoatCounter analytics configuration for each project
- Page views and visitor data are always available
- Additional data (countries, devices, browsers) depends on GoatCounter API availability

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google OAuth app (for authentication)

### Environment Setup

Create a `.env` file in the `backend` directory:

```bash
# Environment
NODE_ENV=development
PORT=5000

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-minimum-32-characters
REFRESH_TOKEN_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Analytics (Per-Project Configuration)
# GoatCounter analytics are configured per-project in the UI
# Each project has its own site code and API token - no global token needed

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# Note: Background jobs are automatically enabled in production (NODE_ENV=production)

# Fly.io Production
FLY_APP_NAME=nexus
FLY_REGION=sjc
```

## Getting Started

### Prerequisites

- Node.js (version 18.x or higher)
- npm or yarn
- Docker (for containerized development and deployment)
- Supabase account and project setup
- Google OAuth credentials
- GoatCounter analytics instance (self-hosted or cloud)
- Fly.io account (for deployment)

### Installation

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (if applicable)
npm run migration:run

# Local development (without Docker)
npm run dev-build-local  # Build TypeScript
npm run dev-local        # Start development server

# Docker development
npm run dev-build        # Build Docker image
npm run dev-docker       # Run with Docker
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### Full Stack Docker Development

```bash
# From project root
docker-compose up --build
```

## Development Guidelines

### Code Standards

This project follows comprehensive best practices outlined in our [`.cursorrules`](.cursorrules) file. Please review these guidelines before contributing.

### Key Architecture Principles

- **Frontend-Backend Separation**: No database calls from frontend
- **Security First**: No environment variables in frontend code
- **Optimistic UI**: Always show immediate feedback to users
- **Mobile-First**: All UI components designed mobile-first, but with desktop in mind
- **Type Safety**: Strict TypeScript usage throughout
- **Containerized Deployment**: Docker for consistent environments

### Authentication Flow

1. User signs in with Google OAuth
2. Backend generates JWT tokens
3. Tokens stored in secure httpOnly cookies
4. Frontend makes authenticated requests via cookies
5. Refresh token rotation for enhanced security

### API Design

- RESTful endpoints with proper HTTP status codes
- Consistent error response format
- Request/response validation with TypeScript
- Rate limiting and security middleware

### Workflow

1. Create a feature branch from `main`
2. Follow the coding standards in `.cursorrules`
3. Run tests: `npm test` (both frontend and backend)
4. Check TypeScript: `npm run type-check`
5. Run linting: `npm run lint`
6. Create a pull request with descriptive commit messages

## Project Structure

```
nexus/
├── .cursorrules              # Cursor-specific development guidelines
├── README.md                # This file
├── docker-compose.yml       # Docker development setup
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   ├── Dockerfile          # Frontend Docker configuration
│   ├── nginx.conf          # Nginx configuration for production
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── config/         # Configuration files
│   │   └── types/          # TypeScript definitions
│   ├── scripts/            # Scheduled jobs
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # Backend Docker configuration
│   ├── .dockerignore       # Docker ignore file
│   ├── fly.toml            # Fly.io deployment configuration
│   └── package.json        # Backend dependencies
└── docs/                   # Additional documentation
```

## Available Scripts

### Backend

- `npm run dev-build-local` - Build TypeScript locally (fast development)
- `npm run dev-local` - Start development server with hot reload (no Docker)
- `npm run dev-build` - Build Docker image for development
- `npm run dev-docker` - Run development server with Docker
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run migration:run` - Run database migrations
- `npm run deploy` - Deploy to Fly.io with `fly deploy --ha=false`

### Frontend

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

### Docker Commands

```bash
# Full stack development
docker-compose up --build

# Backend only
cd backend
npm run dev-build        # Build image
npm run dev-docker       # Run container

# Production build
docker build -t nexus .
```

## Deployment ✅ READY

### Fly.io Deployment

The application is configured and ready for deployment to Fly.io.

**App Details**:

- **Name**: `nexus`
- **URL**: https://nexus.fly.dev
- **Region**: Toronto, Canada (yyz)

**Quick Deploy**:

```bash
# Set required environment variables (see docs/DEPLOYMENT.md)
fly secrets set SUPABASE_URL=your-supabase-url
fly secrets set JWT_SECRET=your-jwt-secret
# ... other required variables

# Deploy
npm run deploy
```

**Complete Setup Guide**: See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for detailed instructions.

### Docker Production

```bash
# Build production image
docker build -t nexus .

# Run production container
docker run -p 8080:8080 --env-file .env.production nexus
```

## Analytics & Monitoring

- User interaction tracking (backend only)
- Error monitoring and logging
- Performance metrics collection
- GDPR-compliant data handling
- Health check endpoints for deployment monitoring

## Contributing

Please read our [`.cursorrules`](.cursorrules) file for detailed development guidelines and best practices when using Cursor IDE.

See also: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for comprehensive contribution guidelines.

## License

[Your license information]

# Google Authentication Troubleshooting

## Fixing the "Origin Not Allowed" Error

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID used for this project
4. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000`
   - `http://localhost:5000`
5. Under "Authorized redirect URIs", add:
   - `http://localhost:5000/api/auth/google/callback`
6. Click Save

## Environment Variables Setup

Ensure your backend has these environment variables set:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Restart Both Frontend and Backend

After making these changes, restart both your frontend and backend servers.

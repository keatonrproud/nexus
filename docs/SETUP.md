# Project Setup Guide

## Initial Project Setup

### Frontend Setup (React + TypeScript + MaterialUI)

#### Create React App with TypeScript

```bash
# Create frontend directory
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install MaterialUI dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/lab

# Install additional dependencies
npm install axios react-query @types/node
npm install @testing-library/jest-dom @testing-library/react @testing-library/user-event

# Development dependencies
npm install --save-dev @types/jest eslint-config-prettier prettier
```

#### Frontend Configuration Files

**tsconfig.json** (Frontend)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/hooks/*": ["hooks/*"],
      "@/services/*": ["services/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"]
    }
  },
  "include": ["src"]
}
```

**package.json scripts** (Frontend)

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "prettier": "prettier --write src/**/*.{ts,tsx,css,md}"
  }
}
```

### Backend Setup (Node.js + Express + TypeScript)

#### Initialize Backend

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize npm project
npm init -y

# Install production dependencies
npm install express cors helmet cookie-parser bcryptjs jsonwebtoken
npm install @supabase/supabase-js axios winston node-cron
npm install google-auth-library passport passport-google-oauth20
npm install zod express-rate-limit express-validator

# Install TypeScript and development dependencies
npm install --save-dev typescript ts-node nodemon @types/express
npm install --save-dev @types/cors @types/helmet @types/cookie-parser
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/node
npm install --save-dev jest @types/jest supertest @types/supertest
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier
```

#### Backend Configuration Files

**tsconfig.json** (Backend)

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/controllers/*": ["controllers/*"],
      "@/middleware/*": ["middleware/*"],
      "@/models/*": ["models/*"],
      "@/routes/*": ["routes/*"],
      "@/services/*": ["services/*"],
      "@/config/*": ["config/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**package.json** (Backend)

```json
{
  "scripts": {
    "dev-build-local": "tsc",
    "dev-local": "nodemon --exec ts-node -r tsconfig-paths/register src/server.ts",
    "dev-build": "docker build -t nexus .",
    "dev-docker": "docker run -p 5000:5000 --env-file .env nexus",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "migration:create": "ts-node scripts/create-migration.ts",
    "migration:run": "ts-node scripts/run-migrations.ts",
    "deploy": "fly deploy --ha=false"
  }
}
```

**nodemon.json**

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node -r tsconfig-paths/register src/server.ts"
}
```

### Docker Configuration

#### Dockerfile (Backend)

```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Start the application
CMD ["npm", "start"]
```

#### .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
.coverage/
dist
```

#### docker-compose.yml (For local development)

```yaml
version: "3.8"

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
    env_file:
      - .env
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev-local

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ../frontend:/app
      - /app/node_modules
    command: npm start
```

#### Dockerfile (Frontend)

```dockerfile
# Multi-stage build for production
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf (Frontend)

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy to backend
        location /api {
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
}
```

### Fly.io Deployment Configuration

#### fly.toml

```toml
app = "nexus"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"

[deploy]
  release_command = "npm run migration:run"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

#### .fly/entrypoint.sh

```bash
#!/bin/bash
set -e

# Run database migrations
npm run migration:run

# Start the application
exec "$@"
```

### Environment Configuration

#### Backend .env.example

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-minimum-32-characters
REFRESH_TOKEN_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Analytics (GoatCounter)
GOATCOUNTER_API_TOKEN=your-goatcounter-api-token

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# Note: Scheduler is automatically enabled in production (NODE_ENV=production)
# and disabled in development/test environments

# Redis (for session management - optional)
REDIS_URL=redis://localhost:6379

# File Upload (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket

# Fly.io Production (add these for production)
FLY_APP_NAME=nexus
FLY_REGION=sjc
```

### Database Configuration

#### Supabase Setup Steps

1. Go to [Supabase](https://supabase.com/) and create account
2. Create a new project or select existing
3. Go to Settings > API to get your keys:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)
4. Set up your database tables in the SQL editor or via migrations
5. Configure Row Level Security (RLS) policies for your tables

#### Supabase Configuration Code

```typescript
// config/database.ts
import { createClient } from "@supabase/supabase-js";
import { config } from "./index";
import { logger } from "../utils/logger";

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// For client-side operations (with anon key)
export const supabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
);

export const connectDatabase = async (): Promise<void> => {
  try {
    // Test the connection
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    logger.info("Connected to Supabase successfully");
  } catch (error) {
    logger.error("Supabase connection failed:", error);
    process.exit(1);
  }
};

// Database helper functions
export const db = {
  // User operations
  users: {
    findById: async (id: string) => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (userData: any) => {
      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },
};
```

### Authentication Configuration

#### Google OAuth Setup Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
6. Copy Client ID and Client Secret to `.env` file

#### Authentication Configuration Code

```typescript
// config/auth.ts
import { config } from "./index";

export const authConfig = {
  jwt: {
    secret: config.JWT_SECRET,
    expiresIn: "15m",
    refreshSecret: config.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: "7d",
  },
  google: {
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    redirectUri: `${config.API_BASE_URL}/auth/google/callback`,
  },
  cookies: {
    accessToken: {
      name: "accessToken",
      options: {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict" as const,
        maxAge: 15 * 60 * 1000, // 15 minutes
      },
    },
    refreshToken: {
      name: "refreshToken",
      options: {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict" as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    },
  },
};
```

### Scheduler Configuration

#### Cron Jobs Setup

```typescript
// config/scheduler.ts
import { config } from "./index";

export const schedulerConfig = {
  enabled: config.NODE_ENV === "production", // Automatically enabled in production
  jobs: {
    userCleanup: {
      schedule: "0 2 * * *", // Daily at 2 AM
      enabled: true,
    },
    dataBackup: {
      schedule: "0 1 * * 0", // Weekly on Sunday at 1 AM
      enabled: config.NODE_ENV === "production",
    },
    analyticsReport: {
      schedule: "0 9 1 * *", // Monthly on 1st at 9 AM
      enabled: true,
    },
  },
};
```

**Note**: Background jobs are automatically enabled when `NODE_ENV=production` and disabled in development/test environments. This ensures that scheduled tasks only run in production to avoid interference during development.

### Analytics Configuration

#### GoatCounter Setup Steps

1. **Self-hosted option**:

   ```bash
   # Using Docker
   docker run -d \
     --name goatcounter \
     -p 3000:3000 \
     -e DATABASE_URL=postgresql://username:password@host:port/database \
     ghcr.io/goatcounter/goatcounter:postgresql-latest
   ```

2. **Cloud option**: Sign up at [GoatCounter Cloud](https://cloud.goatcounter.com/)

3. **Configuration**:
   - Create a website in your GoatCounter dashboard
   - Copy the Website ID to your `.env` file
   - Generate an API token in settings
   - Add the API URL and token to your `.env` file

#### GoatCounter Configuration Code

```typescript
// config/analytics.ts
import { config } from "./index";
import axios from "axios";

export const analyticsConfig = {
  enabled: true, // Enable analytics in all environments
  goatcounter: {
    apiUrl: config.GOATCOUNTER_API_TOKEN,
  },
  events: {
    userSignup: "user_signup",
    userLogin: "user_login",
    projectCreated: "project_created",
    ideaCreated: "idea_created",
    bugReported: "bug_reported",
    itemStatusChanged: "item_status_changed",
    itemPriorityChanged: "item_priority_changed",
    projectDeleted: "project_deleted",
    itemDeleted: "item_deleted",
  },
};

// GoatCounter API client
export const goatcounterClient = axios.create({
  baseURL: config.GOATCOUNTER_API_TOKEN,
  headers: {
    Authorization: `Bearer ${config.GOATCOUNTER_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Analytics service
export const analyticsService = {
  track: async (
    event: string,
    properties: Record<string, any> = {},
    websiteId?: string,
  ) => {
    if (!analyticsConfig.enabled) {
      return;
    }

    if (!websiteId) {
      console.log(
        `No website ID provided for event tracking: ${event}`,
        properties,
      );
      return;
    }

    try {
      // Send event to GoatCounter
      await goatcounterClient.post("/send", {
        website: websiteId,
        name: event,
        data: properties,
        url: properties.url || "/",
        referrer: properties.referrer || "",
      });

      console.log(`Analytics event tracked: ${event}`, properties);
    } catch (error) {
      console.error("Failed to track analytics event:", error);
    }
  },

  // Get analytics data
  getStats: async (startDate: string, endDate: string) => {
    try {
      const response = await goatcounterClient.get(
        "/websites/{websiteId}/stats",
        {
          params: {
            startAt: new Date(startDate).getTime(),
            endAt: new Date(endDate).getTime(),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to get analytics stats:", error);
      return null;
    }
  },
};
```

### Development Workflow

#### Initial Setup Commands

```bash
# 1. Clone and setup backend
git clone <repository-url>
cd nexus/backend
npm install
cp .env.example .env
# Edit .env with your configuration

# 2. Setup frontend (in new terminal)
cd ../frontend
npm install

# 3. Setup Supabase
# Create account at https://supabase.com
# Create new project
# Copy URL and keys to .env file
# Set up database tables using Supabase dashboard or migrations

# 4. Setup Fly.io
npm install -g flyctl
fly auth login
fly launch --no-deploy
# Edit fly.toml as needed
```

#### Development Commands

**Local Development (without Docker)**

```bash
# Backend
cd backend
npm run dev-build-local  # Build TypeScript
npm run dev-local        # Run with nodemon

# Frontend
cd frontend
npm start                # Run React dev server
```

**Docker Development**

```bash
# Backend
cd backend
npm run dev-build        # Build Docker image
npm run dev-docker       # Run with Docker

# Full stack with docker-compose
docker-compose up --build
```

#### Deployment Commands

```bash
# Deploy to Fly.io
cd backend
npm run deploy           # Runs: fly deploy --ha=false

# Or manually
fly deploy --ha=false
```

#### Google OAuth Setup Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
6. Copy Client ID and Client Secret to `.env` file

### Production Deployment

#### Fly.io Deployment Steps

1. **Install Fly CLI**:

   ```bash
   npm install -g flyctl
   fly auth login
   ```

2. **Initialize Fly App**:

   ```bash
   cd backend
   fly launch --no-deploy
   # This creates fly.toml - edit as needed
   ```

3. **Set Environment Variables**:

   ```bash
   fly secrets set NODE_ENV=production
   fly secrets set JWT_SECRET=your-production-jwt-secret
   fly secrets set SUPABASE_URL=your-supabase-url
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   fly secrets set GOOGLE_CLIENT_ID=your-google-client-id
   fly secrets set GOOGLE_CLIENT_SECRET=your-google-client-secret
   fly secrets set GOATCOUNTER_API_TOKEN=your-goatcounter-api-token
   # Add all other production environment variables
   ```

4. **Deploy**:
   ```bash
   npm run deploy  # or fly deploy --ha=false
   ```

#### Environment Setup

```typescript
// config/index.ts
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().transform(Number),

  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("24h"),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  // GoatCounter Analytics
  GOATCOUNTER_API_TOKEN: z.string(),

  // Optional Services
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  REDIS_URL: z.string().url().optional(),
});

export const config = {
  ...configSchema.parse(process.env),

  // Scheduler configuration - automatically enabled in production
  get CRON_ENABLED() {
    return this.NODE_ENV === "production";
  },
};
```

#### Build and Deploy

```bash
# Backend build
cd backend
npm run build
npm start

# Frontend build
cd frontend
npm run build
# Serve build files through nginx or similar
```

This setup ensures you have a robust, secure, and scalable foundation following all the best practices outlined in your `.cursorrules` file!

#### Environment Configuration

```typescript
// config/index.ts
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().transform(Number),

  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("24h"),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  // GoatCounter Analytics
  GOATCOUNTER_API_TOKEN: z.string(),

  // Optional Services
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  REDIS_URL: z.string().url().optional(),
});

export const config = {
  ...configSchema.parse(process.env),

  // Scheduler configuration - automatically enabled in production
  get CRON_ENABLED() {
    return this.NODE_ENV === "production";
  },
};
```

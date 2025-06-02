# Contributing Guidelines

## Development Environment Setup

### Cursor IDE Configuration

This project is optimized for use with Cursor IDE. Please ensure you have:

- Cursor IDE installed and updated
- The project's `.cursorrules` file is respected by your IDE
- AI assistance features enabled for optimal development experience
- TypeScript language support enabled

### Required Tools

- Node.js 18.x or higher
- npm or yarn package manager
- Git for version control
- Docker and Docker Compose
- Fly.io CLI (flyctl) for deployment
- Database client (depending on chosen DB)
- Google Cloud Console access for OAuth setup

## Development Workflow

### Local Development (Recommended for Fast Iteration)

```bash
# Backend development
cd backend
npm run dev-build-local  # Build TypeScript
npm run dev-local        # Run with nodemon (hot reload)

# Frontend development (separate terminal)
cd frontend
npm start                # React dev server with hot reload
```

### Docker Development (Production-like Environment)

```bash
# Full stack with docker-compose
docker-compose up --build

# Backend only with Docker
cd backend
npm run dev-build        # Build Docker image
npm run dev-docker       # Run container

# Frontend only with Docker
cd frontend
docker build -t frontend .
docker run -p 3000:3000 frontend
```

### Environment Setup

1. **Clone Repository**:

   ```bash
   git clone <repository-url>
   cd nexus
   ```

2. **Backend Setup**:

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**:

   ```bash
   cd frontend
   npm install
   ```

4. **External Services**:
   - Set up Supabase project and get API keys
   - Configure Google OAuth credentials
   - Set up GoatCounter analytics instance
   - Create Fly.io account for deployment

## Tech Stack Deep Dive

### Frontend (React + TypeScript + MaterialUI)

#### Component Development

```typescript
// Example: Proper component structure
import React, { useState, useCallback } from 'react';
import { Button, CircularProgress, Alert } from '@mui/material';
import { useOptimisticQuery } from '../hooks/useOptimisticQuery';

interface Props {
  userId: string;
  onSuccess?: () => void;
}

export const UserActionButton: React.FC<Props> = ({ userId, onSuccess }) => {
  const [isOptimistic, setIsOptimistic] = useState(false);
  const { mutate, isLoading, error } = useOptimisticQuery();

  const handleClick = useCallback(async () => {
    // Optimistic update pattern
    setIsOptimistic(true);
    try {
      await mutate('/api/users/action', { userId });
      onSuccess?.();
    } catch (err) {
      setIsOptimistic(false);
    }
  }, [userId, mutate, onSuccess]);

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="contained"
        size="small" // Mobile-first approach
      >
        {isLoading ? <CircularProgress size={16} /> : 'Action'}
      </Button>
      {error && <Alert severity="error">{error.message}</Alert>}
    </>
  );
};
```

#### Custom Hooks Pattern

```typescript
// hooks/useOptimisticQuery.ts
import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";

export const useOptimisticQuery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (url: string, data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(url, data);
      return response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
};
```

#### API Service Layer

```typescript
// services/apiClient.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true, // For JWT cookies
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Never add env vars here - handled by cookies
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth errors
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### Backend (Node.js + Express + TypeScript)

#### Project Structure Example

```
backend/src/
├── controllers/
│   ├── authController.ts
│   ├── userController.ts
│   └── index.ts
├── middleware/
│   ├── auth.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   └── index.ts
├── models/
│   ├── User.ts
│   ├── Session.ts
│   └── index.ts
├── routes/
│   ├── auth.ts
│   ├── users.ts
│   └── index.ts
├── services/
│   ├── authService.ts
│   ├── userService.ts
│   ├── emailService.ts
│   └── index.ts
├── config/
│   ├── database.ts
│   ├── auth.ts
│   ├── scheduler.ts
│   └── index.ts
└── types/
    ├── auth.ts
    ├── user.ts
    └── index.ts
```

#### Authentication Implementation

```typescript
// controllers/authController.ts
import { Request, Response } from "express";
import { authService } from "../services/authService";
import { logger } from "../utils/logger";

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const { accessToken, refreshToken, user } =
      await authService.googleLogin(code);

    // Set secure httpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ user });
  } catch (error) {
    logger.error("Auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};
```

### Docker Development

#### Development with Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev-local

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm start
```

#### Docker Best Practices

- Use multi-stage builds for production
- Minimize image layers
- Use .dockerignore to exclude unnecessary files
- Run containers as non-root user
- Use Alpine Linux for smaller images
- Cache npm dependencies in separate layer

## Deployment Process

### Fly.io Deployment

1. **Initial Setup**:

   ```bash
   npm install -g flyctl
   fly auth login
   cd backend
   fly launch --no-deploy
   ```

2. **Environment Configuration**:

   ```bash
   fly secrets set NODE_ENV=production
   fly secrets set JWT_SECRET=your-production-secret
   fly secrets set SUPABASE_URL=your-supabase-url
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key
   # Set all required environment variables
   ```

3. **Deploy**:

   ```bash
   npm run deploy  # Runs: fly deploy --ha=false
   ```

4. **Monitor Deployment**:
   ```bash
   fly logs
   fly status
   fly open  # Open deployed app
   ```

### Production Checklist

- [ ] All environment variables set in Fly.io secrets
- [ ] Database migrations run successfully
- [ ] Health check endpoint responding
- [ ] SSL certificates configured
- [ ] Domain name configured (if applicable)
- [ ] Analytics tracking verified
- [ ] Error monitoring active

## Code Review Process

### Before Submitting Code

1. **Review AI Suggestions**: Always review and understand AI-generated code before accepting
2. **Test Thoroughly**: Run all tests and verify functionality
3. **TypeScript Check**: Ensure no TypeScript errors (`npm run type-check`)
4. **Security Review**: Verify no secrets in frontend, proper auth implementation
5. **Performance Check**: Consider mobile performance and loading states
6. **Docker Build**: Ensure Docker builds work correctly

### Frontend-Specific Checklist

- [ ] Components are mobile-first responsive, but can expand to full screen
- [ ] Optimistic loading implemented
- [ ] Error states handled gracefully
- [ ] No environment variables in frontend code
- [ ] MaterialUI theme used consistently
- [ ] Accessibility standards met
- [ ] Docker build successful

### Backend-Specific Checklist

- [ ] All routes properly authenticated
- [ ] Input validation implemented
- [ ] Error logging in place
- [ ] Database operations use transactions where needed
- [ ] API responses follow consistent format
- [ ] No sensitive data in logs
- [ ] Docker image builds and runs correctly
- [ ] Health check endpoint implemented

### Docker-Specific Checklist

- [ ] Dockerfile follows best practices
- [ ] Image builds successfully
- [ ] Container runs without errors
- [ ] Environment variables properly configured
- [ ] Security: runs as non-root user
- [ ] Image size optimized

## Testing Requirements

- Write unit tests for all new functions
- Ensure integration tests pass
- Test edge cases and error scenarios
- Aim for >80% code coverage
- Test Docker builds in CI/CD pipeline

## Performance Guidelines

- Profile code before optimizing
- Consider memory usage in large datasets
- Use appropriate algorithms and data structures
- Monitor bundle size in web applications
- Optimize Docker image size and build time

## Security Checklist

- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented
- [ ] Authentication/authorization working
- [ ] Dependencies are up to date
- [ ] Security linting passes
- [ ] Docker security best practices followed
- [ ] Fly.io secrets properly configured

### Optional Services

For full functionality, you may also want to set up:

- Set up GoatCounter analytics instance
- Configure SendGrid for email notifications
- Set up Redis for caching (optional)

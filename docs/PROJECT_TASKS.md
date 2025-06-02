# Project Task List: Bug/Idea Board with KPI Dashboard

## Project Overview

Build a project management website where users can:

1. Link and manage multiple projects (websites)
2. Track bugs and ideas for each project
3. View KPI dashboards with GoatCounter analytics and other metrics

## Prerequisites Setup Tasks

### Task 1: Backend Foundation ✅ COMPLETED

**Estimated Time**: 4-5 hours
**Priority**: Critical

1. **Project Initialization**

   ```bash
   mkdir backend && cd backend
   npm init -y
   ```

2. **Install Dependencies**

   ```bash
   # Production dependencies
   npm install express cors helmet cookie-parser bcryptjs jsonwebtoken
   npm install @supabase/supabase-js axios winston node-cron
   npm install google-auth-library passport passport-google-oauth20
   npm install zod express-rate-limit express-validator

   # Development dependencies
   npm install --save-dev typescript ts-node nodemon @types/express
   npm install --save-dev @types/cors @types/helmet @types/cookie-parser
   npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/node
   npm install --save-dev jest @types/jest supertest @types/supertest
   npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   npm install --save-dev prettier eslint-config-prettier tsconfig-paths
   ```

3. **Configuration Files**
   - [x] Create `tsconfig.json` (copy from SETUP.md)
   - [x] Create `package.json` scripts with new npm commands:
     ```json
     {
       "scripts": {
         "dev-build-local": "tsc",
         "dev-local": "nodemon --exec ts-node -r tsconfig-paths/register src/server.ts",
         "dev-build": "docker build -t nexus .",
         "dev-docker": "docker run -p 5000:5000 --env-file .env nexus",
         "build": "tsc",
         "start": "node dist/server.js",
         "deploy": "fly deploy --ha=false"
       }
     }
     ```
   - [x] Create `nodemon.json` configuration
   - [x] Create `.env.example` and `.env` files
   - [x] Set up ESLint and Prettier configurations

### Task 2: Frontend Foundation ✅ COMPLETED

**Estimated Time**: 3-4 hours
**Priority**: Critical

1. **Vite Setup**

   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install @mui/material @emotion/react @emotion/styled
   npm install @mui/icons-material @mui/lab
   npm install axios react-query @types/node
   npm install @testing-library/jest-dom @testing-library/react @testing-library/user-event
   npm install --save-dev @types/jest eslint-config-prettier prettier
   ```

3. **Configuration**

   - [x] Update `tsconfig.json` with path mapping (copy from SETUP.md)
   - [x] Set up MaterialUI theme configuration
   - [x] Create folder structure following project guidelines

4. **Docker Configuration** with Docker/deployment files in root
   - [x] Create `nginx.conf` for production
   - [x] Create `fly.toml` for Fly.io deployment
   - [x] Create `Dockerfile` for building the Docker container
   - [x] Create `docker-compose.yml` in project root for full-stack development

## Core Backend Development

### Task 3: Database Schema Design ✅ COMPLETED

**Estimated Time**: 3-4 hours
**Priority**: High

1. **Design Database Tables**

   - [x] `users` table (id, email, name, google_id, created_at, updated_at)
   - [x] `projects` table (id, user_id, name, url, description, created_at, updated_at)
   - [x] `board_items` table (id, project_id, title, description, type, status, priority, created_at, updated_at)
   - [x] `project_analytics` table - REMOVED: Analytics configuration now stored in projects table (goatcounter_site_code field)

2. **Create Supabase Tables**
   - [x] Use SQL to create the Supabase tables, and show me them so I can manually create the tables
   - [x] Set up Row Level Security (RLS) for each table with no policies (we will use the service key to pass them)
   - [x] Create indexes for performance
   - [x] Test database connections

### Task 4: Authentication System ✅ COMPLETED

**Estimated Time**: 5-6 hours
**Priority**: High

1. **Google OAuth Setup**

   - [x] Configure Google Cloud Console OAuth credentials
   - [x] Set up redirect URIs for development and production
   - [x] Add credentials to environment variables

2. **Authentication Configuration**

   - [x] Create `config/auth.ts` (copy from SETUP.md)
   - [x] Implement JWT token generation and validation
   - [x] Set up secure cookie configuration

3. **Auth Middleware**

   ```typescript
   // middleware/auth.ts
   - [x] Create JWT verification middleware
   - [x] Implement user session management
   - [x] Add refresh token rotation logic
   ```

4. **Auth Controllers**

   ```typescript
   // controllers/authController.ts
   - [x] Google OAuth login endpoint
   - [x] Token refresh endpoint
   - [x] Logout endpoint
   - [x] User profile endpoint
   ```

5. **Auth Routes**
   ```typescript
   // routes/auth.ts
   - [x] POST /auth/google
   - [x] POST /auth/refresh
   - [x] POST /auth/logout
   - [x] GET /auth/me
   ```

### Task 5: Projects Management API ✅ COMPLETED

**Estimated Time**: 4-5 hours
**Priority**: High

1. **Project Models**

   ```typescript
   // models/Project.ts
   - [x] Define Project interface
   - [x] Create validation schemas with Zod
   - [x] Implement CRUD operations
   ```

2. **Project Controllers**

   ```typescript
   // controllers/projectController.ts
   - [x] Create project endpoint
   - [x] Get user projects endpoint
   - [x] Update project endpoint
   - [x] Delete project endpoint
   - [x] Get single project with board items
   ```

3. **Project Routes**

   ```typescript
   // routes/projects.ts
   - [x] POST /projects (create)
   - [x] GET /projects (list user projects)
   - [x] GET /projects/:id (get single project)
   - [x] PUT /projects/:id (update)
   - [x] DELETE /projects/:id (delete)
   ```

4. **Validation Middleware**
   - [x] Project creation validation
   - [x] Project update validation
   - [x] URL validation for project links

### Task 6: Bug/Idea Board API ✅ COMPLETED

**Estimated Time**: 5-6 hours
**Priority**: High

1. **Board Item Models**

   ```typescript
   // models/BoardItem.ts
   - [x] Define BoardItem interface (type: 'bug' | 'idea')
   - [x] Create validation schemas
   - [x] Implement CRUD operations
   ```

2. **Board Controllers**

   ```typescript
   // controllers/boardController.ts
   - [x] Create board item endpoint
   - [x] Get project board items endpoint
   - [x] Update board item endpoint (status, priority, etc.)
   - [x] Delete board item endpoint
   - [x] Bulk operations endpoint
   ```

3. **Board Routes**

   ```typescript
   // routes/board.ts
   - [x] POST /projects/:projectId/board (create item)
   - [x] GET /projects/:projectId/board (list items)
   - [x] PUT /projects/:projectId/board/:itemId (update item)
   - [x] DELETE /projects/:projectId/board/:itemId (delete item)
   - [x] PATCH /projects/:projectId/board/bulk (bulk operations)
   ```

4. **Board Item Features**
   - [x] Status tracking (open, in-progress, closed)
   - [x] Priority levels (low, medium, high, critical)
   - [x] Search and filtering capabilities

### Task 7: Analytics Integration ✅ COMPLETED

**Estimated Time**: 4-5 hours
**Priority**: Medium

1. **GoatCounter Analytics Setup**

   - [x] Create `config/analytics.ts` with full GoatCounter integration
   - [x] Implement GoatCounter API client with axios

2. **Analytics Controllers**

   ```typescript
   // controllers/analyticsController.ts
   - [x] Get project analytics endpoint with GoatCounter data integration
   - [x] Get dashboard metrics endpoint with aggregated statistics
   - [x] Track custom events endpoint with user context
   - [x] Get analytics configuration endpoint
   ```

3. **Analytics Routes**

   ```typescript
   // routes/analytics.ts
   - [x] GET /analytics/projects/:projectId (project analytics)
   - [x] GET /analytics/dashboard (dashboard KPI metrics)
   - [x] POST /analytics/track (custom event tracking)
   - [x] GET /analytics/config (analytics configuration)
   ```

4. **KPI Calculations & Features**
   - [x] Project activity metrics (bugs, ideas, status tracking)
   - [x] User engagement statistics via GoatCounter integration
   - [x] Automatic event tracking for all user actions
   - [x] Privacy-focused analytics with GDPR compliance
   - [x] Comprehensive test coverage for all analytics functionality
   - [x] Integration with project and board controllers for automatic tracking

## Core Frontend Development

### Task 8: Frontend Foundation & Routing ✅ COMPLETED

**Estimated Time**: 3-4 hours
**Priority**: High

In general, the frontend should be modern, simple, and vibrant. When in doubt, think: How would Brian Chesky and Airbnb solve the problem?

1. **App Structure Setup**

   ```typescript
   // src/App.tsx
   - [x] Set up React Router with all required routes
   - [x] Configure MaterialUI theme with mobile-first responsive design
   - [x] Implement global error boundary for error handling
   - [x] Add loading states with React Query integration
   - [x] Integrate AuthProvider for global authentication state
   ```

2. **API Service Layer**

   ```typescript
   // services/apiClient.ts
   - [x] Create axios client with comprehensive interceptors
   - [x] Implement cookie-based authentication with automatic token refresh
   - [x] Add error handling and retry logic with exponential backoff
   - [x] Handle 401 errors with automatic redirect to login
   ```

3. **Custom Hooks**

   ```typescript
   // hooks/
   - [x] useAuth hook for authentication state management
   - [x] useOptimisticQuery hook for optimistic API calls
   - [x] useProjects hook for project management operations
   - [x] useBoardItems hook for board operations
   - [x] Additional utility hooks (useLoadingStates, useDebouncedValue)
   ```

4. **Route Structure**

   - [x] `/` - Dashboard/Project list with responsive grid layout
   - [x] `/projects/:id` - Project detail with board interface
   - [x] `/projects/:id/analytics` - KPI dashboard (placeholder ready for Task 12)
   - [x] `/login` - Authentication page with Google OAuth
   - [x] All routes protected with ProtectedRoute component

5. **Additional Features Implemented**
   - [x] AuthContext for global authentication state management
   - [x] Comprehensive error boundaries and loading states
   - [x] Mobile-first responsive design with MaterialUI theme
   - [x] TypeScript strict mode compliance
   - [x] Production-ready build configuration

### Task 9: Authentication UI ✅ COMPLETED

**Estimated Time**: 3-4 hours
**Priority**: High

1. **Login Component**

   ```typescript
   // components/auth/LoginPage.tsx
   - [x] Enhanced Google OAuth button with authentic styling
   - [x] Multiple button variants (contained/outlined) and sizes
   - [x] Comprehensive loading states with animations
   - [x] Error handling with user-friendly messages
   - [x] Mobile-responsive design with gradient background
   - [x] Automatic redirect after authentication
   - [x] Beautiful card-based layout with fade animations
   ```

2. **Auth Context**

   ```typescript
   // contexts/AuthContext.tsx
   - [x] User state management with TypeScript types
   - [x] Login/logout functions with proper error handling
   - [x] Token refresh handling via useAuth hook
   - [x] Project access control helper functions
   - [x] Global authentication state management
   ```

3. **Protected Routes**

   ```typescript
   // components/auth/ProtectedRoute.tsx
   - [x] Route protection logic with authentication checks
   - [x] Automatic redirect to login with return path
   - [x] Enhanced loading states with custom fallback support
   - [x] Proper error handling for authentication failures
   - [x] Integration with AuthContext for global state
   ```

4. **Enhanced Google Sign-In Button**
   ```typescript
   // components/common/GoogleSignInButton.tsx
   - [x] Authentic Google branding with proper colors
   - [x] Multiple sizes (small, medium, large) support
   - [x] Contained and outlined variants
   - [x] Proper loading states with spinner
   - [x] Preserves existing OAuth flow
   - [x] Mobile-responsive design
   - [x] Accessibility features
   ```

### Task 10: Project Management UI ✅ COMPLETED

**Estimated Time**: 5-6 hours
**Priority**: High

1. **Project List Component**

   ```typescript
   // components/projects/ProjectList.tsx
   - [x] Grid/list view of projects
   - [x] Add new project button
   - [x] Search and filter functionality
   - [x] Mobile-responsive cards
   ```

2. **Project Form Component**

   ```typescript
   // components/projects/ProjectForm.tsx
   - [x] Create/edit project form
   - [x] URL validation
   - [x] Form validation with error states
   - [x] Optimistic updates
   ```

3. **Project Card Component**
   ```typescript
   // components/projects/ProjectCard.tsx
   - [x] Project information display
   - [x] Quick actions (edit, delete, view)
   - [x] Status indicators
   - [x] Click to navigate
   ```

### Task 11: Bug/Idea Board UI ✅ COMPLETED

**Estimated Time**: 6-7 hours
**Priority**: High

1. **Board Layout Component**

   ```typescript
   // components/board/BoardLayout.tsx
   - [x] Kanban-style board layout with status columns
   - [x] Mobile-responsive design with automatic list view
   - [x] Empty state handling with create buttons
   - [x] Column headers with item counts
   - [x] Floating action button for mobile
   ```

2. **Board Item Component**

   ```typescript
   // components/board/BoardItem.tsx
   - [x] Item card with type indicator (bug/idea)
   - [x] Priority and status badges with color coding
   - [x] Context menu with edit, delete, and status change options
   - [x] Tag display with overflow handling
   - [x] Responsive design with hover effects
   - [x] Time formatting for creation/update dates
   ```

3. **Board Item Form**

   ```typescript
   // components/board/BoardItemForm.tsx
   - [x] Create/edit item form with comprehensive validation
   - [x] Type selection (bug/idea) with proper defaults
   - [x] Priority and status dropdowns with all options
   - [x] Rich text description with proper formatting
   - [x] Tag management system with autocomplete
   - [x] Modal dialog interface with loading states
   ```

4. **Board Filters**

   ```typescript
   // components/board/BoardFilters.tsx
   - [x] Filter by type (bug/idea) with item counts
   - [x] Filter by status with real-time counts
   - [x] Filter by priority with visual indicators
   - [x] Advanced search functionality with debouncing
   - [x] Tag-based filtering with autocomplete
   - [x] Active filters display with individual removal
   ```

5. **ProjectBoard Page Integration**
   ```typescript
   // pages/ProjectBoard.tsx
   - [x] Complete integration of all board components
   - [x] View switching (Kanban/List) with mobile responsiveness
   - [x] CRUD operations with optimistic updates
   - [x] Statistics cards showing bug/idea/status counts
   - [x] Error handling and loading states
   - [x] Mobile-first responsive design
   ```

### Task 12: KPI Dashboard UI

**Estimated Time**: 5-6 hours
**Priority**: Medium

1. **Dashboard Layout**

   ```typescript
   // components/analytics/KPIDashboard.tsx
   - [ ] Grid layout for metrics cards
   - [ ] Responsive design
   - [ ] Loading states
   - [ ] Error handling
   ```

2. **Metrics Cards**

   ```typescript
   // components/analytics/MetricCard.tsx
   - [ ] Individual metric display
   - [ ] Trend indicators
   - [ ] Click for detailed view
   - [ ] Various chart types
   ```

3. **Analytics Charts**

   ```typescript
   // components/analytics/Charts.tsx
   - [ ] Bug resolution time chart
   - [ ] Idea implementation rate
   - [ ] Activity timeline
   - [ ] GoatCounter analytics integration
   ```

4. **Analytics Service**
   ```typescript
   // services/analyticsService.ts
   - [ ] Fetch GoatCounter data
   - [ ] Calculate custom metrics
   - [ ] Data transformation for charts
   ```

## Advanced Features & Polish

### Task 13: Performance Optimization ✅ COMPLETED

**Estimated Time**: 3-4 hours
**Priority**: Medium

1. **Frontend Optimization**

   - [x] Implement React.memo for components
   - [x] Add virtual scrolling for large lists
   - [x] Optimize bundle size
   - [x] Add service worker for caching

2. **Backend Optimization**
   - [x] Add database indexes
   - [x] Implement caching layer
   - [x] Optimize API queries
   - [x] Add compression middleware

### Task 14: Testing & Quality Assurance ✅ COMPLETED

**Estimated Time**: 6-8 hours
**Priority**: High

1. **Backend Testing**

   ```typescript
   // tests/
   - [x] Unit tests for controllers
   - [x] Integration tests for API endpoints
   - [x] Authentication flow tests
   - [x] Database operation tests
   ```

2. **Frontend Testing**

   ```typescript
   // src/__tests__/
   - [x] Component unit tests
   - [x] Hook testing infrastructure
   - [x] Integration tests setup
   - [x] Test framework configuration
   ```

3. **Quality Checks**
   - [x] TypeScript strict mode compliance
   - [x] ESLint and Prettier formatting
   - [x] Security audit (npm audit)
   - [x] Performance testing

### Task 15: Deployment Preparation

**Estimated Time**: 4-5 hours
**Priority**: High

1. **Fly.io Setup**

   - [ ] Install Fly.io CLI: `npm install -g flyctl`
   - [ ] Authenticate: `fly auth login`
   - [ ] Initialize app: `fly launch --no-deploy`
   - [ ] Configure `fly.toml` file
   - [ ] Set up health check endpoint

2. **Environment Configuration**

   - [ ] Set production environment variables with `fly secrets set`
   - [ ] Configure database connection for production
   - [ ] Set up Google OAuth for production domain
   - [ ] Configure GoatCounter analytics for production

3. **Docker Production Setup**

   - [ ] Optimize Dockerfile for production
   - [ ] Test Docker build locally
   - [ ] Verify container runs correctly
   - [ ] Test deployment with `npm run deploy`

4. **Documentation**

   - [ ] API documentation
   - [ ] Deployment guide
   - [ ] User manual
   - [ ] Troubleshooting guide

5. **Monitoring Setup**
   - [ ] Error tracking (Sentry)
   - [ ] Performance monitoring
   - [ ] Analytics verification
   - [ ] Health check endpoints

## Final Checklist

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Test coverage >80%
- [ ] Security best practices followed
- [ ] Performance optimized

### Functionality

- [ ] User authentication working
- [ ] Project CRUD operations
- [ ] Board item management
- [ ] Analytics dashboard functional
- [ ] Mobile responsiveness verified

### Security

- [ ] No environment variables in frontend
- [ ] Secure cookie implementation
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection

### Documentation

- [ ] README updated
- [ ] API endpoints documented
- [ ] Deployment instructions complete
- [ ] User guide created

## Estimated Total Time: 60-75 hours

## Notes for Engineer:

1. **Follow the `.cursorrules` file strictly** - it contains critical best practices
2. **Mobile-first approach** - design for mobile, then desktop
3. **Security first** - never put secrets in frontend code
4. **Optimistic UI** - always show immediate feedback to users
5. **TypeScript strict** - no `any` types except rare exceptions
6. **Test as you go** - don't leave testing until the end
7. **Review AI suggestions** - understand all generated code before accepting
8. **Use Docker for production-like testing** - test with `npm run dev-build` and `npm run dev-docker`
9. **Deploy early and often** - use `npm run deploy` to test Fly.io deployment

## Development Commands Reference:

### Local Development (Fast)

```bash
# Backend
npm run dev-build-local  # Build TypeScript
npm run dev-local        # Run with hot reload

# Frontend
npm start               # React dev server
```

### Docker Development (Production-like)

```bash
# Backend
npm run dev-build       # Build Docker image
npm run dev-docker      # Run with Docker

# Full stack
docker-compose up --build
```

### Deployment

```bash
npm run deploy          # Deploy to Fly.io
```

## Priority Order:

1. Complete Tasks 1-7 (Backend foundation)
2. Complete Tasks 8-11 (Frontend core)
3. Complete Task 13 (Performance Optimization)
4. Complete Task 14 (Testing)
5. Complete Task 15 (Deployment)
6. Complete remaining tasks based on requirements

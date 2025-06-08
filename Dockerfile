# Multi-stage build for full-stack application
FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend build and dependencies
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy frontend build to be served by backend
COPY --from=frontend-build /app/frontend/dist ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs /app

USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
# Add Node.js options for faster startup
ENV NODE_OPTIONS="--max-old-space-size=256 --no-warnings --no-deprecation"

# Expose port
EXPOSE 8080

# Health check - faster check to prevent startup delay
HEALTHCHECK --interval=1s --timeout=1s --start-period=1s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"] 
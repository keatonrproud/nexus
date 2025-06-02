# Deployment Guide

This guide covers deploying the Bug/Idea Board application to Fly.io.

## Prerequisites

1. **Fly.io CLI installed**: `npm install -g flyctl`
2. **Fly.io account**: Sign up at [fly.io](https://fly.io)
3. **Supabase project**: Set up at [supabase.com](https://supabase.com)
4. **Google OAuth app**: Set up at [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Fly.io Setup ✅ COMPLETED

The Fly.io app has been initialized with the following configuration:

- **App name**: `nexus`
- **Region**: Toronto, Canada (yyz)
- **Resources**: 1 shared CPU, 512MB RAM
- **URL**: https://nexus.fly.dev

## Step 2: Environment Variables Setup

Set the following environment variables using `fly secrets set`:

### Required Variables

```bash
# Set production environment (this automatically enables background jobs)
fly secrets set NODE_ENV=production

# Database (Supabase) - REQUIRED
fly secrets set SUPABASE_URL=https://your-project.supabase.co
fly secrets set SUPABASE_ANON_KEY=your-supabase-anon-key
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication - REQUIRED
fly secrets set JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
fly secrets set REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-minimum-32-characters-long

# Google OAuth - REQUIRED
fly secrets set GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
fly secrets set GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional Variables

```bash
# JWT token expiration (defaults provided)
fly secrets set JWT_EXPIRES_IN=15m
fly secrets set REFRESH_TOKEN_EXPIRES_IN=7d

# GoatCounter Analytics (if using)
fly secrets set GOATCOUNTER_API_TOKEN=your-goatcounter-api-token

# Note: Background jobs are automatically enabled when NODE_ENV=production
# No need to set CRON_ENABLED separately

# Email service (if using)
fly secrets set SENDGRID_API_KEY=your-sendgrid-api-key
fly secrets set FROM_EMAIL=noreply@yourdomain.com

# Redis (if using)
fly secrets set REDIS_URL=redis://your-redis-instance
```

## Step 3: Database Setup

### Supabase Configuration

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Set up the database schema** using the SQL editor in Supabase dashboard
3. **Copy and execute** the contents of `database_schema.sql` in your Supabase SQL editor
4. **Get your credentials** from Settings > API

### Database Schema

The application requires the following tables:

- `users` - User authentication data
- `projects` - User projects with analytics configuration
- `board_items` - Bug reports and feature ideas

Execute the SQL in `database_schema.sql` to create all required tables and indexes.

## Step 4: Google OAuth Setup

1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Create a new project** or select existing one
3. **Enable Google+ API** in APIs & Services
4. **Create OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `https://nexus.fly.dev/api/auth/google/callback`
5. **Copy the Client ID and Client Secret** to your environment variables

## Step 5: Test Local Build

Before deploying, test the production build locally:

```bash
# Build the Docker image
docker build -t nexus .

# Test the container (with your .env file)
docker run -p 8080:8080 --env-file backend/.env nexus
```

Visit `http://localhost:8080/health` to verify the application starts correctly.

## Step 6: Deploy to Fly.io

```bash
# Deploy the application
npm run deploy
# OR
fly deploy --ha=false
```

The deployment will:

1. Build the Docker image
2. Deploy to Fly.io
3. Start the application
4. Run health checks

## Step 7: Verify Deployment

1. **Check app status**: `fly status`
2. **View logs**: `fly logs`
3. **Test health endpoint**: Visit `https://nexus.fly.dev/health`
4. **Test the application**: Visit `https://nexus.fly.dev`

## Step 8: Monitoring Setup

### Health Checks ✅ CONFIGURED

The application includes:

- Health check endpoint at `/health`
- Automatic health monitoring by Fly.io
- Graceful shutdown handling

### Logging

View application logs:

```bash
# Real-time logs
fly logs

# Historical logs
fly logs --app nexus
```

### Error Tracking (Optional)

For production error tracking, consider integrating:

- **Sentry** for error monitoring
- **LogRocket** for session replay
- **DataDog** for comprehensive monitoring

## Troubleshooting

### Common Issues

1. **Build failures**:

   ```bash
   # Check build logs
   fly logs --app nexus

   # Test build locally
   docker build -t nexus .
   ```

2. **Environment variable issues**:

   ```bash
   # List current secrets
   fly secrets list

   # Update a secret
   fly secrets set KEY=value
   ```

3. **Database connection issues**:

   - Verify Supabase credentials
   - Check if database schema is set up
   - Ensure service role key has proper permissions

4. **OAuth issues**:
   - Verify redirect URI in Google Console
   - Check Google Client ID and Secret
   - Ensure production domain is authorized

### Useful Commands

```bash
# App management
fly status                    # Check app status
fly logs                      # View logs
fly ssh console              # SSH into the app
fly scale count 1            # Scale to 1 instance

# Secrets management
fly secrets list             # List all secrets
fly secrets set KEY=value    # Set a secret
fly secrets unset KEY        # Remove a secret

# Deployment
fly deploy                   # Deploy latest changes
fly deploy --ha=false        # Deploy without high availability
```

## Security Checklist

- [ ] All environment variables set via `fly secrets set`
- [ ] No secrets in code or configuration files
- [ ] HTTPS enforced (configured in fly.toml)
- [ ] Google OAuth redirect URI matches production domain
- [ ] Supabase RLS policies configured (if needed)
- [ ] JWT secrets are strong (32+ characters)
- [ ] Database service role key secured

## Performance Optimization

The application is configured with:

- **Compression**: Gzip compression enabled
- **Caching**: Static file caching headers
- **Auto-scaling**: Machines suspend when idle
- **Health checks**: Automatic health monitoring

## Next Steps

After successful deployment:

1. **Set up custom domain** (optional):

   ```bash
   fly certs create yourdomain.com
   ```

2. **Configure analytics** with GoatCounter or Google Analytics

3. **Set up monitoring** and alerting

4. **Configure backup strategy** for Supabase

5. **Set up CI/CD pipeline** for automated deployments

## Support

- **Fly.io Documentation**: https://fly.io/docs/
- **Supabase Documentation**: https://supabase.com/docs
- **Application Issues**: Check the logs with `fly logs`

```

```

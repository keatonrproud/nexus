# Troubleshooting Guide

This guide covers common issues and their solutions for the Bug/Idea Board application.

## Deployment Issues

### Docker Build Failures

#### Frontend Build Errors

**Problem**: Frontend build fails with module resolution errors.

**Solution**:

```bash
# Clear node_modules and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build

# If still failing, check for dependency conflicts
npm audit fix
```

#### Backend Build Errors

**Problem**: TypeScript compilation errors.

**Solution**:

```bash
# Check TypeScript configuration
cd backend
npm run type-check

# Fix any TypeScript errors
npm run lint:fix
```

### Fly.io Deployment Issues

#### App Creation Fails

**Problem**: `fly launch` fails with configuration errors.

**Solution**:

```bash
# Validate fly.toml syntax
fly config validate

# If invalid, recreate the app
fly apps destroy nexus
fly launch --no-deploy --name nexus
```

#### Build Timeout

**Problem**: Docker build times out on Fly.io.

**Solution**:

```bash
# Increase build timeout
fly deploy --build-timeout 20m

# Or build locally and push
docker build -t nexus .
fly deploy --local-only
```

#### Deployment Fails

**Problem**: Deployment fails with health check errors.

**Solution**:

```bash
# Check application logs
fly logs --app nexus

# Verify health endpoint locally
curl http://localhost:8080/health

# Check environment variables
fly secrets list
```

## Runtime Issues

### Application Won't Start

#### Missing Environment Variables

**Problem**: App crashes on startup with configuration errors.

**Solution**:

```bash
# Check required environment variables
fly secrets list

# Set missing variables
fly secrets set SUPABASE_URL=your-url
fly secrets set JWT_SECRET=your-secret
```

#### Database Connection Issues

**Problem**: Cannot connect to Supabase database.

**Solution**:

1. Verify Supabase credentials in Fly.io secrets
2. Check Supabase project status
3. Ensure service role key has correct permissions
4. Test connection locally:

```bash
# Test with curl
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_KEY" \
     "https://your-project.supabase.co/rest/v1/users"
```

### Authentication Issues

#### Google OAuth Not Working

**Problem**: Google OAuth redirects fail or return errors.

**Solution**:

1. **Check Google Console Configuration**:

   - Authorized redirect URIs: `https://nexus.fly.dev/api/auth/google/callback`
   - Authorized JavaScript origins: `https://nexus.fly.dev`

2. **Verify Environment Variables**:

```bash
fly secrets list | grep GOOGLE
```

3. **Check OAuth Credentials**:
   - Ensure Client ID and Secret are correct
   - Verify OAuth consent screen is configured

#### JWT Token Issues

**Problem**: Users get logged out frequently or authentication fails.

**Solution**:

1. **Check JWT Configuration**:

```bash
# Ensure JWT secrets are set and long enough (32+ characters)
fly secrets set JWT_SECRET=your-very-long-secret-key-here
fly secrets set REFRESH_TOKEN_SECRET=another-very-long-secret-key
```

2. **Verify Token Expiration**:

```bash
# Adjust token expiration if needed
fly secrets set JWT_EXPIRES_IN=15m
fly secrets set REFRESH_TOKEN_EXPIRES_IN=7d
```

### Performance Issues

#### Slow Response Times

**Problem**: API responses are slow.

**Solution**:

1. **Check Database Performance**:

   - Review Supabase dashboard for slow queries
   - Ensure proper indexes are in place

2. **Monitor Application Metrics**:

```bash
# Check CPU and memory usage
fly metrics --app nexus

# Scale if needed
fly scale count 2
fly scale memory 1024
```

#### High Memory Usage

**Problem**: Application uses too much memory.

**Solution**:

1. **Check for Memory Leaks**:

```bash
# Monitor memory usage
fly ssh console --app nexus
top
```

2. **Optimize Application**:
   - Review database connection pooling
   - Check for memory leaks in code
   - Consider scaling memory:

```bash
fly scale memory 1024
```

### Frontend Issues

#### Static Files Not Loading

**Problem**: Frontend assets return 404 errors.

**Solution**:

1. **Verify Build Output**:

```bash
# Check if frontend built correctly
docker build -t test-build .
docker run -p 8080:8080 test-build
curl http://localhost:8080
```

2. **Check Static File Serving**:
   - Ensure `express.static` is configured correctly
   - Verify frontend build output directory

#### CORS Errors

**Problem**: Frontend cannot make API requests due to CORS.

**Solution**:

1. **Update CORS Configuration**:

```typescript
// In backend/src/server.ts
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://nexus.fly.dev"]
        : ["http://localhost:3000"],
    credentials: true,
  }),
);
```

2. **Verify Domain Configuration**:
   - Ensure production domain matches CORS origin
   - Check for trailing slashes or protocol mismatches

### Database Issues

#### Schema Not Set Up

**Problem**: Database tables don't exist.

**Solution**:

1. **Set Up Database Schema**:

   - Go to Supabase dashboard
   - Open SQL Editor
   - Execute contents of `database_schema.sql`

2. **Verify Tables**:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

#### Permission Errors

**Problem**: Database operations fail with permission errors.

**Solution**:

1. **Check Service Role Key**:

   - Ensure using service role key, not anon key
   - Verify key has correct permissions

2. **Review RLS Policies**:
   - Check if Row Level Security is blocking operations
   - Ensure service role bypasses RLS

### Monitoring and Debugging

#### Application Logs

```bash
# View real-time logs
fly logs --app nexus

# View specific number of lines
fly logs --app nexus -n 100

# Follow logs
fly logs --app nexus -f
```

#### Health Checks

```bash
# Test health endpoint
curl https://nexus.fly.dev/health

# Check application status
fly status --app nexus
```

#### SSH Access

```bash
# SSH into the application
fly ssh console --app nexus

# Check running processes
ps aux

# Check disk usage
df -h

# Check memory usage
free -h
```

### Common Error Messages

#### "Cannot find module"

**Cause**: Missing dependencies or incorrect imports.
**Solution**:

```bash
npm install
npm run build
```

#### "Port already in use"

**Cause**: Another process is using the port.
**Solution**:

```bash
# Find process using port
lsof -i :8080
kill -9 <PID>
```

#### "ECONNREFUSED"

**Cause**: Cannot connect to database or external service.
**Solution**:

- Check network connectivity
- Verify service URLs and credentials
- Check firewall settings

#### "JWT malformed"

**Cause**: Invalid JWT token format.
**Solution**:

- Clear browser cookies
- Check JWT secret configuration
- Verify token generation logic

### Getting Help

1. **Check Application Logs**: Always start with `fly logs`
2. **Review Configuration**: Verify all environment variables are set
3. **Test Locally**: Reproduce issues in local development
4. **Check Dependencies**: Ensure all services (Supabase, Google OAuth) are working
5. **Monitor Resources**: Check CPU, memory, and disk usage

### Emergency Procedures

#### Application Down

1. Check Fly.io status: `fly status`
2. View recent logs: `fly logs -n 100`
3. Restart application: `fly restart`
4. Scale up if needed: `fly scale count 2`

#### Database Issues

1. Check Supabase dashboard
2. Verify connection strings
3. Test database connectivity
4. Review recent schema changes

#### Rollback Deployment

```bash
# List recent deployments
fly releases

# Rollback to previous version
fly releases rollback <version>
```

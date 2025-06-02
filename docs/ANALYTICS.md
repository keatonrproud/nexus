# Analytics Integration

This project uses **GoatCounter** for web analytics, providing privacy-focused, lightweight analytics without the limitations of other solutions.

## Features

- **Privacy-focused**: No cookies, no tracking across sites
- **Lightweight**: Minimal impact on page load times
- **No site limits** (unlike other analytics platforms)
- **Open source**: Self-hostable or use the cloud service
- **Simple API**: Easy integration with applications
- **Real-time data**: Live visitor tracking
- **Comprehensive data**: Browsers, systems, locations, referrals, and more
- **Detailed analytics dashboard**: Interactive charts and breakdowns
- **Multiple visualization types**: Bar charts, doughnut charts, line graphs
- **Per-project configuration**: Each project can have its own GoatCounter site and API token

## Why GoatCounter?

- **No site limits**
- **Privacy-focused** and GDPR compliant
- **Lightweight** (~2KB tracking script)
- **Self-hosted or cloud** options available
- **Simple API** with good documentation
- **Rich analytics data** with detailed breakdowns

## Configuration

### Per-Project Configuration

Each project stores its own GoatCounter site code and API token in the database:

```sql
-- Projects table includes both site code and API token
ALTER TABLE projects ADD COLUMN goatcounter_site_code VARCHAR(255);
ALTER TABLE projects ADD COLUMN goatcounter_api_token VARCHAR(500);
```

**Benefits of per-project tokens:**

- Each project can use a different GoatCounter account
- Better security isolation between projects
- Easier to manage permissions per project
- No global configuration required

## Migration from Global Token

If you're upgrading from a previous version that used a global `GOATCOUNTER_API_TOKEN`, follow these steps:

### 1. Database Migration

Run this SQL command in your Supabase SQL editor:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goatcounter_api_token VARCHAR(500);
```

### 2. Update Environment Variables

Remove the global token from your `.env` file:

```bash
# Remove this line:
# GOATCOUNTER_API_TOKEN=your-global-token
```

### 3. Configure Projects

For each project that needs analytics:

1. Edit the project in the UI
2. Add the GoatCounter site code
3. Add the corresponding API token
4. Save the project

### 4. Verify Analytics

Check that analytics data appears correctly in the dashboard for each configured project.

## API Structure

GoatCounter uses a site-specific API structure:

- **API Base URL**: `https://{site_code}.goatcounter.com/api/v0`
- **Authentication**: `Authorization: Bearer {api_token}`
- **Rate Limit**: 4 requests per second

## Implementation

### GoatCounterClient

The `GoatCounterClient` class handles all API interactions using the official GoatCounter API endpoints. Each method now accepts both the site code and API token as parameters:

```typescript
import { goatcounterClient } from "../config/analytics";

// Get detailed hits data
const hits = await goatcounterClient.getHits(
  "your-site-code",
  "your-api-token",
  "2024-01-01",
  "2024-01-31",
  { daily: true, limit: 50 },
);

// Get total counts
const totals = await goatcounterClient.getTotalCount(
  "your-site-code",
  "your-api-token",
  "2024-01-01",
  "2024-01-31",
);

// Get browser statistics
const browsers = await goatcounterClient.getStatsPage(
  "your-site-code",
  "your-api-token",
  "browsers",
  "2024-01-01",
  "2024-01-31",
);

// Get all paths on the site
const paths = await goatcounterClient.getPaths(
  "your-site-code",
  "your-api-token",
);

// Get referrals for a specific path
const referrals = await goatcounterClient.getPathReferrals(
  "your-site-code",
  "your-api-token",
  123, // path ID
  "2024-01-01",
  "2024-01-31",
);

// Track pageview (server-side)
await goatcounterClient.trackPageview(
  "your-site-code",
  "your-api-token",
  "/page-path",
  "Page Title",
  "https://referrer.com",
);
```

### API Endpoints

#### Basic Analytics

```
GET /api/analytics/config
GET /api/analytics/dashboard?startDate&endDate
GET /api/analytics/projects/:projectId?startDate&endDate
POST /api/analytics/track
```

#### Detailed Analytics

```
GET /api/analytics/projects/:projectId/detailed?type&startDate&endDate&limit&offset
GET /api/analytics/projects/:projectId/paths?limit&after
GET /api/analytics/projects/:projectId/path-referrals?pathId&startDate&endDate&limit&offset
GET /api/analytics/projects/:projectId/totals?startDate&endDate
GET /api/analytics/projects/:projectId/hits?startDate&endDate&daily&limit
GET /api/analytics/user/sites
```

#### Detailed Analytics Types

The `type` parameter for detailed analytics can be:

- `browsers` - Browser statistics (Chrome, Firefox, Safari, etc.)
- `systems` - Operating system statistics (Windows, macOS, Linux, etc.)
- `locations` - Geographic location statistics (countries, regions, cities)
- `languages` - Language preference statistics
- `sizes` - Screen size statistics
- `campaigns` - Campaign tracking statistics
- `toprefs` - Top referrer statistics

## Frontend Dashboard

### Analytics Page Structure

The analytics page features a tabbed interface with two main sections:

1. **Overview Dashboard** (`KPIDashboard`)

   - Key performance indicators (KPIs)
   - Page views, unique visitors, total visits
   - Bounce rate and session duration metrics
   - Interactive charts for trends and distributions
   - Browser, OS, and location breakdowns

2. **Detailed Analytics** (`DetailedAnalytics`)
   - Tabbed interface for different data types
   - Interactive bar and doughnut charts
   - Detailed data tables with percentages
   - Real-time filtering by date range

### Dashboard Features

#### KPI Dashboard

- **Primary Metrics**: Page views, unique visitors, visits, bounce rate
- **Secondary Metrics**: Pages per session, average session duration, total time
- **Visualizations**: Line charts for trends, bar charts for top pages, doughnut charts for distributions
- **Data Sources**: Browsers, operating systems, locations, referrers

#### Detailed Analytics

- **Interactive Tabs**: Switch between different analytics types
- **Multiple Chart Types**: Bar charts for comparisons, doughnut charts for distributions
- **Data Tables**: Sortable tables with counts and percentages
- **Date Range Selection**: Flexible date filtering

### Component Usage

```typescript
import { KPIDashboard, DetailedAnalytics } from '@/components/analytics';

// KPI Dashboard
<KPIDashboard projectId="project-id" />

// Detailed Analytics
<DetailedAnalytics projectId="project-id" />
```

## Data Structure

### GoatCounter API Response Types

```typescript
interface GoatCounterHit {
  count: number;
  path_id: number;
  path: string;
  event: boolean;
  title: string;
  max: number;
  stats: GoatCounterHitStat[];
  ref_scheme?: string;
}

interface GoatCounterHitStat {
  day: string;
  hourly: number[];
  daily: number;
}

interface GoatCounterMetric {
  id: string;
  name: string;
  count: number;
  ref_scheme?: string;
}

interface GoatCounterTotalCount {
  total: number;
  total_events: number;
  total_utc: number;
}

interface GoatCounterPath {
  id: number;
  path: string;
  title: string;
  event: boolean;
}

interface GoatCounterSite {
  id: number;
  code: string;
  cname: string;
  link_domain: string;
  created_at: string;
  updated_at: string;
}

interface GoatCounterUser {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}
```

### Frontend API Response Types

```typescript
interface DetailedAnalyticsData {
  project: { id: string; name: string; url: string };
  dateRange: { startDate: string; endDate: string };
  type:
    | "browsers"
    | "systems"
    | "locations"
    | "languages"
    | "sizes"
    | "campaigns"
    | "toprefs";
  data: GoatCounterMetric[];
  analyticsEnabled: boolean;
  error?: string;
}

interface HitsData {
  project: { id: string; name: string; url: string };
  dateRange: { startDate: string; endDate: string };
  hits: GoatCounterHit[];
  analyticsEnabled: boolean;
  error?: string;
}

interface ProjectPathsData {
  project: { id: string; name: string; url: string };
  paths: GoatCounterPath[];
  more: boolean;
  analyticsEnabled: boolean;
  error?: string;
}
```

## Setup Guide

### 1. Create GoatCounter Account

- Sign up at [goatcounter.com](https://goatcounter.com)
- Create a site for each project you want to track
- Note the site code (e.g., `myproject` from `myproject.goatcounter.com`)

### 2. Get API Token for Each Site

- Go to Settings → API in your GoatCounter dashboard
- Create a new API token for each site
- Copy the API token (you'll need this for each project)

### 3. Configure Projects

- When creating or editing a project in the Bug/Idea Board:
  - Add the GoatCounter site code (e.g., "myproject")
  - Add the corresponding API token
- Both fields are optional, but both are required for analytics to work

### 4. Add Tracking Script (Frontend)

Add to each project's HTML (replace YOURCODE with your site code):

```html
<script
  data-goatcounter="https://YOURCODE.goatcounter.com/count"
  async
  src="//gc.zgo.at/count.js"
></script>
```

### 5. Verify Setup

- Create some test pageviews on your site
- Check the analytics dashboard in the Bug/Idea Board
- Data should appear within a few minutes

## Usage Examples

### Frontend Analytics Service

```typescript
import { analyticsApi } from "@/services/analyticsService";

// Get detailed browser statistics
const browserStats = await analyticsApi.getDetailedAnalytics(
  "project-id",
  "browsers",
  "2024-01-01",
  "2024-01-31",
  { limit: 10 },
);

// Get all paths for a project
const paths = await analyticsApi.getProjectPaths("project-id", { limit: 50 });

// Get referrals for a specific path
const referrals = await analyticsApi.getPathReferrals(
  "project-id",
  123, // path ID
  "2024-01-01",
  "2024-01-31",
);

// Get total counts
const totals = await analyticsApi.getTotalCounts(
  "project-id",
  "2024-01-01",
  "2024-01-31",
);

// Get detailed hits data
const hits = await analyticsApi.getHitsData(
  "project-id",
  "2024-01-01",
  "2024-01-31",
  { daily: true, limit: 20 },
);

// Get user's GoatCounter sites
const userSites = await analyticsApi.getUserSites();
```

## Error Handling

The client includes comprehensive error handling:

- **API errors**: Logged and re-thrown with descriptive messages
- **Tracking failures**: Logged but don't break the main application flow
- **Missing configuration**: Clear error messages for setup issues
- **Rate limiting**: Respects GoatCounter's 4 requests/second limit

## Rate Limiting

GoatCounter has a rate limit of 4 requests per second. The client respects this limit and includes appropriate error handling for rate limit exceeded scenarios.

## Testing

The analytics system includes comprehensive tests:

```bash
npm test -- analytics.test.ts
```

Tests cover:

- API client functionality
- Error handling
- Data transformation
- Rate limiting behavior

## Monitoring

Monitor analytics health through:

- **Application logs**: Check for API errors
- **GoatCounter dashboard**: Verify data is being received
- **API response times**: Monitor for performance issues

## Privacy Compliance

GoatCounter is designed with privacy in mind:

- **No cookies** by default
- **No personal data** collection
- **GDPR compliant** out of the box
- **Data retention** policies configurable

## Troubleshooting

### Common Issues

1. **"GoatCounter site code or API token not configured"**

   - Ensure both `goatcounter_site_code` and `goatcounter_api_token` are set for the project
   - Both fields are required for analytics to work

2. **"Failed to fetch analytics data"**

   - Check that the API token is valid and has the correct permissions
   - Verify the site code matches your GoatCounter site exactly
   - Check GoatCounter service status

3. **Rate limit errors**

   - The system automatically handles rate limiting (4 requests per second)
   - If you see rate limit errors, they should resolve automatically

4. **"No data returned"**

   - Verify the date range has data
   - Check if the site has received any pageviews
   - Ensure tracking script is properly installed on your website
   - Confirm the site code in the tracking script matches the project configuration

5. **Analytics not appearing in dashboard**
   - Verify both site code and API token are correctly configured
   - Check that the GoatCounter site is receiving data
   - Ensure the API token has read permissions

### Security Notes

- **API tokens are stored securely** in the database
- **Each project uses its own token** for better security isolation
- **Tokens are never exposed** in frontend code or logs
- **Use different tokens** for different projects when possible

## Available Endpoints Summary

| Endpoint                                 | Purpose                     | Parameters                                |
| ---------------------------------------- | --------------------------- | ----------------------------------------- |
| `/analytics/config`                      | Get analytics configuration | -                                         |
| `/analytics/dashboard`                   | Get dashboard metrics       | startDate, endDate                        |
| `/analytics/projects/:id`                | Get project analytics       | startDate, endDate                        |
| `/analytics/projects/:id/detailed`       | Get detailed analytics      | type, startDate, endDate, limit, offset   |
| `/analytics/projects/:id/paths`          | Get project paths           | limit, after                              |
| `/analytics/projects/:id/path-referrals` | Get path referrals          | pathId, startDate, endDate, limit, offset |
| `/analytics/projects/:id/totals`         | Get total counts            | startDate, endDate                        |
| `/analytics/projects/:id/hits`           | Get hits data               | startDate, endDate, daily, limit          |
| `/analytics/user/sites`                  | Get user's sites            | -                                         |
| `/analytics/track`                       | Track custom event          | event, properties                         |

## Recent Updates

### Legacy Endpoint Removal

- Removed legacy `getStats()` and `getPageviews()` methods
- All endpoints now use official GoatCounter API structure
- Improved data consistency and reliability

### Enhanced Dashboard Features

- Added detailed analytics component with tabbed interface
- Implemented interactive charts for all data types
- Added real-time data filtering and visualization
- Improved mobile responsiveness and user experience

### New Data Visualizations

- Browser and OS distribution charts
- Geographic location analytics
- Referrer tracking and analysis
- Screen size and language statistics
- Campaign tracking support

## Setup Complete

The application is now fully configured to use GoatCounter analytics with comprehensive data access and modern dashboard interfaces. All official GoatCounter API endpoints (excluding exports) have been implemented and are available through both the KPI dashboard and detailed analytics views.

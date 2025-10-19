## 🚀 Phase 2: Backend & Web Scraping - Complete Setup Guide

Congratulations! Your backend is now fully built. This guide will walk you through setting it up and deploying it.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [Running the Backend](#running-the-backend)
5. [Testing the Scrapers](#testing-the-scrapers)
6. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   ```bash
   # Check if installed
   node --version
   npm --version

   # Install from: https://nodejs.org/
   # Or use Homebrew on macOS:
   brew install node
   ```

2. **PostgreSQL** (v13 or higher)
   ```bash
   # Check if installed
   psql --version

   # Install on macOS:
   brew install postgresql@15
   brew services start postgresql@15

   # Install on Linux:
   sudo apt-get install postgresql postgresql-contrib

   # Install on Windows:
   # Download from: https://www.postgresql.org/download/windows/
   ```

3. **Git** (already installed if you completed Phase 1)

---

## Local Development Setup

### 1. Install Node.js Dependencies

```bash
cd /Users/cmlwork/code/baldwin-agr

# Install all dependencies
npm install

# This will install:
# - Express (web server)
# - Cheerio (HTML parsing)
# - Puppeteer (browser automation)
# - Axios (HTTP client)
# - node-cron (scheduling)
# - pg (PostgreSQL client)
# - rss-parser (RSS feed parsing)
# - Winston (logging)
# - and more...
```

### 2. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Minimal `.env` configuration:**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/baldwin_news
FRONTEND_URL=http://localhost:8000
SCRAPE_DELAY_MS=2000
USER_AGENT=BaldwinNewsBot/1.0 (+https://yourdomain.com/about)
LOG_LEVEL=info
```

**Important:**
- Replace `yourpassword` with your PostgreSQL password
- Change `yourdomain.com` to your actual domain (or leave as placeholder)

---

## Database Configuration

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE baldwin_news;

# Create user (optional - or use existing user)
CREATE USER baldwin_user WITH PASSWORD 'yourpassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE baldwin_news TO baldwin_user;

# Exit
\q
```

### 2. Initialize Database Schema

```bash
# Run the setup script
npm run db:setup
```

This will:
- Create all tables (sources, articles, tags, etc.)
- Add indexes for performance
- Insert default news sources
- Insert common tags

**Expected output:**
```
==================================================
Baldwin County News Hub - Database Setup
==================================================

1. Connecting to database...
2. Creating tables...
   ✓ Tables created successfully
3. Verifying schema...
   ✓ Found 5 tables:
     - sources
     - articles
     - tags
     - article_tags
     - scrape_logs
4. Checking sources...
   ✓ Found 7 sources:
     ✓ Baldwin Times
     ✓ Gulf Coast News
     ✓ Orange Beach Today
     ✓ AL.com Baldwin
     ✓ Foley Observer
     ✓ Mobile Register
     ✓ Orange Beach City
==================================================
Database setup complete!
==================================================
```

### 3. Verify Database

```bash
# Connect to your database
psql -d baldwin_news

# Check tables
\dt

# View sources
SELECT * FROM sources;

# Exit
\q
```

---

## Running the Backend

### 1. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

**Expected output:**
```
╔═══════════════════════════════════════════╗
║   Baldwin County News Hub - Backend      ║
║                                           ║
║   Server running on port 3000            ║
║   Environment: development               ║
║   API: http://localhost:3000/api         ║
╚═══════════════════════════════════════════╝
```

### 2. Test API Endpoints

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/api/health

# List sources
curl http://localhost:3000/api/sources

# Get news (will be empty until you scrape)
curl http://localhost:3000/api/news

# Get stats
curl http://localhost:3000/api/stats
```

---

## Testing the Scrapers

### 1. Run Manual Scrape

```bash
npm run scrape
```

This will:
- Initialize all scrapers
- Scrape each enabled news source
- Save articles to database
- Display results

**Expected output:**
```
============================================================
Baldwin County News Hub - Manual Scraping
============================================================

[INFO] Initializing Scraper Manager...
[INFO] Found 7 enabled sources
[INFO] Initialized scraper for: Baldwin Times
[INFO] Initialized scraper for: Gulf Coast News
...

==================================================
Starting scraping cycle...
==================================================

Scraping: Baldwin Times
✓ Baldwin Times: Found 15 new articles

Scraping: Gulf Coast News
✓ Gulf Coast News: Found 8 new articles

...

==================================================
Scraping cycle complete!
Total time: 45.23s
Successful: 7/7
Failed: 0/7
New articles: 48
==================================================
```

### 2. Check Scraped Data

```bash
# Connect to database
psql -d baldwin_news

# View articles
SELECT id, title, source_id, published_at
FROM articles
ORDER BY published_at DESC
LIMIT 10;

# Count by source
SELECT s.name, COUNT(a.id) as article_count
FROM sources s
LEFT JOIN articles a ON s.id = a.source_id
GROUP BY s.name
ORDER BY article_count DESC;
```

### 3. Test API with Data

```bash
# Get latest news
curl http://localhost:3000/api/news?limit=5

# Filter by category
curl http://localhost:3000/api/news?category=local

# Search
curl http://localhost:3000/api/news?search=beach

# Get trending
curl http://localhost:3000/api/trending
```

---

## Connecting Frontend to Backend

### 1. Update Frontend HTML

Edit `/Users/cmlwork/code/baldwin-agr/frontend/index.html`:

```html
<!-- Add API client before app.js -->
<script src="./js/api.js"></script>
<script src="./js/app.js"></script>
</body>
</html>
```

### 2. Modify app.js to Use API

The existing `app.js` works with static data. To use the API, add this function:

```javascript
/**
 * Load news from API
 */
async function loadNewsFromAPI() {
  try {
    showStatus('Loading news...');

    // Get active filters
    const filters = {
      limit: 50,
      // Add other filters based on UI state
    };

    // Fetch from API
    const articles = await fetchNews(filters);

    // Render articles
    renderArticles(articles);

    showStatus(`Loaded ${articles.length} articles`);
  } catch (error) {
    console.error('Failed to load news:', error);
    showStatus('Failed to load news');
  }
}

/**
 * Render articles to the page
 */
function renderArticles(articles) {
  const container = document.getElementById('newsContainer');
  container.innerHTML = ''; // Clear existing

  articles.forEach(article => {
    const articleEl = createArticleElement(article);
    container.appendChild(articleEl);
  });
}

/**
 * Create article HTML element
 */
function createArticleElement(article) {
  const div = document.createElement('div');
  div.className = `news-item ${article.content_type === 'social' ? 'social-post' : ''}`;
  div.dataset.timestamp = article.published_at;
  div.dataset.category = article.category;
  div.dataset.contentType = article.content_type;

  div.innerHTML = `
    <div class="news-meta">
      <span class="content-type-badge badge-${article.content_type}">${article.content_type.toUpperCase()}</span>
      <span class="news-source">${article.source_name}</span>
      <span>${formatTimeAgo(article.published_at)}</span>
      <a href="${article.url}" target="_blank" class="citation-link">🔗 Source</a>
    </div>
    <a href="${article.url}" target="_blank" class="news-title">${article.title}</a>
    <div class="news-excerpt">${article.excerpt || ''}</div>
    ${article.tags ? `
      <div class="news-tags">
        ${article.tags.map(tag => `<span class="news-tag">${tag}</span>`).join('')}
      </div>
    ` : ''}
  `;

  return div;
}

/**
 * Format timestamp as "X hours ago"
 */
function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
```

### 3. Test Full Stack

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd frontend
python3 -m http.server 8000
```

Visit: http://localhost:8000

The frontend will now load news from your backend API!

---

## Deployment

### Option 1: Railway.app (Recommended - Easy)

**Backend:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://yourusername.github.io/baldwin-county-news-hub
```

**Frontend:** Already on GitHub Pages from Phase 1!

### Option 2: DigitalOcean App Platform

1. Connect your GitHub repository
2. Select backend folder
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy!

### Option 3: Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
heroku create baldwin-news-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main

# Set variables
heroku config:set NODE_ENV=production
```

---

## Project Structure

After Phase 2, your project looks like this:

```
baldwin-agr/
├── backend/
│   ├── config/
│   │   ├── database.js        # DB connection
│   │   └── schema.sql         # Database schema
│   ├── models/
│   │   └── Article.js         # Article model
│   ├── routes/
│   │   └── api.js             # API endpoints
│   ├── scrapers/
│   │   ├── BaseScraper.js     # Base scraper class
│   │   ├── ScraperManager.js  # Orchestrator
│   │   ├── manual-scrape.js   # Manual run script
│   │   ├── news/
│   │   │   ├── RSSScraper.js  # RSS scraper
│   │   │   └── CheerioScraper.js
│   │   └── social/
│   │       └── NitterScraper.js
│   ├── scripts/
│   │   └── setup-database.js  # DB setup
│   ├── utils/
│   │   └── logger.js          # Logging
│   └── server.js              # Main server
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js             # Main app
│   │   └── api.js             # API client
│   ├── assets/
│   └── index.html
├── logs/                       # Log files (auto-created)
├── package.json
├── .env                        # Your secrets (gitignored)
├── .env.example
├── README.md
├── DEPLOYMENT.md
└── PHASE2_SETUP.md
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `ECONNREFUSED` or `password authentication failed`

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start if not running
brew services start postgresql@15

# Test connection
psql -U postgres -d baldwin_news

# Reset password if needed
psql postgres
ALTER USER postgres PASSWORD 'newpassword';
```

### Scraping Errors

**Error:** `HTTP 403 Forbidden` or `Timeout`

- Some sites block automated scraping
- Try increasing delay in `.env`: `SCRAPE_DELAY_MS=5000`
- Check if site has robots.txt restrictions
- May need to implement Puppeteer scraper for JavaScript sites

**Error:** `Cannot find module`

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Frontend Can't Connect to API

**Check CORS settings:**

In `backend/server.js`, ensure CORS is properly configured:

```javascript
app.use(cors({
  origin: '*', // Or specify your frontend URL
  credentials: true,
}));
```

**Check API URL:**

In `frontend/js/api.js`, verify `API_BASE_URL` is correct for your environment.

---

## Next Steps

✅ **Phase 2 Complete!** You now have:
- Automated news scraping from 7 sources
- REST API serving news data
- Scheduled scraping (every 30 min during day)
- Database storing all articles
- Frontend-backend integration

**Phase 3:** Production Deployment
- Deploy backend to Railway/Heroku
- Configure custom domain
- Set up SSL/HTTPS
- Add monitoring and alerts
- Performance optimization

**Phase 4:** Social Media APIs
- Twitter API v2 integration
- Instagram Graph API
- TikTok Research API
- Real-time updates

**Phase 5:** Advanced Features
- User accounts
- Saved articles
- Email notifications
- Mobile app

---

## Support

Questions? Issues?
- Check logs: `tail -f logs/combined.log`
- Enable debug logging: `LOG_LEVEL=debug` in `.env`
- Review API responses: `curl -v http://localhost:3000/api/health`

Happy scraping! 🚀📰

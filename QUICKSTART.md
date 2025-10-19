# ⚡ Quick Start Guide - Baldwin County News Hub

Get up and running in 5 minutes!

---

## 🏃 Super Quick Start (For Testing)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/baldwin_news
FRONTEND_URL=http://localhost:8000
SCRAPE_DELAY_MS=2000
LOG_LEVEL=info
EOF

# 3. Create database
createdb baldwin_news

# 4. Setup schema
npm run db:setup

# 5. Run test scrape
npm run scrape

# 6. Start server
npm run dev
```

**Open another terminal:**
```bash
# 7. Test API
curl http://localhost:3000/api/news | json_pp

# 8. Serve frontend
cd frontend && python3 -m http.server 8000
```

**Visit:** http://localhost:8000

---

## 📋 Prerequisites Checklist

- [ ] Node.js v16+ installed (`node --version`)
- [ ] PostgreSQL 13+ installed (`psql --version`)
- [ ] PostgreSQL running (`pg_isready`)
- [ ] Git installed (already have it from Phase 1)

**Don't have them?**
```bash
# macOS
brew install node postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install nodejs npm postgresql

# Windows
# Download from nodejs.org and postgresql.org
```

---

## 🎯 What Each Command Does

### `npm install`
Installs all Node.js dependencies:
- Express (web server)
- Cheerio (HTML parsing)
- Puppeteer (browser automation)
- PostgreSQL client
- And more...

### `npm run db:setup`
Creates database tables and inserts default data:
- sources (7 news sources)
- articles (empty initially)
- tags (common hashtags)
- Indexes for performance

### `npm run scrape`
Runs all scrapers manually:
- Fetches latest articles from each source
- Saves to database
- Shows summary of results

### `npm run dev`
Starts the backend server with auto-reload:
- Listens on port 3000
- Serves REST API
- Auto-restarts on code changes

---

## 🧪 Testing Checklist

### 1. Backend Health
```bash
curl http://localhost:3000/api/health
```
**Expected:** `{"success":true,"status":"healthy"}`

### 2. Sources Loaded
```bash
curl http://localhost:3000/api/sources | json_pp
```
**Expected:** List of 7 news sources

### 3. Articles Scraped
```bash
curl http://localhost:3000/api/news?limit=5 | json_pp
```
**Expected:** Array of articles (after running scrape)

### 4. Search Works
```bash
curl "http://localhost:3000/api/news?search=beach" | json_pp
```
**Expected:** Articles containing "beach"

### 5. Trending Topics
```bash
curl http://localhost:3000/api/trending | json_pp
```
**Expected:** List of trending tags

---

## 🚨 Common Issues & Fixes

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Database connection error"
```bash
# Check PostgreSQL is running
pg_isready

# Start it if not
brew services start postgresql@15

# Test connection
psql -U postgres -d baldwin_news
```

### "Port 3000 already in use"
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

### "No articles found"
```bash
# Run scraper
npm run scrape

# Check database
psql -d baldwin_news -c "SELECT COUNT(*) FROM articles;"
```

---

## 📂 Project Layout

```
baldwin-agr/
├── backend/          # Server code
│   ├── server.js    # Main entry point
│   ├── routes/      # API endpoints
│   ├── scrapers/    # Web scrapers
│   ├── models/      # Database models
│   └── config/      # Configuration
├── frontend/        # Client code
│   ├── index.html
│   ├── css/
│   └── js/
├── package.json     # Dependencies
└── .env            # Your secrets
```

---

## 🔄 Development Workflow

### Making Changes

**1. Edit code**
```bash
# Backend auto-reloads with nodemon
# Just save your files
```

**2. Test changes**
```bash
# Test API
curl http://localhost:3000/api/news

# Check logs
tail -f logs/combined.log
```

**3. Test scraper changes**
```bash
# Run specific scraper
npm run scrape
```

### Database Changes

**1. Modify schema**
```bash
# Edit backend/config/schema.sql
nano backend/config/schema.sql
```

**2. Reapply schema**
```bash
# Drop and recreate
dropdb baldwin_news
createdb baldwin_news
npm run db:setup
```

**3. Re-scrape data**
```bash
npm run scrape
```

---

## 📊 Useful Database Commands

```bash
# Connect to database
psql -d baldwin_news

# View all tables
\dt

# Count articles
SELECT COUNT(*) FROM articles;

# Recent articles
SELECT title, source_id, published_at
FROM articles
ORDER BY published_at DESC
LIMIT 10;

# Articles by source
SELECT s.name, COUNT(a.id)
FROM sources s
LEFT JOIN articles a ON s.id = a.source_id
GROUP BY s.name;

# Exit
\q
```

---

## 🎨 Frontend Testing

```bash
# Start frontend
cd frontend
python3 -m http.server 8000

# Or use Node
npx http-server -p 8000

# Or use PHP
php -S localhost:8000
```

**Test in browser:**
- http://localhost:8000 - Main page
- F12 - Open developer console
- Check for API errors
- Test search, filters, toggles

---

## 📝 Quick Reference

### Environment Variables
```env
NODE_ENV=development|production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/db
FRONTEND_URL=http://localhost:8000
SCRAPE_DELAY_MS=2000
LOG_LEVEL=debug|info|warn|error
```

### NPM Scripts
```bash
npm start        # Start server (production)
npm run dev      # Start server (dev mode)
npm run scrape   # Manual scrape
npm run db:setup # Setup database
```

### API Endpoints
```
GET  /api/health          # Health check
GET  /api/news            # Get articles
GET  /api/news/:id        # Get single article
GET  /api/sources         # List sources
GET  /api/trending        # Trending topics
GET  /api/stats           # Statistics
```

### Database Tables
```
sources        # News sources
articles       # Scraped articles
tags           # Hashtags/categories
article_tags   # Article-tag relationships
scrape_logs    # Scraping history
```

---

## 🚀 Ready to Deploy?

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

**Recommended hosting:**
- Backend: Railway.app or Heroku
- Database: Railway PostgreSQL or Heroku Postgres
- Frontend: GitHub Pages (already set up from Phase 1)

---

## 📚 More Documentation

- [PHASE2_SETUP.md](PHASE2_SETUP.md) - Detailed setup guide
- [README_PHASE2.md](README_PHASE2.md) - Phase 2 overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [README.md](README.md) - Original README

---

## ✅ Success Criteria

Your setup is working if:

1. ✅ `npm run dev` starts without errors
2. ✅ `curl http://localhost:3000/api/health` returns success
3. ✅ `npm run scrape` finds articles
4. ✅ `curl http://localhost:3000/api/news` returns articles
5. ✅ Frontend loads at http://localhost:8000
6. ✅ No errors in browser console

---

## 🆘 Still Stuck?

1. Check logs: `tail -f logs/combined.log`
2. Enable debug: `LOG_LEVEL=debug` in `.env`
3. Review full setup guide: [PHASE2_SETUP.md](PHASE2_SETUP.md)
4. Check database: `psql -d baldwin_news`
5. Verify Node version: `node --version` (must be v16+)

---

**Happy coding! 🎉**

Time from zero to running: ~5 minutes

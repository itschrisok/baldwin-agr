# Baldwin County News Hub - Deployment Guide

This guide walks you through setting up Git, pushing to GitHub, and deploying your application.

## 📋 Table of Contents
- [Initial Git Setup](#initial-git-setup)
- [Pushing to GitHub](#pushing-to-github)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Testing Instructions](#testing-instructions)
- [Phase 2: Backend Setup](#phase-2-backend-setup)

---

## Initial Git Setup

### 1. Initialize Git Repository

```bash
# Navigate to project directory
cd /Users/cmlwork/code/baldwin-agr/baldwin-county-news-hub

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Baldwin County News Hub MVP

- Multi-source news aggregation (7 sources)
- Advanced filtering and search functionality
- Hashtag management system
- Responsive design (mobile-first)
- Citation links to all original sources
- Clean separation of HTML/CSS/JS
- Production-ready code structure

Ready for Phase 2: Backend implementation"
```

### 2. Verify Commit

```bash
# Check git status
git status

# View commit history
git log --oneline

# See what files are tracked
git ls-files
```

---

## Pushing to GitHub

### 1. Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon in top-right corner
3. Select **New repository**
4. Fill in details:
   - **Repository name:** `baldwin-county-news-hub`
   - **Description:** "A modern news aggregator for Baldwin County, Alabama"
   - **Visibility:** Public (or Private if preferred)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### 2. Connect Local Repository to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/baldwin-county-news-hub.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Verify on GitHub

Visit your repository: `https://github.com/YOUR_USERNAME/baldwin-county-news-hub`

You should see:
- ✅ All project files
- ✅ README.md displayed on homepage
- ✅ LICENSE file recognized
- ✅ .gitignore working (no node_modules, etc.)

---

## GitHub Pages Deployment

### Option 1: Simple GitHub Pages (Recommended for MVP)

1. **Go to Repository Settings**
   - Navigate to your repository on GitHub
   - Click **Settings** tab
   - Scroll down to **Pages** section (left sidebar)

2. **Configure GitHub Pages**
   - **Source:** Deploy from a branch
   - **Branch:** main
   - **Folder:** / (root)
   - Click **Save**

3. **Wait for Deployment**
   - GitHub will build and deploy (takes 1-2 minutes)
   - Refresh the page to see the deployment URL
   - URL format: `https://YOUR_USERNAME.github.io/baldwin-county-news-hub/`

4. **Verify Deployment**
   - Visit the URL
   - Test all features
   - Check browser console for errors

### Option 2: Custom Domain (Optional)

If you have a custom domain (e.g., baldwincountynews.com):

1. **Add CNAME Record** in your domain DNS:
   ```
   Type: CNAME
   Name: www (or @)
   Value: YOUR_USERNAME.github.io
   ```

2. **Configure in GitHub:**
   - Settings → Pages → Custom domain
   - Enter your domain: `www.baldwincountynews.com`
   - Wait for DNS check (can take 24-48 hours)
   - Enable "Enforce HTTPS" after DNS propagates

---

## Testing Instructions

### Local Testing

#### Method 1: Direct File Open
```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

#### Method 2: Local Web Server (Recommended)
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server -p 8000

# Then visit: http://localhost:8000
```

### Testing Checklist

- [ ] **Page loads without errors**
  - Check browser console (F12)
  - No 404 errors for CSS/JS files
  - No JavaScript errors

- [ ] **Search functionality**
  - [ ] Type in search box
  - [ ] Results appear/disappear
  - [ ] Text highlighting works
  - [ ] Clear button (×) works
  - [ ] Result count displays

- [ ] **Filter toggles**
  - [ ] Click news source toggles
  - [ ] Items appear/disappear correctly
  - [ ] Content type toggles work
  - [ ] Category filters work (All, Local, Politics, Sports, Weather)
  - [ ] Time sorting works (Newest, Today, This Month)

- [ ] **Hashtag management**
  - [ ] Add new hashtag
  - [ ] Remove hashtag with × button
  - [ ] Duplicate prevention works
  - [ ] Enter key adds hashtag

- [ ] **Citation links**
  - [ ] All "🔗 Source" links work
  - [ ] Links open in new tabs
  - [ ] Hover effects work

- [ ] **Responsive design**
  - [ ] Test on desktop
  - [ ] Test on tablet (resize window to ~768px)
  - [ ] Test on mobile (resize window to ~375px)
  - [ ] Sidebar moves on mobile
  - [ ] Buttons wrap properly

- [ ] **Cross-browser testing**
  - [ ] Chrome/Edge (Chromium)
  - [ ] Firefox
  - [ ] Safari (if on macOS)

### Expected Behavior

1. **On Load:**
   - Status indicator shows "✅ Ready" briefly
   - 6 news items visible (all toggles default on)
   - Search box empty and ready

2. **Search:**
   - Type "development" → 2 results
   - Type "beach" → 3 results
   - Matching text highlighted in yellow

3. **Filters:**
   - Turn off "Baldwin Times" → 1 item hidden
   - Turn off "Social Media" → 2 items hidden
   - Select "Today" filter → Only today's items show

4. **Hashtags:**
   - Add "test" → becomes "#test"
   - Add "#example" → stays as "#example"
   - Try adding duplicate → Warning message

---

## Phase 2: Backend Setup

When you're ready to implement the backend (news scraping):

### 1. Technology Stack

**Backend:**
- Node.js + Express (web server)
- Cheerio (HTML parsing)
- Puppeteer (JavaScript-heavy sites)
- node-cron (scheduled scraping)

**Database:**
- PostgreSQL (recommended) or MongoDB
- Prisma ORM (optional but helpful)

**Hosting:**
- Railway.app (easy deployment)
- Heroku (classic choice)
- DigitalOcean (more control)

### 2. Project Structure for Phase 2

```
baldwin-county-news-hub/
├── frontend/              # Move current files here
│   ├── index.html
│   ├── css/
│   └── js/
├── backend/               # New backend code
│   ├── server.js
│   ├── routes/
│   ├── scrapers/
│   ├── database/
│   └── config/
├── package.json
├── .env
└── README.md
```

### 3. Backend Setup Commands

```bash
# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv
npm install cheerio puppeteer node-cron
npm install pg prisma  # For PostgreSQL

# Install dev dependencies
npm install --save-dev nodemon

# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/news_hub
EOF
```

### 4. Scraping Best Practices

**Legal & Ethical:**
- ✅ Respect robots.txt
- ✅ Add 1-2 second delays between requests
- ✅ Use descriptive User-Agent
- ✅ Scrape only public content
- ✅ Cache responses (don't hammer servers)
- ✅ Provide attribution and source links

**Technical:**
- Start with RSS feeds (AL.com likely has one)
- Use Cheerio for static sites (faster)
- Use Puppeteer only when necessary (slower)
- Implement error handling and retries
- Log all scraping activity
- Set up monitoring/alerts

**Recommended Scraping Schedule:**
```javascript
// Example using node-cron
const cron = require('node-cron');

// Every 30 minutes during business hours (6am-10pm)
cron.schedule('*/30 6-22 * * *', () => {
  scrapeAllSources();
});

// Every 2 hours overnight (10pm-6am)
cron.schedule('0 */2 22-5 * * *', () => {
  scrapeAllSources();
});
```

### 5. API Endpoints to Implement

```javascript
GET  /api/news              // Get all news (with filters)
GET  /api/news/:id          // Get single article
GET  /api/sources           // List all sources
GET  /api/trending          // Get trending topics
GET  /api/hashtags/:tag     // Get posts by hashtag
POST /api/scrape/trigger    // Manual scrape trigger (admin)
```

### 6. Database Schema Example

```sql
-- Articles table
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  url VARCHAR(1000) UNIQUE NOT NULL,
  source VARCHAR(100),
  category VARCHAR(50),
  content_type VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sources table
CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500),
  enabled BOOLEAN DEFAULT true,
  last_scraped TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Article_Tags junction table
CREATE TABLE article_tags (
  article_id INT REFERENCES articles(id),
  tag_id INT REFERENCES tags(id),
  PRIMARY KEY (article_id, tag_id)
);
```

### 7. Deployment Workflow

**Frontend (GitHub Pages):**
```bash
# Already deployed - just push updates
git add .
git commit -m "Update frontend"
git push origin main
```

**Backend (Railway.app example):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Link database
railway add postgresql

# Set environment variables
railway variables set NODE_ENV=production
```

### 8. Environment Variables Needed

```bash
# Backend .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
FRONTEND_URL=https://yourusername.github.io/baldwin-county-news-hub

# Optional (for Phase 4 - Social Media APIs)
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
INSTAGRAM_CLIENT_ID=...
```

---

## Recommended Next Steps

### Immediate (Now)
1. ✅ Push to GitHub
2. ✅ Enable GitHub Pages
3. ✅ Test deployed site
4. ✅ Share with friends/beta testers

### Short Term (Next 2-4 weeks)
1. Research local news sites for RSS feeds
2. Build simple backend with Express
3. Implement 1-2 scrapers (start with easiest sources)
4. Set up basic PostgreSQL database
5. Connect frontend to backend API

### Medium Term (1-2 months)
1. Add all 7 news source scrapers
2. Implement public social media scraping (Nitter, etc.)
3. Set up automated scraping schedule
4. Add admin dashboard for monitoring
5. Deploy backend to production

### Long Term (3+ months)
1. Gather user feedback
2. Add user accounts (save favorites)
3. Implement email notifications
4. Consider social media APIs (if revenue justifies)
5. Build mobile app (PWA or native)

---

## Troubleshooting

### Common Issues

**CSS/JS not loading:**
- Check file paths (should be `./css/styles.css` and `./js/app.js`)
- Verify files exist in correct folders
- Check browser console for 404 errors

**Search not working:**
- Open browser console
- Look for JavaScript errors
- Verify all elements have correct IDs

**Filters not working:**
- Check that data attributes match (`data-content-type`, `data-category`)
- Verify toggle switches have correct event listeners
- Check console for errors

**GitHub Pages 404:**
- Ensure repository is public (or have GitHub Pro for private Pages)
- Check Pages settings - make sure it's enabled
- Wait 5-10 minutes after initial deployment
- Clear browser cache

---

## Support & Resources

### Documentation
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- [Express.js Docs](https://expressjs.com/)
- [Cheerio Docs](https://cheerio.js.org/)
- [Puppeteer Docs](https://pptr.dev/)

### Web Scraping Ethics
- [robots.txt Specification](https://www.robotstxt.org/)
- [Web Scraping Best Practices](https://www.scrapehero.com/how-to-prevent-getting-blacklisted-while-scraping/)

### Deployment Platforms
- [Railway.app](https://railway.app/) - Easy backend hosting
- [Vercel](https://vercel.com/) - Frontend hosting alternative
- [DigitalOcean](https://www.digitalocean.com/) - Full control VPS

---

**Questions?** Open an issue on GitHub or check the README.md for contact information.

**Good luck with deployment! 🚀**

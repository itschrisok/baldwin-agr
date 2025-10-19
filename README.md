# Baldwin County News Hub

> A modern, responsive news aggregator for Baldwin County, Alabama, combining local news sources, social media feeds, and community updates in one unified platform.

![Status](https://img.shields.io/badge/status-MVP-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

## 📸 Screenshots

*Screenshots to be added:*
- Desktop view showing full layout with news feed and sidebar
- Mobile responsive view
- Filter and search functionality in action
- Social media integration examples

## 🎯 Project Overview

Baldwin County News Hub aggregates news and information from multiple sources across Baldwin County, Alabama, including Orange Beach, Gulf Shores, Foley, and surrounding communities. The application provides a clean, unified interface for residents to stay informed about local events, news, and community updates.

## ✨ Features

### Core Functionality
- **Multi-Source News Aggregation** - Combines 7 local news sources into one feed
  - Baldwin Times
  - Gulf Coast News
  - Orange Beach Today
  - AL.com
  - Foley Observer
  - Mobile Register
  - OBA Website

- **Advanced Filtering System**
  - Toggle individual news sources on/off
  - Filter by content type (News Articles, Social Media, Photos & Videos)
  - Category filters (All, Local, Politics, Sports, Weather)
  - Time-based sorting (Newest, Today, This Month)

- **Real-time Search**
  - Search across article titles, descriptions, and tags
  - Live highlighting of matching text
  - Displays result count
  - Works seamlessly with all active filters

- **Social Media Integration**
  - Track custom hashtags (#BaldwinCounty, #OrangeBeach, etc.)
  - Add/remove hashtags dynamically
  - Platform indicators for Twitter, Instagram, TikTok
  - Simulated live scraping (ready for backend integration)

- **Citation & Source Links**
  - Every article/post links to original source
  - Clear attribution for all content
  - Supports journalism and original publishers

### User Experience
- **Responsive Design** - Mobile-first approach that works on all devices
- **Modern UI** - Clean interface with smooth animations
- **Fast Performance** - Pure JavaScript, no framework overhead
- **Accessible** - Semantic HTML5 structure

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox and Grid
- **Vanilla JavaScript** - No dependencies, pure ES6+
- **No Build Process** - Works directly in any modern browser

## 📁 Project Structure

```
baldwin-county-news-hub/
├── index.html           # Main HTML structure
├── css/
│   └── styles.css      # All styles (organized by section)
├── js/
│   └── app.js          # Application logic (modular, well-commented)
├── assets/
│   └── .gitkeep        # Placeholder for future media files
├── README.md           # This file
├── LICENSE             # MIT License
└── .gitignore          # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd baldwin-county-news-hub
   ```

2. **Open in browser**

   **Option A: Simple (Direct File)**
   ```bash
   # Just open index.html in your browser
   open index.html  # macOS
   start index.html # Windows
   xdg-open index.html # Linux
   ```

   **Option B: Local Server (Recommended)**
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Using Python 2
   python -m SimpleHTTPServer 8000

   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000

   # Then visit: http://localhost:8000
   ```

3. **Start exploring!**
   - Try the search functionality
   - Toggle different news sources
   - Add custom hashtags
   - Test filters and sorting

## 📖 Usage Guide

### Searching for News
1. Use the search bar in the feed header
2. Type keywords to search across titles, excerpts, and tags
3. Matching text will be highlighted
4. Click the × button to clear the search

### Filtering Content
- **By Source:** Toggle news sources on/off in the header
- **By Content Type:** Show/hide News, Social Media, or Photos & Videos
- **By Category:** Click All, Local, Politics, Sports, or Weather
- **By Time:** Filter by Newest, Today, or This Month

### Managing Hashtags
1. Type a hashtag in the input field (with or without #)
2. Click "Add" or press Enter
3. Click the × on any hashtag to remove it
4. *Note: Backend integration needed for live social media scraping*

### Reading Articles
- Click any article title to visit the original source
- Click the "🔗 Source" badge to open in a new tab
- All citations link directly to the publisher

## 🔧 Configuration

### Adding New News Sources

**In HTML** ([index.html:25-51](index.html#L25-L51)):
```html
<div class="toggle-item" data-source="your-source-name">
    <div class="toggle-switch active"></div>
    <span>Your Source Name</span>
</div>
```

**Add corresponding news items** with matching `data-source` attributes.

### Customizing Styles

All styles are in [css/styles.css](css/styles.css) with clear section headers:
- Base styles and resets
- Header and navigation
- Control panels
- News feed
- Responsive breakpoints (1024px, 768px)

### Modifying JavaScript

Key functions in [js/app.js](js/app.js):
- `initializeApp()` - Main initialization
- `performSearch()` - Search functionality
- `applyFilters()` - Filter logic
- `addHashtag()` - Hashtag management

## 🗺️ Development Roadmap

### Phase 1: MVP ✅ COMPLETE
- [x] Multi-source news display
- [x] Filtering and search
- [x] Hashtag management UI
- [x] Responsive design
- [x] Citation links

### Phase 2: Backend & Scraping (Next Priority)
- [ ] Node.js/Express backend server
- [ ] Web scraping for local news sources
  - [ ] Check for RSS feeds (AL.com, etc.)
  - [ ] Implement Cheerio for static HTML parsing
  - [ ] Implement Puppeteer for dynamic sites
  - [ ] Respect robots.txt and rate limits
- [ ] Database setup (PostgreSQL or MongoDB)
- [ ] Scheduled scraping jobs (30min during day, 2hr overnight)
- [ ] REST API endpoints
  - `GET /api/news` - Fetch filtered news
  - `GET /api/sources` - List all sources
  - `GET /api/trending` - Get trending topics
- [ ] Public social media scraping (Nitter, Instagram, TikTok)
- [ ] Frontend integration with backend APIs

### Phase 3: Production Deployment
- [ ] Frontend hosting (Vercel, Netlify, or GitHub Pages)
- [ ] Backend hosting (Railway, Heroku, DigitalOcean)
- [ ] Custom domain configuration
- [ ] SSL certificates (Let's Encrypt)
- [ ] CDN setup for static assets
- [ ] Analytics integration
- [ ] Error tracking (Sentry)

### Phase 4: Paid API Integration (When Revenue Justifies)
- [ ] Twitter API v2 ($100-500/month)
- [ ] Instagram Graph API (free but complex approval)
- [ ] TikTok Research API (application-based)
- [ ] Real-time social media updates
- [ ] Verified content streams

### Phase 5: Advanced Features
- [ ] User accounts and authentication
- [ ] Save/favorite articles
- [ ] Email notifications for hashtags
- [ ] Admin dashboard
- [ ] Mobile app (PWA or React Native)
- [ ] Browser extension

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style Guidelines
- Use semantic HTML5 elements
- Follow existing CSS organization (sections with headers)
- Write clear, commented JavaScript
- Use JSDoc comments for functions
- Maintain mobile-first responsive design
- Test on multiple browsers

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Baldwin County News Hub Team**

## 🙏 Acknowledgments

- Local news publishers for their valuable journalism
- Baldwin County community for inspiration
- Open source community for tools and resources

## 📞 Contact

For questions, suggestions, or collaboration inquiries:
- Open an issue on GitHub
- Email: [your-email@example.com]
- Website: [your-website-url]

## 🔐 Privacy & Legal

### Content Attribution
All news articles, social media posts, and media content are properly attributed to their original sources with citation links. This aggregator respects copyright and journalism by:
- Always linking to the original source
- Displaying only excerpts, not full articles
- Clearly identifying the publisher
- Supporting local journalism through traffic referrals

### Scraping Ethics (Phase 2)
When implementing web scraping:
- Respect robots.txt files
- Implement rate limiting (1-2 second delays)
- Use polite scraping practices
- Cache responsibly
- Only scrape publicly accessible content
- Comply with each site's Terms of Service

### Future API Usage (Phase 4)
Official API integrations will comply with:
- Platform Terms of Service
- API rate limits and quotas
- Data usage policies
- User privacy requirements

---

**Built with ❤️ for Baldwin County, Alabama**

*Last Updated: 2025*

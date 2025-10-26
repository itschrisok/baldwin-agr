/**
 * Temporary Admin Routes
 * Used for initial deployment setup
 * REMOVE THESE AFTER SETUP IS COMPLETE!
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

/**
 * Database setup endpoint
 * Visit: /admin/setup
 */
router.get('/setup', async (req, res) => {
  try {
    const logs = [];

    logs.push('='.repeat(50));
    logs.push('Baldwin County News Hub - Database Setup');
    logs.push('='.repeat(50));
    logs.push('');

    // Read schema file
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    logs.push('1. Connecting to database...');
    logs.push(`   URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
    logs.push('');

    // Execute schema
    logs.push('2. Creating tables...');
    await pool.query(schema);
    logs.push('   ✓ Tables created successfully');
    logs.push('');

    // Verify tables
    logs.push('3. Verifying schema...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    logs.push(`   ✓ Found ${result.rows.length} tables:`);
    result.rows.forEach((row) => {
      logs.push(`     - ${row.table_name}`);
    });
    logs.push('');

    // Check sources
    logs.push('4. Checking sources...');
    const sources = await pool.query('SELECT name, enabled FROM sources');
    logs.push(`   ✓ Found ${sources.rows.length} sources:`);
    sources.rows.forEach((source) => {
      const status = source.enabled ? '✓' : '✗';
      logs.push(`     ${status} ${source.name}`);
    });
    logs.push('');

    logs.push('='.repeat(50));
    logs.push('✅ Database setup complete!');
    logs.push('='.repeat(50));
    logs.push('');
    logs.push('Next steps:');
    logs.push('1. Visit /admin/scrape to fetch initial articles');
    logs.push('2. Visit /api/news to verify articles');
    logs.push('3. Visit / to see the frontend');
    logs.push('');

    res.setHeader('Content-Type', 'text/plain');
    res.send(logs.join('\n'));

  } catch (error) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send(`
❌ Error during database setup:
${error.message}

Please check:
1. PostgreSQL is running
2. DATABASE_URL in Railway is correct
3. Database exists and user has permissions

Stack trace:
${error.stack}
    `);
  }
});

/**
 * Run scraper endpoint
 * Visit: /admin/scrape
 */
router.get('/scrape', async (req, res) => {
  try {
    const ScraperManager = require('../scrapers/ScraperManager');

    res.setHeader('Content-Type', 'text/plain');
    res.write('Starting scraper...\n\n');

    // Initialize scrapers
    await ScraperManager.initialize();
    res.write('✓ Scrapers initialized\n\n');

    // Run scraping
    res.write('Running scrape cycle...\n');
    res.write('='.repeat(50) + '\n');

    const results = await ScraperManager.scrapeAll();

    res.write('\n' + '='.repeat(50) + '\n');
    res.write(`✅ Scraping complete!\n\n`);
    res.write(`Total sources: ${results.total}\n`);
    res.write(`Successful: ${results.successful}\n`);
    res.write(`Failed: ${results.failed}\n`);
    res.write(`New articles: ${results.articles}\n`);
    res.write(`Duration: ${(results.duration / 1000).toFixed(2)}s\n\n`);

    res.write('Details:\n');
    results.details.forEach(detail => {
      const status = detail.status === 'success' ? '✓' : '✗';
      res.write(`${status} ${detail.source}: ${detail.articles} articles (${detail.duration}ms)\n`);
      if (detail.error) {
        res.write(`  Error: ${detail.error}\n`);
      }
    });

    res.write('\n\nNext steps:\n');
    res.write('1. Visit /api/news to see articles\n');
    res.write('2. Visit / to see the frontend\n');
    res.write('3. Remove /admin routes after setup is complete\n');

    res.end();

  } catch (error) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send(`
❌ Error running scraper:
${error.message}

Stack trace:
${error.stack}
    `);
  }
});

/**
 * Admin home - shows available commands
 */
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
Baldwin County News Hub - Admin Panel
======================================

⚠️  TEMPORARY ENDPOINTS - REMOVE AFTER SETUP ⚠️

Available commands:

1. Database Setup
   URL: /admin/setup
   Description: Creates all database tables and seeds initial data

2. Run Scraper
   URL: /admin/scrape
   Description: Fetches articles from all enabled news sources

3. Health Check
   URL: /api/health
   Description: Check if API is running

4. View Articles
   URL: /api/news
   Description: See scraped articles (JSON)

5. View Sources
   URL: /api/sources
   Description: See configured news sources (JSON)

======================================

Setup Instructions:
1. Visit /admin/setup first
2. Then visit /admin/scrape
3. Then check /api/news to verify
4. Finally visit / to see the frontend

After setup is complete, remove the /admin routes from server.js!
  `);
});

module.exports = router;

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
const ScraperManager = require('../scrapers/ScraperManager');

// Store active scrape jobs in memory
const scrapeJobs = new Map();

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

// ============================================
// ADMIN DASHBOARD API ENDPOINTS
// ============================================

/**
 * GET /admin/api/sources
 * Get all sources with stats
 */
router.get('/api/sources', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.*,
        COUNT(a.id) as article_count,
        MAX(a.published_at) as latest_article
      FROM sources s
      LEFT JOIN articles a ON s.id = a.source_id
      GROUP BY s.id
      ORDER BY s.name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /admin/api/sources/:id/toggle
 * Enable or disable a source
 */
router.patch('/api/sources/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    // Toggle enabled status
    const result = await pool.query(`
      UPDATE sources
      SET enabled = NOT enabled, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /admin/api/sources/:id
 * Update source details (URL, name, etc.)
 */
router.patch('/api/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { url, name, scraper_type, enabled } = req.body;

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (url !== undefined) {
      updates.push(`url = $${paramCount++}`);
      values.push(url);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (scraper_type !== undefined) {
      updates.push(`scraper_type = $${paramCount++}`);
      values.push(scraper_type);
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramCount++}`);
      values.push(enabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE sources
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/api/sources/:id/test
 * Test scrape a single source
 */
router.post('/api/sources/:id/test', async (req, res) => {
  try {
    const { id } = req.params;

    // Initialize scraper if needed
    if (ScraperManager.scrapers.size === 0) {
      await ScraperManager.initialize();
    }

    // Run single scraper
    const result = await ScraperManager.scrapeSingle(parseInt(id));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/api/scrape/start
 * Start a scrape job with options
 */
router.post('/api/scrape/start', async (req, res) => {
  try {
    const { sourceIds, timeout, maxArticles } = req.body;

    // Check if scrape is already running
    const runningJob = Array.from(scrapeJobs.values()).find(job => job.status === 'running');
    if (runningJob) {
      return res.status(409).json({
        success: false,
        error: 'A scrape job is already running',
        jobId: runningJob.id
      });
    }

    // Create job ID
    const jobId = `scrape-${Date.now()}`;

    // Initialize job
    const job = {
      id: jobId,
      status: 'running',
      progress: {
        total: sourceIds ? sourceIds.length : 0,
        completed: 0,
        current: null,
        articles: 0
      },
      results: null,
      startedAt: new Date(),
      completedAt: null
    };

    scrapeJobs.set(jobId, job);

    // Run scrape asynchronously
    (async () => {
      try {
        // Initialize scraper if needed
        if (ScraperManager.scrapers.size === 0) {
          await ScraperManager.initialize();
        }

        let results;
        if (sourceIds && sourceIds.length > 0) {
          // Scrape selected sources
          results = await ScraperManager.scrapeSelected(sourceIds, { timeout, maxArticles });
        } else {
          // Scrape all
          results = await ScraperManager.scrapeAll();
        }

        job.status = 'completed';
        job.results = results;
        job.completedAt = new Date();
      } catch (error) {
        job.status = 'error';
        job.error = error.message;
        job.completedAt = new Date();
      }
    })();

    res.json({
      success: true,
      jobId,
      status: 'running'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /admin/api/scrape/status/:jobId
 * Get status of a scrape job
 */
router.get('/api/scrape/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = scrapeJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  res.json({
    success: true,
    data: job
  });
});

/**
 * GET /admin/api/logs
 * Get recent scrape logs
 */
router.get('/api/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const sourceId = req.query.source_id;

    let query = `
      SELECT
        sl.*,
        s.name as source_name
      FROM scrape_logs sl
      LEFT JOIN sources s ON sl.source_id = s.id
    `;

    const params = [];
    if (sourceId) {
      query += ' WHERE sl.source_id = $1';
      params.push(sourceId);
    }

    query += ' ORDER BY sl.started_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /admin/api/stats
 * Get dashboard statistics
 */
router.get('/api/stats', async (req, res) => {
  try {
    // Overall stats
    const overallStats = await pool.query(`
      SELECT
        COUNT(*) as total_articles,
        COUNT(DISTINCT source_id) as active_sources,
        MAX(created_at) as last_article
      FROM articles
    `);

    // Success rate (last 100 scrapes)
    const successRate = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        AVG(duration_ms) as avg_duration
      FROM (
        SELECT * FROM scrape_logs
        ORDER BY started_at DESC
        LIMIT 100
      ) recent_scrapes
    `);

    // Per-source stats
    const sourceStats = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.enabled,
        s.error_count,
        s.last_successful_scrape,
        COUNT(sl.id) as scrape_count,
        COUNT(CASE WHEN sl.status = 'success' THEN 1 END) as successful_scrapes
      FROM sources s
      LEFT JOIN scrape_logs sl ON s.id = sl.source_id
      GROUP BY s.id
      ORDER BY s.name
    `);

    res.json({
      success: true,
      data: {
        overall: overallStats.rows[0],
        successRate: successRate.rows[0],
        sources: sourceStats.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/api/scrape/rss-only
 * Quick action: Scrape only RSS sources
 */
router.post('/api/scrape/rss-only', async (req, res) => {
  try {
    // Get RSS source IDs
    const result = await pool.query(`
      SELECT id FROM sources
      WHERE scraper_type = 'rss' AND enabled = true
    `);

    const sourceIds = result.rows.map(row => row.id);

    if (sourceIds.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No enabled RSS sources found'
      });
    }

    // Create job ID
    const jobId = `scrape-${Date.now()}`;

    // Initialize job
    const job = {
      id: jobId,
      status: 'running',
      progress: {
        total: sourceIds.length,
        completed: 0,
        current: null,
        articles: 0
      },
      results: null,
      startedAt: new Date()
    };

    scrapeJobs.set(jobId, job);

    // Run scrape asynchronously
    (async () => {
      try {
        if (ScraperManager.scrapers.size === 0) {
          await ScraperManager.initialize();
        }

        const results = await ScraperManager.scrapeSelected(sourceIds);
        job.status = 'completed';
        job.results = results;
        job.completedAt = new Date();
      } catch (error) {
        job.status = 'error';
        job.error = error.message;
        job.completedAt = new Date();
      }
    })();

    res.json({
      success: true,
      jobId,
      sourceCount: sourceIds.length,
      status: 'running'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/api/sources/enable-all
 * Enable all sources
 */
router.post('/api/sources/enable-all', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE sources
      SET enabled = true, updated_at = NOW()
      RETURNING *
    `);

    res.json({
      success: true,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/api/sources/reset-errors
 * Reset error counts for all sources
 */
router.post('/api/sources/reset-errors', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE sources
      SET error_count = 0, last_error = NULL, updated_at = NOW()
      RETURNING *
    `);

    res.json({
      success: true,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

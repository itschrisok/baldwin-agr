/**
 * Scraper Manager
 * Orchestrates all scraping operations
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const db = require('../config/database');
const RSSScraper = require('./news/RSSScraper');
const CheerioScraper = require('./news/CheerioScraper');

class ScraperManager {
  constructor() {
    this.scrapers = new Map();
    this.isRunning = false;
    this.schedules = [];
  }

  /**
   * Initialize all scrapers
   */
  async initialize() {
    try {
      logger.info('Initializing Scraper Manager...');

      // Get all enabled sources from database
      const result = await db.query(
        'SELECT * FROM sources WHERE enabled = true ORDER BY name'
      );

      const sources = result.rows;
      logger.info(`Found ${sources.length} enabled sources`);

      // Create scraper for each source
      for (const source of sources) {
        try {
          const scraper = this.createScraper(source);
          if (scraper) {
            this.scrapers.set(source.id, scraper);
            logger.info(`Initialized scraper for: ${source.name}`);
          }
        } catch (error) {
          logger.error(
            `Failed to initialize scraper for ${source.name}:`,
            error.message
          );
        }
      }

      logger.info(
        `Scraper Manager initialized with ${this.scrapers.size} scrapers`
      );
    } catch (error) {
      logger.error('Error initializing Scraper Manager:', error);
      throw error;
    }
  }

  /**
   * Create appropriate scraper based on source type
   * @param {Object} source - Source configuration
   * @returns {BaseScraper} Scraper instance
   */
  createScraper(source) {
    const config = {
      id: source.id,
      url: source.url,
      scraper_type: source.scraper_type,
      rss_url: source.rss_url,
    };

    switch (source.scraper_type) {
      case 'rss':
        return new RSSScraper(source.name, config);

      case 'cheerio':
        return new CheerioScraper(source.name, config);

      case 'puppeteer':
        // TODO: Implement Puppeteer scraper for JavaScript-heavy sites
        logger.warn(
          `Puppeteer scraper not yet implemented for ${source.name}`
        );
        return null;

      default:
        logger.warn(
          `Unknown scraper type: ${source.scraper_type} for ${source.name}`
        );
        return null;
    }
  }

  /**
   * Run all scrapers
   * @returns {Promise<Object>} Scraping results
   */
  async scrapeAll() {
    if (this.isRunning) {
      logger.warn('Scraping already in progress, skipping...');
      return { success: false, message: 'Scraping already in progress' };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const results = {
      total: this.scrapers.size,
      successful: 0,
      failed: 0,
      articles: 0,
      details: [],
    };

    logger.info('='.repeat(50));
    logger.info('Starting scraping cycle...');
    logger.info('='.repeat(50));

    for (const [sourceId, scraper] of this.scrapers.entries()) {
      const scrapeStart = Date.now();
      let status = 'error';
      let articlesFound = 0;
      let errorMessage = null;

      try {
        logger.info(`\nScraping: ${scraper.sourceName}`);

        // Update last_scraped timestamp
        await this.updateSourceTimestamp(sourceId, 'last_scraped');

        // Run scraper
        const articles = await scraper.scrape();
        articlesFound = articles.length;

        if (articles.length > 0) {
          status = 'success';
          results.successful++;
          results.articles += articlesFound;
          logger.info(
            `✓ ${scraper.sourceName}: Found ${articlesFound} new articles`
          );

          // Update last successful scrape
          await this.updateSourceTimestamp(
            sourceId,
            'last_successful_scrape'
          );
          await this.updateSourceCount(sourceId, articlesFound);
        } else {
          status = 'success';
          results.successful++;
          logger.info(`✓ ${scraper.sourceName}: No new articles`);
        }
      } catch (error) {
        status = 'error';
        errorMessage = error.message;
        results.failed++;
        logger.error(`✗ ${scraper.sourceName}: ${error.message}`);

        // Update error count
        await this.updateSourceError(sourceId, error.message);
      }

      const duration = Date.now() - scrapeStart;

      // Log scrape operation
      await this.logScrape(
        sourceId,
        status,
        articlesFound,
        duration,
        errorMessage
      );

      results.details.push({
        source: scraper.sourceName,
        status,
        articles: articlesFound,
        duration,
        error: errorMessage,
      });
    }

    const totalDuration = Date.now() - startTime;

    logger.info('='.repeat(50));
    logger.info('Scraping cycle complete!');
    logger.info(`Total time: ${(totalDuration / 1000).toFixed(2)}s`);
    logger.info(`Successful: ${results.successful}/${results.total}`);
    logger.info(`Failed: ${results.failed}/${results.total}`);
    logger.info(`New articles: ${results.articles}`);
    logger.info('='.repeat(50));

    this.isRunning = false;

    return {
      success: true,
      duration: totalDuration,
      ...results,
    };
  }

  /**
   * Run specific scraper by source ID
   * @param {number} sourceId - Source ID
   * @returns {Promise<Object>} Scraping result
   */
  async scrapeSingle(sourceId) {
    const scraper = this.scrapers.get(sourceId);

    if (!scraper) {
      throw new Error(`No scraper found for source ID: ${sourceId}`);
    }

    logger.info(`Running scraper for: ${scraper.sourceName}`);

    try {
      const articles = await scraper.scrape();
      await this.updateSourceTimestamp(sourceId, 'last_scraped');
      await this.updateSourceTimestamp(sourceId, 'last_successful_scrape');
      await this.updateSourceCount(sourceId, articles.length);

      return {
        success: true,
        source: scraper.sourceName,
        articles: articles.length,
      };
    } catch (error) {
      await this.updateSourceError(sourceId, error.message);
      throw error;
    }
  }

  /**
   * Run scrapers for selected sources only
   * @param {Array<number>} sourceIds - Array of source IDs to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Scraping results
   */
  async scrapeSelected(sourceIds, options = {}) {
    if (this.isRunning) {
      logger.warn('Scraping already in progress, skipping...');
      return { success: false, message: 'Scraping already in progress' };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const { timeout, maxArticles } = options;

    const results = {
      total: sourceIds.length,
      successful: 0,
      failed: 0,
      articles: 0,
      details: [],
    };

    logger.info('='.repeat(50));
    logger.info(`Starting scraping cycle for ${sourceIds.length} sources...`);
    logger.info('='.repeat(50));

    // Wrap scraping logic in timeout if specified
    const scrapePromise = (async () => {
      for (const sourceId of sourceIds) {
        const scraper = this.scrapers.get(sourceId);

        if (!scraper) {
          logger.warn(`No scraper found for source ID: ${sourceId}`);
          results.failed++;
          continue;
        }

        const scrapeStart = Date.now();
        let status = 'error';
        let articlesFound = 0;
        let errorMessage = null;

        try {
          logger.info(`\nScraping: ${scraper.sourceName}`);

          // Update last_scraped timestamp
          await this.updateSourceTimestamp(sourceId, 'last_scraped');

          // Run scraper
          const articles = await scraper.scrape();
          articlesFound = articles.length;

          if (articles.length > 0) {
            status = 'success';
            results.successful++;
            results.articles += articlesFound;
            logger.info(
              `✓ ${scraper.sourceName}: Found ${articlesFound} new articles`
            );

            // Update last successful scrape
            await this.updateSourceTimestamp(
              sourceId,
              'last_successful_scrape'
            );
            await this.updateSourceCount(sourceId, articlesFound);
          } else {
            status = 'success';
            results.successful++;
            logger.info(`✓ ${scraper.sourceName}: No new articles`);
          }

          // Check if we've hit max articles limit
          if (maxArticles && results.articles >= maxArticles) {
            logger.info(`\nReached max articles limit (${maxArticles}), stopping...`);
            break;
          }
        } catch (error) {
          status = 'error';
          errorMessage = error.message;
          results.failed++;
          logger.error(`✗ ${scraper.sourceName}: ${error.message}`);

          // Update error count
          await this.updateSourceError(sourceId, error.message);
        }

        const duration = Date.now() - scrapeStart;

        // Log scrape operation
        await this.logScrape(
          sourceId,
          status,
          articlesFound,
          duration,
          errorMessage
        );

        results.details.push({
          source: scraper.sourceName,
          status,
          articles: articlesFound,
          duration,
          error: errorMessage,
        });
      }

      return results;
    })();

    // Apply timeout if specified
    let finalResults;
    if (timeout) {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Scraping timeout')), timeout)
      );

      try {
        finalResults = await Promise.race([scrapePromise, timeoutPromise]);
      } catch (error) {
        logger.warn(`Scraping stopped due to timeout (${timeout}ms)`);
        finalResults = results; // Return partial results
        finalResults.timedOut = true;
      }
    } else {
      finalResults = await scrapePromise;
    }

    const totalDuration = Date.now() - startTime;

    logger.info('='.repeat(50));
    logger.info('Scraping cycle complete!');
    logger.info(`Total time: ${(totalDuration / 1000).toFixed(2)}s`);
    logger.info(`Successful: ${finalResults.successful}/${finalResults.total}`);
    logger.info(`Failed: ${finalResults.failed}/${finalResults.total}`);
    logger.info(`New articles: ${finalResults.articles}`);
    logger.info('='.repeat(50));

    this.isRunning = false;

    return {
      success: true,
      duration: totalDuration,
      ...finalResults,
    };
  }

  /**
   * Schedule automated scraping
   */
  startScheduler() {
    logger.info('Starting scraping scheduler...');

    // Scrape every 30 minutes during business hours (6am-10pm)
    const businessHours = cron.schedule(
      '*/30 6-22 * * *',
      async () => {
        logger.info('Scheduled scrape (business hours) triggered');
        await this.scrapeAll();
      },
      {
        scheduled: false,
        timezone: 'America/Chicago', // Alabama time zone
      }
    );

    // Scrape every 2 hours overnight (10pm-6am)
    const nightHours = cron.schedule(
      '0 */2 22-5 * * *',
      async () => {
        logger.info('Scheduled scrape (night hours) triggered');
        await this.scrapeAll();
      },
      {
        scheduled: false,
        timezone: 'America/Chicago',
      }
    );

    // Start schedules
    businessHours.start();
    nightHours.start();

    this.schedules.push(businessHours, nightHours);

    logger.info('Scheduler started successfully');
    logger.info('- Business hours (6am-10pm): Every 30 minutes');
    logger.info('- Night hours (10pm-6am): Every 2 hours');

    // Run initial scrape
    logger.info('Running initial scrape...');
    this.scrapeAll();
  }

  /**
   * Stop scheduler
   */
  stopScheduler() {
    logger.info('Stopping scraping scheduler...');
    this.schedules.forEach((schedule) => schedule.stop());
    this.schedules = [];
    logger.info('Scheduler stopped');
  }

  /**
   * Update source timestamp
   */
  async updateSourceTimestamp(sourceId, field) {
    await db.query(
      `UPDATE sources SET ${field} = NOW() WHERE id = $1`,
      [sourceId]
    );
  }

  /**
   * Update source scrape count
   */
  async updateSourceCount(sourceId, count) {
    await db.query(
      'UPDATE sources SET scrape_count = scrape_count + 1 WHERE id = $1',
      [sourceId]
    );
  }

  /**
   * Update source error
   */
  async updateSourceError(sourceId, errorMessage) {
    await db.query(
      'UPDATE sources SET error_count = error_count + 1, last_error = $1 WHERE id = $2',
      [errorMessage, sourceId]
    );
  }

  /**
   * Log scrape operation
   */
  async logScrape(sourceId, status, articlesFound, duration, errorMessage) {
    await db.query(
      `INSERT INTO scrape_logs
       (source_id, status, articles_found, articles_new, duration_ms, error_message, completed_at)
       VALUES ($1, $2, $3, $3, $4, $5, NOW())`,
      [sourceId, status, articlesFound, duration, errorMessage]
    );
  }
}

// Export singleton instance
module.exports = new ScraperManager();

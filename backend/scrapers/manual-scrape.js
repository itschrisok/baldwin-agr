/**
 * Manual Scraping Script
 * Run scrapers manually without starting the full server
 */

require('dotenv').config();
const scraperManager = require('./ScraperManager');
const logger = require('../utils/logger');

async function runManualScrape() {
  console.log('='.repeat(60));
  console.log('Baldwin County News Hub - Manual Scraping');
  console.log('='.repeat(60));

  try {
    // Initialize scrapers
    await scraperManager.initialize();

    // Run all scrapers
    const results = await scraperManager.scrapeAll();

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('SCRAPING RESULTS');
    console.log('='.repeat(60));
    console.log(`Total sources: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`New articles: ${results.articles}`);
    console.log(`Duration: ${(results.duration / 1000).toFixed(2)}s`);

    console.log('\nDetailed Results:');
    console.log('-'.repeat(60));

    results.details.forEach((detail) => {
      const status = detail.status === 'success' ? '✓' : '✗';
      const duration = (detail.duration / 1000).toFixed(2);

      console.log(`${status} ${detail.source}`);
      console.log(`  Articles: ${detail.articles}`);
      console.log(`  Duration: ${duration}s`);

      if (detail.error) {
        console.log(`  Error: ${detail.error}`);
      }
      console.log('');
    });

    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    logger.error('Manual scrape failed:', error);
    console.error('\n❌ Scraping failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runManualScrape();
}

module.exports = runManualScrape;

/**
 * Base Scraper Class
 * Provides common functionality for all scrapers
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');
const logger = require('../utils/logger');

class BaseScraper {
  constructor(sourceName, sourceConfig) {
    this.sourceName = sourceName;
    this.sourceUrl = sourceConfig.url;
    this.sourceId = sourceConfig.id;
    this.scraperType = sourceConfig.scraper_type;
    this.delay = parseInt(process.env.SCRAPE_DELAY_MS) || 2000;
    this.userAgent =
      process.env.USER_AGENT ||
      'BaldwinNewsBot/1.0 (+https://baldwincountynews.com/about)';
  }

  /**
   * Fetch HTML content from URL
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} HTML content
   */
  async fetchHTML(url) {
    try {
      logger.info(`Fetching: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          DNT: '1',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000,
      });

      // Respectful delay
      await this.sleep(this.delay);

      return response.data;
    } catch (error) {
      logger.error(`Error fetching ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse HTML with Cheerio
   * @param {string} html - HTML string
   * @returns {CheerioStatic} Cheerio instance
   */
  parseHTML(html) {
    return cheerio.load(html);
  }

  /**
   * Extract clean text from element
   * @param {CheerioElement} element - Cheerio element
   * @returns {string} Clean text
   */
  cleanText(element) {
    return element.text().trim().replace(/\s+/g, ' ');
  }

  /**
   * Extract absolute URL
   * @param {string} relativeUrl - Relative URL
   * @param {string} baseUrl - Base URL
   * @returns {string} Absolute URL
   */
  getAbsoluteUrl(relativeUrl, baseUrl) {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * Extract metadata from article
   * @param {CheerioStatic} $ - Cheerio instance
   * @param {string} url - Article URL
   * @returns {Object} Article metadata
   */
  extractMetadata($, url) {
    const metadata = {
      title: null,
      excerpt: null,
      author: null,
      published_at: null,
      image_url: null,
    };

    // Try common meta tags
    metadata.title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text();

    metadata.excerpt =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content');

    metadata.author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('.author').first().text() ||
      $('[rel="author"]').first().text();

    metadata.published_at =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time').first().attr('datetime');

    metadata.image_url =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content');

    // Clean up
    if (metadata.title) metadata.title = metadata.title.trim();
    if (metadata.excerpt) metadata.excerpt = metadata.excerpt.trim();
    if (metadata.author) metadata.author = metadata.author.trim();
    if (metadata.image_url)
      metadata.image_url = this.getAbsoluteUrl(
        metadata.image_url,
        this.sourceUrl
      );

    return metadata;
  }

  /**
   * Save article to database
   * @param {Object} articleData - Article data
   * @returns {Promise<Object>} Saved article
   */
  async saveArticle(articleData) {
    try {
      const article = await Article.create({
        source_id: this.sourceId,
        content_type: 'news',
        category: 'local', // Default category
        ...articleData,
      });

      // Extract and save tags
      if (articleData.tags && articleData.tags.length > 0) {
        await Article.addTags(article.id, articleData.tags);
      }

      logger.info(`Saved article: ${article.title}`);
      return article;
    } catch (error) {
      logger.error(`Error saving article: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Scrape method - to be implemented by subclasses
   * @returns {Promise<Array>} Array of scraped articles
   */
  async scrape() {
    throw new Error('scrape() method must be implemented by subclass');
  }

  /**
   * Categorize article based on keywords
   * @param {string} title - Article title
   * @param {string} excerpt - Article excerpt
   * @returns {string} Category
   */
  categorizeArticle(title, excerpt) {
    const text = `${title} ${excerpt}`.toLowerCase();

    if (
      /weather|storm|hurricane|flood|tornado|forecast/.test(text)
    ) {
      return 'weather';
    }
    if (
      /election|council|mayor|government|vote|policy|bill/.test(text)
    ) {
      return 'politics';
    }
    if (
      /football|basketball|baseball|sports|game|team|player/.test(text)
    ) {
      return 'sports';
    }
    if (
      /school|education|student|teacher|university|college/.test(text)
    ) {
      return 'education';
    }
    if (/beach|tourism|visitor|hotel|resort|festival/.test(text)) {
      return 'tourism';
    }
    if (
      /development|construction|zoning|building|property/.test(text)
    ) {
      return 'development';
    }

    return 'local'; // Default category
  }

  /**
   * Extract tags from text
   * @param {string} title - Article title
   * @param {string} excerpt - Article excerpt
   * @returns {Array<string>} Array of tags
   */
  extractTags(title, excerpt) {
    const tags = new Set();
    const text = `${title} ${excerpt}`;

    // Location tags
    const locations = [
      'Orange Beach',
      'Gulf Shores',
      'Foley',
      'Baldwin County',
      'Mobile',
      'Fairhope',
      'Daphne',
    ];
    locations.forEach((loc) => {
      if (new RegExp(loc, 'i').test(text)) {
        tags.add(loc);
      }
    });

    // Extract hashtags if present
    const hashtagMatches = text.match(/#[\w]+/g);
    if (hashtagMatches) {
      hashtagMatches.forEach((tag) => tags.add(tag));
    }

    return Array.from(tags);
  }
}

module.exports = BaseScraper;

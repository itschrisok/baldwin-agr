/**
 * RSS Feed Scraper
 * Scrapes news from RSS/Atom feeds
 * Used for: AL.com, Mobile Register (they have RSS feeds)
 */

const Parser = require('rss-parser');
const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');

class RSSScraper extends BaseScraper {
  constructor(sourceName, sourceConfig) {
    super(sourceName, sourceConfig);
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['media:thumbnail', 'mediaThumbnail'],
          ['content:encoded', 'contentEncoded'],
        ],
      },
    });
    this.rssUrl = sourceConfig.rss_url || sourceConfig.url;
  }

  /**
   * Scrape RSS feed
   * @returns {Promise<Array>} Array of articles
   */
  async scrape() {
    logger.info(`Scraping RSS feed: ${this.sourceName}`);
    const articles = [];

    try {
      const feed = await this.parser.parseURL(this.rssUrl);
      logger.info(`Found ${feed.items.length} items in RSS feed`);

      for (const item of feed.items) {
        try {
          const article = await this.processItem(item);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          logger.error(
            `Error processing RSS item: ${error.message}`,
            item.link
          );
        }
      }

      logger.info(`Successfully processed ${articles.length} articles from RSS`);
      return articles;
    } catch (error) {
      logger.error(`Error scraping RSS feed ${this.sourceName}:`, error);
      throw error;
    }
  }

  /**
   * Process individual RSS item
   * @param {Object} item - RSS item
   * @returns {Promise<Object>} Processed article
   */
  async processItem(item) {
    // Check if article already exists
    const existing = await this.checkIfExists(item.link);
    if (existing) {
      logger.debug(`Article already exists: ${item.link}`);
      return null;
    }

    // Extract article data
    const title = item.title;
    const url = item.link;
    const excerpt =
      item.contentSnippet ||
      item.summary ||
      item.description ||
      '';
    const content = item.contentEncoded || item.content || excerpt;
    const author = item.creator || item.author || null;
    const published_at = item.pubDate ? new Date(item.pubDate) : new Date();

    // Extract image
    let image_url = null;
    if (item.enclosure && item.enclosure.url) {
      image_url = item.enclosure.url;
    } else if (item.mediaContent && item.mediaContent.$) {
      image_url = item.mediaContent.$.url;
    } else if (item.mediaThumbnail && item.mediaThumbnail.$) {
      image_url = item.mediaThumbnail.$.url;
    }

    // Categorize article
    const category = this.categorizeArticle(title, excerpt);

    // Extract tags
    const tags = this.extractTags(title, excerpt);

    // Add RSS categories as tags
    if (item.categories) {
      item.categories.forEach((cat) => tags.push(cat));
    }

    const articleData = {
      title: title.substring(0, 500),
      excerpt: excerpt.substring(0, 1000),
      content,
      url,
      author,
      category,
      image_url,
      published_at,
      tags,
    };

    // Save to database
    return await this.saveArticle(articleData);
  }

  /**
   * Check if article already exists in database
   * @param {string} url - Article URL
   * @returns {Promise<boolean>} True if exists
   */
  async checkIfExists(url) {
    const Article = require('../../models/Article');
    const existing = await Article.findByUrl(url);
    return !!existing;
  }
}

module.exports = RSSScraper;

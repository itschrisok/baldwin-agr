/**
 * Cheerio HTML Scraper
 * Scrapes news from static HTML pages
 * Used for: Baldwin Times, Gulf Coast News, Foley Observer, etc.
 */

const BaseScraper = require('../BaseScraper');
const Article = require('../../models/Article');
const logger = require('../../utils/logger');

class CheerioScraper extends BaseScraper {
  constructor(sourceName, sourceConfig) {
    super(sourceName, sourceConfig);
    this.selectors = sourceConfig.selectors || this.getDefaultSelectors();
  }

  /**
   * Default selectors - common patterns for news sites
   * @returns {Object} Selector configuration
   */
  getDefaultSelectors() {
    return {
      articleList: 'article, .article, .post, .entry, .news-item',
      title: 'h2, h3, .title, .headline, .entry-title',
      link: 'a',
      excerpt: '.excerpt, .summary, .description, p',
      date: 'time, .date, .published, .post-date',
      author: '.author, .byline, [rel="author"]',
      image: 'img',
    };
  }

  /**
   * Scrape news articles
   * @returns {Promise<Array>} Array of articles
   */
  async scrape() {
    logger.info(`Scraping with Cheerio: ${this.sourceName}`);
    const articles = [];

    try {
      const html = await this.fetchHTML(this.sourceUrl);
      const $ = this.parseHTML(html);

      const articleElements = $(this.selectors.articleList);
      logger.info(
        `Found ${articleElements.length} potential articles on page`
      );

      for (let i = 0; i < articleElements.length; i++) {
        try {
          const article = await this.processArticleElement(
            $,
            $(articleElements[i])
          );
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          logger.error(`Error processing article ${i}:`, error.message);
        }
      }

      logger.info(
        `Successfully processed ${articles.length} articles from ${this.sourceName}`
      );
      return articles;
    } catch (error) {
      logger.error(
        `Error scraping ${this.sourceName}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Process individual article element
   * @param {CheerioStatic} $ - Cheerio instance
   * @param {CheerioElement} $article - Article element
   * @returns {Promise<Object|null>} Processed article or null
   */
  async processArticleElement($, $article) {
    // Extract title
    const $title = $article.find(this.selectors.title).first();
    const title = this.cleanText($title);

    if (!title || title.length < 10) {
      logger.debug('Skipping: No valid title found');
      return null;
    }

    // Extract link
    const $link = $article.find(this.selectors.link).first();
    let url = $link.attr('href');

    if (!url) {
      logger.debug('Skipping: No link found');
      return null;
    }

    url = this.getAbsoluteUrl(url, this.sourceUrl);

    // Check if already exists
    const existing = await Article.findByUrl(url);
    if (existing) {
      logger.debug(`Article already exists: ${url}`);
      return null;
    }

    // Extract excerpt
    const $excerpt = $article.find(this.selectors.excerpt).first();
    const excerpt = this.cleanText($excerpt);

    // Extract date
    const $date = $article.find(this.selectors.date).first();
    let published_at = $date.attr('datetime') || $date.text();
    published_at = published_at
      ? new Date(published_at)
      : new Date();

    // Extract author
    const $author = $article.find(this.selectors.author).first();
    const author = this.cleanText($author) || null;

    // Extract image
    const $image = $article.find(this.selectors.image).first();
    let image_url = $image.attr('src') || $image.attr('data-src');
    if (image_url) {
      image_url = this.getAbsoluteUrl(image_url, this.sourceUrl);
    }

    // Categorize
    const category = this.categorizeArticle(title, excerpt);

    // Extract tags
    const tags = this.extractTags(title, excerpt);

    const articleData = {
      title: title.substring(0, 500),
      excerpt: excerpt.substring(0, 1000),
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
   * Scrape full article content from article page
   * @param {string} url - Article URL
   * @returns {Promise<string>} Full article content
   */
  async scrapeArticleContent(url) {
    try {
      const html = await this.fetchHTML(url);
      const $ = this.parseHTML(html);

      // Try common content selectors
      const contentSelectors = [
        'article .content',
        '.article-content',
        '.entry-content',
        '.post-content',
        '[itemprop="articleBody"]',
        'main article',
      ];

      for (const selector of contentSelectors) {
        const $content = $(selector);
        if ($content.length) {
          return this.cleanText($content);
        }
      }

      return '';
    } catch (error) {
      logger.error(
        `Error scraping article content from ${url}:`,
        error.message
      );
      return '';
    }
  }
}

module.exports = CheerioScraper;

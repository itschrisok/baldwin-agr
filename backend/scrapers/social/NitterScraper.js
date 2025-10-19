/**
 * Nitter Scraper
 * Scrapes Twitter/X content via public Nitter instances (no API key needed)
 * Nitter is an alternative Twitter frontend without rate limiting
 */

const BaseScraper = require('../BaseScraper');
const logger = require('../../utils/logger');

class NitterScraper extends BaseScraper {
  constructor(hashtag) {
    // Use a public Nitter instance
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.1d4.us',
      'https://nitter.kavin.rocks',
      'https://nitter.unixfox.eu',
    ];

    const config = {
      url: `${nitterInstances[0]}/search?f=tweets&q=%23${hashtag}`,
      id: null, // Will be set when saved
      scraper_type: 'cheerio',
    };

    super(`Nitter-${hashtag}`, config);
    this.hashtag = hashtag;
    this.nitterInstance = nitterInstances[0];
  }

  /**
   * Scrape tweets from Nitter
   * @returns {Promise<Array>} Array of tweets
   */
  async scrape() {
    logger.info(`Scraping tweets for #${this.hashtag} from Nitter`);
    const tweets = [];

    try {
      const html = await this.fetchHTML(this.sourceUrl);
      const $ = this.parseHTML(html);

      const tweetElements = $('.timeline-item');
      logger.info(`Found ${tweetElements.length} tweets`);

      for (let i = 0; i < tweetElements.length; i++) {
        try {
          const tweet = await this.processTweetElement($, $(tweetElements[i]));
          if (tweet) {
            tweets.push(tweet);
          }
        } catch (error) {
          logger.error(`Error processing tweet ${i}:`, error.message);
        }
      }

      logger.info(
        `Successfully processed ${tweets.length} tweets for #${this.hashtag}`
      );
      return tweets;
    } catch (error) {
      logger.error(`Error scraping Nitter for #${this.hashtag}:`, error);
      throw error;
    }
  }

  /**
   * Process individual tweet element
   * @param {CheerioStatic} $ - Cheerio instance
   * @param {CheerioElement} $tweet - Tweet element
   * @returns {Promise<Object|null>} Processed tweet or null
   */
  async processTweetElement($, $tweet) {
    // Extract tweet content
    const $content = $tweet.find('.tweet-content');
    const content = this.cleanText($content);

    if (!content || content.length < 5) {
      return null;
    }

    // Extract author
    const $author = $tweet.find('.username');
    const author = this.cleanText($author);

    // Extract link to tweet
    const $link = $tweet.find('.tweet-link');
    let tweetUrl = $link.attr('href');

    if (tweetUrl) {
      tweetUrl = tweetUrl.replace('/i/web', '');
      tweetUrl = `https://twitter.com${tweetUrl}`;
    } else {
      return null; // Skip if no URL
    }

    // Check if already exists
    const Article = require('../../models/Article');
    const existing = await Article.findByUrl(tweetUrl);
    if (existing) {
      logger.debug(`Tweet already exists: ${tweetUrl}`);
      return null;
    }

    // Extract timestamp
    const $date = $tweet.find('.tweet-date a');
    const dateStr = $date.attr('title');
    const published_at = dateStr ? new Date(dateStr) : new Date();

    // Extract media/image
    let image_url = null;
    const $image = $tweet.find('.attachment.image img');
    if ($image.length) {
      image_url = $image.attr('src');
      if (image_url && image_url.startsWith('/')) {
        image_url = `${this.nitterInstance}${image_url}`;
      }
    }

    // Create title from first 100 chars
    const title = content.length > 100 ? content.substring(0, 100) + '...' : content;

    // Extract hashtags
    const hashtagMatches = content.match(/#[\w]+/g) || [];
    const tags = [...new Set([...hashtagMatches, `#${this.hashtag}`])];

    const articleData = {
      title,
      excerpt: content,
      content,
      url: tweetUrl,
      author: author || 'Unknown',
      category: 'social',
      content_type: 'social',
      platform: 'twitter',
      image_url,
      published_at,
      tags,
    };

    // Save to database
    return await this.saveArticle(articleData);
  }
}

module.exports = NitterScraper;

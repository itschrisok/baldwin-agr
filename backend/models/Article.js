/**
 * Article Model
 * Handles database operations for news articles
 */

const db = require('../config/database');

class Article {
  /**
   * Create a new article
   * @param {Object} articleData - Article data
   * @returns {Promise<Object>} Created article
   */
  static async create(articleData) {
    const {
      source_id,
      title,
      excerpt,
      content,
      url,
      author,
      category,
      content_type,
      platform,
      image_url,
      published_at,
    } = articleData;

    const query = `
      INSERT INTO articles
      (source_id, title, excerpt, content, url, author, category, content_type, platform, image_url, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        content = EXCLUDED.content,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      source_id,
      title,
      excerpt,
      content,
      url,
      author,
      category,
      content_type,
      platform,
      image_url,
      published_at,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get articles with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Array of articles
   */
  static async getAll(filters = {}) {
    const {
      source_id,
      category,
      content_type,
      limit = 50,
      offset = 0,
      search,
      since,
    } = filters;

    let query = `
      SELECT a.*, s.name as source_name, s.type as source_type,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // Apply filters
    if (source_id) {
      query += ` AND a.source_id = $${paramIndex}`;
      values.push(source_id);
      paramIndex++;
    }

    if (category) {
      query += ` AND a.category = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }

    if (content_type) {
      query += ` AND a.content_type = $${paramIndex}`;
      values.push(content_type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        to_tsvector('english', a.title || ' ' || COALESCE(a.excerpt, ''))
        @@ plainto_tsquery('english', $${paramIndex})
      )`;
      values.push(search);
      paramIndex++;
    }

    if (since) {
      query += ` AND a.published_at >= $${paramIndex}`;
      values.push(since);
      paramIndex++;
    }

    query += `
      GROUP BY a.id, s.name, s.type
      ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Get article by ID
   * @param {number} id - Article ID
   * @returns {Promise<Object>} Article object
   */
  static async getById(id) {
    const query = `
      SELECT a.*, s.name as source_name,
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.id = $1
      GROUP BY a.id, s.name
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Check if article exists by URL
   * @param {string} url - Article URL
   * @returns {Promise<Object|null>} Article if exists, null otherwise
   */
  static async findByUrl(url) {
    const query = 'SELECT * FROM articles WHERE url = $1';
    const result = await db.query(query, [url]);
    return result.rows[0] || null;
  }

  /**
   * Add tags to an article
   * @param {number} articleId - Article ID
   * @param {Array<string>} tagNames - Array of tag names
   * @returns {Promise<void>}
   */
  static async addTags(articleId, tagNames) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      for (const tagName of tagNames) {
        // Insert tag if it doesn't exist
        const tagResult = await client.query(
          `INSERT INTO tags (name, type)
           VALUES ($1, $2)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [tagName, tagName.startsWith('#') ? 'hashtag' : 'general']
        );

        const tagId = tagResult.rows[0].id;

        // Link article to tag
        await client.query(
          `INSERT INTO article_tags (article_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [articleId, tagId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get trending topics
   * @param {number} limit - Number of topics to return
   * @returns {Promise<Array>} Array of trending topics
   */
  static async getTrending(limit = 10) {
    const query = `
      SELECT t.name, t.type, COUNT(at.article_id) as article_count
      FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      JOIN articles a ON at.article_id = a.id
      WHERE a.published_at >= NOW() - INTERVAL '7 days'
      GROUP BY t.id, t.name, t.type
      ORDER BY article_count DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * Delete old articles
   * @param {number} days - Delete articles older than X days
   * @returns {Promise<number>} Number of deleted articles
   */
  static async deleteOld(days = 90) {
    const query = `
      DELETE FROM articles
      WHERE created_at < NOW() - INTERVAL '${days} days'
    `;

    const result = await db.query(query);
    return result.rowCount;
  }
}

module.exports = Article;

/**
 * API Routes
 * RESTful API endpoints for news aggregation
 */

const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const logger = require('../utils/logger');

/**
 * GET /api/news
 * Get news articles with filtering
 * Query params: source_id, category, content_type, limit, offset, search, since
 */
router.get('/news', async (req, res) => {
  try {
    const {
      source_id,
      category,
      content_type,
      limit = 50,
      offset = 0,
      search,
      since,
    } = req.query;

    const filters = {
      source_id: source_id ? parseInt(source_id) : undefined,
      category,
      content_type,
      limit: Math.min(parseInt(limit), 100), // Max 100 articles
      offset: parseInt(offset),
      search,
      since,
    };

    const articles = await Article.getAll(filters);

    res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    logger.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news articles',
    });
  }
});

/**
 * GET /api/news/:id
 * Get single article by ID
 */
router.get('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.getById(parseInt(id));

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
      });
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article',
    });
  }
});

/**
 * GET /api/sources
 * Get list of all news sources
 */
router.get('/sources', async (req, res) => {
  try {
    const db = require('../config/database');
    const result = await db.query(`
      SELECT s.*, COUNT(a.id) as article_count
      FROM sources s
      LEFT JOIN articles a ON s.id = a.source_id
      GROUP BY s.id
      ORDER BY s.name
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sources',
    });
  }
});

/**
 * GET /api/trending
 * Get trending topics
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const trending = await Article.getTrending(limit);

    res.json({
      success: true,
      count: trending.length,
      data: trending,
    });
  } catch (error) {
    logger.error('Error fetching trending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending topics',
    });
  }
});

/**
 * GET /api/stats
 * Get aggregation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const db = require('../config/database');

    const stats = await db.query(`
      SELECT
        COUNT(*) as total_articles,
        COUNT(DISTINCT source_id) as total_sources,
        COUNT(CASE WHEN published_at >= NOW() - INTERVAL '1 day' THEN 1 END) as articles_today,
        COUNT(CASE WHEN published_at >= NOW() - INTERVAL '7 days' THEN 1 END) as articles_this_week,
        COUNT(CASE WHEN content_type = 'news' THEN 1 END) as news_count,
        COUNT(CASE WHEN content_type = 'social' THEN 1 END) as social_count,
        COUNT(CASE WHEN content_type = 'media' THEN 1 END) as media_count
      FROM articles
    `);

    const categoryStats = await db.query(`
      SELECT category, COUNT(*) as count
      FROM articles
      WHERE published_at >= NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        overall: stats.rows[0],
        by_category: categoryStats.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const db = require('../config/database');
    await db.query('SELECT 1');

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

module.exports = router;

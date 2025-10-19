/**
 * Baldwin County News Hub - Backend Server
 * Express.js API server with web scraping
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// STATIC FILE SERVING
// ============================================

// Serve frontend static files from ../frontend directory
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

logger.info(`Serving static files from: ${frontendPath}`);

// ============================================
// ROUTES
// ============================================

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// API info endpoint (for when /api is accessed directly)
app.get('/api', (req, res) => {
  res.json({
    name: 'Baldwin County News Hub API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      news: '/api/news',
      sources: '/api/sources',
      trending: '/api/trending',
      stats: '/api/stats',
      health: '/api/health',
    },
  });
});

// Catch-all route: serve index.html for client-side routing
// This must be AFTER API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`
  ╔═══════════════════════════════════════════╗
  ║   Baldwin County News Hub - Backend      ║
  ║                                           ║
  ║   Server running on port ${PORT}            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
  ║   API: http://localhost:${PORT}/api         ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = app;

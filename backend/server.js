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

// Security headers - Configure CSP to allow admin dashboard inline scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for admin dashboard
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

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

// Serve admin dashboard static files
const adminPublicPath = path.join(__dirname, 'public');
app.use(express.static(adminPublicPath));

logger.info(`Serving static files from: ${frontendPath}`);
logger.info(`Serving admin files from: ${adminPublicPath}`);

// ============================================
// ROUTES
// ============================================

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Admin Routes (TEMPORARY - for initial setup only)
// TODO: Remove these after database setup and initial scrape are complete
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

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

const server = app.listen(PORT, () => {
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

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;

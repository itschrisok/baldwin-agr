/**
 * Puppeteer Configuration
 * Skip Chromium download during npm install to speed up Railway builds
 * Uses system Chromium provided by Railway's Nixpacks at runtime
 */

const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Skip downloading Chromium during npm install
  skipDownload: true,

  // Cache directory (not used when skipDownload is true)
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

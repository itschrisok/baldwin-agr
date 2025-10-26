/**
 * Admin API Client
 * Wrapper for all admin dashboard API calls
 */

const AdminAPI = {
    // Base URL - auto-detect based on environment
    baseURL: window.location.origin + '/admin/api',

    /**
     * Generic API request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // ============================================
    // SOURCE MANAGEMENT
    // ============================================

    /**
     * Get all sources with stats
     */
    async getSources() {
        return this.request('/sources');
    },

    /**
     * Toggle source enabled/disabled
     */
    async toggleSource(sourceId) {
        return this.request(`/sources/${sourceId}/toggle`, {
            method: 'PATCH'
        });
    },

    /**
     * Test scrape a single source
     */
    async testSource(sourceId) {
        return this.request(`/sources/${sourceId}/test`, {
            method: 'POST'
        });
    },

    /**
     * Enable all sources
     */
    async enableAllSources() {
        return this.request('/sources/enable-all', {
            method: 'POST'
        });
    },

    /**
     * Reset error counts
     */
    async resetErrors() {
        return this.request('/sources/reset-errors', {
            method: 'POST'
        });
    },

    // ============================================
    // SCRAPING OPERATIONS
    // ============================================

    /**
     * Start a scrape job
     */
    async startScrape(options = {}) {
        return this.request('/scrape/start', {
            method: 'POST',
            body: JSON.stringify(options)
        });
    },

    /**
     * Get scrape job status
     */
    async getScrapeStatus(jobId) {
        return this.request(`/scrape/status/${jobId}`);
    },

    /**
     * Quick action: Scrape RSS sources only
     */
    async scrapeRSSOnly() {
        return this.request('/scrape/rss-only', {
            method: 'POST'
        });
    },

    // ============================================
    // LOGS & STATISTICS
    // ============================================

    /**
     * Get recent scrape logs
     */
    async getLogs(options = {}) {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.source_id) params.append('source_id', options.source_id);

        const query = params.toString();
        return this.request(`/logs${query ? '?' + query : ''}`);
    },

    /**
     * Get dashboard statistics
     */
    async getStats() {
        return this.request('/stats');
    }
};

// Make available globally
window.AdminAPI = AdminAPI;

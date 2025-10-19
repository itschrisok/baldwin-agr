/**
 * API Client
 * Handles all backend API communication
 */

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api'; // Production: assume backend is on same domain or proxied

/**
 * Fetch news articles from API
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Array of articles
 */
async function fetchNews(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.source_id) params.append('source_id', filters.source_id);
    if (filters.category) params.append('category', filters.category);
    if (filters.content_type) params.append('content_type', filters.content_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.since) params.append('since', filters.since);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${API_BASE_URL}/news?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}

/**
 * Fetch all news sources
 * @returns {Promise<Array>} Array of sources
 */
async function fetchSources() {
  try {
    const response = await fetch(`${API_BASE_URL}/sources`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching sources:', error);
    throw error;
  }
}

/**
 * Fetch trending topics
 * @param {number} limit - Number of topics to fetch
 * @returns {Promise<Array>} Array of trending topics
 */
async function fetchTrending(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/trending?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching trending:', error);
    throw error;
  }
}

/**
 * Fetch statistics
 * @returns {Promise<Object>} Statistics object
 */
async function fetchStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}

/**
 * Check API health
 * @returns {Promise<boolean>} True if API is healthy
 */
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.success && data.status === 'healthy';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

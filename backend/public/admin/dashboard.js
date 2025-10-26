/**
 * Admin Dashboard - Main Logic
 * Handles all UI interactions and state management
 */

// Global state
const state = {
    sources: [],
    selectedSources: new Set(),
    currentJobId: null,
    pollingInterval: null,
    jobStartTime: null,
    editingSourceId: null
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Dashboard loaded');
    setupEventListeners();
    init();
});

function setupEventListeners() {
    // Source management buttons
    document.getElementById('refreshSourcesBtn').addEventListener('click', refreshSources);
    document.getElementById('enableAllBtn').addEventListener('click', enableAllSources);
    document.getElementById('resetErrorsBtn').addEventListener('click', resetErrors);

    // Scraping action buttons
    document.getElementById('scrapeRSSBtn').addEventListener('click', scrapeRSSOnly);
    document.getElementById('scrapeSelectedBtn').addEventListener('click', scrapeSelected);
    document.getElementById('scrapeAllBtn').addEventListener('click', scrapeAll);

    // Status and control buttons
    document.getElementById('stopBtn').addEventListener('click', stopScraping);
    document.getElementById('clearResultsBtn').addEventListener('click', clearResults);
    document.getElementById('refreshLogsBtn').addEventListener('click', refreshLogs);

    // Modal buttons
    document.getElementById('modalCloseBtn').addEventListener('click', closeEditModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('modalSaveBtn').addEventListener('click', saveSourceEdit);

    // Event delegation for dynamically generated source items
    document.getElementById('sourcesList').addEventListener('click', handleSourceClick);
}

function handleSourceClick(e) {
    const target = e.target;

    // Handle checkbox toggle
    if (target.classList.contains('source-checkbox')) {
        const sourceId = parseInt(target.closest('.source-item').dataset.sourceId);
        toggleSourceSelection(sourceId);
    }

    // Handle edit button
    if (target.textContent === 'Edit') {
        const sourceId = parseInt(target.closest('.source-item').dataset.sourceId);
        openEditModal(sourceId);
    }

    // Handle enable/disable button
    if (target.textContent === 'Enable' || target.textContent === 'Disable') {
        const sourceId = parseInt(target.closest('.source-item').dataset.sourceId);
        toggleSourceEnabled(sourceId);
    }

    // Handle test button
    if (target.textContent === 'Test') {
        const sourceId = parseInt(target.closest('.source-item').dataset.sourceId);
        testSource(sourceId);
    }
}

async function init() {
    await loadDashboardStats();
    await loadSources();
    await loadLogs();

    // Check for running scrape jobs on startup
    checkForRunningJobs();
}

// ============================================
// DASHBOARD STATS
// ============================================

async function loadDashboardStats() {
    try {
        const response = await AdminAPI.getStats();
        const stats = response.data;

        // Update header stats
        document.getElementById('totalArticles').textContent =
            stats.overall.total_articles || '0';

        document.getElementById('activeSources').textContent =
            stats.overall.active_sources || '0';

        const successRate = stats.successRate.total > 0
            ? Math.round((stats.successRate.successful / stats.successRate.total) * 100)
            : 0;
        document.getElementById('successRate').textContent = `${successRate}%`;

    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load statistics', 'error');
    }
}

// ============================================
// SOURCE MANAGEMENT
// ============================================

async function loadSources() {
    try {
        const response = await AdminAPI.getSources();
        state.sources = response.data;
        renderSources();
    } catch (error) {
        console.error('Error loading sources:', error);
        showToast('Failed to load sources', 'error');
    }
}

function renderSources() {
    const container = document.getElementById('sourcesList');

    if (state.sources.length === 0) {
        container.innerHTML = '<div class="empty-state">No sources configured</div>';
        return;
    }

    container.innerHTML = state.sources.map(source => `
        <div class="source-item ${!source.enabled ? 'disabled' : ''} ${state.selectedSources.has(source.id) ? 'selected' : ''}"
             data-source-id="${source.id}">
            <div class="source-header">
                <input type="checkbox"
                       class="source-checkbox"
                       ${source.enabled ? '' : 'disabled'}
                       ${state.selectedSources.has(source.id) ? 'checked' : ''}>
                <span class="source-name">${source.name}</span>
                <span class="source-badge badge-${source.scraper_type}">${source.scraper_type.toUpperCase()}</span>
            </div>
            <div class="source-meta">
                <span>Articles: ${source.article_count || 0}</span>
                <span>Errors: ${source.error_count || 0}</span>
                <span>Last: ${source.last_successful_scrape ? formatTimeAgo(source.last_successful_scrape) : 'Never'}</span>
            </div>
            <div class="source-actions">
                <button class="btn btn-sm btn-edit">
                    Edit
                </button>
                <button class="btn btn-sm">
                    ${source.enabled ? 'Disable' : 'Enable'}
                </button>
                <button class="btn btn-sm btn-primary" ${!source.enabled ? 'disabled' : ''}>
                    Test
                </button>
            </div>
        </div>
    `).join('');

    updateSelectedCount();
}

function toggleSourceSelection(sourceId) {
    if (state.selectedSources.has(sourceId)) {
        state.selectedSources.delete(sourceId);
    } else {
        state.selectedSources.add(sourceId);
    }
    renderSources();
}

async function toggleSourceEnabled(sourceId) {
    try {
        await AdminAPI.toggleSource(sourceId);
        showToast('Source updated successfully', 'success');
        await loadSources();
        await loadDashboardStats();
    } catch (error) {
        console.error('Error toggling source:', error);
        showToast('Failed to toggle source', 'error');
    }
}

async function testSource(sourceId) {
    const source = state.sources.find(s => s.id === sourceId);
    showToast(`Testing ${source.name}...`, 'info');

    try {
        const response = await AdminAPI.testSource(sourceId);
        const result = response.data;

        if (result.articles > 0) {
            showToast(`${source.name}: Found ${result.articles} articles`, 'success');
        } else {
            showToast(`${source.name}: No articles found`, 'warning');
        }

        await loadSources();
        await loadLogs();
    } catch (error) {
        console.error('Error testing source:', error);
        showToast(`${source.name}: Test failed - ${error.message}`, 'error');
    }
}

async function enableAllSources() {
    try {
        await AdminAPI.enableAllSources();
        showToast('All sources enabled', 'success');
        await loadSources();
    } catch (error) {
        console.error('Error enabling all sources:', error);
        showToast('Failed to enable all sources', 'error');
    }
}

async function resetErrors() {
    try {
        await AdminAPI.resetErrors();
        showToast('Error counts reset', 'success');
        await loadSources();
    } catch (error) {
        console.error('Error resetting errors:', error);
        showToast('Failed to reset errors', 'error');
    }
}

function refreshSources() {
    loadSources();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = state.selectedSources.size;
}

// ============================================
// SOURCE EDITING MODAL
// ============================================

function openEditModal(sourceId) {
    const source = state.sources.find(s => s.id === sourceId);
    if (!source) {
        showToast('Source not found', 'error');
        return;
    }

    // Store current source ID in state
    state.editingSourceId = sourceId;

    // Populate modal fields
    document.getElementById('editSourceName').value = source.name;
    document.getElementById('editSourceUrl').value = source.url;
    document.getElementById('editSourceType').value = source.scraper_type;

    // Show modal
    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    state.editingSourceId = null;
}

async function saveSourceEdit() {
    const sourceId = state.editingSourceId;
    if (!sourceId) return;

    const name = document.getElementById('editSourceName').value.trim();
    const url = document.getElementById('editSourceUrl').value.trim();
    const scraper_type = document.getElementById('editSourceType').value;

    if (!name || !url) {
        showToast('Name and URL are required', 'error');
        return;
    }

    try {
        await AdminAPI.updateSource(sourceId, { name, url, scraper_type });
        showToast('Source updated successfully', 'success');
        closeEditModal();
        await loadSources();
    } catch (error) {
        console.error('Error updating source:', error);
        showToast('Failed to update source: ' + error.message, 'error');
    }
}

// ============================================
// SCRAPING OPERATIONS
// ============================================

async function scrapeSelected() {
    if (state.selectedSources.size === 0) {
        showToast('Please select at least one source', 'warning');
        return;
    }

    const sourceIds = Array.from(state.selectedSources);
    const timeout = parseInt(document.getElementById('timeoutInput').value) * 1000;
    const maxArticles = parseInt(document.getElementById('maxArticlesInput').value);

    await startScrapeJob({ sourceIds, timeout, maxArticles });
}

async function scrapeAll() {
    const enabledSourceIds = state.sources
        .filter(s => s.enabled)
        .map(s => s.id);

    if (enabledSourceIds.length === 0) {
        showToast('No enabled sources found', 'warning');
        return;
    }

    const timeout = parseInt(document.getElementById('timeoutInput').value) * 1000;
    const maxArticles = parseInt(document.getElementById('maxArticlesInput').value);

    await startScrapeJob({ sourceIds: enabledSourceIds, timeout, maxArticles });
}

async function scrapeRSSOnly() {
    try {
        showToast('Starting RSS scrape...', 'info');
        const response = await AdminAPI.scrapeRSSOnly();
        state.currentJobId = response.jobId;
        state.jobStartTime = Date.now();
        showScrapeStatus();
        startPolling();
        showToast(`Scraping ${response.sourceCount} RSS sources`, 'success');
    } catch (error) {
        console.error('Error starting RSS scrape:', error);
        showToast('Failed to start RSS scrape', 'error');
    }
}

async function startScrapeJob(options) {
    try {
        showToast('Starting scrape...', 'info');
        const response = await AdminAPI.startScrape(options);
        state.currentJobId = response.jobId;
        state.jobStartTime = Date.now();
        showScrapeStatus();
        startPolling();
        showToast('Scrape started', 'success');
    } catch (error) {
        console.error('Error starting scrape:', error);
        showToast(`Failed to start scrape: ${error.message}`, 'error');
    }
}

function showScrapeStatus() {
    document.getElementById('scrapeStatusPanel').style.display = 'block';
    document.getElementById('jobId').textContent = state.currentJobId;
    document.getElementById('statusBadge').textContent = 'Running';
    document.getElementById('statusBadge').className = 'status-badge';
}

function startPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
    }

    state.pollingInterval = setInterval(async () => {
        await updateScrapeStatus();
    }, 1000); // Poll every second
}

async function updateScrapeStatus() {
    if (!state.currentJobId) return;

    try {
        const response = await AdminAPI.getScrapeStatus(state.currentJobId);
        const job = response.data;

        // Update status badge
        const badge = document.getElementById('statusBadge');
        badge.textContent = job.status.charAt(0).toUpperCase() + job.status.slice(1);
        badge.className = `status-badge ${job.status}`;

        // Update progress
        if (job.progress) {
            const percentage = job.progress.total > 0
                ? (job.progress.completed / job.progress.total) * 100
                : 0;

            document.getElementById('progress').textContent =
                `${job.progress.completed}/${job.progress.total}`;
            document.getElementById('articlesFound').textContent =
                job.progress.articles || 0;
            document.getElementById('currentSource').textContent =
                job.progress.current || 'Complete';
            document.getElementById('progressFill').style.width = `${percentage}%`;
        }

        // Update elapsed time
        const elapsed = Math.floor((Date.now() - state.jobStartTime) / 1000);
        document.getElementById('elapsed').textContent = `${elapsed}s`;

        // If job completed, show results
        if (job.status === 'completed' || job.status === 'error') {
            clearInterval(state.pollingInterval);
            state.pollingInterval = null;

            if (job.results) {
                displayResults(job.results);
            }

            if (job.status === 'completed') {
                showToast('Scrape completed successfully', 'success');
            } else {
                showToast(`Scrape failed: ${job.error}`, 'error');
            }

            // Refresh data
            await loadDashboardStats();
            await loadSources();
            await loadLogs();
        }
    } catch (error) {
        console.error('Error updating status:', error);
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
}

function displayResults(results) {
    const container = document.getElementById('resultsList');

    if (!results.details || results.details.length === 0) {
        container.innerHTML = '<div class="empty-state">No results</div>';
        return;
    }

    container.innerHTML = results.details.map(detail => `
        <div class="result-item ${detail.status}">
            <strong>${detail.source}</strong>
            <div>${detail.articles} articles (${detail.duration}ms)</div>
            ${detail.error ? `<div class="error-msg">${detail.error}</div>` : ''}
        </div>
    `).join('');
}

function clearResults() {
    document.getElementById('resultsList').innerHTML =
        '<div class="empty-state">No scraping results yet</div>';
    document.getElementById('scrapeStatusPanel').style.display = 'none';
    state.currentJobId = null;
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
}

function stopScraping() {
    // Currently no stop endpoint, but we can stop polling
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
    showToast('Stopped monitoring scrape job', 'info');
}

function checkForRunningJobs() {
    // Check if there's a job in progress on page load
    // This is a placeholder for persistence
}

// ============================================
// LOGS
// ============================================

async function loadLogs() {
    try {
        const response = await AdminAPI.getLogs({ limit: 20 });
        renderLogs(response.data);
    } catch (error) {
        console.error('Error loading logs:', error);
        showToast('Failed to load logs', 'error');
    }
}

function renderLogs(logs) {
    const container = document.getElementById('logsList');

    if (logs.length === 0) {
        container.innerHTML = '<div class="empty-state">No logs found</div>';
        return;
    }

    container.innerHTML = logs.map(log => `
        <div class="log-item log-${log.status}">
            <div class="log-header">
                <span class="log-source">${log.source_name || 'Unknown'}</span>
                <span class="log-time">${formatTimeAgo(log.started_at)}</span>
            </div>
            <div class="log-stats">
                ${log.articles_found} articles (${log.duration_ms}ms)
                ${log.error_message ? `- ${log.error_message}` : ''}
            </div>
        </div>
    `).join('');
}

function refreshLogs() {
    loadLogs();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Never';

    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Make functions available globally for onclick handlers
window.toggleSourceSelection = toggleSourceSelection;
window.toggleSourceEnabled = toggleSourceEnabled;
window.testSource = testSource;
window.enableAllSources = enableAllSources;
window.resetErrors = resetErrors;
window.refreshSources = refreshSources;
window.scrapeSelected = scrapeSelected;
window.scrapeAll = scrapeAll;
window.scrapeRSSOnly = scrapeRSSOnly;
window.clearResults = clearResults;
window.stopScraping = stopScraping;
window.refreshLogs = refreshLogs;

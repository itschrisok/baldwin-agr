/**
 * Baldwin County News Hub - Main Application
 * Handles search, filtering, sorting, and hashtag management
 *
 * @author Baldwin County News Hub Team
 * @version 1.0.0
 */

/* ============================================
   GLOBAL STATE
   ============================================ */

let isReady = false;
let checkCount = 0;
const maxChecks = 50; // 5 seconds max wait
const originalContent = new Map(); // Store original content for search highlighting
let newsArticles = []; // Store all articles from API
let sourcesMap = new Map(); // Map source IDs to source names

/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Display status message to user
 * @param {string} message - Status message to display
 */
function showStatus(message) {
    const status = document.getElementById('appStatus');
    if (status) {
        status.textContent = message;
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    }
}

/**
 * Wait for all required DOM elements to be available
 * Uses polling approach for compatibility with various rendering environments
 */
function waitForElements() {
    checkCount++;

    const requiredElements = [
        'searchInput',
        'searchClear',
        'searchResults',
        'hashtagInput',
        'addHashtagBtn',
        'hashtagContainer',
        'newsContainer'
    ];

    let allFound = true;
    for (let id of requiredElements) {
        if (!document.getElementById(id)) {
            allFound = false;
            break;
        }
    }

    if (allFound) {
        isReady = true;
        console.log('✅ All elements found, initializing...');
        showStatus('✅ Ready');
        initializeApp();
    } else if (checkCount < maxChecks) {
        console.log(`⏳ Waiting for elements... (${checkCount}/${maxChecks})`);
        showStatus(`⏳ Loading... (${checkCount}/${maxChecks})`);
        setTimeout(waitForElements, 100);
    } else {
        console.error('❌ Timeout waiting for elements');
        showStatus('❌ Failed to load');
    }
}

/**
 * Main initialization function
 * Sets up all event listeners and loads data from API
 */
function initializeApp() {
    try {
        console.log('🚀 Starting initialization...');

        // Initialize all features
        initializeSearch();
        initializeToggles();
        initializeFilters();
        initializeSorting();
        initializeHashtags();

        console.log('✅ Event listeners initialized');

        // Load news from API
        loadNews();

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showStatus('❌ Error');
    }
}

/**
 * Store original content for each news item
 * Used for search highlighting and restoration
 */
function storeOriginalContent() {
    document.querySelectorAll('.news-item').forEach(item => {
        try {
            const titleEl = item.querySelector('.news-title');
            const excerptEl = item.querySelector('.news-excerpt');
            const tagEls = item.querySelectorAll('.news-tag');

            if (titleEl && excerptEl) {
                originalContent.set(item, {
                    title: titleEl.textContent,
                    excerpt: excerptEl.textContent,
                    tags: Array.from(tagEls).map(tag => tag.textContent)
                });
            }
        } catch (e) {
            console.warn('Error storing content for item:', e);
        }
    });

    console.log(`📝 Stored content for ${originalContent.size} items`);
}

/* ============================================
   API INTEGRATION
   ============================================ */

/**
 * Load news articles from the backend API
 */
async function loadNews() {
    try {
        showStatus('⏳ Loading articles...');

        // Fetch sources first to build the map
        const sources = await fetchSources();
        sources.forEach(source => {
            sourcesMap.set(source.id, source.name);
        });

        // Fetch news articles
        const articles = await fetchNews({ limit: 100 });
        newsArticles = articles;

        console.log(`📰 Loaded ${articles.length} articles from API`);

        // Render articles
        renderNewsItems(articles);

        // Store original content for search
        storeOriginalContent();

        showStatus('✅ Articles loaded');

    } catch (error) {
        console.error('Error loading news:', error);
        showError('Failed to load articles. Please refresh the page.');
    }
}

/**
 * Render news items into the DOM
 */
function renderNewsItems(articles) {
    const container = document.getElementById('newsContainer');

    if (!container) {
        console.error('News container not found');
        return;
    }

    // Clear container
    container.innerHTML = '';

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; color: #666;">
                <p style="font-size: 18px; margin-bottom: 10px;">No articles found</p>
                <p style="font-size: 14px;">Try running the scraper to fetch news articles</p>
            </div>
        `;
        return;
    }

    // Render each article
    articles.forEach(article => {
        const articleEl = createArticleElement(article);
        container.appendChild(articleEl);
    });

    console.log(`✅ Rendered ${articles.length} articles`);
}

/**
 * Create DOM element for a single article
 */
function createArticleElement(article) {
    const div = document.createElement('div');
    div.className = 'news-item';
    div.setAttribute('data-timestamp', article.published_at || article.created_at);
    div.setAttribute('data-category', article.category || 'local');
    div.setAttribute('data-content-type', article.content_type || 'news');

    // Get source name
    const sourceName = sourcesMap.get(article.source_id) || 'Unknown Source';

    // Format timestamp
    const timeAgo = formatTimeAgo(article.published_at || article.created_at);

    // Determine badge class and text
    const badgeClass = `badge-${article.content_type || 'news'}`;
    const badgeText = (article.content_type || 'news').toUpperCase();

    // Build HTML
    div.innerHTML = `
        <div class="news-meta">
            <span class="content-type-badge ${badgeClass}">${badgeText}</span>
            <span class="news-source">${escapeHtml(sourceName)}</span>
            <span>${timeAgo}</span>
            <a href="${escapeHtml(article.url)}" target="_blank" class="citation-link">🔗 Source</a>
        </div>
        <a href="${escapeHtml(article.url)}" target="_blank" class="news-title">${escapeHtml(article.title)}</a>
        ${article.excerpt ? `<div class="news-excerpt">${escapeHtml(article.excerpt)}</div>` : ''}
        ${article.image_url ? `<div class="media-preview"><img src="${escapeHtml(article.image_url)}" alt="${escapeHtml(article.title)}" loading="lazy"></div>` : ''}
        <div class="news-tags">
            ${formatTags(article)}
        </div>
    `;

    return div;
}

/**
 * Format tags for an article
 */
function formatTags(article) {
    // Tags could come from article.tags array or article.category
    const tags = [];

    if (article.category) {
        tags.push(article.category);
    }

    // If there are additional tags in the future, add them here

    return tags.map(tag => `<span class="news-tag">${escapeHtml(tag)}</span>`).join('');
}

/**
 * Format timestamp as "X time ago"
 */
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Recently';

    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show error message to user
 */
function showError(message) {
    const container = document.getElementById('newsContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 60px 20px; color: #c62828; background: #ffebee; border-radius: 8px; margin: 20px;">
                <p style="font-size: 18px; margin-bottom: 10px;">⚠️ ${escapeHtml(message)}</p>
                <button onclick="loadNews()" style="padding: 10px 20px; background: #c62828; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Try Again
                </button>
            </div>
        `;
    }
    showStatus('❌ Error');
}

/* ============================================
   SEARCH FUNCTIONALITY
   ============================================ */

/**
 * Initialize search functionality
 * Sets up input and clear button event listeners
 */
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');

    if (searchInput && searchClear && searchResults) {
        // Search input listener
        searchInput.addEventListener('input', function() {
            try {
                const query = this.value.trim();
                if (query) {
                    searchClear.style.display = 'block';
                    performSearch(query, searchResults);
                } else {
                    searchClear.style.display = 'none';
                    clearSearch(searchResults);
                }
            } catch (e) {
                console.error('Search input error:', e);
            }
        });

        // Clear button listener
        searchClear.addEventListener('click', function() {
            try {
                searchInput.value = '';
                this.style.display = 'none';
                clearSearch(searchResults);
            } catch (e) {
                console.error('Search clear error:', e);
            }
        });
    }
}

/**
 * Perform search across all news items
 * Highlights matching text and shows/hides items based on filters
 *
 * @param {string} query - Search query
 * @param {HTMLElement} resultsEl - Element to display result count
 */
function performSearch(query, resultsEl) {
    try {
        const items = document.querySelectorAll('.news-item');
        let found = 0;
        const queryLower = query.toLowerCase();

        items.forEach(item => {
            try {
                const original = originalContent.get(item);
                if (!original) {
                    item.style.display = 'none';
                    return;
                }

                // Check if query matches title, excerpt, or tags
                const titleMatch = original.title.toLowerCase().includes(queryLower);
                const excerptMatch = original.excerpt.toLowerCase().includes(queryLower);
                const tagMatch = original.tags.some(tag => tag.toLowerCase().includes(queryLower));

                if (titleMatch || excerptMatch || tagMatch) {
                    if (isItemVisible(item)) {
                        item.style.display = 'block';
                        found++;

                        // Apply highlighting
                        const titleEl = item.querySelector('.news-title');
                        const excerptEl = item.querySelector('.news-excerpt');

                        if (titleEl && titleMatch) {
                            titleEl.innerHTML = highlightText(original.title, query);
                        }
                        if (excerptEl && excerptMatch) {
                            excerptEl.innerHTML = highlightText(original.excerpt, query);
                        }
                    } else {
                        item.style.display = 'none';
                    }
                } else {
                    item.style.display = 'none';
                }
            } catch (e) {
                console.warn('Error processing item in search:', e);
            }
        });

        // Update result count
        if (resultsEl) {
            resultsEl.textContent = found > 0 ?
                `Found ${found} item${found !== 1 ? 's' : ''}` :
                'No results found';
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

/**
 * Highlight matching text in search results
 *
 * @param {string} text - Original text
 * @param {string} query - Search query to highlight
 * @returns {string} HTML with highlighted text
 */
function highlightText(text, query) {
    try {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    } catch (e) {
        return text;
    }
}

/**
 * Clear search and restore original content
 *
 * @param {HTMLElement} resultsEl - Element to clear result count
 */
function clearSearch(resultsEl) {
    try {
        // Restore original text without highlighting
        document.querySelectorAll('.news-item').forEach(item => {
            const original = originalContent.get(item);
            if (original) {
                const titleEl = item.querySelector('.news-title');
                const excerptEl = item.querySelector('.news-excerpt');

                if (titleEl) titleEl.textContent = original.title;
                if (excerptEl) excerptEl.textContent = original.excerpt;
            }
        });

        if (resultsEl) resultsEl.textContent = '';
        applyFilters();
    } catch (error) {
        console.error('Clear search error:', error);
    }
}

/* ============================================
   TOGGLE FUNCTIONALITY
   ============================================ */

/**
 * Initialize toggle switches for sources and content types
 */
function initializeToggles() {
    document.querySelectorAll('.toggle-item').forEach(item => {
        item.addEventListener('click', function() {
            try {
                const toggle = this.querySelector('.toggle-switch');
                if (toggle) {
                    toggle.classList.toggle('active');
                    console.log('Toggle clicked:', this.dataset.source || this.dataset.content);
                    showStatus('🔄 Refreshing...');
                    applyFilters();
                }
            } catch (e) {
                console.error('Toggle error:', e);
            }
        });
    });
}

/* ============================================
   FILTER FUNCTIONALITY
   ============================================ */

/**
 * Initialize category filter buttons
 */
function initializeFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            try {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                applyFilters();
            } catch (e) {
                console.error('Filter error:', e);
            }
        });
    });
}

/* ============================================
   SORTING FUNCTIONALITY
   ============================================ */

/**
 * Initialize sort buttons (Newest, Today, This Month)
 */
function initializeSorting() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            try {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                applyFilters();
            } catch (e) {
                console.error('Sort error:', e);
            }
        });
    });
}

/**
 * Check if a news item should be visible based on current filters
 *
 * @param {HTMLElement} item - News item element
 * @returns {boolean} True if item should be visible
 */
function isItemVisible(item) {
    try {
        // Check content type filter
        const contentType = item.dataset.contentType;
        const contentToggle = document.querySelector(`[data-content="${contentType}"] .toggle-switch`);
        if (contentToggle && !contentToggle.classList.contains('active')) {
            return false;
        }

        // Check category filter
        const activeFilter = document.querySelector('.filter-btn.active');
        if (activeFilter && activeFilter.dataset.category !== 'all') {
            if (item.dataset.category !== activeFilter.dataset.category) {
                return false;
            }
        }

        // Check time filter
        const activeSort = document.querySelector('.sort-btn.active');
        if (activeSort) {
            const sortType = activeSort.dataset.sort;
            if (sortType === 'day') {
                const itemDate = new Date(item.dataset.timestamp);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (itemDate < today) return false;
            } else if (sortType === 'month') {
                const itemDate = new Date(item.dataset.timestamp);
                const thisMonth = new Date();
                thisMonth.setDate(1);
                thisMonth.setHours(0, 0, 0, 0);
                if (itemDate < thisMonth) return false;
            }
        }

        return true;
    } catch (e) {
        console.warn('Error checking item visibility:', e);
        return true;
    }
}

/**
 * Apply all active filters to news items
 * TODO: When backend is implemented, this will trigger an API call with filter parameters
 */
function applyFilters() {
    try {
        document.querySelectorAll('.news-item').forEach(item => {
            item.style.display = isItemVisible(item) ? 'block' : 'none';
        });
    } catch (error) {
        console.error('Filter error:', error);
    }
}

/* ============================================
   HASHTAG FUNCTIONALITY
   ============================================ */

/**
 * Initialize hashtag management
 * Sets up add button and remove button event delegation
 */
function initializeHashtags() {
    const hashtagInput = document.getElementById('hashtagInput');
    const addBtn = document.getElementById('addHashtagBtn');
    const container = document.getElementById('hashtagContainer');

    if (hashtagInput && addBtn && container) {
        // Add button listener
        addBtn.addEventListener('click', function() {
            addHashtag(hashtagInput, container);
        });

        // Enter key listener
        hashtagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addHashtag(hashtagInput, container);
            }
        });

        // Remove button delegation (handles dynamically added hashtags)
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove')) {
                try {
                    const tag = e.target.parentElement;
                    if (tag) {
                        const tagText = tag.textContent.replace('×', '').trim();
                        tag.remove();
                        console.log('Removed hashtag:', tagText);
                        showStatus('🗑️ Hashtag removed');
                        // TODO: When backend is implemented, trigger API call to update hashtag subscriptions
                    }
                } catch (err) {
                    console.error('Error removing hashtag:', err);
                }
            }
        });
    }
}

/**
 * Add a new hashtag to the tracking list
 *
 * @param {HTMLInputElement} inputEl - Input element containing hashtag
 * @param {HTMLElement} containerEl - Container for hashtag tags
 */
function addHashtag(inputEl, containerEl) {
    try {
        const value = inputEl.value.trim();
        if (!value) return;

        // Ensure hashtag format
        const hashtag = value.startsWith('#') ? value : '#' + value;

        // Check for duplicates
        const existing = Array.from(containerEl.querySelectorAll('.hashtag-tag'))
            .map(tag => tag.textContent.replace('×', '').trim());

        if (existing.includes(hashtag)) {
            inputEl.value = '';
            showStatus('⚠️ Hashtag already exists');
            return;
        }

        // Create new hashtag tag element
        const tagEl = document.createElement('div');
        tagEl.className = 'hashtag-tag';

        const textEl = document.createTextNode(hashtag);
        const removeEl = document.createElement('span');
        removeEl.className = 'remove';
        removeEl.textContent = '×';

        tagEl.appendChild(textEl);
        tagEl.appendChild(removeEl);
        containerEl.appendChild(tagEl);

        inputEl.value = '';
        console.log('Added hashtag:', hashtag);
        showStatus('✅ Hashtag added');

        // TODO: When backend is implemented, trigger API call to start monitoring this hashtag

    } catch (error) {
        console.error('Add hashtag error:', error);
        showStatus('❌ Error adding hashtag');
    }
}

/* ============================================
   APPLICATION STARTUP
   ============================================ */

console.log('🚀 Baldwin County News Hub starting...');
showStatus('⏳ Starting...');

// Use multiple initialization methods for compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElements);
} else {
    setTimeout(waitForElements, 100);
}

// Backup initialization after 1 second
setTimeout(() => {
    if (!isReady) {
        console.log('🔄 Backup initialization triggered');
        waitForElements();
    }
}, 1000);

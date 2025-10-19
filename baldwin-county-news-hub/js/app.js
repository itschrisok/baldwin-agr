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
 * Sets up all event listeners and stores original content
 */
function initializeApp() {
    try {
        console.log('🚀 Starting initialization...');

        // Store original content for search highlighting
        storeOriginalContent();

        // Initialize all features
        initializeSearch();
        initializeToggles();
        initializeFilters();
        initializeSorting();
        initializeHashtags();

        console.log('✅ Initialization complete');
        showStatus('✅ Ready');

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

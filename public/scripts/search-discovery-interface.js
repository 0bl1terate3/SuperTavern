/**
 * Search & Discovery Interface
 * Handles UI interactions for the Search & Discovery Hub
 */

let searchDiscoveryState = {
    enabled: false,
    searchQuery: '',
    searchScope: 'all',
    searchType: 'contains',
    filters: {
        dateFrom: null,
        dateTo: null,
        character: 'all',
        length: 'any',
        hasAttachments: false,
        hasLinks: false,
    },
    savedSearches: [],
    searchResults: [],
    discoverySettings: {
        trendingEnabled: true,
        recentEnabled: true,
        popularEnabled: true,
        suggestionsEnabled: true,
    },
};

/**
 * Initialize the Search & Discovery Interface
 */
export function initializeSearchDiscoveryInterface() {
    console.log('Initializing Search & Discovery Interface...');
    loadSearchDiscoverySettings();
    setupEventListeners();
    updateUIFromState();
    console.log('Search & Discovery Interface initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Toggle drawer
    document.getElementById('search-discovery-button')?.addEventListener('click', () => {
        const panel = document.getElementById('SearchDiscoveryHub');
        const icon = document.querySelector('#search-discovery-button .drawer-icon');
        if (panel && icon) {
            panel.classList.toggle('closedDrawer');
            icon.classList.toggle('closedIcon');
        }
    });

    // Search Engine
    document.getElementById('search_enabled')?.addEventListener('change', (e) => {
        searchDiscoveryState.enabled = e.target.checked;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('search_query')?.addEventListener('input', (e) => {
        searchDiscoveryState.searchQuery = e.target.value;
        updateSearchDiscoveryControllerSettings();
    });

    document.getElementById('search_scope')?.addEventListener('change', (e) => {
        searchDiscoveryState.searchScope = e.target.value;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('search_type')?.addEventListener('change', (e) => {
        searchDiscoveryState.searchType = e.target.value;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('search_execute')?.addEventListener('click', () => {
        executeSearch();
    });

    document.getElementById('search_clear')?.addEventListener('click', () => {
        clearSearch();
    });

    // Advanced Filters
    document.getElementById('filter_date_from')?.addEventListener('change', (e) => {
        searchDiscoveryState.filters.dateFrom = e.target.value;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('filter_date_to')?.addEventListener('change', (e) => {
        searchDiscoveryState.filters.dateTo = e.target.value;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('filter_character')?.addEventListener('change', (e) => {
        searchDiscoveryState.filters.character = e.target.value;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('filter_length')?.addEventListener('change', (e) => {
        searchDiscoveryState.filters.length = e.target.value;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('filter_has_attachments')?.addEventListener('change', (e) => {
        searchDiscoveryState.filters.hasAttachments = e.target.checked;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    document.getElementById('filter_has_links')?.addEventListener('change', (e) => {
        searchDiscoveryState.filters.hasLinks = e.target.checked;
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
    });

    // Search Results
    document.getElementById('search_export_results')?.addEventListener('click', () => {
        exportSearchResults();
    });

    document.getElementById('search_save_query')?.addEventListener('click', () => {
        saveSearchQuery();
    });

    // Saved Searches
    document.getElementById('search_load_saved')?.addEventListener('click', () => {
        loadSavedSearch();
    });

    document.getElementById('search_delete_saved')?.addEventListener('click', () => {
        deleteSavedSearch();
    });

    // Content Discovery
    document.getElementById('discover_trending')?.addEventListener('click', () => {
        discoverTrending();
    });

    document.getElementById('discover_recent')?.addEventListener('click', () => {
        discoverRecent();
    });

    document.getElementById('discover_popular')?.addEventListener('click', () => {
        discoverPopular();
    });

    document.getElementById('discover_suggestions')?.addEventListener('click', () => {
        discoverSuggestions();
    });

    // Search Actions
    document.getElementById('search_quick_find')?.addEventListener('click', () => {
        quickFind();
    });

    document.getElementById('search_advanced')?.addEventListener('click', () => {
        showAdvancedSearch();
    });

    document.getElementById('search_reset')?.addEventListener('click', () => {
        resetAllFilters();
    });

    document.getElementById('search_help')?.addEventListener('click', () => {
        showSearchHelp();
    });

    // Import/Export
    document.getElementById('search_import')?.addEventListener('click', () => {
        importSearchSettings();
    });

    document.getElementById('search_export')?.addEventListener('click', () => {
        exportSearchSettings();
    });

    // Listen for controller events
    if (window.searchDiscoveryController) {
        window.searchDiscoveryController.on('searchCompleted', (results) => {
            updateSearchResults(results);
        });

        window.searchDiscoveryController.on('searchSaved', (savedQuery) => {
            updateSavedSearchesList();
            toastr.success('Search query saved!');
        });

        window.searchDiscoveryController.on('searchLoaded', (savedQuery) => {
            loadSavedQueryToUI(savedQuery);
            toastr.success('Search query loaded!');
        });

        window.searchDiscoveryController.on('searchDeleted', (id) => {
            updateSavedSearchesList();
            toastr.success('Search query deleted!');
        });
    }
}

/**
 * Execute search
 */
function executeSearch() {
    if (!searchDiscoveryState.searchQuery.trim()) {
        toastr.warning('Please enter a search query!');
        return;
    }

    if (window.searchDiscoveryController) {
        const results = window.searchDiscoveryController.executeSearch({
            query: searchDiscoveryState.searchQuery,
            scope: searchDiscoveryState.searchScope,
            type: searchDiscoveryState.searchType,
            filters: searchDiscoveryState.filters,
        });

        updateSearchResults(results);
        toastr.success(`Found ${results.length} results!`);
    }
}

/**
 * Clear search
 */
function clearSearch() {
    searchDiscoveryState.searchQuery = '';
    searchDiscoveryState.searchResults = [];
    document.getElementById('search_query').value = '';
    document.getElementById('search_results').value = '';
    updateSearchDiscoveryControllerSettings();
    toastr.info('Search cleared!');
}

/**
 * Update search results display
 * @param {Array} results Search results
 */
function updateSearchResults(results) {
    const resultsText = results.map((msg, index) => {
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'Unknown time';
        return `${index + 1}. [${msg.type.toUpperCase()}] ${timestamp}\n${msg.text}\n---`;
    }).join('\n\n');

    document.getElementById('search_results').value = resultsText;
    searchDiscoveryState.searchResults = results;
}

/**
 * Export search results
 */
function exportSearchResults() {
    if (searchDiscoveryState.searchResults.length === 0) {
        toastr.warning('No search results to export!');
        return;
    }

    if (window.searchDiscoveryController) {
        const exportData = window.searchDiscoveryController.exportSearchResults(searchDiscoveryState.searchResults);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'search_results.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastr.success('Search results exported!');
    }
}

/**
 * Save search query
 */
function saveSearchQuery() {
    const name = prompt('Enter a name for this search query:');
    if (!name) return;

    if (window.searchDiscoveryController) {
        const query = {
            query: searchDiscoveryState.searchQuery,
            scope: searchDiscoveryState.searchScope,
            type: searchDiscoveryState.searchType,
            filters: searchDiscoveryState.filters,
        };

        window.searchDiscoveryController.saveSearchQuery(name, query);
    }
}

/**
 * Load saved search
 */
function loadSavedSearch() {
    const savedSearchesSelect = document.getElementById('saved_searches');
    const selectedId = savedSearchesSelect.value;

    if (!selectedId) {
        toastr.warning('Please select a saved search!');
        return;
    }

    if (window.searchDiscoveryController) {
        const savedQuery = window.searchDiscoveryController.loadSavedSearch(selectedId);
        if (savedQuery) {
            loadSavedQueryToUI(savedQuery);
        }
    }
}

/**
 * Load saved query to UI
 * @param {object} savedQuery Saved query object
 */
function loadSavedQueryToUI(savedQuery) {
    if (savedQuery.query) {
        searchDiscoveryState.searchQuery = savedQuery.query;
        document.getElementById('search_query').value = savedQuery.query;
    }

    if (savedQuery.scope) {
        searchDiscoveryState.searchScope = savedQuery.scope;
        document.getElementById('search_scope').value = savedQuery.scope;
    }

    if (savedQuery.type) {
        searchDiscoveryState.searchType = savedQuery.type;
        document.getElementById('search_type').value = savedQuery.type;
    }

    if (savedQuery.filters) {
        searchDiscoveryState.filters = { ...searchDiscoveryState.filters, ...savedQuery.filters };
        updateFiltersUI();
    }

    updateSearchDiscoveryControllerSettings();
}

/**
 * Delete saved search
 */
function deleteSavedSearch() {
    const savedSearchesSelect = document.getElementById('saved_searches');
    const selectedId = savedSearchesSelect.value;

    if (!selectedId) {
        toastr.warning('Please select a saved search to delete!');
        return;
    }

    if (confirm('Are you sure you want to delete this saved search?')) {
        if (window.searchDiscoveryController) {
            window.searchDiscoveryController.deleteSavedSearch(selectedId);
        }
    }
}

/**
 * Update saved searches list
 */
function updateSavedSearchesList() {
    const savedSearchesSelect = document.getElementById('saved_searches');
    savedSearchesSelect.innerHTML = '<option value="">No saved searches</option>';

    if (window.searchDiscoveryController) {
        const savedSearches = window.searchDiscoveryController.getSettings().savedSearches;
        savedSearches.forEach(search => {
            const option = document.createElement('option');
            option.value = search.id;
            option.textContent = search.name;
            savedSearchesSelect.appendChild(option);
        });
    }
}

/**
 * Discover trending topics
 */
function discoverTrending() {
    if (window.searchDiscoveryController) {
        const trending = window.searchDiscoveryController.getTrendingTopics();
        const trendingText = trending.map(item => `${item.word} (${item.count} mentions)`).join('\n');
        document.getElementById('search_results').value = `Trending Topics:\n${trendingText}`;
        toastr.success('Trending topics discovered!');
    }
}

/**
 * Discover recent activity
 */
function discoverRecent() {
    if (window.searchDiscoveryController) {
        const recent = window.searchDiscoveryController.getRecentActivity();
        const recentText = recent.map((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            return `${index + 1}. [${msg.type.toUpperCase()}] ${timestamp}\n${msg.text.substring(0, 100)}...`;
        }).join('\n\n');

        document.getElementById('search_results').value = `Recent Activity:\n${recentText}`;
        toastr.success('Recent activity discovered!');
    }
}

/**
 * Discover popular content
 */
function discoverPopular() {
    if (window.searchDiscoveryController) {
        const popular = window.searchDiscoveryController.getPopularContent();
        const popularText = popular.map((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            return `${index + 1}. [${msg.type.toUpperCase()}] ${timestamp}\n${msg.text.substring(0, 100)}...`;
        }).join('\n\n');

        document.getElementById('search_results').value = `Popular Content:\n${popularText}`;
        toastr.success('Popular content discovered!');
    }
}

/**
 * Discover suggestions
 */
function discoverSuggestions() {
    if (window.searchDiscoveryController) {
        const suggestions = window.searchDiscoveryController.getContentSuggestions();
        const suggestionsText = suggestions.map((suggestion, index) => {
            return `${index + 1}. [${suggestion.type.toUpperCase()}] ${suggestion.content} (${suggestion.count} occurrences)`;
        }).join('\n');

        document.getElementById('search_results').value = `Content Suggestions:\n${suggestionsText}`;
        toastr.success('Content suggestions discovered!');
    }
}

/**
 * Quick find
 */
function quickFind() {
    const query = prompt('Enter quick search term:');
    if (query) {
        searchDiscoveryState.searchQuery = query;
        document.getElementById('search_query').value = query;
        executeSearch();
    }
}

/**
 * Show advanced search
 */
function showAdvancedSearch() {
    toastr.info('Advanced search features are available in the filters section!');
}

/**
 * Reset all filters
 */
function resetAllFilters() {
    if (confirm('Are you sure you want to reset all filters?')) {
        searchDiscoveryState.filters = {
            dateFrom: null,
            dateTo: null,
            character: 'all',
            length: 'any',
            hasAttachments: false,
            hasLinks: false,
        };

        updateFiltersUI();
        updateSearchDiscoveryControllerSettings();
        saveSearchDiscoverySettings();
        toastr.success('All filters reset!');
    }
}

/**
 * Update filters UI
 */
function updateFiltersUI() {
    document.getElementById('filter_date_from').value = searchDiscoveryState.filters.dateFrom || '';
    document.getElementById('filter_date_to').value = searchDiscoveryState.filters.dateTo || '';
    document.getElementById('filter_character').value = searchDiscoveryState.filters.character;
    document.getElementById('filter_length').value = searchDiscoveryState.filters.length;
    document.getElementById('filter_has_attachments').checked = searchDiscoveryState.filters.hasAttachments;
    document.getElementById('filter_has_links').checked = searchDiscoveryState.filters.hasLinks;
}

/**
 * Show search help
 */
function showSearchHelp() {
    const helpText = `
Search & Discovery Hub Help:

1. Search Engine:
   - Enter your search query
   - Choose search scope (All, User, AI, System)
   - Select search type (Contains, Exact, Regex, Fuzzy)

2. Advanced Filters:
   - Filter by date range
   - Filter by character
   - Filter by message length
   - Filter by attachments/links

3. Content Discovery:
   - Trending: Find popular topics
   - Recent: Get latest activity
   - Popular: Find most engaging content
   - Suggestions: Get content recommendations

4. Saved Searches:
   - Save frequently used queries
   - Load saved searches
   - Delete old searches

5. Search Actions:
   - Quick Find: Fast search
   - Advanced: Use all filters
   - Reset: Clear all filters
   - Help: Show this help
    `;

    alert(helpText);
}

/**
 * Import search settings
 */
function importSearchSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                const importedConfig = JSON.parse(text);
                window.searchDiscoveryController.updateSettings(importedConfig);
                loadSearchDiscoverySettings();
                updateUIFromState();
                toastr.success('Search settings imported!');
            } catch (error) {
                console.error('Failed to import search settings:', error);
                toastr.error('Failed to import search settings!');
            }
        }
    };
    input.click();
}

/**
 * Export search settings
 */
function exportSearchSettings() {
    if (window.searchDiscoveryController) {
        const config = window.searchDiscoveryController.getSettings();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 4));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "search_discovery_settings.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toastr.success('Search settings exported!');
    }
}

/**
 * Update Search Discovery Controller settings
 */
function updateSearchDiscoveryControllerSettings() {
    if (window.searchDiscoveryController) {
        window.searchDiscoveryController.updateSettings(searchDiscoveryState);
        console.log('Search Discovery controller settings updated');
    }
}

/**
 * Load Search Discovery settings
 */
function loadSearchDiscoverySettings() {
    try {
        const saved = localStorage.getItem('search-discovery-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            searchDiscoveryState = mergeDeep(searchDiscoveryState, parsed);
            updateUIFromState();
        }
    } catch (error) {
        console.error('Failed to load search discovery settings:', error);
        searchDiscoveryState = {
            enabled: false,
            searchQuery: '',
            searchScope: 'all',
            searchType: 'contains',
            filters: {
                dateFrom: null,
                dateTo: null,
                character: 'all',
                length: 'any',
                hasAttachments: false,
                hasLinks: false,
            },
            savedSearches: [],
            searchResults: [],
            discoverySettings: {
                trendingEnabled: true,
                recentEnabled: true,
                popularEnabled: true,
                suggestionsEnabled: true,
            },
        };
        updateUIFromState();
    }
}

/**
 * Save Search Discovery settings
 */
function saveSearchDiscoverySettings() {
    localStorage.setItem('search-discovery-settings', JSON.stringify(searchDiscoveryState));
}

/**
 * Update UI from state
 */
function updateUIFromState() {
    document.getElementById('search_enabled').checked = searchDiscoveryState.enabled;
    document.getElementById('search_query').value = searchDiscoveryState.searchQuery;
    document.getElementById('search_scope').value = searchDiscoveryState.searchScope;
    document.getElementById('search_type').value = searchDiscoveryState.searchType;

    updateFiltersUI();
    updateSavedSearchesList();
}

/**
 * Deep merge objects
 * @param {object} target Target object
 * @param {object} source Source object
 * @returns {object} Merged object
 */
function mergeDeep(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = mergeDeep(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

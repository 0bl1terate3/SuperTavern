/**
 * Search & Discovery Controller
 * Handles search functionality and content discovery
 */

class SearchDiscoveryController {
    constructor() {
        this.state = {
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

        this.eventListeners = new Map();
        this.isInitialized = false;
        this.searchIndex = new Map();
        this.messageCache = [];
    }

    /**
     * Initialize the search discovery controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Search & Discovery Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Build search index
            this.buildSearchIndex();

            this.isInitialized = true;
            console.log('Search & Discovery Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Search & Discovery Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for message events
        if (typeof window !== 'undefined') {
            document.addEventListener('messageAdded', (event) => {
                this.handleMessageAdded(event.detail);
            });

            document.addEventListener('messageRemoved', (event) => {
                this.handleMessageRemoved(event.detail);
            });

            document.addEventListener('chatCleared', (event) => {
                this.handleChatCleared(event.detail);
            });
        }
    }

    /**
     * Handle message added
     * @param {object} data Message data
     */
    handleMessageAdded(data) {
        if (!this.state.enabled) return;

        // Add to search index
        this.addToSearchIndex(data);
        this.emit('messageIndexed', data);
    }

    /**
     * Handle message removed
     * @param {object} data Message data
     */
    handleMessageRemoved(data) {
        if (!this.state.enabled) return;

        // Remove from search index
        this.removeFromSearchIndex(data);
        this.emit('messageRemoved', data);
    }

    /**
     * Handle chat cleared
     * @param {object} data Chat data
     */
    handleChatCleared(data) {
        if (!this.state.enabled) return;

        // Clear search index
        this.clearSearchIndex();
        this.emit('chatCleared', data);
    }

    /**
     * Build search index from existing messages
     */
    buildSearchIndex() {
        if (typeof window === 'undefined') return;

        try {
            // Get all message elements
            const messageElements = document.querySelectorAll('.mes, .mes_text, .mes_ex, .mes_edit');

            messageElements.forEach((element, index) => {
                const messageData = this.extractMessageData(element, index);
                if (messageData) {
                    this.addToSearchIndex(messageData);
                }
            });

            console.log(`Search index built with ${this.searchIndex.size} entries`);
        } catch (error) {
            console.error('Failed to build search index:', error);
        }
    }

    /**
     * Extract message data from element
     * @param {HTMLElement} element Message element
     * @param {number} index Message index
     * @returns {object|null} Message data
     */
    extractMessageData(element, index) {
        try {
            const text = element.textContent || element.innerText || '';
            const timestamp = this.extractTimestamp(element);
            const messageType = this.determineMessageType(element);
            const character = this.extractCharacter(element);

            return {
                id: `msg_${index}`,
                text: text.trim(),
                timestamp: timestamp,
                type: messageType,
                character: character,
                element: element,
                index: index,
                hasAttachments: this.hasAttachments(element),
                hasLinks: this.hasLinks(text),
                length: text.length,
            };
        } catch (error) {
            console.error('Failed to extract message data:', error);
            return null;
        }
    }

    /**
     * Extract timestamp from element
     * @param {HTMLElement} element Message element
     * @returns {Date|null} Timestamp
     */
    extractTimestamp(element) {
        try {
            // Look for timestamp in various formats
            const timeElement = element.querySelector('.mes_timestamp, .timestamp, time');
            if (timeElement) {
                const timeText = timeElement.textContent || timeElement.getAttribute('datetime');
                return new Date(timeText);
            }

            // Fallback to current time
            return new Date();
        } catch (error) {
            return new Date();
        }
    }

    /**
     * Determine message type
     * @param {HTMLElement} element Message element
     * @returns {string} Message type
     */
    determineMessageType(element) {
        if (element.classList.contains('mes_ex')) return 'system';
        if (element.classList.contains('mes_edit')) return 'edit';
        if (element.classList.contains('mes_text')) return 'ai';
        return 'user';
    }

    /**
     * Extract character from element
     * @param {HTMLElement} element Message element
     * @returns {string} Character name
     */
    extractCharacter(element) {
        try {
            const charElement = element.querySelector('.mes_name, .character_name');
            if (charElement) {
                return charElement.textContent.trim();
            }
            return 'system';
        } catch (error) {
            return 'system';
        }
    }

    /**
     * Check if message has attachments
     * @param {HTMLElement} element Message element
     * @returns {boolean} Has attachments
     */
    hasAttachments(element) {
        return element.querySelector('img, video, audio, [data-attachment]') !== null;
    }

    /**
     * Check if text has links
     * @param {string} text Message text
     * @returns {boolean} Has links
     */
    hasLinks(text) {
        return /https?:\/\/[^\s]+/.test(text);
    }

    /**
     * Add message to search index
     * @param {object} messageData Message data
     */
    addToSearchIndex(messageData) {
        if (!messageData || !messageData.text) return;

        this.searchIndex.set(messageData.id, messageData);
        this.messageCache.push(messageData);

        // Keep cache size manageable
        if (this.messageCache.length > 1000) {
            this.messageCache = this.messageCache.slice(-500);
        }
    }

    /**
     * Remove message from search index
     * @param {object} messageData Message data
     */
    removeFromSearchIndex(messageData) {
        if (!messageData || !messageData.id) return;

        this.searchIndex.delete(messageData.id);
        this.messageCache = this.messageCache.filter(msg => msg.id !== messageData.id);
    }

    /**
     * Clear search index
     */
    clearSearchIndex() {
        this.searchIndex.clear();
        this.messageCache = [];
    }

    /**
     * Execute search
     * @param {object} searchOptions Search options
     * @returns {Array} Search results
     */
    executeSearch(searchOptions = {}) {
        if (!this.state.enabled) return [];

        const query = searchOptions.query || this.state.searchQuery;
        const scope = searchOptions.scope || this.state.searchScope;
        const type = searchOptions.type || this.state.searchType;
        const filters = searchOptions.filters || this.state.filters;

        if (!query.trim()) return [];

        let results = Array.from(this.searchIndex.values());

        // Apply scope filter
        if (scope !== 'all') {
            results = results.filter(msg => msg.type === scope);
        }

        // Apply text search
        results = this.filterByText(results, query, type);

        // Apply additional filters
        results = this.applyFilters(results, filters);

        // Sort by relevance
        results = this.sortByRelevance(results, query);

        this.state.searchResults = results;
        this.emit('searchCompleted', results);

        return results;
    }

    /**
     * Filter messages by text
     * @param {Array} messages Messages to filter
     * @param {string} query Search query
     * @param {string} type Search type
     * @returns {Array} Filtered messages
     */
    filterByText(messages, query, type) {
        const queryLower = query.toLowerCase();

        return messages.filter(msg => {
            const text = msg.text.toLowerCase();

            switch (type) {
                case 'exact':
                    return text === queryLower;
                case 'regex':
                    try {
                        const regex = new RegExp(query, 'i');
                        return regex.test(msg.text);
                    } catch (error) {
                        return false;
                    }
                case 'fuzzy':
                    return this.fuzzyMatch(text, queryLower);
                case 'contains':
                default:
                    return text.includes(queryLower);
            }
        });
    }

    /**
     * Fuzzy string matching
     * @param {string} text Text to search
     * @param {string} query Query to match
     * @returns {boolean} Match result
     */
    fuzzyMatch(text, query) {
        let textIndex = 0;
        let queryIndex = 0;

        while (textIndex < text.length && queryIndex < query.length) {
            if (text[textIndex] === query[queryIndex]) {
                queryIndex++;
            }
            textIndex++;
        }

        return queryIndex === query.length;
    }

    /**
     * Apply filters to results
     * @param {Array} results Search results
     * @param {object} filters Filters to apply
     * @returns {Array} Filtered results
     */
    applyFilters(results, filters) {
        return results.filter(msg => {
            // Date filters
            if (filters.dateFrom && msg.timestamp < new Date(filters.dateFrom)) {
                return false;
            }
            if (filters.dateTo && msg.timestamp > new Date(filters.dateTo)) {
                return false;
            }

            // Character filter
            if (filters.character !== 'all' && msg.character !== filters.character) {
                return false;
            }

            // Length filter
            if (filters.length !== 'any') {
                const length = msg.length;
                switch (filters.length) {
                    case 'short':
                        if (length >= 50) return false;
                        break;
                    case 'medium':
                        if (length < 50 || length > 200) return false;
                        break;
                    case 'long':
                        if (length <= 200) return false;
                        break;
                }
            }

            // Attachment filter
            if (filters.hasAttachments && !msg.hasAttachments) {
                return false;
            }

            // Link filter
            if (filters.hasLinks && !msg.hasLinks) {
                return false;
            }

            return true;
        });
    }

    /**
     * Sort results by relevance
     * @param {Array} results Search results
     * @param {string} query Search query
     * @returns {Array} Sorted results
     */
    sortByRelevance(results, query) {
        const queryLower = query.toLowerCase();

        return results.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(a.text, queryLower);
            const bScore = this.calculateRelevanceScore(b.text, queryLower);

            return bScore - aScore;
        });
    }

    /**
     * Calculate relevance score
     * @param {string} text Message text
     * @param {string} query Search query
     * @returns {number} Relevance score
     */
    calculateRelevanceScore(text, query) {
        const textLower = text.toLowerCase();
        let score = 0;

        // Exact match gets highest score
        if (textLower === query) {
            score += 100;
        }

        // Starts with query gets high score
        if (textLower.startsWith(query)) {
            score += 50;
        }

        // Contains query gets medium score
        if (textLower.includes(query)) {
            score += 25;
        }

        // Word boundary matches get bonus
        const wordRegex = new RegExp(`\\b${query}\\b`, 'i');
        if (wordRegex.test(text)) {
            score += 15;
        }

        // Shorter text gets slight bonus (more relevant)
        score += Math.max(0, 100 - text.length / 10);

        return score;
    }

    /**
     * Get trending topics
     * @returns {Array} Trending topics
     */
    getTrendingTopics() {
        if (!this.state.discoverySettings.trendingEnabled) return [];

        const wordCounts = new Map();
        const messages = Array.from(this.searchIndex.values());

        messages.forEach(msg => {
            const words = msg.text.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 3) { // Only count words longer than 3 characters
                    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
                }
            });
        });

        return Array.from(wordCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
    }

    /**
     * Get recent activity
     * @returns {Array} Recent messages
     */
    getRecentActivity() {
        if (!this.state.discoverySettings.recentEnabled) return [];

        return Array.from(this.searchIndex.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20);
    }

    /**
     * Get popular content
     * @returns {Array} Popular messages
     */
    getPopularContent() {
        if (!this.state.discoverySettings.popularEnabled) return [];

        return Array.from(this.searchIndex.values())
            .sort((a, b) => b.length - a.length)
            .slice(0, 15);
    }

    /**
     * Get content suggestions
     * @returns {Array} Content suggestions
     */
    getContentSuggestions() {
        if (!this.state.discoverySettings.suggestionsEnabled) return [];

        const suggestions = [];
        const messages = Array.from(this.searchIndex.values());

        // Find common patterns
        const patterns = this.findCommonPatterns(messages);
        suggestions.push(...patterns);

        // Find related content
        const related = this.findRelatedContent(messages);
        suggestions.push(...related);

        return suggestions.slice(0, 10);
    }

    /**
     * Find common patterns in messages
     * @param {Array} messages Messages to analyze
     * @returns {Array} Common patterns
     */
    findCommonPatterns(messages) {
        const patterns = [];
        const phrases = new Map();

        messages.forEach(msg => {
            const words = msg.text.toLowerCase().split(/\s+/);
            for (let i = 0; i < words.length - 2; i++) {
                const phrase = words.slice(i, i + 3).join(' ');
                if (phrase.length > 10) {
                    phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
                }
            }
        });

        return Array.from(phrases.entries())
            .filter(([phrase, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([phrase, count]) => ({ type: 'pattern', content: phrase, count }));
    }

    /**
     * Find related content
     * @param {Array} messages Messages to analyze
     * @returns {Array} Related content
     */
    findRelatedContent(messages) {
        const related = [];
        const topics = new Map();

        messages.forEach(msg => {
            const words = msg.text.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 4) {
                    topics.set(word, (topics.get(word) || 0) + 1);
                }
            });
        });

        return Array.from(topics.entries())
            .filter(([topic, count]) => count > 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic, count]) => ({ type: 'topic', content: topic, count }));
    }

    /**
     * Save search query
     * @param {string} name Query name
     * @param {object} query Query object
     */
    saveSearchQuery(name, query) {
        const savedQuery = {
            id: `search_${Date.now()}`,
            name: name,
            query: query,
            timestamp: new Date(),
        };

        this.state.savedSearches.push(savedQuery);
        this.saveSettings();
        this.emit('searchSaved', savedQuery);
    }

    /**
     * Load saved search query
     * @param {string} id Query ID
     * @returns {object|null} Saved query
     */
    loadSavedSearch(id) {
        const savedQuery = this.state.savedSearches.find(q => q.id === id);
        if (savedQuery) {
            this.emit('searchLoaded', savedQuery);
        }
        return savedQuery;
    }

    /**
     * Delete saved search query
     * @param {string} id Query ID
     */
    deleteSavedSearch(id) {
        this.state.savedSearches = this.state.savedSearches.filter(q => q.id !== id);
        this.saveSettings();
        this.emit('searchDeleted', id);
    }

    /**
     * Export search results
     * @param {Array} results Search results
     * @returns {string} Exported data
     */
    exportSearchResults(results) {
        const exportData = {
            query: this.state.searchQuery,
            filters: this.state.filters,
            results: results.map(msg => ({
                text: msg.text,
                timestamp: msg.timestamp,
                type: msg.type,
                character: msg.character,
            })),
            exportTime: new Date().toISOString(),
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Update settings
     * @param {object} newSettings New settings
     */
    updateSettings(newSettings) {
        this.state = { ...this.state, ...newSettings };
        this.saveSettings();
        this.emit('settingsUpdated', this.state);
    }

    /**
     * Get current settings
     * @returns {object} Current settings
     */
    getSettings() {
        return { ...this.state };
    }

    /**
     * Load settings from localStorage
     */
    async loadSettings() {
        try {
            const saved = localStorage.getItem('search-discovery-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load search discovery settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('search-discovery-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save search discovery settings:', error);
        }
    }

    /**
     * Event emitter methods
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Create global instance
const searchDiscoveryController = new SearchDiscoveryController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            searchDiscoveryController.initialize().catch(console.error);
        });
    } else {
        searchDiscoveryController.initialize().catch(console.error);
    }

    // Expose globally
    window.searchDiscoveryController = searchDiscoveryController;
}

export { searchDiscoveryController, SearchDiscoveryController };

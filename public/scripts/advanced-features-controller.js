/**
 * Advanced Features Controller
 * Consolidated controller for multiple advanced features
 */

class AdvancedFeaturesController {
    constructor() {
        this.state = {
            // Context Compression
            compression: {
                enabled: false,
                level: 'medium',
                autoCompress: false,
                threshold: 100,
            },
            // Mood Tracking
            mood: {
                enabled: false,
                currentMood: 'neutral',
                history: [],
            },
            // Bookmarks
            bookmarks: [],
            // Message Templates
            templates: [],
            // Statistics
            stats: null,
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Advanced Features Controller...');

            await this.loadSettings();
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('Advanced Features Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Advanced Features Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (typeof window !== 'undefined') {
            // Listen for message events
            document.addEventListener('messageReceived', (event) => {
                if (this.state.mood.enabled) {
                    this.trackMood(event.detail);
                }
            });

            // Listen for chat loaded
            document.addEventListener('chatLoaded', async (event) => {
                if (event.detail && event.detail.id) {
                    await this.loadBookmarksForChat(event.detail.id);
                }
            });
        }
    }

    // ========================================================================
    // CONTEXT COMPRESSION
    // ========================================================================

    /**
     * Compress conversation context
     */
    async compressContext(messages, options = {}) {
        try {
            const response = await fetch('/api/context/compress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    compression_level: options.level || this.state.compression.level,
                    preserve_recent: options.preserveRecent || 10,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.emit('contextCompressed', data);
                return data;
            }
        } catch (error) {
            console.error('Error compressing context:', error);
        }

        return null;
    }

    /**
     * Get compression statistics
     */
    async getCompressionStats(chatId) {
        try {
            const response = await fetch('/api/context/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId }),
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting compression stats:', error);
        }

        return null;
    }

    // ========================================================================
    // MOOD TRACKING
    // ========================================================================

    /**
     * Track mood for a message
     */
    async trackMood(messageData) {
        if (!messageData || !messageData.chat_id) return;

        // Simple sentiment analysis (would use AI in production)
        const mood = this.analyzeMood(messageData.text || messageData.mes);
        
        try {
            const response = await fetch('/api/advanced/mood/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: messageData.chat_id,
                    message_id: messageData.message_id,
                    mood: mood.type,
                    intensity: mood.intensity,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.mood.currentMood = mood.type;
                this.state.mood.history.push(mood);
                this.emit('moodTracked', mood);
                return data;
            }
        } catch (error) {
            console.error('Error tracking mood:', error);
        }

        return null;
    }

    /**
     * Get mood data for chat
     */
    async getMoodData(chatId) {
        try {
            const response = await fetch('/api/advanced/mood/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId }),
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting mood data:', error);
        }

        return null;
    }

    /**
     * Analyze mood from text
     */
    analyzeMood(text) {
        if (!text) return { type: 'neutral', intensity: 50 };

        const lowerText = text.toLowerCase();
        
        // Simple keyword-based analysis
        const moodKeywords = {
            happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'love', '😊', '😄', '🎉'],
            sad: ['sad', 'unhappy', 'depressed', 'down', 'miserable', '😢', '😞'],
            angry: ['angry', 'mad', 'furious', 'rage', 'hate', '😠', '😡'],
            excited: ['excited', 'thrilled', 'amazing', 'awesome', 'fantastic'],
            calm: ['calm', 'peaceful', 'serene', 'relaxed', 'tranquil'],
        };

        let maxScore = 0;
        let detectedMood = 'neutral';

        for (const [mood, keywords] of Object.entries(moodKeywords)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    score += 10;
                }
            });

            if (score > maxScore) {
                maxScore = score;
                detectedMood = mood;
            }
        }

        return {
            type: detectedMood,
            intensity: Math.min(100, maxScore * 5),
        };
    }

    // ========================================================================
    // BOOKMARKS & ANNOTATIONS
    // ========================================================================

    /**
     * Add bookmark to message
     */
    async addBookmark(chatId, messageId, note = '', tags = [], category = 'general') {
        try {
            const response = await fetch('/api/advanced/bookmarks/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    note,
                    tags,
                    category,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.bookmarks.push(data.bookmark);
                this.emit('bookmarkAdded', data.bookmark);
                this.updateBookmarkUI();
                return data.bookmark;
            }
        } catch (error) {
            console.error('Error adding bookmark:', error);
        }

        return null;
    }

    /**
     * Load bookmarks for chat
     */
    async loadBookmarksForChat(chatId) {
        try {
            const response = await fetch('/api/advanced/bookmarks/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.bookmarks = data.bookmarks || [];
                this.emit('bookmarksLoaded', this.state.bookmarks);
                this.updateBookmarkUI();
            }
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    }

    /**
     * Navigate to bookmarked message
     */
    navigateToBookmark(messageId) {
        const messageElement = document.querySelector(`[mesid="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-bookmark');
            setTimeout(() => {
                messageElement.classList.remove('highlight-bookmark');
            }, 2000);
        }
    }

    // ========================================================================
    // MESSAGE TEMPLATES
    // ========================================================================

    /**
     * Save message template
     */
    async saveTemplate(name, content, variables = [], category = 'general') {
        try {
            const response = await fetch('/api/advanced/message-templates/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    content,
                    variables,
                    category,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.templates.push(data.template);
                this.emit('templateSaved', data.template);
                return data.template;
            }
        } catch (error) {
            console.error('Error saving template:', error);
        }

        return null;
    }

    /**
     * Load message templates
     */
    async loadTemplates() {
        try {
            const response = await fetch('/api/advanced/message-templates/list', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                this.state.templates = data.templates || [];
                this.emit('templatesLoaded', this.state.templates);
                return this.state.templates;
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }

        return [];
    }

    /**
     * Apply template with variable substitution
     */
    applyTemplate(templateId, variables = {}) {
        const template = this.state.templates.find(t => t.id === templateId);
        if (!template) return '';

        let content = template.content;

        // Substitute variables
        for (const [key, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        // Built-in variables
        content = content.replace(/{{date}}/g, new Date().toLocaleDateString());
        content = content.replace(/{{time}}/g, new Date().toLocaleTimeString());
        content = content.replace(/{{random}}/g, Math.floor(Math.random() * 1000));

        return content;
    }

    // ========================================================================
    // CONVERSATION STATISTICS
    // ========================================================================

    /**
     * Calculate conversation statistics
     */
    async calculateStats(chatId, messages) {
        try {
            const response = await fetch('/api/advanced/stats/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    messages,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.stats = data.stats;
                this.emit('statsCalculated', data.stats);
                return data.stats;
            }
        } catch (error) {
            console.error('Error calculating stats:', error);
        }

        return null;
    }

    /**
     * Show statistics dashboard
     */
    showStatsDashboard() {
        if (!this.state.stats) {
            console.log('No statistics available');
            return;
        }

        const stats = this.state.stats;
        const dashboard = `
            <div class="stats-dashboard">
                <h3>Conversation Statistics</h3>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.total_messages}</div>
                        <div class="stat-label">Total Messages</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-value">${stats.word_count.toLocaleString()}</div>
                        <div class="stat-label">Total Words</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(stats.average_message_length)}</div>
                        <div class="stat-label">Avg Words/Message</div>
                    </div>
                    
                    ${stats.average_response_time_seconds ? `
                    <div class="stat-card">
                        <div class="stat-value">${stats.average_response_time_seconds}s</div>
                        <div class="stat-label">Avg Response Time</div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="stats-section">
                    <h4>Top Words</h4>
                    <div class="word-cloud">
                        ${stats.top_words ? stats.top_words.map(w => 
                            `<span class="word-tag" style="font-size: ${10 + w.count}px">${w.word} (${w.count})</span>`
                        ).join('') : ''}
                    </div>
                </div>
                
                <div class="stats-section">
                    <h4>By Character</h4>
                    ${Object.entries(stats.by_character || {}).map(([name, charStats]) => `
                        <div class="character-stats">
                            <strong>${name}</strong>: ${charStats.message_count} messages, ${charStats.word_count} words
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Show dashboard (integrate with existing popup system)
        if (typeof window.callGenericPopup === 'function') {
            window.callGenericPopup(dashboard, 'POPUP_TYPE.TEXT');
        } else {
            console.log('Statistics:', stats);
        }
    }

    // ========================================================================
    // AI DIRECTOR
    // ========================================================================

    /**
     * Get AI Director suggestions
     */
    async getDirectorSuggestions(chatId, context, type = 'plot_twist') {
        try {
            const response = await fetch('/api/advanced/director/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    context,
                    suggestion_type: type,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.emit('suggestionsReceived', data.suggestions);
                return data.suggestions;
            }
        } catch (error) {
            console.error('Error getting director suggestions:', error);
        }

        return [];
    }

    // ========================================================================
    // UI UPDATES
    // ========================================================================

    /**
     * Update bookmark UI
     */
    updateBookmarkUI() {
        if (typeof window === 'undefined') return;

        const bookmarkList = document.getElementById('bookmark-list');
        if (bookmarkList) {
            bookmarkList.innerHTML = this.state.bookmarks.map(bookmark => `
                <div class="bookmark-item" data-message-id="${bookmark.message_id}">
                    <div class="bookmark-note">${bookmark.note || 'No note'}</div>
                    <div class="bookmark-tags">${bookmark.tags.join(', ')}</div>
                    <button class="bookmark-navigate" data-message-id="${bookmark.message_id}">Go to</button>
                </div>
            `).join('');

            bookmarkList.querySelectorAll('.bookmark-navigate').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const messageId = e.target.getAttribute('data-message-id');
                    this.navigateToBookmark(parseInt(messageId));
                });
            });
        }
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.state = { ...this.state, ...newSettings };
        this.saveSettings();
        this.emit('settingsUpdated', this.state);
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.state };
    }

    /**
     * Load settings from localStorage
     */
    async loadSettings() {
        try {
            const saved = localStorage.getItem('advanced-features-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load advanced features settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('advanced-features-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save advanced features settings:', error);
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
const advancedFeaturesController = new AdvancedFeaturesController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            advancedFeaturesController.initialize().catch(console.error);
        });
    } else {
        advancedFeaturesController.initialize().catch(console.error);
    }

    // Expose globally
    window.advancedFeaturesController = advancedFeaturesController;
}

export { advancedFeaturesController, AdvancedFeaturesController };

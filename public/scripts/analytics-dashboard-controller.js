/**
 * Analytics Dashboard Controller
 * Handles analytics and statistics tracking
 */

class AnalyticsDashboardController {
    constructor() {
        this.state = {
            enabled: false,
            conversation: {
                totalMessages: 0,
                aiResponses: 0,
                userMessages: 0,
                charactersUsed: 0,
            },
            usage: {
                sessionTime: 0,
                avgResponseTime: 0,
                tokensUsed: 0,
                costEstimate: 0,
            },
            performance: {
                memoryUsage: 0,
                cpuUsage: 0,
                networkLatency: 0,
                errorRate: 0,
            },
            behavior: {
                mostUsedFeatures: 'chat',
                peakHours: '9:00 AM - 5:00 PM',
                avgSessionLength: 30,
                retention: 85,
            },
            visualization: {
                chartType: 'line',
                timeRange: '24h',
                data: [],
            },
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
        this.startTime = Date.now();
        this.messageHistory = [];
        this.performanceMetrics = [];
    }

    /**
     * Initialize the analytics dashboard controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Analytics Dashboard Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Start performance monitoring
            this.startPerformanceMonitoring();

            this.isInitialized = true;
            console.log('Analytics Dashboard Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Analytics Dashboard Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for message events
        if (typeof window !== 'undefined') {
            document.addEventListener('messageSent', (event) => {
                this.handleMessageSent(event.detail);
            });

            document.addEventListener('messageReceived', (event) => {
                this.handleMessageReceived(event.detail);
            });

            document.addEventListener('generationStarted', (event) => {
                this.handleGenerationStarted(event.detail);
            });

            document.addEventListener('generationCompleted', (event) => {
                this.handleGenerationCompleted(event.detail);
            });
        }
    }

    /**
     * Handle message sent
     * @param {object} data Message data
     */
    handleMessageSent(data) {
        if (!this.state.enabled) return;

        this.state.conversation.userMessages++;
        this.state.conversation.charactersUsed += data.text?.length || 0;

        this.messageHistory.push({
            type: 'user',
            timestamp: Date.now(),
            text: data.text,
            length: data.text?.length || 0,
        });

        this.updateUI();
        this.emit('messageSent', data);
    }

    /**
     * Handle message received
     * @param {object} data Message data
     */
    handleMessageReceived(data) {
        if (!this.state.enabled) return;

        this.state.conversation.aiResponses++;
        this.state.conversation.charactersUsed += data.text?.length || 0;

        this.messageHistory.push({
            type: 'ai',
            timestamp: Date.now(),
            text: data.text,
            length: data.text?.length || 0,
        });

        this.updateUI();
        this.emit('messageReceived', data);
    }

    /**
     * Handle generation started
     * @param {object} data Generation data
     */
    handleGenerationStarted(data) {
        if (!this.state.enabled) return;

        this.generationStartTime = Date.now();
        this.emit('generationStarted', data);
    }

    /**
     * Handle generation completed
     * @param {object} data Generation data
     */
    handleGenerationCompleted(data) {
        if (!this.state.enabled) return;

        if (this.generationStartTime) {
            const responseTime = Date.now() - this.generationStartTime;
            this.updateAverageResponseTime(responseTime);
            this.generationStartTime = null;
        }

        this.emit('generationCompleted', data);
    }

    /**
     * Update average response time
     * @param {number} responseTime Response time in milliseconds
     */
    updateAverageResponseTime(responseTime) {
        const currentAvg = this.state.usage.avgResponseTime;
        const totalResponses = this.state.conversation.aiResponses;

        if (totalResponses === 1) {
            this.state.usage.avgResponseTime = responseTime;
        } else {
            this.state.usage.avgResponseTime = (currentAvg * (totalResponses - 1) + responseTime) / totalResponses;
        }
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        if (typeof window !== 'undefined' && 'performance' in window) {
            setInterval(() => {
                this.updatePerformanceMetrics();
            }, 5000); // Update every 5 seconds
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        if (typeof window !== 'undefined' && 'performance' in window) {
            const memory = performance.memory;
            if (memory) {
                this.state.performance.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            }

            // Simulate CPU usage (in real implementation, this would be more sophisticated)
            this.state.performance.cpuUsage = Math.round(Math.random() * 100);

            // Simulate network latency
            this.state.performance.networkLatency = Math.round(Math.random() * 100);
        }
    }

    /**
     * Update session time
     */
    updateSessionTime() {
        const currentTime = Date.now();
        const sessionTime = Math.round((currentTime - this.startTime) / 1000 / 60); // minutes
        this.state.usage.sessionTime = sessionTime;
    }

    /**
     * Update UI
     */
    updateUI() {
        this.updateSessionTime();

        if (typeof window !== 'undefined') {
            // Update conversation stats
            const totalMessages = document.getElementById('stats_total_messages');
            const aiResponses = document.getElementById('stats_ai_responses');
            const userMessages = document.getElementById('stats_user_messages');
            const characters = document.getElementById('stats_characters');

            if (totalMessages) totalMessages.value = this.state.conversation.totalMessages;
            if (aiResponses) aiResponses.value = this.state.conversation.aiResponses;
            if (userMessages) userMessages.value = this.state.conversation.userMessages;
            if (characters) characters.value = this.state.conversation.charactersUsed;

            // Update usage stats
            const sessionTime = document.getElementById('usage_session_time');
            const avgResponse = document.getElementById('usage_avg_response');
            const tokens = document.getElementById('usage_tokens_used');
            const cost = document.getElementById('usage_cost_estimate');

            if (sessionTime) sessionTime.value = `${Math.floor(this.state.usage.sessionTime / 60)}h ${this.state.usage.sessionTime % 60}m`;
            if (avgResponse) avgResponse.value = `${Math.round(this.state.usage.avgResponseTime / 1000)}s`;
            if (tokens) tokens.value = this.state.usage.tokensUsed;
            if (cost) cost.value = `$${this.state.usage.costEstimate.toFixed(2)}`;

            // Update performance stats
            const memory = document.getElementById('perf_memory_usage');
            const cpu = document.getElementById('perf_cpu_usage');
            const latency = document.getElementById('perf_network_latency');
            const errorRate = document.getElementById('perf_error_rate');

            if (memory) memory.value = `${this.state.performance.memoryUsage} MB`;
            if (cpu) cpu.value = `${this.state.performance.cpuUsage}%`;
            if (latency) latency.value = `${this.state.performance.networkLatency}ms`;
            if (errorRate) errorRate.value = `${this.state.performance.errorRate}%`;
        }
    }

    /**
     * Generate chart data
     * @param {string} chartType Chart type
     * @param {string} timeRange Time range
     * @returns {object} Chart data
     */
    generateChartData(chartType, timeRange) {
        const now = Date.now();
        const timeRanges = {
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            'all': Infinity,
        };

        const range = timeRanges[timeRange] || timeRanges['24h'];
        const filteredMessages = this.messageHistory.filter(msg =>
            now - msg.timestamp <= range
        );

        return {
            type: chartType,
            data: filteredMessages,
            timeRange: timeRange,
            totalMessages: filteredMessages.length,
            aiMessages: filteredMessages.filter(msg => msg.type === 'ai').length,
            userMessages: filteredMessages.filter(msg => msg.type === 'user').length,
        };
    }

    /**
     * Export analytics data
     * @returns {string} JSON data
     */
    exportAnalyticsData() {
        const data = {
            ...this.state,
            messageHistory: this.messageHistory,
            performanceMetrics: this.performanceMetrics,
            exportTime: new Date().toISOString(),
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Reset analytics data
     */
    resetAnalyticsData() {
        this.state = {
            enabled: false,
            conversation: {
                totalMessages: 0,
                aiResponses: 0,
                userMessages: 0,
                charactersUsed: 0,
            },
            usage: {
                sessionTime: 0,
                avgResponseTime: 0,
                tokensUsed: 0,
                costEstimate: 0,
            },
            performance: {
                memoryUsage: 0,
                cpuUsage: 0,
                networkLatency: 0,
                errorRate: 0,
            },
            behavior: {
                mostUsedFeatures: 'chat',
                peakHours: '9:00 AM - 5:00 PM',
                avgSessionLength: 30,
                retention: 85,
            },
            visualization: {
                chartType: 'line',
                timeRange: '24h',
                data: [],
            },
        };

        this.messageHistory = [];
        this.performanceMetrics = [];
        this.startTime = Date.now();

        this.updateUI();
        this.saveSettings();
        this.emit('analyticsReset');
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
            const saved = localStorage.getItem('analytics-dashboard-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load analytics dashboard settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('analytics-dashboard-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save analytics dashboard settings:', error);
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
const analyticsDashboardController = new AnalyticsDashboardController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            analyticsDashboardController.initialize().catch(console.error);
        });
    } else {
        analyticsDashboardController.initialize().catch(console.error);
    }

    // Expose globally
    window.analyticsDashboardController = analyticsDashboardController;
}

export { analyticsDashboardController, AnalyticsDashboardController };

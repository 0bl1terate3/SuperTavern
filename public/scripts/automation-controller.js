/**
 * Automation Controller
 * Handles all automation features including auto-responses, scheduled messages, and workflows
 */

class AutomationController {
    constructor() {
        this.state = {
            autoResponses: {
                enabled: false,
                triggers: [],
            },
            scheduled: {
                enabled: false,
                schedules: [],
            },
            workflows: {
                enabled: false,
                workflows: [],
            },
            smartFeatures: {
                smartReplies: false,
                moodDetection: false,
                contextAware: false,
            },
            analytics: {
                responsesSent: 0,
                scheduledMessages: 0,
                workflowsExecuted: 0,
            },
        };

        this.eventListeners = new Map();
        this.scheduledTimers = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the automation controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Automation Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Start scheduled message timers
            this.startScheduledTimers();

            this.isInitialized = true;
            console.log('Automation Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Automation Controller:', error);
        }
    }

    /**
     * Set up event listeners for automation features
     */
    setupEventListeners() {
        // Listen for new messages to check for auto-responses
        if (typeof window !== 'undefined') {
            // Listen for message events
            document.addEventListener('messageReceived', (event) => {
                this.handleMessageReceived(event.detail);
            });

            // Listen for chat events
            document.addEventListener('chatUpdated', (event) => {
                this.handleChatUpdated(event.detail);
            });
        }
    }

    /**
     * Handle new message received
     * @param {object} messageData Message data
     */
    handleMessageReceived(messageData) {
        if (!this.state.autoResponses.enabled) {
            return;
        }

        // Check for auto-response triggers
        this.checkAutoResponseTriggers(messageData);

        // Check for smart features
        if (this.state.smartFeatures.smartReplies) {
            this.handleSmartReplies(messageData);
        }

        if (this.state.smartFeatures.moodDetection) {
            this.handleMoodDetection(messageData);
        }
    }

    /**
     * Handle chat updates
     * @param {object} chatData Chat data
     */
    handleChatUpdated(chatData) {
        if (this.state.smartFeatures.contextAware) {
            this.updateContextAwareness(chatData);
        }
    }

    /**
     * Check for auto-response triggers
     * @param {object} messageData Message data
     */
    checkAutoResponseTriggers(messageData) {
        const messageText = messageData.text?.toLowerCase() || '';

        for (const trigger of this.state.autoResponses.triggers) {
            if (trigger.enabled && this.matchesTrigger(messageText, trigger)) {
                this.executeAutoResponse(trigger, messageData);
            }
        }
    }

    /**
     * Check if message matches trigger
     * @param {string} messageText Message text
     * @param {object} trigger Trigger configuration
     * @returns {boolean} Whether trigger matches
     */
    matchesTrigger(messageText, trigger) {
        switch (trigger.type) {
            case 'contains':
                return messageText.includes(trigger.pattern.toLowerCase());
            case 'startsWith':
                return messageText.startsWith(trigger.pattern.toLowerCase());
            case 'endsWith':
                return messageText.endsWith(trigger.pattern.toLowerCase());
            case 'regex':
                try {
                    const regex = new RegExp(trigger.pattern, 'i');
                    return regex.test(messageText);
                } catch (error) {
                    console.error('Invalid regex pattern:', trigger.pattern);
                    return false;
                }
            default:
                return false;
        }
    }

    /**
     * Execute auto-response
     * @param {object} trigger Trigger configuration
     * @param {object} messageData Original message data
     */
    executeAutoResponse(trigger, messageData) {
        try {
            console.log(`Executing auto-response: ${trigger.name}`);

            // Send the auto-response
            this.sendMessage(trigger.response, messageData.characterId);

            // Update analytics
            this.state.analytics.responsesSent++;
            this.updateAnalytics();

            // Emit event
            this.emit('autoResponseExecuted', {
                trigger: trigger,
                messageData: messageData,
            });
        } catch (error) {
            console.error('Failed to execute auto-response:', error);
        }
    }

    /**
     * Handle smart replies
     * @param {object} messageData Message data
     */
    handleSmartReplies(messageData) {
        // This would integrate with AI to generate smart replies
        console.log('Smart replies feature triggered');
    }

    /**
     * Handle mood detection
     * @param {object} messageData Message data
     */
    handleMoodDetection(messageData) {
        // This would analyze the mood of the message
        console.log('Mood detection feature triggered');
    }

    /**
     * Update context awareness
     * @param {object} chatData Chat data
     */
    updateContextAwareness(chatData) {
        // This would update the context for better automation
        console.log('Context awareness updated');
    }

    /**
     * Send a message
     * @param {string} message Message text
     * @param {string} characterId Character ID
     */
    sendMessage(message, characterId) {
        // This would integrate with the main chat system
        console.log(`Sending message: ${message} to character: ${characterId}`);

        // For now, just emit an event
        this.emit('messageToSend', {
            message: message,
            characterId: characterId,
        });
    }

    /**
     * Add auto-response trigger
     * @param {object} trigger Trigger configuration
     */
    addTrigger(trigger) {
        const newTrigger = {
            id: Date.now().toString(),
            name: trigger.name,
            pattern: trigger.pattern,
            type: trigger.type,
            response: trigger.response,
            enabled: true,
            createdAt: new Date().toISOString(),
        };

        this.state.autoResponses.triggers.push(newTrigger);
        this.saveSettings();

        this.emit('triggerAdded', newTrigger);
        return newTrigger;
    }

    /**
     * Remove auto-response trigger
     * @param {string} triggerId Trigger ID
     */
    removeTrigger(triggerId) {
        const index = this.state.autoResponses.triggers.findIndex(t => t.id === triggerId);
        if (index !== -1) {
            const removed = this.state.autoResponses.triggers.splice(index, 1)[0];
            this.saveSettings();
            this.emit('triggerRemoved', removed);
            return removed;
        }
        return null;
    }

    /**
     * Add scheduled message
     * @param {object} schedule Schedule configuration
     */
    addSchedule(schedule) {
        const newSchedule = {
            id: Date.now().toString(),
            name: schedule.name,
            message: schedule.message,
            time: schedule.time,
            interval: schedule.interval,
            enabled: true,
            createdAt: new Date().toISOString(),
        };

        this.state.scheduled.schedules.push(newSchedule);
        this.saveSettings();
        this.startScheduleTimer(newSchedule);

        this.emit('scheduleAdded', newSchedule);
        return newSchedule;
    }

    /**
     * Start schedule timer
     * @param {object} schedule Schedule configuration
     */
    startScheduleTimer(schedule) {
        if (!schedule.enabled) return;

        const now = new Date();
        const scheduleTime = new Date(schedule.time);

        if (schedule.interval) {
            // Recurring schedule
            const timer = setInterval(() => {
                this.executeScheduledMessage(schedule);
            }, this.parseInterval(schedule.interval));

            this.scheduledTimers.set(schedule.id, timer);
        } else if (scheduleTime > now) {
            // One-time schedule
            const delay = scheduleTime.getTime() - now.getTime();
            const timer = setTimeout(() => {
                this.executeScheduledMessage(schedule);
                this.scheduledTimers.delete(schedule.id);
            }, delay);

            this.scheduledTimers.set(schedule.id, timer);
        }
    }

    /**
     * Parse interval string to milliseconds
     * @param {string} interval Interval string (e.g., "5m", "1h", "1d")
     * @returns {number} Milliseconds
     */
    parseInterval(interval) {
        const match = interval.match(/^(\d+)([smhd])$/);
        if (!match) return 0;

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 0;
        }
    }

    /**
     * Execute scheduled message
     * @param {object} schedule Schedule configuration
     */
    executeScheduledMessage(schedule) {
        try {
            console.log(`Executing scheduled message: ${schedule.name}`);

            // Send the scheduled message
            this.sendMessage(schedule.message, 'default');

            // Update analytics
            this.state.analytics.scheduledMessages++;
            this.updateAnalytics();

            // Emit event
            this.emit('scheduledMessageExecuted', schedule);
        } catch (error) {
            console.error('Failed to execute scheduled message:', error);
        }
    }

    /**
     * Start all scheduled timers
     */
    startScheduledTimers() {
        for (const schedule of this.state.scheduled.schedules) {
            this.startScheduleTimer(schedule);
        }
    }

    /**
     * Update analytics display
     */
    updateAnalytics() {
        if (typeof window !== 'undefined') {
            const responsesEl = document.getElementById('automation-stat-responses');
            const scheduledEl = document.getElementById('automation-stat-scheduled');
            const workflowsEl = document.getElementById('automation-stat-workflows');

            if (responsesEl) responsesEl.textContent = this.state.analytics.responsesSent;
            if (scheduledEl) scheduledEl.textContent = this.state.analytics.scheduledMessages;
            if (workflowsEl) workflowsEl.textContent = this.state.analytics.workflowsExecuted;
        }
    }

    /**
     * Load settings from localStorage
     */
    async loadSettings() {
        try {
            const saved = localStorage.getItem('automation-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load automation settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('automation-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save automation settings:', error);
        }
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
     * Test all automations
     */
    testAll() {
        console.log('Testing all automations...');

        // Test auto-responses
        for (const trigger of this.state.autoResponses.triggers) {
            if (trigger.enabled) {
                console.log(`Testing trigger: ${trigger.name}`);
            }
        }

        // Test scheduled messages
        for (const schedule of this.state.scheduled.schedules) {
            if (schedule.enabled) {
                console.log(`Testing schedule: ${schedule.name}`);
            }
        }

        this.emit('testCompleted');
    }

    /**
     * Export configuration
     * @returns {string} JSON configuration
     */
    exportConfig() {
        return JSON.stringify(this.state, null, 2);
    }

    /**
     * Import configuration
     * @param {string} configJson JSON configuration
     */
    importConfig(configJson) {
        try {
            const config = JSON.parse(configJson);
            this.state = { ...this.state, ...config };
            this.saveSettings();
            this.emit('configImported', config);
        } catch (error) {
            console.error('Failed to import configuration:', error);
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
const automationController = new AutomationController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            automationController.initialize().catch(console.error);
        });
    } else {
        automationController.initialize().catch(console.error);
    }

    // Expose globally
    window.automationController = automationController;
}

export { automationController, AutomationController };

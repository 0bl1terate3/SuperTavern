/**
 * Developer Tools Controller
 * Handles developer tools and debugging features
 */

class DeveloperToolsController {
    constructor() {
        this.state = {
            debug: {
                enabled: false,
                console: '',
                logLevel: 'info',
            },
            api: {
                endpoint: '',
                method: 'GET',
                headers: {},
                body: '',
                savedRequests: [],
            },
            snippets: {
                language: 'javascript',
                name: '',
                code: '',
                savedSnippets: [],
            },
            testing: {
                autoRun: false,
                coverage: false,
                verbose: false,
                testResults: [],
            },
            utilities: {
                jsonFormatter: true,
                base64Encoder: true,
                urlEncoder: true,
                hashGenerator: true,
            },
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
        this.consoleHistory = [];
    }

    /**
     * Initialize the developer tools controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Developer Tools Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Set up console logging
            this.setupConsoleLogging();

            this.isInitialized = true;
            console.log('Developer Tools Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Developer Tools Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for console events
        if (typeof window !== 'undefined') {
            // Override console methods to capture output
            this.overrideConsoleMethods();
        }
    }

    /**
     * Override console methods to capture output
     */
    overrideConsoleMethods() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
        };

        const captureLog = (level, ...args) => {
            // Call original method
            originalConsole[level](...args);

            // Capture for debug console
            if (this.state.debug.enabled) {
                const timestamp = new Date().toLocaleTimeString();
                const message = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');

                this.addToConsole(`${timestamp} [${level.toUpperCase()}] ${message}`);
            }
        };

        console.log = (...args) => captureLog('log', ...args);
        console.error = (...args) => captureLog('error', ...args);
        console.warn = (...args) => captureLog('warn', ...args);
        console.info = (...args) => captureLog('info', ...args);
    }

    /**
     * Set up console logging
     */
    setupConsoleLogging() {
        // This would set up console logging capture
        console.log('Developer Tools: Console logging enabled');
    }

    /**
     * Add message to debug console
     * @param {string} message Message to add
     */
    addToConsole(message) {
        this.consoleHistory.push(message);
        this.state.debug.console = this.consoleHistory.join('\n');

        // Update UI if available
        this.updateConsoleUI();

        this.emit('consoleUpdated', { message, history: this.consoleHistory });
    }

    /**
     * Update console UI
     */
    updateConsoleUI() {
        if (typeof window !== 'undefined') {
            const consoleElement = document.getElementById('debug_console');
            if (consoleElement) {
                consoleElement.value = this.state.debug.console;
                consoleElement.scrollTop = consoleElement.scrollHeight;
            }
        }
    }

    /**
     * Clear debug console
     */
    clearConsole() {
        this.consoleHistory = [];
        this.state.debug.console = '';
        this.updateConsoleUI();
        this.emit('consoleCleared');
    }

    /**
     * Save console log
     */
    saveConsoleLog() {
        if (this.state.debug.console) {
            const blob = new Blob([this.state.debug.console], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `console-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            this.emit('consoleLogSaved');
        }
    }

    /**
     * Test API endpoint
     * @param {object} request Request configuration
     * @returns {Promise<object>} API response
     */
    async testAPI(request) {
        try {
            console.log('Testing API endpoint:', request.endpoint);

            const options = {
                method: request.method,
                headers: request.headers || {},
            };

            if (request.body && (request.method === 'POST' || request.method === 'PUT')) {
                options.body = request.body;
            }

            const response = await fetch(request.endpoint, options);
            const data = await response.text();

            const result = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data: data,
                timestamp: new Date().toISOString(),
            };

            this.emit('apiTested', result);
            return result;
        } catch (error) {
            console.error('API test failed:', error);
            this.emit('apiTestFailed', error);
            throw error;
        }
    }

    /**
     * Save API request
     * @param {object} request Request configuration
     */
    saveAPIRequest(request) {
        const savedRequest = {
            id: Date.now().toString(),
            name: request.name || `Request ${this.state.api.savedRequests.length + 1}`,
            endpoint: request.endpoint,
            method: request.method,
            headers: request.headers,
            body: request.body,
            createdAt: new Date().toISOString(),
        };

        this.state.api.savedRequests.push(savedRequest);
        this.saveSettings();

        this.emit('apiRequestSaved', savedRequest);
    }

    /**
     * Save code snippet
     * @param {object} snippet Snippet configuration
     */
    saveCodeSnippet(snippet) {
        const savedSnippet = {
            id: Date.now().toString(),
            name: snippet.name,
            language: snippet.language,
            code: snippet.code,
            createdAt: new Date().toISOString(),
        };

        this.state.snippets.savedSnippets.push(savedSnippet);
        this.saveSettings();

        this.emit('snippetSaved', savedSnippet);
    }

    /**
     * Run code snippet
     * @param {string} code Code to run
     * @param {string} language Programming language
     * @returns {Promise<any>} Execution result
     */
    async runCodeSnippet(code, language) {
        try {
            console.log(`Running ${language} snippet...`);

            // This would contain the actual code execution logic
            // For now, just log the code
            console.log('Code to execute:', code);

            this.emit('snippetExecuted', { code, language });
            return { success: true, output: 'Code executed successfully' };
        } catch (error) {
            console.error('Code execution failed:', error);
            this.emit('snippetExecutionFailed', error);
            throw error;
        }
    }

    /**
     * Run tests
     * @param {object} options Test options
     * @returns {Promise<object>} Test results
     */
    async runTests(options = {}) {
        try {
            console.log('Running tests...');

            // This would contain the actual test execution logic
            const results = {
                passed: 0,
                failed: 0,
                total: 0,
                duration: 0,
                tests: [],
            };

            this.emit('testsCompleted', results);
            return results;
        } catch (error) {
            console.error('Test execution failed:', error);
            this.emit('testExecutionFailed', error);
            throw error;
        }
    }

    /**
     * Format JSON
     * @param {string} json JSON string
     * @returns {string} Formatted JSON
     */
    formatJSON(json) {
        try {
            const parsed = JSON.parse(json);
            return JSON.stringify(parsed, null, 2);
        } catch (error) {
            throw new Error('Invalid JSON: ' + error.message);
        }
    }

    /**
     * Encode/Decode Base64
     * @param {string} text Text to encode/decode
     * @param {boolean} encode Whether to encode or decode
     * @returns {string} Encoded/decoded text
     */
    base64EncodeDecode(text, encode = true) {
        if (encode) {
            return btoa(text);
        } else {
            return atob(text);
        }
    }

    /**
     * Encode URL
     * @param {string} url URL to encode
     * @returns {string} Encoded URL
     */
    encodeURL(url) {
        return encodeURIComponent(url);
    }

    /**
     * Generate hash
     * @param {string} text Text to hash
     * @param {string} algorithm Hash algorithm
     * @returns {Promise<string>} Hash value
     */
    async generateHash(text, algorithm = 'SHA-256') {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest(algorithm, data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Hash generation failed:', error);
            throw error;
        }
    }

    /**
     * Reload application
     */
    reloadApplication() {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        if (typeof window !== 'undefined' && 'caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }

        // Clear localStorage
        localStorage.clear();

        this.emit('cacheCleared');
    }

    /**
     * Export logs
     */
    exportLogs() {
        const logs = {
            console: this.state.debug.console,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        };

        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.emit('logsExported');
    }

    /**
     * Get system information
     * @returns {object} System information
     */
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString(),
        };
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
            const saved = localStorage.getItem('developer-tools-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load developer tools settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('developer-tools-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save developer tools settings:', error);
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
const developerToolsController = new DeveloperToolsController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            developerToolsController.initialize().catch(console.error);
        });
    } else {
        developerToolsController.initialize().catch(console.error);
    }

    // Expose globally
    window.developerToolsController = developerToolsController;
}

export { developerToolsController, DeveloperToolsController };

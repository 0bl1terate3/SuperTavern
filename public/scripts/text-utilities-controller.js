/**
 * Text Utilities Controller
 * Handles text processing and utility functions
 */

class TextUtilitiesController {
    constructor() {
        this.state = {
            enabled: false,
            text: '',
            formatters: {
                uppercase: false,
                lowercase: false,
                titleCase: false,
                sentenceCase: false,
            },
            analyzers: {
                wordCount: 0,
                charCount: 0,
                lineCount: 0,
                paragraphCount: 0,
                readability: 0,
            },
            generators: {
                type: 'lorem',
                length: 100,
            },
            tools: {
                removeSpaces: false,
                removeLines: false,
                reverse: false,
                sortLines: false,
            },
            converters: {
                markdown: false,
                html: false,
                json: false,
                csv: false,
            },
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
        this.savedTexts = [];
    }

    /**
     * Initialize the text utilities controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Text Utilities Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('Text Utilities Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Text Utilities Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // This would set up any global event listeners if needed
        console.log('Text Utilities: Event listeners set up');
    }

    /**
     * Format text to uppercase
     * @param {string} text Text to format
     * @returns {string} Formatted text
     */
    toUppercase(text) {
        return text.toUpperCase();
    }

    /**
     * Format text to lowercase
     * @param {string} text Text to format
     * @returns {string} Formatted text
     */
    toLowercase(text) {
        return text.toLowerCase();
    }

    /**
     * Format text to title case
     * @param {string} text Text to format
     * @returns {string} Formatted text
     */
    toTitleCase(text) {
        return text.replace(/\w\S*/g, (txt) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    /**
     * Format text to sentence case
     * @param {string} text Text to format
     * @returns {string} Formatted text
     */
    toSentenceCase(text) {
        return text.toLowerCase().replace(/(^\w|\.\s+\w)/g, (txt) =>
            txt.toUpperCase()
        );
    }

    /**
     * Analyze text and return statistics
     * @param {string} text Text to analyze
     * @returns {object} Analysis results
     */
    analyzeText(text) {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const lines = text.split('\n');
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

        // Simple readability score (Flesch Reading Ease approximation)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
        const avgSyllablesPerWord = this.estimateSyllables(words);
        const readability = Math.max(0, Math.min(100,
            206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
        ));

        return {
            wordCount: words.length,
            charCount: text.length,
            lineCount: lines.length,
            paragraphCount: paragraphs.length,
            readability: Math.round(readability),
            avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
            avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
        };
    }

    /**
     * Estimate syllables in words (simple approximation)
     * @param {Array} words Array of words
     * @returns {number} Average syllables per word
     */
    estimateSyllables(words) {
        if (words.length === 0) return 0;

        let totalSyllables = 0;
        words.forEach(word => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            if (cleanWord.length === 0) return;

            let syllables = 0;
            const vowels = 'aeiouy';
            let prevWasVowel = false;

            for (let i = 0; i < cleanWord.length; i++) {
                const isVowel = vowels.includes(cleanWord[i]);
                if (isVowel && !prevWasVowel) {
                    syllables++;
                }
                prevWasVowel = isVowel;
            }

            // Handle silent 'e'
            if (cleanWord.endsWith('e') && syllables > 1) {
                syllables--;
            }

            // Every word has at least one syllable
            syllables = Math.max(1, syllables);
            totalSyllables += syllables;
        });

        return totalSyllables / words.length;
    }

    /**
     * Generate Lorem Ipsum text
     * @param {number} length Desired length
     * @returns {string} Generated text
     */
    generateLoremIpsum(length) {
        const loremWords = [
            'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
            'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
            'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
            'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
            'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
            'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
            'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
            'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
        ];

        let result = '';
        let currentLength = 0;

        while (currentLength < length) {
            const word = loremWords[Math.floor(Math.random() * loremWords.length)];
            if (currentLength > 0) {
                result += ' ';
                currentLength++;
            }
            result += word;
            currentLength += word.length;
        }

        return result.substring(0, length);
    }

    /**
     * Generate random text
     * @param {number} length Desired length
     * @returns {string} Generated text
     */
    generateRandomText(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    /**
     * Generate placeholder text
     * @param {number} length Desired length
     * @returns {string} Generated text
     */
    generatePlaceholder(length) {
        const words = ['placeholder', 'text', 'content', 'sample', 'example'];
        let result = '';
        let currentLength = 0;

        while (currentLength < length) {
            const word = words[Math.floor(Math.random() * words.length)];
            if (currentLength > 0) {
                result += ' ';
                currentLength++;
            }
            result += word;
            currentLength += word.length;
        }

        return result.substring(0, length);
    }

    /**
     * Generate password
     * @param {number} length Desired length
     * @returns {string} Generated password
     */
    generatePassword(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    /**
     * Remove extra spaces from text
     * @param {string} text Text to process
     * @returns {string} Processed text
     */
    removeExtraSpaces(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * Remove empty lines from text
     * @param {string} text Text to process
     * @returns {string} Processed text
     */
    removeEmptyLines(text) {
        return text.split('\n').filter(line => line.trim().length > 0).join('\n');
    }

    /**
     * Reverse text
     * @param {string} text Text to reverse
     * @returns {string} Reversed text
     */
    reverseText(text) {
        return text.split('').reverse().join('');
    }

    /**
     * Sort lines in text
     * @param {string} text Text to sort
     * @returns {string} Sorted text
     */
    sortLines(text) {
        return text.split('\n').sort().join('\n');
    }

    /**
     * Duplicate text
     * @param {string} text Text to duplicate
     * @returns {string} Duplicated text
     */
    duplicateText(text) {
        return text + '\n' + text;
    }

    /**
     * Convert text to Markdown
     * @param {string} text Text to convert
     * @returns {string} Markdown text
     */
    toMarkdown(text) {
        const lines = text.split('\n');
        return lines.map(line => {
            if (line.trim().length === 0) return '';
            if (line.startsWith('#') || line.startsWith('*') || line.startsWith('-')) return line;
            return `**${line}**`;
        }).join('\n');
    }

    /**
     * Convert text to HTML
     * @param {string} text Text to convert
     * @returns {string} HTML text
     */
    toHTML(text) {
        const lines = text.split('\n');
        return lines.map(line => {
            if (line.trim().length === 0) return '<br>';
            return `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
        }).join('\n');
    }

    /**
     * Convert text to JSON
     * @param {string} text Text to convert
     * @returns {string} JSON text
     */
    toJSON(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return JSON.stringify({ text: lines }, null, 2);
    }

    /**
     * Convert text to CSV
     * @param {string} text Text to convert
     * @returns {string} CSV text
     */
    toCSV(text) {
        const lines = text.split('\n');
        return lines.map(line => `"${line.replace(/"/g, '""')}"`).join('\n');
    }

    /**
     * Save text
     * @param {string} text Text to save
     * @param {string} name Name for the saved text
     */
    saveText(text, name) {
        const savedText = {
            id: Date.now().toString(),
            name: name || `Text ${this.savedTexts.length + 1}`,
            text: text,
            createdAt: new Date().toISOString(),
        };

        this.savedTexts.push(savedText);
        this.saveSettings();

        this.emit('textSaved', savedText);
    }

    /**
     * Load saved text
     * @param {string} id Text ID
     * @returns {object} Saved text
     */
    loadText(id) {
        return this.savedTexts.find(item => item.id === id);
    }

    /**
     * Get all saved texts
     * @returns {Array} Array of saved texts
     */
    getSavedTexts() {
        return this.savedTexts;
    }

    /**
     * Delete saved text
     * @param {string} id Text ID
     */
    deleteText(id) {
        this.savedTexts = this.savedTexts.filter(item => item.id !== id);
        this.saveSettings();
        this.emit('textDeleted', id);
    }

    /**
     * Export text
     * @param {string} text Text to export
     * @param {string} filename Filename for export
     */
    exportText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `text-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        this.emit('textExported', { text, filename });
    }

    /**
     * Copy text to clipboard
     * @param {string} text Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.emit('textCopied', text);
            return true;
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
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
     * Load settings from localStorage
     */
    async loadSettings() {
        try {
            const saved = localStorage.getItem('text-utilities-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }

            const savedTexts = localStorage.getItem('text-utilities-saved-texts');
            if (savedTexts) {
                this.savedTexts = JSON.parse(savedTexts);
            }
        } catch (error) {
            console.error('Failed to load text utilities settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('text-utilities-settings', JSON.stringify(this.state));
            localStorage.setItem('text-utilities-saved-texts', JSON.stringify(this.savedTexts));
        } catch (error) {
            console.error('Failed to save text utilities settings:', error);
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
const textUtilitiesController = new TextUtilitiesController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            textUtilitiesController.initialize().catch(console.error);
        });
    } else {
        textUtilitiesController.initialize().catch(console.error);
    }

    // Expose globally
    window.textUtilitiesController = textUtilitiesController;
}

export { textUtilitiesController, TextUtilitiesController };

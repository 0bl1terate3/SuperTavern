/**
 * Visual Effects Controller
 * Handles visual effects and animations
 */

class VisualEffectsController {
    constructor() {
        this.state = {
            enabled: false,
            messageEffects: {
                entrance: 'none',
                exit: 'none',
                highlight: 'none',
                particles: 'none',
            },
            screenEffects: {
                transitions: 'none',
                background: 'none',
                typing: 'none',
                cursor: 'none',
            },
            colorEffects: {
                theme: 'default',
                textEffects: 'none',
                accentColor: '#00ff88',
                intensity: 50,
            },
            animationSettings: {
                speed: 1.0,
                duration: 1.0,
                easing: 'ease',
                delay: 0.0,
            },
            specialEffects: {
                glitch: false,
                matrix: false,
                cyberpunk: false,
                hologram: false,
                retro: false,
            },
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
        this.activeEffects = new Set();
        this.particleSystems = [];
    }

    /**
     * Initialize the visual effects controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Visual Effects Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize CSS animations
            this.initializeCSSAnimations();

            this.isInitialized = true;
            console.log('Visual Effects Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Visual Effects Controller:', error);
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

            document.addEventListener('generationStarted', (event) => {
                this.handleGenerationStarted(event.detail);
            });

            document.addEventListener('generationCompleted', (event) => {
                this.handleGenerationCompleted(event.detail);
            });
        }
    }

    /**
     * Initialize CSS animations
     */
    initializeCSSAnimations() {
        if (typeof window !== 'undefined') {
            // Inject CSS animations into the page
            this.injectAnimationCSS();
        }
    }

    /**
     * Inject CSS animations
     */
    injectAnimationCSS() {
        const style = document.createElement('style');
        style.id = 'visual-effects-styles';
        style.textContent = this.getAnimationCSS();
        document.head.appendChild(style);
    }

    /**
     * Get animation CSS
     * @returns {string} CSS animations
     */
    getAnimationCSS() {
        return `
            /* Message Effects */
            .message-fade-in {
                animation: fadeIn 0.5s ease-in-out;
            }

            .message-slide-in {
                animation: slideIn 0.5s ease-out;
            }

            .message-bounce-in {
                animation: bounceIn 0.6s ease-out;
            }

            .message-zoom-in {
                animation: zoomIn 0.4s ease-out;
            }

            .message-flip-in {
                animation: flipIn 0.5s ease-out;
            }

            /* Message Exit Effects */
            .message-fade-out {
                animation: fadeOut 0.3s ease-in;
            }

            .message-slide-out {
                animation: slideOut 0.3s ease-in;
            }

            .message-bounce-out {
                animation: bounceOut 0.4s ease-in;
            }

            .message-zoom-out {
                animation: zoomOut 0.3s ease-in;
            }

            .message-flip-out {
                animation: flipOut 0.4s ease-in;
            }

            /* Highlight Effects */
            .message-glow {
                box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
                animation: glow 2s ease-in-out infinite alternate;
            }

            .message-pulse {
                animation: pulse 1.5s ease-in-out infinite;
            }

            .message-shimmer {
                background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
                background-size: 200% 200%;
                animation: shimmer 2s ease-in-out infinite;
            }

            .message-rainbow {
                animation: rainbow 3s linear infinite;
            }

            /* Particle Effects */
            .particle-stars::before {
                content: '✨';
                position: absolute;
                animation: float 3s ease-in-out infinite;
            }

            .particle-hearts::before {
                content: '💖';
                position: absolute;
                animation: float 2s ease-in-out infinite;
            }

            .particle-sparkles::before {
                content: '✨';
                position: absolute;
                animation: sparkle 1.5s ease-in-out infinite;
            }

            .particle-confetti::before {
                content: '🎉';
                position: absolute;
                animation: confetti 2s ease-in-out infinite;
            }

            /* Screen Transitions */
            .screen-fade {
                animation: screenFade 0.5s ease-in-out;
            }

            .screen-slide {
                animation: screenSlide 0.5s ease-in-out;
            }

            .screen-zoom {
                animation: screenZoom 0.5s ease-in-out;
            }

            .screen-flip {
                animation: screenFlip 0.6s ease-in-out;
            }

            /* Typing Animations */
            .typing-typewriter {
                animation: typewriter 0.1s linear infinite;
            }

            .typing-matrix {
                animation: matrix 0.05s linear infinite;
            }

            .typing-glitch {
                animation: glitch 0.1s linear infinite;
            }

            .typing-neon {
                animation: neon 0.2s linear infinite;
            }

            /* Cursor Effects */
            .cursor-trail {
                animation: cursorTrail 0.3s ease-out;
            }

            .cursor-sparkle {
                animation: cursorSparkle 0.5s ease-out;
            }

            .cursor-glow {
                animation: cursorGlow 0.4s ease-out;
            }

            .cursor-rainbow {
                animation: cursorRainbow 0.6s ease-out;
            }

            /* Special Effects */
            .effect-glitch {
                animation: glitchEffect 0.1s linear infinite;
            }

            .effect-matrix {
                background: linear-gradient(90deg, #00ff00, #008800);
                animation: matrixRain 0.1s linear infinite;
            }

            .effect-cyberpunk {
                background: linear-gradient(45deg, #ff0080, #00ff80, #8000ff);
                animation: cyberpunk 2s linear infinite;
            }

            .effect-hologram {
                animation: hologram 1s ease-in-out infinite;
            }

            .effect-retro {
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
                animation: retroWave 3s ease-in-out infinite;
            }

            /* Keyframes */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }

            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes zoomIn {
                from { transform: scale(0); }
                to { transform: scale(1); }
            }

            @keyframes flipIn {
                from { transform: rotateY(-90deg); }
                to { transform: rotateY(0deg); }
            }

            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            @keyframes slideOut {
                from { transform: translateX(0); }
                to { transform: translateX(100%); }
            }

            @keyframes bounceOut {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(0); }
            }

            @keyframes zoomOut {
                from { transform: scale(1); }
                to { transform: scale(0); }
            }

            @keyframes flipOut {
                from { transform: rotateY(0deg); }
                to { transform: rotateY(90deg); }
            }

            @keyframes glow {
                from { box-shadow: 0 0 20px rgba(0, 255, 136, 0.5); }
                to { box-shadow: 0 0 30px rgba(0, 255, 136, 0.8); }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            @keyframes rainbow {
                0% { color: #ff0000; }
                16% { color: #ff8000; }
                33% { color: #ffff00; }
                50% { color: #00ff00; }
                66% { color: #0080ff; }
                83% { color: #8000ff; }
                100% { color: #ff0000; }
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }

            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0); }
                50% { opacity: 1; transform: scale(1); }
            }

            @keyframes confetti {
                0% { transform: translateY(0px) rotate(0deg); }
                100% { transform: translateY(-20px) rotate(360deg); }
            }

            @keyframes screenFade {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes screenSlide {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }

            @keyframes screenZoom {
                from { transform: scale(0.8); }
                to { transform: scale(1); }
            }

            @keyframes screenFlip {
                from { transform: rotateY(-180deg); }
                to { transform: rotateY(0deg); }
            }

            @keyframes typewriter {
                0%, 50% { border-right: 2px solid #00ff88; }
                51%, 100% { border-right: 2px solid transparent; }
            }

            @keyframes matrix {
                0% { color: #00ff00; }
                100% { color: #008800; }
            }

            @keyframes glitch {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-2px); }
                40% { transform: translateX(2px); }
                60% { transform: translateX(-1px); }
                80% { transform: translateX(1px); }
            }

            @keyframes neon {
                0%, 100% { text-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88; }
                50% { text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88; }
            }

            @keyframes cursorTrail {
                0% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(0.5); }
            }

            @keyframes cursorSparkle {
                0% { opacity: 1; transform: rotate(0deg); }
                100% { opacity: 0; transform: rotate(360deg); }
            }

            @keyframes cursorGlow {
                0% { box-shadow: 0 0 5px #00ff88; }
                100% { box-shadow: 0 0 20px #00ff88; }
            }

            @keyframes cursorRainbow {
                0% { color: #ff0000; }
                25% { color: #00ff00; }
                50% { color: #0000ff; }
                75% { color: #ffff00; }
                100% { color: #ff0000; }
            }

            @keyframes glitchEffect {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-2px); }
                40% { transform: translateX(2px); }
                60% { transform: translateX(-1px); }
                80% { transform: translateX(1px); }
            }

            @keyframes matrixRain {
                0% { background-position: 0 0; }
                100% { background-position: 0 100%; }
            }

            @keyframes cyberpunk {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }

            @keyframes hologram {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            @keyframes retroWave {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
    }

    /**
     * Handle message added
     * @param {object} data Message data
     */
    handleMessageAdded(data) {
        if (!this.state.enabled) return;

        this.applyMessageEffects(data.element, 'entrance');
        this.emit('messageAdded', data);
    }

    /**
     * Handle message removed
     * @param {object} data Message data
     */
    handleMessageRemoved(data) {
        if (!this.state.enabled) return;

        this.applyMessageEffects(data.element, 'exit');
        this.emit('messageRemoved', data);
    }

    /**
     * Handle generation started
     * @param {object} data Generation data
     */
    handleGenerationStarted(data) {
        if (!this.state.enabled) return;

        this.applyScreenEffects('generation');
        this.emit('generationStarted', data);
    }

    /**
     * Handle generation completed
     * @param {object} data Generation data
     */
    handleGenerationCompleted(data) {
        if (!this.state.enabled) return;

        this.applyScreenEffects('completed');
        this.emit('generationCompleted', data);
    }

    /**
     * Apply message effects
     * @param {HTMLElement} element Message element
     * @param {string} type Effect type
     */
    applyMessageEffects(element, type) {
        if (!element) return;

        const effect = this.state.messageEffects[type];
        if (effect === 'none') return;

        // Apply entrance/exit effects
        element.classList.add(`message-${effect}`);

        // Apply highlight effects
        if (this.state.messageEffects.highlight !== 'none') {
            element.classList.add(`message-${this.state.messageEffects.highlight}`);
        }

        // Apply particle effects
        if (this.state.messageEffects.particles !== 'none') {
            element.classList.add(`particle-${this.state.messageEffects.particles}`);
        }

        // Remove effects after animation
        setTimeout(() => {
            element.classList.remove(`message-${effect}`);
            if (this.state.messageEffects.highlight !== 'none') {
                element.classList.remove(`message-${this.state.messageEffects.highlight}`);
            }
            if (this.state.messageEffects.particles !== 'none') {
                element.classList.remove(`particle-${this.state.messageEffects.particles}`);
            }
        }, this.state.animationSettings.duration * 1000);
    }

    /**
     * Apply screen effects
     * @param {string} type Effect type
     */
    applyScreenEffects(type) {
        if (!this.state.enabled) return;

        const body = document.body;
        if (!body) return;

        // Apply screen transitions
        if (this.state.screenEffects.transitions !== 'none') {
            body.classList.add(`screen-${this.state.screenEffects.transitions}`);

            setTimeout(() => {
                body.classList.remove(`screen-${this.state.screenEffects.transitions}`);
            }, this.state.animationSettings.duration * 1000);
        }

        // Apply background effects
        if (this.state.screenEffects.background !== 'none') {
            body.classList.add(`background-${this.state.screenEffects.background}`);
        }

        // Apply typing animations
        if (this.state.screenEffects.typing !== 'none') {
            body.classList.add(`typing-${this.state.screenEffects.typing}`);
        }

        // Apply cursor effects
        if (this.state.screenEffects.cursor !== 'none') {
            body.classList.add(`cursor-${this.state.screenEffects.cursor}`);
        }
    }

    /**
     * Apply special effects
     */
    applySpecialEffects() {
        if (!this.state.enabled) return;

        const body = document.body;
        if (!body) return;

        // Remove all special effects first
        body.classList.remove('effect-glitch', 'effect-matrix', 'effect-cyberpunk', 'effect-hologram', 'effect-retro');

        // Apply active special effects
        if (this.state.specialEffects.glitch) {
            body.classList.add('effect-glitch');
        }
        if (this.state.specialEffects.matrix) {
            body.classList.add('effect-matrix');
        }
        if (this.state.specialEffects.cyberpunk) {
            body.classList.add('effect-cyberpunk');
        }
        if (this.state.specialEffects.hologram) {
            body.classList.add('effect-hologram');
        }
        if (this.state.specialEffects.retro) {
            body.classList.add('effect-retro');
        }
    }

    /**
     * Preview effects
     */
    previewEffects() {
        console.log('Previewing visual effects...');
        this.emit('effectsPreviewed');
    }

    /**
     * Test effects
     */
    testEffects() {
        console.log('Testing visual effects...');

        // Create test element
        const testElement = document.createElement('div');
        testElement.textContent = 'Test Message';
        testElement.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #333; color: #fff; padding: 10px; border-radius: 5px; z-index: 9999;';
        document.body.appendChild(testElement);

        // Apply test effects
        this.applyMessageEffects(testElement, 'entrance');

        // Remove test element
        setTimeout(() => {
            document.body.removeChild(testElement);
        }, 2000);

        this.emit('effectsTested');
    }

    /**
     * Reset all effects
     */
    resetEffects() {
        if (typeof window !== 'undefined') {
            const body = document.body;
            if (body) {
                // Remove all effect classes
                const effectClasses = [
                    'message-fade-in', 'message-slide-in', 'message-bounce-in', 'message-zoom-in', 'message-flip-in',
                    'message-fade-out', 'message-slide-out', 'message-bounce-out', 'message-zoom-out', 'message-flip-out',
                    'message-glow', 'message-pulse', 'message-shimmer', 'message-rainbow',
                    'particle-stars', 'particle-hearts', 'particle-sparkles', 'particle-confetti',
                    'screen-fade', 'screen-slide', 'screen-zoom', 'screen-flip',
                    'typing-typewriter', 'typing-matrix', 'typing-glitch', 'typing-neon',
                    'cursor-trail', 'cursor-sparkle', 'cursor-glow', 'cursor-rainbow',
                    'effect-glitch', 'effect-matrix', 'effect-cyberpunk', 'effect-hologram', 'effect-retro'
                ];

                effectClasses.forEach(className => {
                    body.classList.remove(className);
                });
            }
        }

        this.emit('effectsReset');
    }

    /**
     * Export effects configuration
     * @returns {string} JSON configuration
     */
    exportEffects() {
        const config = {
            ...this.state,
            exportTime: new Date().toISOString(),
            version: '1.0.0'
        };

        return JSON.stringify(config, null, 2);
    }

    /**
     * Update settings
     * @param {object} newSettings New settings
     */
    updateSettings(newSettings) {
        this.state = { ...this.state, ...newSettings };
        this.saveSettings();
        this.applySpecialEffects();
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
            const saved = localStorage.getItem('visual-effects-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load visual effects settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('visual-effects-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save visual effects settings:', error);
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
const visualEffectsController = new VisualEffectsController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            visualEffectsController.initialize().catch(console.error);
        });
    } else {
        visualEffectsController.initialize().catch(console.error);
    }

    // Expose globally
    window.visualEffectsController = visualEffectsController;
}

export { visualEffectsController, VisualEffectsController };

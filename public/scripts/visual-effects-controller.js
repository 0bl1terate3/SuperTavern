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
                particles3d: false,
                rotatingCube: false,
                dnaHelix: false,
                starfield: false,
                plasma: false,
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

        // Stop any running canvas effects
        this.stopCanvasEffects();

        // Apply active special effects
        if (this.state.specialEffects.glitch) {
            this.startGlitchEffect();
        }
        if (this.state.specialEffects.matrix) {
            this.startMatrixRain();
        }
        if (this.state.specialEffects.cyberpunk) {
            this.startCyberpunkEffect();
        }
        if (this.state.specialEffects.hologram) {
            this.startHologramEffect();
        }
        if (this.state.specialEffects.retro) {
            this.startRetroWaveEffect();
        }
        if (this.state.specialEffects.particles3d) {
            this.start3DParticles();
        }
        if (this.state.specialEffects.rotatingCube) {
            this.startRotatingCube();
        }
        if (this.state.specialEffects.dnaHelix) {
            this.startDNAHelix();
        }
        if (this.state.specialEffects.starfield) {
            this.startStarfield();
        }
        if (this.state.specialEffects.plasma) {
            this.startPlasmaEffect();
        }
    }

    /**
     * Start Matrix Rain effect
     */
    startMatrixRain() {
        // Create canvas if it doesn't exist
        let canvas = document.getElementById('matrix-rain-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'matrix-rain-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.8;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Matrix characters
        const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];

        // Initialize drops
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100;
        }

        // Animation function
        const draw = () => {
            // Semi-transparent black to create fade effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Green text
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            // Draw characters
            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                ctx.fillText(char, x, y);

                // Reset drop to top randomly
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        };

        // Store animation ID for cleanup
        this.matrixAnimationId = setInterval(draw, 33);

        // Handle window resize
        this.matrixResizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', this.matrixResizeHandler);
    }

    /**
     * Stop canvas effects
     */
    stopCanvasEffects() {
        // Stop Matrix Rain
        if (this.matrixAnimationId) {
            clearInterval(this.matrixAnimationId);
            this.matrixAnimationId = null;
        }

        if (this.matrixResizeHandler) {
            window.removeEventListener('resize', this.matrixResizeHandler);
            this.matrixResizeHandler = null;
        }

        // Stop Glitch
        if (this.glitchAnimationId) {
            clearInterval(this.glitchAnimationId);
            this.glitchAnimationId = null;
        }

        // Stop Cyberpunk
        if (this.cyberpunkAnimationId) {
            cancelAnimationFrame(this.cyberpunkAnimationId);
            this.cyberpunkAnimationId = null;
        }

        // Stop Hologram
        if (this.hologramAnimationId) {
            clearInterval(this.hologramAnimationId);
            this.hologramAnimationId = null;
        }

        // Stop Retro Wave
        if (this.retroAnimationId) {
            cancelAnimationFrame(this.retroAnimationId);
            this.retroAnimationId = null;
        }

        // Stop 3D Particles
        if (this.particles3dAnimationId) {
            cancelAnimationFrame(this.particles3dAnimationId);
            this.particles3dAnimationId = null;
        }

        // Stop Rotating Cube
        if (this.cubeAnimationId) {
            cancelAnimationFrame(this.cubeAnimationId);
            this.cubeAnimationId = null;
        }

        // Stop DNA Helix
        if (this.dnaAnimationId) {
            cancelAnimationFrame(this.dnaAnimationId);
            this.dnaAnimationId = null;
        }

        // Stop Starfield
        if (this.starfieldAnimationId) {
            cancelAnimationFrame(this.starfieldAnimationId);
            this.starfieldAnimationId = null;
        }

        // Stop Plasma
        if (this.plasmaAnimationId) {
            cancelAnimationFrame(this.plasmaAnimationId);
            this.plasmaAnimationId = null;
        }

        // Remove all canvases
        const canvases = [
            'matrix-rain-canvas',
            'glitch-canvas',
            'cyberpunk-canvas',
            'hologram-canvas',
            'retro-canvas',
            'particles3d-canvas',
            'cube-canvas',
            'dna-canvas',
            'starfield-canvas',
            'plasma-canvas'
        ];
        
        canvases.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) canvas.remove();
        });
    }

    /**
     * Start Glitch Effect - Random screen distortion
     */
    startGlitchEffect() {
        let canvas = document.getElementById('glitch-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'glitch-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; mix-blend-mode: difference;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const glitch = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Random glitch bars
            if (Math.random() > 0.9) {
                const numBars = Math.floor(Math.random() * 5) + 1;
                for (let i = 0; i < numBars; i++) {
                    const y = Math.random() * canvas.height;
                    const height = Math.random() * 50 + 5;
                    const offset = (Math.random() - 0.5) * 20;
                    
                    // RGB split effect
                    ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.5})`;
                    ctx.fillRect(offset - 2, y, canvas.width, height);
                    
                    ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.5})`;
                    ctx.fillRect(offset, y, canvas.width, height);
                    
                    ctx.fillStyle = `rgba(0, 0, 255, ${Math.random() * 0.5})`;
                    ctx.fillRect(offset + 2, y, canvas.width, height);
                }
            }

            // Random pixel blocks
            if (Math.random() > 0.95) {
                const numBlocks = Math.floor(Math.random() * 10) + 5;
                for (let i = 0; i < numBlocks; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 100 + 20;
                    
                    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 0.3})`;
                    ctx.fillRect(x, y, size, size);
                }
            }
        };

        this.glitchAnimationId = setInterval(glitch, 50);
    }

    /**
     * Start Cyberpunk Effect - Neon grid with particles
     */
    startCyberpunkEffect() {
        let canvas = document.getElementById('cyberpunk-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'cyberpunk-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.6;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Particles
        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                hue: Math.random() * 60 + 280 // Purple to pink range
            });
        }

        let time = 0;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid
            ctx.strokeStyle = `hsla(${(time * 2) % 360}, 100%, 50%, 0.2)`;
            ctx.lineWidth = 1;
            
            const gridSize = 50;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw and update particles
            particles.forEach(p => {
                ctx.fillStyle = `hsla(${p.hue + time}, 100%, 50%, 0.8)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Glow effect
                ctx.shadowBlur = 20;
                ctx.shadowColor = `hsla(${p.hue + time}, 100%, 50%, 1)`;
                ctx.fill();
                ctx.shadowBlur = 0;

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });

            time += 0.5;
            this.cyberpunkAnimationId = requestAnimationFrame(draw);
        };

        draw();
    }

    /**
     * Start Hologram Effect - Scanlines and flicker
     */
    startHologramEffect() {
        let canvas = document.getElementById('hologram-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'hologram-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9998; mix-blend-mode: overlay;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let scanlineY = 0;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Scanlines
            ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
            for (let y = 0; y < canvas.height; y += 4) {
                ctx.fillRect(0, y, canvas.width, 2);
            }

            // Moving scanline
            const gradient = ctx.createLinearGradient(0, scanlineY - 50, 0, scanlineY + 50);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, scanlineY - 50, canvas.width, 100);

            scanlineY += 3;
            if (scanlineY > canvas.height + 50) scanlineY = -50;

            // Random flicker
            if (Math.random() > 0.97) {
                ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.2})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // RGB aberration
            if (Math.random() > 0.95) {
                const offset = Math.random() * 5;
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                ctx.fillRect(offset, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
                ctx.fillRect(-offset, 0, canvas.width, canvas.height);
            }
        };

        this.hologramAnimationId = setInterval(draw, 33);
    }

    /**
     * Start Retro Wave Effect - 80s style grid and sun
     */
    startRetroWaveEffect() {
        let canvas = document.getElementById('retro-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'retro-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.7;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let time = 0;

        const draw = () => {
            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a0033');
            gradient.addColorStop(0.5, '#330066');
            gradient.addColorStop(1, '#ff00ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Sun
            const sunY = canvas.height * 0.4;
            const sunRadius = 100;
            const sunGradient = ctx.createRadialGradient(canvas.width / 2, sunY, 0, canvas.width / 2, sunY, sunRadius);
            sunGradient.addColorStop(0, '#ff00ff');
            sunGradient.addColorStop(0.5, '#ff0080');
            sunGradient.addColorStop(1, 'rgba(255, 0, 128, 0)');
            
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            // Sun lines
            ctx.strokeStyle = '#ff0080';
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                ctx.beginPath();
                ctx.arc(canvas.width / 2, sunY, sunRadius - (i * 8), 0, Math.PI);
                ctx.stroke();
            }

            // Perspective grid
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            
            const gridY = canvas.height * 0.6;
            const gridSpacing = 40;
            const perspective = 0.5;

            // Horizontal lines
            for (let i = 0; i < 20; i++) {
                const y = gridY + (i * gridSpacing * (1 + i * perspective * 0.1));
                if (y > canvas.height) break;
                
                const width = canvas.width * (1 - (i * 0.03));
                const x = (canvas.width - width) / 2;
                
                ctx.beginPath();
                ctx.moveTo(x, y + Math.sin(time + i * 0.5) * 5);
                ctx.lineTo(x + width, y + Math.sin(time + i * 0.5) * 5);
                ctx.stroke();
            }

            // Vertical lines
            const numVertical = 20;
            for (let i = 0; i < numVertical; i++) {
                const x = (canvas.width / numVertical) * i;
                const perspective = Math.abs(i - numVertical / 2) / (numVertical / 2);
                
                ctx.beginPath();
                ctx.moveTo(x, gridY);
                
                const endX = canvas.width / 2 + (x - canvas.width / 2) * 2;
                ctx.lineTo(endX, canvas.height);
                ctx.stroke();
            }

            time += 0.05;
            this.retroAnimationId = requestAnimationFrame(draw);
        };

        draw();
    }

    /**
     * Start 3D Particles - Floating 3D particle system
     */
    start3DParticles() {
        let canvas = document.getElementById('particles3d-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'particles3d-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.8;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create 3D particles
        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
                z: Math.random() * 400 - 200,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                vz: (Math.random() - 0.5) * 0.5,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const focalLength = 300;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach(p => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;

                // Wrap around
                if (p.x < -200 || p.x > 200) p.vx *= -1;
                if (p.y < -200 || p.y > 200) p.vy *= -1;
                if (p.z < -200 || p.z > 200) p.vz *= -1;

                // Project 3D to 2D
                const scale = focalLength / (focalLength + p.z);
                const x2d = centerX + p.x * scale;
                const y2d = centerY + p.y * scale;
                const size = scale * 3;

                // Draw particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
                ctx.fill();

                // Draw connections
                particles.forEach(p2 => {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dz = p.z - p2.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < 80) {
                        const scale2 = focalLength / (focalLength + p2.z);
                        const x2d2 = centerX + p2.x * scale2;
                        const y2d2 = centerY + p2.y * scale2;

                        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 80) * 0.3})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x2d, y2d);
                        ctx.lineTo(x2d2, y2d2);
                        ctx.stroke();
                    }
                });
            });

            this.particles3dAnimationId = requestAnimationFrame(draw);
        };

        draw();
    }

    /**
     * Start Rotating Cube - 3D wireframe cube
     */
    startRotatingCube() {
        let canvas = document.getElementById('cube-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'cube-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.7;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = 100;

        // Cube vertices
        const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];

        // Cube edges
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        let angleX = 0;
        let angleY = 0;
        let angleZ = 0;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Rotate vertices
            const rotated = vertices.map(v => {
                let [x, y, z] = v;

                // Rotate X
                let y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
                let z1 = y * Math.sin(angleX) + z * Math.cos(angleX);
                y = y1;
                z = z1;

                // Rotate Y
                let x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
                z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
                x = x1;
                z = z1;

                // Rotate Z
                x1 = x * Math.cos(angleZ) - y * Math.sin(angleZ);
                y1 = x * Math.sin(angleZ) + y * Math.cos(angleZ);
                x = x1;
                y = y1;

                // Project to 2D
                const scale = 300 / (300 + z * size);
                return {
                    x: centerX + x * size * scale,
                    y: centerY + y * size * scale,
                    scale: scale
                };
            });

            // Draw edges
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            edges.forEach(edge => {
                const v1 = rotated[edge[0]];
                const v2 = rotated[edge[1]];

                ctx.beginPath();
                ctx.moveTo(v1.x, v1.y);
                ctx.lineTo(v2.x, v2.y);
                ctx.stroke();
            });

            // Draw vertices
            ctx.fillStyle = '#ff00ff';
            rotated.forEach(v => {
                ctx.beginPath();
                ctx.arc(v.x, v.y, 4 * v.scale, 0, Math.PI * 2);
                ctx.fill();
            });

            angleX += 0.01;
            angleY += 0.015;
            angleZ += 0.02;

            this.cubeAnimationId = requestAnimationFrame(draw);
        };

        draw();
    }

    /**
     * Start DNA Helix - Double helix structure
     */
    startDNAHelix() {
        let canvas = document.getElementById('dna-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'dna-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.8;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const centerX = canvas.width / 2;
        let time = 0;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const numPoints = 50;
            const radius = 80;
            const spacing = canvas.height / numPoints;

            for (let i = 0; i < numPoints; i++) {
                const y = i * spacing;
                const angle1 = time + i * 0.3;
                const angle2 = time + i * 0.3 + Math.PI;

                // First strand
                const x1 = centerX + Math.cos(angle1) * radius;
                const z1 = Math.sin(angle1) * radius;
                const scale1 = 300 / (300 + z1);

                // Second strand
                const x2 = centerX + Math.cos(angle2) * radius;
                const z2 = Math.sin(angle2) * radius;
                const scale2 = 300 / (300 + z2);

                // Draw spheres
                ctx.fillStyle = `hsl(${(i * 7 + time * 50) % 360}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(x1, y, 5 * scale1, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `hsl(${(i * 7 + time * 50 + 180) % 360}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(x2, y, 5 * scale2, 0, Math.PI * 2);
                ctx.fill();

                // Draw connecting lines
                if (i % 3 === 0) {
                    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x1, y);
                    ctx.lineTo(x2, y);
                    ctx.stroke();
                }

                // Connect to previous point
                if (i > 0) {
                    const prevY = (i - 1) * spacing;
                    const prevAngle1 = time + (i - 1) * 0.3;
                    const prevX1 = centerX + Math.cos(prevAngle1) * radius;

                    ctx.strokeStyle = `hsla(${(i * 7 + time * 50) % 360}, 100%, 50%, 0.5)`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(prevX1, prevY);
                    ctx.lineTo(x1, y);
                    ctx.stroke();

                    const prevAngle2 = time + (i - 1) * 0.3 + Math.PI;
                    const prevX2 = centerX + Math.cos(prevAngle2) * radius;

                    ctx.strokeStyle = `hsla(${(i * 7 + time * 50 + 180) % 360}, 100%, 50%, 0.5)`;
                    ctx.beginPath();
                    ctx.moveTo(prevX2, prevY);
                    ctx.lineTo(x2, y);
                    ctx.stroke();
                }
            }

            time += 0.05;
            this.dnaAnimationId = requestAnimationFrame(draw);
        };

        draw();
    }

    /**
     * Start Starfield - Flying through stars
     */
    startStarfield() {
        let canvas = document.getElementById('starfield-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'starfield-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Create stars
        const stars = [];
        for (let i = 0; i < 500; i++) {
            stars.push({
                x: Math.random() * canvas.width - centerX,
                y: Math.random() * canvas.height - centerY,
                z: Math.random() * canvas.width
            });
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                // Move star towards viewer
                star.z -= 5;

                // Reset if too close
                if (star.z <= 0) {
                    star.z = canvas.width;
                    star.x = Math.random() * canvas.width - centerX;
                    star.y = Math.random() * canvas.height - centerY;
                }

                // Project to 2D
                const k = 128 / star.z;
                const px = star.x * k + centerX;
                const py = star.y * k + centerY;

                // Size based on depth
                const size = (1 - star.z / canvas.width) * 3;

                // Brightness based on depth
                const brightness = (1 - star.z / canvas.width) * 255;

                // Draw star
                ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();

                // Draw trail
                const prevZ = star.z + 5;
                const prevK = 128 / prevZ;
                const prevPx = star.x * prevK + centerX;
                const prevPy = star.y * prevK + centerY;

                ctx.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.5)`;
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(prevPx, prevPy);
                ctx.lineTo(px, py);
                ctx.stroke();
            });

            this.starfieldAnimationId = requestAnimationFrame(draw);
        };

        draw();
    }

    /**
     * Start Plasma Effect - Animated plasma waves
     */
    startPlasmaEffect() {
        let canvas = document.getElementById('plasma-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'plasma-canvas';
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; opacity: 0.6;';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let time = 0;

        const draw = () => {
            const imageData = ctx.createImageData(canvas.width, canvas.height);
            const data = imageData.data;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const index = (y * canvas.width + x) * 4;

                    // Plasma algorithm
                    const value = Math.sin(x / 16 + time) +
                                Math.sin(y / 8 + time) +
                                Math.sin((x + y) / 16 + time) +
                                Math.sin(Math.sqrt(x * x + y * y) / 8 + time);

                    const color = Math.floor((value + 4) * 32);

                    // RGB based on plasma value
                    data[index] = Math.sin(color * 0.1) * 127 + 128;
                    data[index + 1] = Math.sin(color * 0.1 + 2) * 127 + 128;
                    data[index + 2] = Math.sin(color * 0.1 + 4) * 127 + 128;
                    data[index + 3] = 255;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            time += 0.05;
            this.plasmaAnimationId = requestAnimationFrame(draw);
        };

        draw();
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

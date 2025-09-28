/**
 * Audio Studio Controller
 * Handles audio playback, sound effects, and audio themes
 */

class AudioStudioController {
    constructor() {
        this.state = {
            enabled: false,
            backgroundMusic: {
                enabled: false,
                theme: 'none',
                volume: 50,
                loop: false,
                isPlaying: false,
                currentTrack: null,
            },
            soundEffects: {
                enabled: false,
                type: 'notification',
                volume: 30,
            },
            audioThemes: {
                mood: 'neutral',
                intensity: 5,
            },
            audioSettings: {
                quality: 'medium',
                fadeDuration: 1.0,
                autoPlay: false,
                respectFocus: true,
            },
            audioLibrary: [],
            currentAudio: null,
            audioContext: null,
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
        this.audioElements = new Map();
        this.soundEffects = new Map();
        this.backgroundMusicElement = null;
    }

    /**
     * Initialize the audio studio controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Audio Studio Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize audio context
            this.initializeAudioContext();

            // Load default audio library
            this.loadDefaultAudioLibrary();

            this.isInitialized = true;
            console.log('Audio Studio Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Audio Studio Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for page visibility changes
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                this.handleVisibilityChange();
            });

            // Listen for message events to trigger sound effects
            document.addEventListener('messageAdded', (event) => {
                this.handleMessageAdded(event.detail);
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
     * Initialize audio context
     */
    initializeAudioContext() {
        try {
            // Create audio context for advanced audio processing
            if (typeof window !== 'undefined' && window.AudioContext) {
                this.state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }

    /**
     * Load default audio library
     */
    loadDefaultAudioLibrary() {
        // Default audio files (these would be actual audio files in a real implementation)
        this.state.audioLibrary = [
            { id: 'ambient_1', name: 'Ambient Forest', category: 'ambient', type: 'ambient', url: '/audio/ambient.mp3' },
            { id: 'nature_1', name: 'Rain Sounds', category: 'nature', url: '/audio/rain.mp3' },
            { id: 'music_1', name: 'Lo-Fi Study', category: 'music', url: '/audio/lofi.mp3' },
            { id: 'effect_1', name: 'Notification Bell', category: 'effects', url: '/audio/notification.mp3' },
            { id: 'effect_2', name: 'Message Pop', category: 'effects', url: '/audio/message.mp3' },
            { id: 'effect_3', name: 'Success Chime', category: 'effects', url: '/audio/success.mp3' },
            { id: 'effect_4', name: 'Error Sound', category: 'effects', url: '/audio/error.mp3' },
            { id: 'effect_5', name: 'Typing Sound', category: 'effects', url: '/audio/typing.mp3' },
        ];
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (!this.state.audioSettings.respectFocus) return;

        if (document.hidden) {
            this.pauseAllAudio();
        } else {
            if (this.state.backgroundMusic.enabled && this.state.backgroundMusic.isPlaying) {
                this.resumeBackgroundMusic();
            }
        }
    }

    /**
     * Handle message added
     * @param {object} data Message data
     */
    handleMessageAdded(data) {
        if (!this.state.soundEffects.enabled) return;

        this.playSoundEffect('message');
        this.emit('messageAdded', data);
    }

    /**
     * Handle generation started
     * @param {object} data Generation data
     */
    handleGenerationStarted(data) {
        if (!this.state.soundEffects.enabled) return;

        this.playSoundEffect('typing');
        this.emit('generationStarted', data);
    }

    /**
     * Handle generation completed
     * @param {object} data Generation data
     */
    handleGenerationCompleted(data) {
        if (!this.state.soundEffects.enabled) return;

        this.playSoundEffect('success');
        this.emit('generationCompleted', data);
    }

    /**
     * Play background music
     * @param {string} theme Music theme
     */
    playBackgroundMusic(theme = null) {
        if (!this.state.backgroundMusic.enabled) return;

        const selectedTheme = theme || this.state.backgroundMusic.theme;
        if (selectedTheme === 'none') return;

        try {
            // Stop current music
            this.stopBackgroundMusic();

            // Find audio file for theme
            const audioFile = this.findAudioForTheme(selectedTheme);
            if (!audioFile) {
                console.warn(`No audio file found for theme: ${selectedTheme}`);
                return;
            }

            // Create audio element
            this.backgroundMusicElement = new Audio(audioFile.url);
            this.backgroundMusicElement.volume = this.state.backgroundMusic.volume / 100;
            this.backgroundMusicElement.loop = this.state.backgroundMusic.loop;

            // Add event listeners
            this.backgroundMusicElement.addEventListener('ended', () => {
                this.state.backgroundMusic.isPlaying = false;
                this.emit('musicEnded');
            });

            this.backgroundMusicElement.addEventListener('error', (error) => {
                console.error('Background music error:', error);
                this.emit('musicError', error);
            });

            // Play music
            this.backgroundMusicElement.play().then(() => {
                this.state.backgroundMusic.isPlaying = true;
                this.state.backgroundMusic.currentTrack = audioFile;
                this.emit('musicStarted', audioFile);
            }).catch(error => {
                console.error('Failed to play background music:', error);
                this.emit('musicError', error);
            });

        } catch (error) {
            console.error('Error playing background music:', error);
            this.emit('musicError', error);
        }
    }

    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        if (this.backgroundMusicElement && !this.backgroundMusicElement.paused) {
            this.backgroundMusicElement.pause();
            this.state.backgroundMusic.isPlaying = false;
            this.emit('musicPaused');
        }
    }

    /**
     * Resume background music
     */
    resumeBackgroundMusic() {
        if (this.backgroundMusicElement && this.backgroundMusicElement.paused) {
            this.backgroundMusicElement.play().then(() => {
                this.state.backgroundMusic.isPlaying = true;
                this.emit('musicResumed');
            }).catch(error => {
                console.error('Failed to resume background music:', error);
            });
        }
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.backgroundMusicElement) {
            this.backgroundMusicElement.pause();
            this.backgroundMusicElement.currentTime = 0;
            this.backgroundMusicElement = null;
            this.state.backgroundMusic.isPlaying = false;
            this.state.backgroundMusic.currentTrack = null;
            this.emit('musicStopped');
        }
    }

    /**
     * Play sound effect
     * @param {string} type Effect type
     */
    playSoundEffect(type) {
        if (!this.state.soundEffects.enabled) return;

        try {
            const effectFile = this.findSoundEffect(type);
            if (!effectFile) {
                console.warn(`No sound effect found for type: ${type}`);
                return;
            }

            const audio = new Audio(effectFile.url);
            audio.volume = this.state.soundEffects.volume / 100;

            audio.addEventListener('error', (error) => {
                console.error('Sound effect error:', error);
            });

            audio.play().then(() => {
                this.emit('soundEffectPlayed', { type, file: effectFile });
            }).catch(error => {
                console.error('Failed to play sound effect:', error);
            });

        } catch (error) {
            console.error('Error playing sound effect:', error);
        }
    }

    /**
     * Find audio file for theme
     * @param {string} theme Music theme
     * @returns {object|null} Audio file
     */
    findAudioForTheme(theme) {
        const themeMap = {
            'ambient': 'ambient_1',
            'classical': 'music_1',
            'electronic': 'music_1',
            'nature': 'nature_1',
            'jazz': 'music_1',
            'lofi': 'music_1',
        };

        const audioId = themeMap[theme];
        if (!audioId) return null;

        return this.state.audioLibrary.find(audio => audio.id === audioId);
    }

    /**
     * Find sound effect
     * @param {string} type Effect type
     * @returns {object|null} Sound effect file
     */
    findSoundEffect(type) {
        const effectMap = {
            'notification': 'effect_1',
            'message': 'effect_2',
            'success': 'effect_3',
            'error': 'effect_4',
            'typing': 'effect_5',
            'ambient': 'effect_1',
        };

        const effectId = effectMap[type];
        if (!effectId) return null;

        return this.state.audioLibrary.find(audio => audio.id === effectId);
    }

    /**
     * Apply audio theme
     * @param {string} mood Audio mood
     * @param {number} intensity Intensity level
     */
    applyAudioTheme(mood, intensity) {
        this.state.audioThemes.mood = mood;
        this.state.audioThemes.intensity = intensity;

        // Apply theme-based settings
        switch (mood) {
            case 'relaxed':
                this.state.backgroundMusic.volume = Math.max(20, 50 - intensity * 3);
                this.state.soundEffects.volume = Math.max(10, 30 - intensity * 2);
                break;
            case 'energetic':
                this.state.backgroundMusic.volume = Math.min(80, 50 + intensity * 3);
                this.state.soundEffects.volume = Math.min(70, 30 + intensity * 4);
                break;
            case 'focused':
                this.state.backgroundMusic.volume = Math.max(10, 50 - intensity * 4);
                this.state.soundEffects.volume = Math.max(5, 30 - intensity * 3);
                break;
            case 'creative':
                this.state.backgroundMusic.volume = Math.min(70, 50 + intensity * 2);
                this.state.soundEffects.volume = Math.min(50, 30 + intensity * 2);
                break;
            case 'dramatic':
                this.state.backgroundMusic.volume = Math.min(90, 50 + intensity * 4);
                this.state.soundEffects.volume = Math.min(80, 30 + intensity * 5);
                break;
            default: // neutral
                this.state.backgroundMusic.volume = 50;
                this.state.soundEffects.volume = 30;
        }

        this.saveSettings();
        this.emit('themeApplied', { mood, intensity });
    }

    /**
     * Test all audio
     */
    testAllAudio() {
        console.log('Testing all audio...');

        // Test background music
        if (this.state.backgroundMusic.enabled) {
            this.playBackgroundMusic();
            setTimeout(() => {
                this.pauseBackgroundMusic();
            }, 2000);
        }

        // Test sound effects
        if (this.state.soundEffects.enabled) {
            const effects = ['notification', 'message', 'success', 'error', 'typing'];
            effects.forEach((effect, index) => {
                setTimeout(() => {
                    this.playSoundEffect(effect);
                }, index * 500);
            });
        }

        this.emit('audioTested');
    }

    /**
     * Mute all audio
     */
    muteAllAudio() {
        if (this.backgroundMusicElement) {
            this.backgroundMusicElement.volume = 0;
        }

        // Store original volumes
        this.state.originalMusicVolume = this.state.backgroundMusic.volume;
        this.state.originalEffectVolume = this.state.soundEffects.volume;

        this.state.backgroundMusic.volume = 0;
        this.state.soundEffects.volume = 0;

        this.emit('audioMuted');
    }

    /**
     * Unmute all audio
     */
    unmuteAllAudio() {
        if (this.backgroundMusicElement) {
            this.backgroundMusicElement.volume = this.state.backgroundMusic.volume / 100;
        }

        // Restore original volumes
        if (this.state.originalMusicVolume !== undefined) {
            this.state.backgroundMusic.volume = this.state.originalMusicVolume;
        }
        if (this.state.originalEffectVolume !== undefined) {
            this.state.soundEffects.volume = this.state.originalEffectVolume;
        }

        this.emit('audioUnmuted');
    }

    /**
     * Pause all audio
     */
    pauseAllAudio() {
        this.pauseBackgroundMusic();
        this.emit('audioPaused');
    }

    /**
     * Upload audio file
     * @param {File} file Audio file
     */
    uploadAudioFile(file) {
        if (!file || !file.type.startsWith('audio/')) {
            throw new Error('Invalid audio file');
        }

        const audioId = `custom_${Date.now()}`;
        const audioFile = {
            id: audioId,
            name: file.name.replace(/\.[^/.]+$/, ''),
            category: 'custom',
            url: URL.createObjectURL(file),
            file: file,
        };

        this.state.audioLibrary.push(audioFile);
        this.saveSettings();
        this.emit('audioUploaded', audioFile);
    }

    /**
     * Remove audio file
     * @param {string} audioId Audio file ID
     */
    removeAudioFile(audioId) {
        const audioIndex = this.state.audioLibrary.findIndex(audio => audio.id === audioId);
        if (audioIndex === -1) return;

        const audioFile = this.state.audioLibrary[audioIndex];

        // Revoke object URL if it's a custom file
        if (audioFile.url && audioFile.url.startsWith('blob:')) {
            URL.revokeObjectURL(audioFile.url);
        }

        this.state.audioLibrary.splice(audioIndex, 1);
        this.saveSettings();
        this.emit('audioRemoved', audioFile);
    }

    /**
     * Get audio library by category
     * @param {string} category Category filter
     * @returns {Array} Filtered audio library
     */
    getAudioLibrary(category = 'all') {
        if (category === 'all') {
            return this.state.audioLibrary;
        }
        return this.state.audioLibrary.filter(audio => audio.category === category);
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
            const saved = localStorage.getItem('audio-studio-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load audio studio settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('audio-studio-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save audio studio settings:', error);
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
const audioStudioController = new AudioStudioController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            audioStudioController.initialize().catch(console.error);
        });
    } else {
        audioStudioController.initialize().catch(console.error);
    }

    // Expose globally
    window.audioStudioController = audioStudioController;
}

export { audioStudioController, AudioStudioController };

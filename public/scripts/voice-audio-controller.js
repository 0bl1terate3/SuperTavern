/**
 * SuperTavern Voice & Audio Controller
 * Comprehensive voice and audio management system with speech playback,
 * microphone capture, ambient soundscapes, mood synchronization, and character voice customization.
 */

import { debounce, download } from './utils.js';

// Default voice and audio settings
const DEFAULT_VOICE_SETTINGS = {
    speech: {
        enabled: false,
        autoPlay: true,
        voice: 'default',
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
        language: 'en-US',
        voices: [],
        characterVoices: {},
        lastUsedVoice: null,
    },
    microphone: {
        enabled: false,
        autoStart: false,
        continuous: false,
        language: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        confidence: 0.7,
        timeout: 5000,
        silenceDetection: true,
        silenceThreshold: 2000,
    },
    ambient: {
        enabled: false,
        volume: 0.3,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
        crossfade: true,
        soundscapes: [],
        activeSoundscape: null,
        loop: true,
        randomize: false,
        moodSync: false,
    },
    mood: {
        enabled: false,
        sensitivity: 0.5,
        detectionMethod: 'sentiment', // 'sentiment', 'keywords', 'hybrid'
        moodVoices: {
            happy: { rate: 1.1, pitch: 1.05, volume: 0.9 },
            sad: { rate: 0.9, pitch: 0.95, volume: 0.7 },
            excited: { rate: 1.2, pitch: 1.1, volume: 1.0 },
            calm: { rate: 0.8, pitch: 0.9, volume: 0.6 },
            angry: { rate: 1.3, pitch: 1.2, volume: 0.95 },
            neutral: { rate: 1.0, pitch: 1.0, volume: 0.8 },
        },
        currentMood: 'neutral',
        moodHistory: [],
        autoDetect: true,
    },
    character: {
        enabled: false,
        voiceProfiles: {},
        autoAssign: true,
        voiceMatching: 'name', // 'name', 'personality', 'custom'
        defaultVoice: null,
        voiceCache: {},
    },
    accessibility: {
        enabled: false,
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        voiceDescriptions: false,
        audioCues: true,
        hapticFeedback: false,
    },
    advanced: {
        audioContext: null,
        gainNode: null,
        compressor: null,
        equalizer: null,
        reverb: null,
        echo: null,
        noiseReduction: false,
        audioProcessing: false,
        realTimeAnalysis: false,
        audioVisualization: false,
    },
};

// Voice and Audio Controller Class
class VoiceAudioController {
    constructor() {
        this.state = this.deepClone(DEFAULT_VOICE_SETTINGS);
        this.synthesis = window.speechSynthesis;
        this.recognition = null;
        this.audioContext = null;
        this.audioNodes = {};
        this.activeUtterances = new Map();
        this.recordingStream = null;
        this.mediaRecorder = null;
        this.ambientAudio = null;
        this.moodAnalyzer = null;
        this.characterProfiles = new Map();
        this.eventListeners = new Map();
        this.isInitialized = false;
        this.isRecording = false;
        this.isPlaying = false;
        this.currentMood = 'neutral';
        this.moodHistory = [];
        this.voiceCache = new Map();

        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.destroy = this.destroy.bind(this);
        this.speak = this.speak.bind(this);
        this.stopSpeaking = this.stopSpeaking.bind(this);
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        this.playAmbient = this.playAmbient.bind(this);
        this.stopAmbient = this.stopAmbient.bind(this);
        this.analyzeMood = this.analyzeMood.bind(this);
        this.setCharacterVoice = this.setCharacterVoice.bind(this);
        this.updateSettings = this.updateSettings.bind(this);
    }

    /**
     * Initialize the voice and audio controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize speech synthesis
            await this.initializeSpeechSynthesis();

            // Load available voices
            await this.loadVoices();

            // Initialize speech recognition
            await this.initializeSpeechRecognition();

            // Initialize audio context for advanced features
            await this.initializeAudioContext();

            // Initialize mood analyzer
            this.initializeMoodAnalyzer();

            // Load character voice profiles
            await this.loadCharacterProfiles();

            // Set up event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('Voice & Audio Controller initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Voice & Audio Controller:', error);
            throw error;
        }
    }

    /**
     * Initialize speech synthesis
     */
    async initializeSpeechSynthesis() {
        if (!this.synthesis) {
            throw new Error('Speech synthesis not supported');
        }

        // Load available voices
        await this.loadVoices();

        // Set up voice change handler
        this.synthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
    }

    /**
     * Initialize speech recognition
     */
    async initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = this.state.microphone.continuous;
        this.recognition.interimResults = this.state.microphone.interimResults;
        this.recognition.lang = this.state.microphone.language;
        this.recognition.maxAlternatives = this.state.microphone.maxAlternatives;

        // Set up recognition event handlers
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.emit('recordingStarted');
        };

        this.recognition.onresult = (event) => {
            this.handleRecognitionResult(event);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.emit('recognitionError', event.error);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.emit('recordingEnded');
        };
    }

    /**
     * Initialize Web Audio API context
     */
    async initializeAudioContext() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('Web Audio API not supported');
            return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();

        // Create audio processing nodes
        this.audioNodes.gainNode = this.audioContext.createGain();
        this.audioNodes.compressor = this.audioContext.createDynamicsCompressor();
        this.audioNodes.equalizer = this.createEqualizer();

        // Connect nodes
        this.audioNodes.gainNode.connect(this.audioNodes.compressor);
        this.audioNodes.compressor.connect(this.audioContext.destination);

        // Store in state
        this.state.advanced.audioContext = this.audioContext;
        this.state.advanced.gainNode = this.audioNodes.gainNode;
        this.state.advanced.compressor = this.audioNodes.compressor;
    }

    /**
     * Initialize mood analyzer
     */
    initializeMoodAnalyzer() {
        this.moodAnalyzer = {
            sentimentKeywords: {
                happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'fantastic'],
                sad: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'terrible', 'awful', 'hate'],
                excited: ['excited', 'thrilled', 'pumped', 'energetic', 'amazing', 'incredible', 'wow'],
                calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'quiet', 'gentle'],
                angry: ['angry', 'mad', 'furious', 'rage', 'annoyed', 'irritated', 'frustrated'],
            },
            analyze: (text) => this.analyzeTextMood(text),
        };
    }

    /**
     * Load available voices
     */
    async loadVoices() {
        return new Promise((resolve) => {
            const loadVoices = () => {
                const voices = this.synthesis.getVoices();
                console.log(`Loading ${voices.length} voices...`);
                this.state.speech.voices = voices.map(voice => ({
                    name: voice.name,
                    lang: voice.lang,
                    localService: voice.localService,
                    default: voice.default,
                    voiceURI: voice.voiceURI,
                }));
                console.log('Voices loaded:', this.state.speech.voices.map(v => v.name));
                resolve(voices);
            };

            // Check if voices are already available
            const initialVoices = this.synthesis.getVoices();
            if (initialVoices.length > 0) {
                loadVoices();
            } else {
                // Wait for voices to load
                console.log('Waiting for voices to load...');
                this.synthesis.onvoiceschanged = loadVoices;

                // Fallback timeout in case voices never load
                setTimeout(() => {
                    if (this.state.speech.voices.length === 0) {
                        console.warn('No voices loaded after timeout, using default');
                        this.state.speech.voices = [{
                            name: 'Default',
                            lang: 'en-US',
                            localService: true,
                            default: true,
                            voiceURI: ''
                        }];
                        resolve([]);
                    }
                }, 3000);
            }
        });
    }

    /**
     * Load character voice profiles
     */
    async loadCharacterProfiles() {
        // Load from localStorage or server
        const stored = localStorage.getItem('supertavern_character_voices');
        if (stored) {
            try {
                this.state.character.voiceProfiles = JSON.parse(stored);
            } catch (error) {
                console.error('Failed to load character voice profiles:', error);
            }
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Browser focus/blur events
        window.addEventListener('focus', () => {
            this.handleBrowserFocus();
        });

        window.addEventListener('blur', () => {
            this.handleBrowserBlur();
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Audio context state changes
        if (this.audioContext) {
            this.audioContext.addEventListener('statechange', () => {
                this.handleAudioContextStateChange();
            });
        }
    }

    /**
     * Speak text using speech synthesis
     */
    async speak(text, options = {}) {
        if (!this.state.speech.enabled || !text) {
            return;
        }

        try {
            // Stop any current speech
            this.stopSpeaking();

            // Create utterance
            const utterance = new SpeechSynthesisUtterance(text);

            // Apply voice settings
            const voiceName = options.voice || this.state.speech.voice;
            const voice = this.getActualVoice(voiceName);
            if (voice) {
                utterance.voice = voice;
                console.log(`Using voice: ${voice.name} (${voice.lang})`);
            } else {
                console.warn(`Voice not found: ${voiceName}, using default`);
            }

            // Validate and set speech parameters with fallbacks
            utterance.rate = this.validateSpeechParam(options.rate || this.state.speech.rate, 1.0, 0.1, 10.0);
            utterance.pitch = this.validateSpeechParam(options.pitch || this.state.speech.pitch, 1.0, 0.0, 2.0);
            utterance.volume = this.validateSpeechParam(options.volume || this.state.speech.volume, 0.8, 0.0, 1.0);
            utterance.lang = options.language || this.state.speech.language || 'en-US';

            // Apply mood-based voice modifications
            if (this.state.mood.enabled && options.mood) {
                this.applyMoodToUtterance(utterance, options.mood);
            }

            // Set up event handlers
            utterance.onstart = () => {
                this.isPlaying = true;
                this.emit('speechStarted', { text, options });
            };

            utterance.onend = () => {
                this.isPlaying = false;
                this.activeUtterances.delete(utterance);
                this.emit('speechEnded', { text, options });
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                this.emit('speechError', event.error);
            };

            // Store utterance
            this.activeUtterances.set(utterance, { text, options });

            // Speak
            this.synthesis.speak(utterance);

        } catch (error) {
            console.error('Failed to speak text:', error);
            this.emit('speechError', error);
        }
    }

    /**
     * Stop current speech
     */
    stopSpeaking() {
        this.synthesis.cancel();
        this.activeUtterances.clear();
        this.isPlaying = false;
        this.emit('speechStopped');
    }

    /**
     * Start voice recording
     */
    async startRecording() {
        if (!this.state.microphone.enabled || this.isRecording) {
            return;
        }

        try {
            if (this.recognition) {
                this.recognition.start();
            }
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.emit('recordingError', error);
        }
    }

    /**
     * Stop voice recording
     */
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
    }

    /**
     * Handle speech recognition results
     */
    handleRecognitionResult(event) {
        const results = Array.from(event.results);
        const transcript = results
            .map(result => result[0].transcript)
            .join(' ');

        const confidence = results[0][0].confidence;

        if (confidence >= this.state.microphone.confidence) {
            this.emit('transcriptReceived', { transcript, confidence, isFinal: results[0].isFinal });

            // Analyze mood if enabled
            if (this.state.mood.enabled && this.state.mood.autoDetect) {
                this.analyzeMood(transcript);
            }
        }
    }

    /**
     * Play ambient soundscape
     */
    async playAmbient(soundscapeId, options = {}) {
        if (!this.state.ambient.enabled) {
            return;
        }

        try {
            // Stop current ambient audio
            this.stopAmbient();

            // Find soundscape
            const soundscape = this.state.ambient.soundscapes.find(s => s.id === soundscapeId);
            if (!soundscape) {
                throw new Error(`Soundscape not found: ${soundscapeId}`);
            }

            // Create audio element
            this.ambientAudio = new Audio(soundscape.url);
            this.ambientAudio.loop = this.state.ambient.loop;
            this.ambientAudio.volume = options.volume || this.state.ambient.volume;

            // Set up event handlers
            this.ambientAudio.onplay = () => {
                this.emit('ambientStarted', { soundscape, options });
            };

            this.ambientAudio.onended = () => {
                this.emit('ambientEnded', { soundscape, options });
            };

            this.ambientAudio.onerror = (error) => {
                console.error('Ambient audio error:', error);
                this.emit('ambientError', error);
            };

            // Play with fade in
            if (this.state.ambient.fadeInDuration > 0) {
                this.fadeInAudio(this.ambientAudio, this.state.ambient.fadeInDuration);
            } else {
                this.ambientAudio.play();
            }

            this.state.ambient.activeSoundscape = soundscapeId;

        } catch (error) {
            console.error('Failed to play ambient soundscape:', error);
            this.emit('ambientError', error);
        }
    }

    /**
     * Stop ambient audio
     */
    stopAmbient() {
        if (this.ambientAudio) {
            if (this.state.ambient.fadeOutDuration > 0) {
                this.fadeOutAudio(this.ambientAudio, this.state.ambient.fadeOutDuration);
            } else {
                this.ambientAudio.pause();
                this.ambientAudio.currentTime = 0;
            }
            this.ambientAudio = null;
        }
        this.state.ambient.activeSoundscape = null;
        this.emit('ambientStopped');
    }

    /**
     * Analyze mood from text
     */
    analyzeMood(text) {
        if (!this.state.mood.enabled) {
            return;
        }

        const mood = this.moodAnalyzer.analyze(text);
        if (mood !== this.currentMood) {
            this.currentMood = mood;
            this.state.mood.currentMood = mood;
            this.state.mood.moodHistory.push({
                mood,
                timestamp: Date.now(),
                text: text.substring(0, 100), // Store first 100 chars
            });

            // Keep only last 50 mood entries
            if (this.state.mood.moodHistory.length > 50) {
                this.state.mood.moodHistory.shift();
            }

            this.emit('moodChanged', { mood, text });
        }
    }

    /**
     * Analyze text mood using keyword matching
     */
    analyzeTextMood(text) {
        const lowerText = text.toLowerCase();
        const scores = {};

        for (const [mood, keywords] of Object.entries(this.moodAnalyzer.sentimentKeywords)) {
            scores[mood] = keywords.reduce((score, keyword) => {
                return score + (lowerText.includes(keyword) ? 1 : 0);
            }, 0);
        }

        // Find mood with highest score
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore === 0) {
            return 'neutral';
        }

        return Object.keys(scores).find(mood => scores[mood] === maxScore);
    }

    /**
     * Set character voice
     */
    setCharacterVoice(characterId, voiceSettings) {
        this.state.character.voiceProfiles[characterId] = voiceSettings;
        this.characterProfiles.set(characterId, voiceSettings);

        // Save to localStorage
        localStorage.setItem('supertavern_character_voices',
            JSON.stringify(this.state.character.voiceProfiles));

        this.emit('characterVoiceSet', { characterId, voiceSettings });
    }

    /**
     * Get voice for character
     */
    getCharacterVoice(characterId) {
        return this.state.character.voiceProfiles[characterId] || this.state.character.defaultVoice;
    }

    /**
     * Get voice by name or settings
     */
    getVoice(voiceName) {
        if (typeof voiceName === 'string') {
            return this.state.speech.voices.find(v => v.name === voiceName);
        }
        return this.state.speech.voices[0];
    }

    /**
     * Get actual browser voice object by name
     * @param {string} voiceName Voice name
     * @returns {SpeechSynthesisVoice} Browser voice object
     */
    getActualVoice(voiceName) {
        if (!voiceName) return null;

        // Get all available voices from the browser
        const allVoices = this.synthesis.getVoices();

        // Find the voice by exact name match
        const voice = allVoices.find(v => v.name === voiceName);

        if (voice) {
            return voice;
        }

        // Fallback: try partial name match
        const partialMatch = allVoices.find(v =>
            v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
            voiceName.toLowerCase().includes(v.name.toLowerCase())
        );

        if (partialMatch) {
            console.log(`Partial voice match: ${voiceName} -> ${partialMatch.name}`);
            return partialMatch;
        }

        // Final fallback: use first available voice
        console.warn(`Voice "${voiceName}" not found, using first available voice`);
        return allVoices[0] || null;
    }

    /**
     * Get available voices
     * @returns {Array} Array of available voices
     */
    getAvailableVoices() {
        return this.state.speech.voices || [];
    }

    /**
     * Validate speech parameter values
     * @param {number} value - The value to validate
     * @param {number} defaultValue - Default value if invalid
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {number} Valid value
     */
    validateSpeechParam(value, defaultValue, min, max) {
        // Check if value is a valid number
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
            console.warn(`Invalid speech parameter: ${value}, using default: ${defaultValue}`);
            return defaultValue;
        }

        // Clamp value to valid range
        const clamped = Math.max(min, Math.min(max, value));
        if (clamped !== value) {
            console.warn(`Speech parameter ${value} clamped to ${clamped} (range: ${min}-${max})`);
        }

        return clamped;
    }

    /**
     * Apply mood-based voice modifications
     */
    applyMoodToUtterance(utterance, mood) {
        const moodSettings = this.state.mood.moodVoices[mood];
        if (moodSettings) {
            utterance.rate *= moodSettings.rate;
            utterance.pitch *= moodSettings.pitch;
            utterance.volume *= moodSettings.volume;
        }
    }

    /**
     * Create audio equalizer
     */
    createEqualizer() {
        if (!this.audioContext) return null;

        const equalizer = this.audioContext.createBiquadFilter();
        equalizer.type = 'peaking';
        equalizer.frequency.value = 1000;
        equalizer.Q.value = 1;
        equalizer.gain.value = 0;

        return equalizer;
    }

    /**
     * Fade in audio
     */
    fadeInAudio(audio, duration) {
        audio.volume = 0;
        audio.play();

        const startTime = Date.now();
        const targetVolume = audio.volume;
        audio.volume = 0;

        const fadeIn = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            audio.volume = progress * targetVolume;

            if (progress < 1) {
                requestAnimationFrame(fadeIn);
            }
        };

        fadeIn();
    }

    /**
     * Fade out audio
     */
    fadeOutAudio(audio, duration) {
        const startVolume = audio.volume;
        const startTime = Date.now();

        const fadeOut = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            audio.volume = startVolume * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(fadeOut);
            } else {
                audio.pause();
                audio.currentTime = 0;
            }
        };

        fadeOut();
    }

    /**
     * Handle browser focus
     */
    handleBrowserFocus() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Handle browser blur
     */
    handleBrowserBlur() {
        // Optionally pause audio when browser loses focus
        if (this.state.speech.autoPlay === false) {
            this.stopSpeaking();
        }
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.handleBrowserBlur();
        } else {
            this.handleBrowserFocus();
        }
    }

    /**
     * Handle audio context state change
     */
    handleAudioContextStateChange() {
        console.log('Audio context state:', this.audioContext.state);
        this.emit('audioContextStateChanged', this.audioContext.state);
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.state = this.mergeDeep(this.state, newSettings);
        this.emit('settingsUpdated', this.state);
    }

    /**
     * Get current settings
     */
    getSettings() {
        return this.deepClone(this.state);
    }

    /**
     * Emit event
     */
    emit(eventName, data) {
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }

    /**
     * Add event listener
     */
    on(eventName, listener) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(listener);
    }

    /**
     * Remove event listener
     */
    off(eventName, listener) {
        const listeners = this.eventListeners.get(eventName) || [];
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Destroy controller
     */
    destroy() {
        this.stopSpeaking();
        this.stopRecording();
        this.stopAmbient();

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.eventListeners.clear();
        this.activeUtterances.clear();
        this.characterProfiles.clear();
        this.voiceCache.clear();

        this.isInitialized = false;
    }

    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (typeof structuredClone === 'function') {
            return structuredClone(obj);
        }
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Deep merge objects
     */
    mergeDeep(target, source) {
        const output = Array.isArray(target) ? [...target] : { ...target };
        if (source && typeof source === 'object') {
            Object.keys(source).forEach((key) => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    output[key] = this.mergeDeep(output[key] || {}, source[key]);
                } else {
                    output[key] = source[key];
                }
            });
        }
        return output;
    }
}

// Create global instance
const voiceAudioController = new VoiceAudioController();

// Export functions for integration with SuperTavern
export {
    voiceAudioController,
    DEFAULT_VOICE_SETTINGS,
};

// Export individual functions for easy access
export const {
    initialize: initializeVoiceAudio,
    speak: speakText,
    stopSpeaking: stopVoice,
    startRecording: startVoiceRecording,
    stopRecording: stopVoiceRecording,
    playAmbient: playAmbientSound,
    stopAmbient: stopAmbientSound,
    analyzeMood: analyzeTextMood,
    setCharacterVoice: setCharacterVoiceProfile,
    updateSettings: updateVoiceSettings,
    getSettings: getVoiceSettings,
    on: onVoiceEvent,
    off: offVoiceEvent,
} = voiceAudioController;

// Auto-initialize when module loads and expose globally
if (typeof window !== 'undefined') {
    window.voiceAudioController = voiceAudioController;

    // Initialize immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            voiceAudioController.initialize().catch(console.error);
        });
    } else {
        voiceAudioController.initialize().catch(console.error);
    }
}

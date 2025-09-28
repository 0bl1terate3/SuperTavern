/**
 * Voice & Audio Interface Handler
 * Connects the existing voice-audio toolbar interface to the voice controller
 */

import { voiceAudioController } from './voice-audio-controller.js';

// Voice & Audio settings state
let voiceAudioState = {
    tts: {
        enabled: false,
        voice: 'Microsoft David - English (United States)',
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
    },
    input: {
        enabled: false,
        pushToTalk: false,
    },
    background: {
        enabled: false,
        style: 'tavern',
    },
    characters: {
        sync: false,
        defaultProfile: 'storyteller',
    },
    mood: {
        enabled: false,
        preset: 'serene',
    },
};

// Initialize the voice-audio interface
export function initializeVoiceAudioInterface() {
    console.log('Initializing Voice & Audio Interface...');

    // Set up event listeners for the existing voice-audio controls
    setupVoiceAudioEventListeners();

    // Load saved settings
    loadVoiceAudioSettings();

    // Connect to voice controller
    connectToVoiceController();

    console.log('Voice & Audio Interface initialized');
}

function setupVoiceAudioEventListeners() {
    // Text-to-Speech controls
    const ttsEnabled = document.getElementById('voice_audio_tts_enabled');
    const ttsVoice = document.getElementById('voice_audio_tts_voice');
    const ttsPreview = document.getElementById('voice_audio_tts_preview');

    if (ttsEnabled) {
        ttsEnabled.addEventListener('change', (e) => {
            voiceAudioState.tts.enabled = e.target.checked;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (ttsVoice) {
        ttsVoice.addEventListener('change', (e) => {
            voiceAudioState.tts.voice = e.target.value;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    // TTS Rate control
    const ttsRate = document.getElementById('voice_audio_tts_rate');
    const ttsRateValue = document.getElementById('voice_audio_tts_rate_value');
    if (ttsRate && ttsRateValue) {
        ttsRate.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && isFinite(value)) {
                voiceAudioState.tts.rate = Math.max(0.1, Math.min(10.0, value));
                ttsRateValue.textContent = `${voiceAudioState.tts.rate.toFixed(1)}x`;
                updateVoiceControllerSettings();
                saveVoiceAudioSettings();
            }
        });
    }

    // TTS Pitch control
    const ttsPitch = document.getElementById('voice_audio_tts_pitch');
    const ttsPitchValue = document.getElementById('voice_audio_tts_pitch_value');
    if (ttsPitch && ttsPitchValue) {
        ttsPitch.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && isFinite(value)) {
                voiceAudioState.tts.pitch = Math.max(0.0, Math.min(2.0, value));
                ttsPitchValue.textContent = `${voiceAudioState.tts.pitch.toFixed(1)}x`;
                updateVoiceControllerSettings();
                saveVoiceAudioSettings();
            }
        });
    }

    // TTS Volume control
    const ttsVolume = document.getElementById('voice_audio_tts_volume');
    const ttsVolumeValue = document.getElementById('voice_audio_tts_volume_value');
    if (ttsVolume && ttsVolumeValue) {
        ttsVolume.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && isFinite(value)) {
                voiceAudioState.tts.volume = Math.max(0.0, Math.min(1.0, value));
                ttsVolumeValue.textContent = `${Math.round(voiceAudioState.tts.volume * 100)}%`;
                updateVoiceControllerSettings();
                saveVoiceAudioSettings();
            }
        });
    }

    if (ttsPreview) {
        ttsPreview.addEventListener('click', async () => {
            try {
                if (window.voiceAudioController) {
                    await window.voiceAudioController.speak('Hello! This is a preview of the text-to-speech system. The voice settings are working correctly.');
                } else {
                    console.error('Voice controller not available');
                }
            } catch (error) {
                console.error('TTS preview failed:', error);
            }
        });
    }

    // Voice Input controls
    const inputEnabled = document.getElementById('voice_audio_input_enabled');
    const inputPTT = document.getElementById('voice_audio_input_ptt');
    const inputCalibrate = document.getElementById('voice_audio_input_calibrate');

    if (inputEnabled) {
        inputEnabled.addEventListener('change', (e) => {
            voiceAudioState.input.enabled = e.target.checked;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (inputPTT) {
        inputPTT.addEventListener('change', (e) => {
            voiceAudioState.input.pushToTalk = e.target.checked;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (inputCalibrate) {
        inputCalibrate.addEventListener('click', async () => {
            try {
                if (window.voiceAudioController) {
                    await window.voiceAudioController.startRecording();
                    console.log('Voice calibration started');
                } else {
                    console.error('Voice controller not available');
                }
            } catch (error) {
                console.error('Voice calibration failed:', error);
            }
        });
    }

    // Audio Background controls
    const backgroundEnabled = document.getElementById('voice_audio_background_enabled');
    const backgroundStyle = document.getElementById('voice_audio_background_style');
    const backgroundPreview = document.getElementById('voice_audio_background_preview');

    if (backgroundEnabled) {
        backgroundEnabled.addEventListener('change', (e) => {
            voiceAudioState.background.enabled = e.target.checked;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (backgroundStyle) {
        backgroundStyle.addEventListener('change', (e) => {
            voiceAudioState.background.style = e.target.value;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (backgroundPreview) {
        backgroundPreview.addEventListener('click', async () => {
            try {
                if (window.voiceAudioController) {
                    await window.voiceAudioController.playAmbient(voiceAudioState.background.style);
                } else {
                    console.error('Voice controller not available');
                }
            } catch (error) {
                console.error('Background preview failed:', error);
            }
        });
    }

    // Character Voice controls
    const characterSync = document.getElementById('voice_audio_character_sync');
    const characterProfile = document.getElementById('voice_audio_character_profile');
    const characterCustomize = document.getElementById('voice_audio_character_customize');

    if (characterSync) {
        characterSync.addEventListener('change', (e) => {
            voiceAudioState.characters.sync = e.target.checked;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (characterProfile) {
        characterProfile.addEventListener('change', (e) => {
            voiceAudioState.characters.defaultProfile = e.target.value;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (characterCustomize) {
        characterCustomize.addEventListener('click', () => {
            console.log('Character voice customization clicked');
            // TODO: Open character voice customization panel
        });
    }

    // Mood controls
    const moodEnabled = document.getElementById('voice_audio_mood_enabled');
    const moodPreset = document.getElementById('voice_audio_mood_preset');
    const moodSync = document.getElementById('voice_audio_mood_sync');

    if (moodEnabled) {
        moodEnabled.addEventListener('change', (e) => {
            voiceAudioState.mood.enabled = e.target.checked;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (moodPreset) {
        moodPreset.addEventListener('change', (e) => {
            voiceAudioState.mood.preset = e.target.value;
            updateVoiceControllerSettings();
            saveVoiceAudioSettings();
        });
    }

    if (moodSync) {
        moodSync.addEventListener('click', () => {
            try {
                if (window.voiceAudioController) {
                    window.voiceAudioController.analyzeMood(`Current mood: ${voiceAudioState.mood.preset}`);
                    console.log(`Mood synced to: ${voiceAudioState.mood.preset}`);
                } else {
                    console.error('Voice controller not available');
                }
            } catch (error) {
                console.error('Mood sync failed:', error);
            }
        });
    }
}

function connectToVoiceController() {
    if (typeof window !== 'undefined' && window.voiceAudioController) {
        // Set up voice controller event listeners
        window.voiceAudioController.on('transcriptReceived', (data) => {
            console.log('Transcript received:', data.transcript);
        });

        window.voiceAudioController.on('moodChanged', (data) => {
            console.log('Mood changed to:', data.mood);
        });

        window.voiceAudioController.on('recordingStarted', () => {
            console.log('Recording started');
        });

        window.voiceAudioController.on('recordingEnded', () => {
            console.log('Recording ended');
        });

        // Update voice controller with current settings
        updateVoiceControllerSettings();
    } else {
        console.warn('Voice controller not available, retrying in 1 second...');
        setTimeout(connectToVoiceController, 1000);
    }
}

function updateVoiceControllerSettings() {
    if (typeof window !== 'undefined' && window.voiceAudioController) {
        // Map voice-audio settings to voice controller format
        const controllerSettings = {
            speech: {
                enabled: voiceAudioState.tts.enabled,
                voice: voiceAudioState.tts.voice || 'Microsoft David - English (United States)',
                autoPlay: true,
                rate: voiceAudioState.tts.rate || 1.0,
                pitch: voiceAudioState.tts.pitch || 1.0,
                volume: voiceAudioState.tts.volume || 0.8,
                language: 'en-US',
            },
            microphone: {
                enabled: voiceAudioState.input.enabled,
                continuous: !voiceAudioState.input.pushToTalk,
                autoStart: false,
                language: 'en-US',
                interimResults: true,
                maxAlternatives: 1,
                confidence: 0.7,
                timeout: 5000,
                silenceDetection: true,
                silenceThreshold: 2000,
            },
            ambient: {
                enabled: voiceAudioState.background.enabled,
                volume: 0.3,
                fadeInDuration: 2000,
                fadeOutDuration: 2000,
                crossfade: true,
                soundscapes: [],
                activeSoundscape: voiceAudioState.background.style,
                loop: true,
                randomize: false,
                moodSync: false,
            },
            character: {
                enabled: voiceAudioState.characters.sync,
                voiceProfiles: {},
                autoAssign: true,
                voiceMatching: 'name',
                defaultVoice: voiceAudioState.characters.defaultProfile,
                voiceCache: {},
            },
            mood: {
                enabled: voiceAudioState.mood.enabled,
                sensitivity: 0.5,
                detectionMethod: 'sentiment',
                moodVoices: {
                    happy: { rate: 1.1, pitch: 1.05, volume: 0.9 },
                    sad: { rate: 0.9, pitch: 0.95, volume: 0.7 },
                    excited: { rate: 1.2, pitch: 1.1, volume: 1.0 },
                    calm: { rate: 0.8, pitch: 0.9, volume: 0.6 },
                    angry: { rate: 1.3, pitch: 1.2, volume: 0.95 },
                    neutral: { rate: 1.0, pitch: 1.0, volume: 0.8 },
                },
                currentMood: voiceAudioState.mood.preset,
                moodHistory: [],
                autoDetect: true,
            },
        };

        try {
            window.voiceAudioController.updateSettings(controllerSettings);
            console.log('Voice controller settings updated');
        } catch (error) {
            console.error('Failed to update voice controller settings:', error);
        }
    }
}

function loadVoiceAudioSettings() {
    try {
        const saved = localStorage.getItem('voice-audio-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to ensure all properties exist
            voiceAudioState = mergeDeep(voiceAudioState, parsed);

            // Update UI elements with loaded settings
            updateUIFromState();
        }
    } catch (error) {
        console.error('Failed to load voice-audio settings:', error);
        // Reset to defaults on error
        voiceAudioState = {
            tts: {
                enabled: false,
                voice: 'Microsoft David - English (United States)',
                rate: 1.0,
                pitch: 1.0,
                volume: 0.8,
            },
            input: {
                enabled: false,
                pushToTalk: false,
            },
            background: {
                enabled: false,
                style: 'tavern',
            },
            characters: {
                sync: false,
                defaultProfile: 'storyteller',
            },
            mood: {
                enabled: false,
                preset: 'serene',
            },
        };
    }
}

// Simple deep merge function
function mergeDeep(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = mergeDeep(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}

function saveVoiceAudioSettings() {
    try {
        localStorage.setItem('voice-audio-settings', JSON.stringify(voiceAudioState));
    } catch (error) {
        console.error('Failed to save voice-audio settings:', error);
    }
}

function updateUIFromState() {
    // Update TTS controls
    const ttsEnabled = document.getElementById('voice_audio_tts_enabled');
    const ttsVoice = document.getElementById('voice_audio_tts_voice');
    const ttsRate = document.getElementById('voice_audio_tts_rate');
    const ttsRateValue = document.getElementById('voice_audio_tts_rate_value');
    const ttsPitch = document.getElementById('voice_audio_tts_pitch');
    const ttsPitchValue = document.getElementById('voice_audio_tts_pitch_value');
    const ttsVolume = document.getElementById('voice_audio_tts_volume');
    const ttsVolumeValue = document.getElementById('voice_audio_tts_volume_value');

    if (ttsEnabled) ttsEnabled.checked = voiceAudioState.tts.enabled;
    if (ttsVoice) ttsVoice.value = voiceAudioState.tts.voice;
    if (ttsRate) {
        ttsRate.value = voiceAudioState.tts.rate || 1.0;
        if (ttsRateValue) ttsRateValue.textContent = `${(voiceAudioState.tts.rate || 1.0).toFixed(1)}x`;
    }
    if (ttsPitch) {
        ttsPitch.value = voiceAudioState.tts.pitch || 1.0;
        if (ttsPitchValue) ttsPitchValue.textContent = `${(voiceAudioState.tts.pitch || 1.0).toFixed(1)}x`;
    }
    if (ttsVolume) {
        ttsVolume.value = voiceAudioState.tts.volume || 0.8;
        if (ttsVolumeValue) ttsVolumeValue.textContent = `${Math.round((voiceAudioState.tts.volume || 0.8) * 100)}%`;
    }

    // Update Input controls
    const inputEnabled = document.getElementById('voice_audio_input_enabled');
    const inputPTT = document.getElementById('voice_audio_input_ptt');

    if (inputEnabled) inputEnabled.checked = voiceAudioState.input.enabled;
    if (inputPTT) inputPTT.checked = voiceAudioState.input.pushToTalk;

    // Update Background controls
    const backgroundEnabled = document.getElementById('voice_audio_background_enabled');
    const backgroundStyle = document.getElementById('voice_audio_background_style');

    if (backgroundEnabled) backgroundEnabled.checked = voiceAudioState.background.enabled;
    if (backgroundStyle) backgroundStyle.value = voiceAudioState.background.style;

    // Update Character controls
    const characterSync = document.getElementById('voice_audio_character_sync');
    const characterProfile = document.getElementById('voice_audio_character_profile');

    if (characterSync) characterSync.checked = voiceAudioState.characters.sync;
    if (characterProfile) characterProfile.value = voiceAudioState.characters.defaultProfile;

    // Update Mood controls
    const moodEnabled = document.getElementById('voice_audio_mood_enabled');
    const moodPreset = document.getElementById('voice_audio_mood_preset');

    if (moodEnabled) moodEnabled.checked = voiceAudioState.mood.enabled;
    if (moodPreset) moodPreset.value = voiceAudioState.mood.preset;
}

// Test function to simulate AI response TTS
export function testAITTS() {
    const sampleResponse = "Hello! This is a test of the automatic text-to-speech system. When AI responses are generated, they will be spoken automatically if TTS is enabled.";

    if (typeof window !== 'undefined' && window.voiceAudioController) {
        const ttsEnabled = document.getElementById('voice_audio_tts_enabled');
        if (ttsEnabled && ttsEnabled.checked) {
            console.log('Testing AI response TTS...');
            window.voiceAudioController.speak(sampleResponse);
        } else {
            console.log('TTS is disabled. Enable it in the voice-audio interface to test.');
        }
    }
}

// Debug function to show available voices
export async function showAvailableVoices() {
    if (typeof window !== 'undefined' && window.voiceAudioController) {
        // Ensure voices are loaded
        await window.voiceAudioController.loadVoices();

        const voices = window.voiceAudioController.getAvailableVoices();
        console.log('Available TTS Voices:');

        if (voices.length === 0) {
            console.log('No voices found. This might be because:');
            console.log('1. Voices are still loading (try again in a few seconds)');
            console.log('2. Your browser doesn\'t support speech synthesis');
            console.log('3. No TTS voices are installed on your system');
        } else {
            voices.forEach((voice, index) => {
                console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
            });

            // Show current voice being used
            const currentVoice = window.voiceAudioController.getVoice(voiceAudioState.tts.voice);
            if (currentVoice) {
                console.log(`Current voice: ${currentVoice.name} (${currentVoice.lang})`);
            }
        }

        return voices;
    }
    return [];
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeVoiceAudioInterface);
    } else {
        initializeVoiceAudioInterface();
    }

    // Expose debug functions globally
    window.showAvailableVoices = showAvailableVoices;
    window.testAITTS = testAITTS;
}

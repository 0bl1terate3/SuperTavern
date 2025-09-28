/**
 * Audio Studio Interface
 * Handles UI interactions for the Audio Studio
 */

let audioStudioState = {
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
};

/**
 * Initialize the Audio Studio Interface
 */
export function initializeAudioStudioInterface() {
    console.log('Initializing Audio Studio Interface...');
    loadAudioStudioSettings();
    setupEventListeners();
    updateUIFromState();
    console.log('Audio Studio Interface initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Toggle drawer
    document.getElementById('audio-studio-button')?.addEventListener('click', () => {
        const panel = document.getElementById('AudioStudio');
        const icon = document.querySelector('#audio-studio-button .drawer-icon');
        if (panel && icon) {
            panel.classList.toggle('closedDrawer');
            icon.classList.toggle('closedIcon');
        }
    });

    // Background Music
    document.getElementById('background_music_enabled')?.addEventListener('change', (e) => {
        audioStudioState.backgroundMusic.enabled = e.target.checked;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('music_theme')?.addEventListener('change', (e) => {
        audioStudioState.backgroundMusic.theme = e.target.value;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('music_volume')?.addEventListener('input', (e) => {
        audioStudioState.backgroundMusic.volume = parseInt(e.target.value);
        document.getElementById('music_volume_value').textContent = e.target.value + '%';
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('music_loop')?.addEventListener('change', (e) => {
        audioStudioState.backgroundMusic.loop = e.target.checked;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('music_play')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.playBackgroundMusic();
            toastr.success('Playing background music...');
        }
    });

    document.getElementById('music_pause')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.pauseBackgroundMusic();
            toastr.info('Background music paused');
        }
    });

    document.getElementById('music_stop')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.stopBackgroundMusic();
            toastr.info('Background music stopped');
        }
    });

    // Sound Effects
    document.getElementById('sound_effects_enabled')?.addEventListener('change', (e) => {
        audioStudioState.soundEffects.enabled = e.target.checked;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('effect_type')?.addEventListener('change', (e) => {
        audioStudioState.soundEffects.type = e.target.value;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('effect_volume')?.addEventListener('input', (e) => {
        audioStudioState.soundEffects.volume = parseInt(e.target.value);
        document.getElementById('effect_volume_value').textContent = e.target.value + '%';
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('effect_test')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.playSoundEffect(audioStudioState.soundEffects.type);
            toastr.success('Testing sound effect...');
        }
    });

    document.getElementById('effect_preview')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            const effects = ['notification', 'message', 'success', 'error', 'typing'];
            effects.forEach((effect, index) => {
                setTimeout(() => {
                    window.audioStudioController.playSoundEffect(effect);
                }, index * 500);
            });
            toastr.success('Previewing all sound effects...');
        }
    });

    // Audio Themes
    document.getElementById('audio_mood')?.addEventListener('change', (e) => {
        audioStudioState.audioThemes.mood = e.target.value;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('audio_intensity')?.addEventListener('input', (e) => {
        audioStudioState.audioThemes.intensity = parseInt(e.target.value);
        document.getElementById('audio_intensity_value').textContent = e.target.value;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('theme_apply')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.applyAudioTheme(
                audioStudioState.audioThemes.mood,
                audioStudioState.audioThemes.intensity
            );
            toastr.success('Audio theme applied!');
        }
    });

    document.getElementById('theme_save')?.addEventListener('click', () => {
        const themeName = prompt('Enter a name for this audio theme:');
        if (themeName) {
            // In a real implementation, you'd save the theme
            toastr.success(`Audio theme "${themeName}" saved!`);
        }
    });

    // Audio Settings
    document.getElementById('audio_quality')?.addEventListener('change', (e) => {
        audioStudioState.audioSettings.quality = e.target.value;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('audio_fade')?.addEventListener('input', (e) => {
        audioStudioState.audioSettings.fadeDuration = parseFloat(e.target.value);
        document.getElementById('audio_fade_value').textContent = e.target.value + 's';
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('audio_auto_play')?.addEventListener('change', (e) => {
        audioStudioState.audioSettings.autoPlay = e.target.checked;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    document.getElementById('audio_respect_focus')?.addEventListener('change', (e) => {
        audioStudioState.audioSettings.respectFocus = e.target.checked;
        updateAudioStudioControllerSettings();
        saveAudioStudioSettings();
    });

    // Audio Library
    document.getElementById('library_category')?.addEventListener('change', (e) => {
        updateAudioLibraryDisplay(e.target.value);
    });

    document.getElementById('library_upload')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    if (window.audioStudioController) {
                        window.audioStudioController.uploadAudioFile(file);
                        updateAudioLibraryDisplay();
                        toastr.success('Audio file uploaded!');
                    }
                } catch (error) {
                    console.error('Failed to upload audio file:', error);
                    toastr.error('Failed to upload audio file!');
                }
            }
        };
        input.click();
    });

    document.getElementById('library_remove')?.addEventListener('click', () => {
        const audioLibrary = document.getElementById('audio_library');
        const selectedId = audioLibrary.value;

        if (!selectedId) {
            toastr.warning('Please select an audio file to remove!');
            return;
        }

        if (confirm('Are you sure you want to remove this audio file?')) {
            if (window.audioStudioController) {
                window.audioStudioController.removeAudioFile(selectedId);
                updateAudioLibraryDisplay();
                toastr.success('Audio file removed!');
            }
        }
    });

    // Audio Actions
    document.getElementById('audio_mute_all')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.muteAllAudio();
            toastr.info('All audio muted!');
        }
    });

    document.getElementById('audio_unmute_all')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.unmuteAllAudio();
            toastr.success('All audio unmuted!');
        }
    });

    document.getElementById('audio_reset')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all audio settings?')) {
            resetAudioStudioState();
            updateUIFromState();
            updateAudioStudioControllerSettings();
            saveAudioStudioSettings();
            toastr.success('Audio settings reset!');
        }
    });

    document.getElementById('audio_test_all')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            window.audioStudioController.testAllAudio();
            toastr.success('Testing all audio...');
        }
    });

    // Import/Export
    document.getElementById('audio_import')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const importedConfig = JSON.parse(text);
                    window.audioStudioController.updateSettings(importedConfig);
                    loadAudioStudioSettings();
                    updateUIFromState();
                    toastr.success('Audio settings imported!');
                } catch (error) {
                    console.error('Failed to import audio settings:', error);
                    toastr.error('Failed to import audio settings!');
                }
            }
        };
        input.click();
    });

    document.getElementById('audio_export')?.addEventListener('click', () => {
        if (window.audioStudioController) {
            const config = window.audioStudioController.getSettings();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 4));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "audio_studio_settings.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            toastr.success('Audio settings exported!');
        }
    });

    // Listen for controller events
    if (window.audioStudioController) {
        window.audioStudioController.on('settingsUpdated', (settings) => {
            audioStudioState = settings;
            updateUIFromState();
        });

        window.audioStudioController.on('musicStarted', (track) => {
            toastr.success(`Now playing: ${track.name}`);
        });

        window.audioStudioController.on('musicPaused', () => {
            toastr.info('Background music paused');
        });

        window.audioStudioController.on('musicStopped', () => {
            toastr.info('Background music stopped');
        });

        window.audioStudioController.on('soundEffectPlayed', (data) => {
            console.log('Sound effect played:', data);
        });

        window.audioStudioController.on('themeApplied', (data) => {
            toastr.success(`Audio theme applied: ${data.mood} (intensity: ${data.intensity})`);
        });

        window.audioStudioController.on('audioTested', () => {
            toastr.success('Audio test completed!');
        });
    }
}

/**
 * Update Audio Studio Controller settings
 */
function updateAudioStudioControllerSettings() {
    if (window.audioStudioController) {
        window.audioStudioController.updateSettings(audioStudioState);
        console.log('Audio Studio controller settings updated');
    }
}

/**
 * Load Audio Studio settings
 */
function loadAudioStudioSettings() {
    try {
        const saved = localStorage.getItem('audio-studio-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            audioStudioState = mergeDeep(audioStudioState, parsed);
            updateUIFromState();
        }
    } catch (error) {
        console.error('Failed to load audio studio settings:', error);
        audioStudioState = {
            enabled: false,
            backgroundMusic: { enabled: false, theme: 'none', volume: 50, loop: false, isPlaying: false, currentTrack: null },
            soundEffects: { enabled: false, type: 'notification', volume: 30 },
            audioThemes: { mood: 'neutral', intensity: 5 },
            audioSettings: { quality: 'medium', fadeDuration: 1.0, autoPlay: false, respectFocus: true },
            audioLibrary: [],
        };
        updateUIFromState();
    }
}

/**
 * Save Audio Studio settings
 */
function saveAudioStudioSettings() {
    localStorage.setItem('audio-studio-settings', JSON.stringify(audioStudioState));
}

/**
 * Update UI from state
 */
function updateUIFromState() {
    document.getElementById('background_music_enabled').checked = audioStudioState.backgroundMusic.enabled;
    document.getElementById('music_theme').value = audioStudioState.backgroundMusic.theme;
    document.getElementById('music_volume').value = audioStudioState.backgroundMusic.volume;
    document.getElementById('music_volume_value').textContent = audioStudioState.backgroundMusic.volume + '%';
    document.getElementById('music_loop').checked = audioStudioState.backgroundMusic.loop;

    document.getElementById('sound_effects_enabled').checked = audioStudioState.soundEffects.enabled;
    document.getElementById('effect_type').value = audioStudioState.soundEffects.type;
    document.getElementById('effect_volume').value = audioStudioState.soundEffects.volume;
    document.getElementById('effect_volume_value').textContent = audioStudioState.soundEffects.volume + '%';

    document.getElementById('audio_mood').value = audioStudioState.audioThemes.mood;
    document.getElementById('audio_intensity').value = audioStudioState.audioThemes.intensity;
    document.getElementById('audio_intensity_value').textContent = audioStudioState.audioThemes.intensity;

    document.getElementById('audio_quality').value = audioStudioState.audioSettings.quality;
    document.getElementById('audio_fade').value = audioStudioState.audioSettings.fadeDuration;
    document.getElementById('audio_fade_value').textContent = audioStudioState.audioSettings.fadeDuration + 's';
    document.getElementById('audio_auto_play').checked = audioStudioState.audioSettings.autoPlay;
    document.getElementById('audio_respect_focus').checked = audioStudioState.audioSettings.respectFocus;

    updateAudioLibraryDisplay();
}

/**
 * Update audio library display
 * @param {string} category Category filter
 */
function updateAudioLibraryDisplay(category = 'all') {
    const audioLibrary = document.getElementById('audio_library');
    if (!audioLibrary) return;

    audioLibrary.innerHTML = '<option value="">No audio files</option>';

    if (window.audioStudioController) {
        const library = window.audioStudioController.getAudioLibrary(category);
        library.forEach(audio => {
            const option = document.createElement('option');
            option.value = audio.id;
            option.textContent = audio.name;
            audioLibrary.appendChild(option);
        });
    }
}

/**
 * Reset Audio Studio state
 */
function resetAudioStudioState() {
    audioStudioState = {
        enabled: false,
        backgroundMusic: { enabled: false, theme: 'none', volume: 50, loop: false, isPlaying: false, currentTrack: null },
        soundEffects: { enabled: false, type: 'notification', volume: 30 },
        audioThemes: { mood: 'neutral', intensity: 5 },
        audioSettings: { quality: 'medium', fadeDuration: 1.0, autoPlay: false, respectFocus: true },
        audioLibrary: [],
    };
}

/**
 * Deep merge objects
 * @param {object} target Target object
 * @param {object} source Source object
 * @returns {object} Merged object
 */
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

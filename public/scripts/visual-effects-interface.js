/**
 * Visual Effects Interface
 * Handles UI interactions for the Visual Effects Studio
 */

let visualEffectsState = {
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

/**
 * Initialize the Visual Effects Interface
 */
export function initializeVisualEffectsInterface() {
    console.log('Initializing Visual Effects Interface...');
    loadVisualEffectsSettings();
    setupEventListeners();
    updateUIFromState();
    console.log('Visual Effects Interface initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Toggle drawer
    document.getElementById('visual-effects-button')?.addEventListener('click', () => {
        const panel = document.getElementById('VisualEffectsStudio');
        const icon = document.querySelector('#visual-effects-button .drawer-icon');
        if (panel && icon) {
            panel.classList.toggle('closedDrawer');
            icon.classList.toggle('closedIcon');
        }
    });

    // Message Effects
    document.getElementById('message_effects_enabled')?.addEventListener('change', (e) => {
        visualEffectsState.enabled = e.target.checked;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('message_entrance_effect')?.addEventListener('change', (e) => {
        visualEffectsState.messageEffects.entrance = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('message_exit_effect')?.addEventListener('change', (e) => {
        visualEffectsState.messageEffects.exit = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('message_highlight_effect')?.addEventListener('change', (e) => {
        visualEffectsState.messageEffects.highlight = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('message_particles')?.addEventListener('change', (e) => {
        visualEffectsState.messageEffects.particles = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    // Screen Effects
    document.getElementById('screen_transitions')?.addEventListener('change', (e) => {
        visualEffectsState.screenEffects.transitions = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('background_effects')?.addEventListener('change', (e) => {
        visualEffectsState.screenEffects.background = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('typing_animation')?.addEventListener('change', (e) => {
        visualEffectsState.screenEffects.typing = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('cursor_effects')?.addEventListener('change', (e) => {
        visualEffectsState.screenEffects.cursor = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    // Color Effects
    document.getElementById('color_theme')?.addEventListener('change', (e) => {
        visualEffectsState.colorEffects.theme = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('text_effects')?.addEventListener('change', (e) => {
        visualEffectsState.colorEffects.textEffects = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('accent_color')?.addEventListener('change', (e) => {
        visualEffectsState.colorEffects.accentColor = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('effect_intensity')?.addEventListener('input', (e) => {
        visualEffectsState.colorEffects.intensity = parseInt(e.target.value);
        document.getElementById('effect_intensity_value').textContent = e.target.value + '%';
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    // Animation Settings
    document.getElementById('animation_speed')?.addEventListener('input', (e) => {
        visualEffectsState.animationSettings.speed = parseFloat(e.target.value);
        document.getElementById('animation_speed_value').textContent = e.target.value + 'x';
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('animation_duration')?.addEventListener('input', (e) => {
        visualEffectsState.animationSettings.duration = parseFloat(e.target.value);
        document.getElementById('animation_duration_value').textContent = e.target.value + 's';
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('easing_function')?.addEventListener('change', (e) => {
        visualEffectsState.animationSettings.easing = e.target.value;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('animation_delay')?.addEventListener('input', (e) => {
        visualEffectsState.animationSettings.delay = parseFloat(e.target.value);
        document.getElementById('animation_delay_value').textContent = e.target.value + 's';
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    // Special Effects
    document.getElementById('special_glitch')?.addEventListener('change', (e) => {
        visualEffectsState.specialEffects.glitch = e.target.checked;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('special_matrix')?.addEventListener('change', (e) => {
        visualEffectsState.specialEffects.matrix = e.target.checked;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('special_cyberpunk')?.addEventListener('change', (e) => {
        visualEffectsState.specialEffects.cyberpunk = e.target.checked;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('special_hologram')?.addEventListener('change', (e) => {
        visualEffectsState.specialEffects.hologram = e.target.checked;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    document.getElementById('special_retro')?.addEventListener('change', (e) => {
        visualEffectsState.specialEffects.retro = e.target.checked;
        updateVisualEffectsControllerSettings();
        saveVisualEffectsSettings();
    });

    // Visual Actions
    document.getElementById('visual_preview')?.addEventListener('click', () => {
        window.visualEffectsController.previewEffects();
        toastr.info('Previewing visual effects...');
    });

    document.getElementById('visual_test')?.addEventListener('click', () => {
        window.visualEffectsController.testEffects();
        toastr.success('Testing visual effects...');
    });

    document.getElementById('visual_reset')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all visual effects?')) {
            window.visualEffectsController.resetEffects();
            resetVisualEffectsState();
            updateUIFromState();
            toastr.success('Visual effects reset!');
        }
    });

    document.getElementById('visual_export')?.addEventListener('click', () => {
        const config = window.visualEffectsController.exportEffects();
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visual_effects_config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastr.success('Visual effects configuration exported!');
    });

    // Import/Export
    document.getElementById('visual_effects_import')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const importedConfig = JSON.parse(text);
                    window.visualEffectsController.updateSettings(importedConfig);
                    loadVisualEffectsSettings();
                    updateUIFromState();
                    toastr.success('Visual effects configuration imported!');
                } catch (error) {
                    console.error('Failed to import visual effects configuration:', error);
                    toastr.error('Failed to import visual effects configuration!');
                }
            }
        };
        input.click();
    });

    document.getElementById('visual_effects_export')?.addEventListener('click', () => {
        const config = window.visualEffectsController.getSettings();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 4));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "visual_effects_settings.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toastr.success('Visual effects settings exported!');
    });

    // Listen for controller events
    if (window.visualEffectsController) {
        window.visualEffectsController.on('settingsUpdated', (settings) => {
            visualEffectsState = settings;
            updateUIFromState();
        });

        window.visualEffectsController.on('effectsPreviewed', () => {
            toastr.info('Effects previewed!');
        });

        window.visualEffectsController.on('effectsTested', () => {
            toastr.success('Effects tested!');
        });

        window.visualEffectsController.on('effectsReset', () => {
            toastr.info('Effects reset!');
        });
    }
}

/**
 * Update Visual Effects Controller settings
 */
function updateVisualEffectsControllerSettings() {
    if (window.visualEffectsController) {
        window.visualEffectsController.updateSettings(visualEffectsState);
        console.log('Visual Effects controller settings updated');
    }
}

/**
 * Load Visual Effects settings
 */
function loadVisualEffectsSettings() {
    try {
        const saved = localStorage.getItem('visual-effects-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            visualEffectsState = mergeDeep(visualEffectsState, parsed);
            updateUIFromState();
        }
    } catch (error) {
        console.error('Failed to load visual effects settings:', error);
        visualEffectsState = {
            enabled: false,
            messageEffects: { entrance: 'none', exit: 'none', highlight: 'none', particles: 'none' },
            screenEffects: { transitions: 'none', background: 'none', typing: 'none', cursor: 'none' },
            colorEffects: { theme: 'default', textEffects: 'none', accentColor: '#00ff88', intensity: 50 },
            animationSettings: { speed: 1.0, duration: 1.0, easing: 'ease', delay: 0.0 },
            specialEffects: { glitch: false, matrix: false, cyberpunk: false, hologram: false, retro: false },
        };
        updateUIFromState();
    }
}

/**
 * Save Visual Effects settings
 */
function saveVisualEffectsSettings() {
    localStorage.setItem('visual-effects-settings', JSON.stringify(visualEffectsState));
}

/**
 * Update UI from state
 */
function updateUIFromState() {
    // Message Effects
    document.getElementById('message_effects_enabled').checked = visualEffectsState.enabled;
    document.getElementById('message_entrance_effect').value = visualEffectsState.messageEffects.entrance;
    document.getElementById('message_exit_effect').value = visualEffectsState.messageEffects.exit;
    document.getElementById('message_highlight_effect').value = visualEffectsState.messageEffects.highlight;
    document.getElementById('message_particles').value = visualEffectsState.messageEffects.particles;

    // Screen Effects
    document.getElementById('screen_transitions').value = visualEffectsState.screenEffects.transitions;
    document.getElementById('background_effects').value = visualEffectsState.screenEffects.background;
    document.getElementById('typing_animation').value = visualEffectsState.screenEffects.typing;
    document.getElementById('cursor_effects').value = visualEffectsState.screenEffects.cursor;

    // Color Effects
    document.getElementById('color_theme').value = visualEffectsState.colorEffects.theme;
    document.getElementById('text_effects').value = visualEffectsState.colorEffects.textEffects;
    document.getElementById('accent_color').value = visualEffectsState.colorEffects.accentColor;
    document.getElementById('effect_intensity').value = visualEffectsState.colorEffects.intensity;
    document.getElementById('effect_intensity_value').textContent = visualEffectsState.colorEffects.intensity + '%';

    // Animation Settings
    document.getElementById('animation_speed').value = visualEffectsState.animationSettings.speed;
    document.getElementById('animation_speed_value').textContent = visualEffectsState.animationSettings.speed + 'x';
    document.getElementById('animation_duration').value = visualEffectsState.animationSettings.duration;
    document.getElementById('animation_duration_value').textContent = visualEffectsState.animationSettings.duration + 's';
    document.getElementById('easing_function').value = visualEffectsState.animationSettings.easing;
    document.getElementById('animation_delay').value = visualEffectsState.animationSettings.delay;
    document.getElementById('animation_delay_value').textContent = visualEffectsState.animationSettings.delay + 's';

    // Special Effects
    document.getElementById('special_glitch').checked = visualEffectsState.specialEffects.glitch;
    document.getElementById('special_matrix').checked = visualEffectsState.specialEffects.matrix;
    document.getElementById('special_cyberpunk').checked = visualEffectsState.specialEffects.cyberpunk;
    document.getElementById('special_hologram').checked = visualEffectsState.specialEffects.hologram;
    document.getElementById('special_retro').checked = visualEffectsState.specialEffects.retro;
}

/**
 * Reset Visual Effects state
 */
function resetVisualEffectsState() {
    visualEffectsState = {
        enabled: false,
        messageEffects: { entrance: 'none', exit: 'none', highlight: 'none', particles: 'none' },
        screenEffects: { transitions: 'none', background: 'none', typing: 'none', cursor: 'none' },
        colorEffects: { theme: 'default', textEffects: 'none', accentColor: '#00ff88', intensity: 50 },
        animationSettings: { speed: 1.0, duration: 1.0, easing: 'ease', delay: 0.0 },
        specialEffects: { glitch: false, matrix: false, cyberpunk: false, hologram: false, retro: false },
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

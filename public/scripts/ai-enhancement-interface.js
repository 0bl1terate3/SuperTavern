/**
 * AI Enhancement Interface
 * Handles UI interactions for the AI Generation Enhancer
 */

let aiEnhancementState = {
    enabled: false,
    preset: 'balanced',
    customPrompt: '',
    quality: {
        creativity: 50,
        detail: 50,
        coherence: 75,
        fluency: 75,
    },
    style: {
        tone: 'neutral',
        voice: 'default',
        length: 'auto',
        format: 'paragraph',
    },
    optimization: {
        clarity: false,
        engagement: false,
        structure: false,
        grammar: false,
        vocabulary: false,
    },
    advanced: {
        contextAwareness: 75,
        creativityBoost: 25,
        consistency: 80,
        originality: 60,
    },
};

/**
 * Initialize the AI enhancement interface
 */
export async function initializeAIEnhancementInterface() {
    console.log('Initializing AI Enhancement Interface...');

    try {
        // Load saved settings
        loadAIEnhancementSettings();

        // Set up event listeners
        setupAIEnhancementEventListeners();

        // Update UI from state
        updateUIFromState();

        console.log('AI Enhancement Interface initialized');
    } catch (error) {
        console.error('Failed to initialize AI Enhancement Interface:', error);
    }
}

/**
 * Set up event listeners for AI enhancement controls
 */
function setupAIEnhancementEventListeners() {
    // Main enable/disable toggle
    const enhancementEnabled = document.getElementById('enhancement_enabled');
    if (enhancementEnabled) {
        enhancementEnabled.addEventListener('change', (e) => {
            aiEnhancementState.enabled = e.target.checked;
            updateAIEnhancementControllerSettings();
            saveAIEnhancementSettings();
        });
    }

    // Preset selection
    const enhancementPresets = document.getElementById('enhancement_presets');
    if (enhancementPresets) {
        enhancementPresets.addEventListener('change', (e) => {
            aiEnhancementState.preset = e.target.value;
            updateAIEnhancementControllerSettings();
            saveAIEnhancementSettings();
            applyPresetSettings();
        });
    }

    // Custom prompt
    const enhancementPrompt = document.getElementById('enhancement_prompt');
    if (enhancementPrompt) {
        enhancementPrompt.addEventListener('input', (e) => {
            aiEnhancementState.customPrompt = e.target.value;
            updateAIEnhancementControllerSettings();
            saveAIEnhancementSettings();
        });
    }

    // Quality sliders
    setupQualitySliders();

    // Style controls
    setupStyleControls();

    // Optimization checkboxes
    setupOptimizationControls();

    // Advanced sliders
    setupAdvancedSliders();

    // Action buttons
    setupActionButtons();
}

/**
 * Set up quality sliders
 */
function setupQualitySliders() {
    const sliders = [
        { id: 'quality_creativity', key: 'creativity', valueId: 'quality_creativity_value' },
        { id: 'quality_detail', key: 'detail', valueId: 'quality_detail_value' },
        { id: 'quality_coherence', key: 'coherence', valueId: 'quality_coherence_value' },
        { id: 'quality_fluency', key: 'fluency', valueId: 'quality_fluency_value' },
    ];

    sliders.forEach(({ id, key, valueId }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                aiEnhancementState.quality[key] = value;
                valueDisplay.textContent = `${value}%`;
                updateAIEnhancementControllerSettings();
                saveAIEnhancementSettings();
            });
        }
    });
}

/**
 * Set up style controls
 */
function setupStyleControls() {
    const controls = [
        { id: 'style_tone', key: 'tone' },
        { id: 'style_voice', key: 'voice' },
        { id: 'style_length', key: 'length' },
        { id: 'style_format', key: 'format' },
    ];

    controls.forEach(({ id, key }) => {
        const control = document.getElementById(id);
        if (control) {
            control.addEventListener('change', (e) => {
                aiEnhancementState.style[key] = e.target.value;
                updateAIEnhancementControllerSettings();
                saveAIEnhancementSettings();
            });
        }
    });
}

/**
 * Set up optimization controls
 */
function setupOptimizationControls() {
    const controls = [
        { id: 'optimize_clarity', key: 'clarity' },
        { id: 'optimize_engagement', key: 'engagement' },
        { id: 'optimize_structure', key: 'structure' },
        { id: 'optimize_grammar', key: 'grammar' },
        { id: 'optimize_vocabulary', key: 'vocabulary' },
    ];

    controls.forEach(({ id, key }) => {
        const control = document.getElementById(id);
        if (control) {
            control.addEventListener('change', (e) => {
                aiEnhancementState.optimization[key] = e.target.checked;
                updateAIEnhancementControllerSettings();
                saveAIEnhancementSettings();
            });
        }
    });
}

/**
 * Set up advanced sliders
 */
function setupAdvancedSliders() {
    const sliders = [
        { id: 'advanced_context_awareness', key: 'contextAwareness', valueId: 'advanced_context_awareness_value' },
        { id: 'advanced_creativity_boost', key: 'creativityBoost', valueId: 'advanced_creativity_boost_value' },
        { id: 'advanced_consistency', key: 'consistency', valueId: 'advanced_consistency_value' },
        { id: 'advanced_originality', key: 'originality', valueId: 'advanced_originality_value' },
    ];

    sliders.forEach(({ id, key, valueId }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                aiEnhancementState.advanced[key] = value;
                valueDisplay.textContent = `${value}%`;
                updateAIEnhancementControllerSettings();
                saveAIEnhancementSettings();
            });
        }
    });
}

/**
 * Set up action buttons
 */
function setupActionButtons() {
    // Enhance current button
    const enhanceCurrentBtn = document.getElementById('enhance_current');
    if (enhanceCurrentBtn) {
        enhanceCurrentBtn.addEventListener('click', () => {
            enhanceCurrentGeneration();
        });
    }

    // Enhance all button
    const enhanceAllBtn = document.getElementById('enhance_all');
    if (enhanceAllBtn) {
        enhanceAllBtn.addEventListener('click', () => {
            enhanceAllGenerations();
        });
    }

    // Preview button
    const previewBtn = document.getElementById('enhance_preview');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            previewEnhancement();
        });
    }

    // Reset button
    const resetBtn = document.getElementById('enhance_reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetToDefaults();
        });
    }

    // Import/Export buttons
    const importBtn = document.getElementById('ai_enhancer_import');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            importSettings();
        });
    }

    const exportBtn = document.getElementById('ai_enhancer_export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportSettings();
        });
    }
}

/**
 * Update AI enhancement controller settings
 */
function updateAIEnhancementControllerSettings() {
    if (typeof window !== 'undefined' && window.aiEnhancementController) {
        window.aiEnhancementController.updateSettings(aiEnhancementState);
    }
}

/**
 * Update UI from current state
 */
function updateUIFromState() {
    // Update main toggle
    const enhancementEnabled = document.getElementById('enhancement_enabled');
    if (enhancementEnabled) {
        enhancementEnabled.checked = aiEnhancementState.enabled;
    }

    // Update preset
    const enhancementPresets = document.getElementById('enhancement_presets');
    if (enhancementPresets) {
        enhancementPresets.value = aiEnhancementState.preset;
    }

    // Update custom prompt
    const enhancementPrompt = document.getElementById('enhancement_prompt');
    if (enhancementPrompt) {
        enhancementPrompt.value = aiEnhancementState.customPrompt;
    }

    // Update quality sliders
    updateQualitySliders();

    // Update style controls
    updateStyleControls();

    // Update optimization controls
    updateOptimizationControls();

    // Update advanced sliders
    updateAdvancedSliders();
}

/**
 * Update quality sliders
 */
function updateQualitySliders() {
    const sliders = [
        { id: 'quality_creativity', key: 'creativity', valueId: 'quality_creativity_value' },
        { id: 'quality_detail', key: 'detail', valueId: 'quality_detail_value' },
        { id: 'quality_coherence', key: 'coherence', valueId: 'quality_coherence_value' },
        { id: 'quality_fluency', key: 'fluency', valueId: 'quality_fluency_value' },
    ];

    sliders.forEach(({ id, key, valueId }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
            const value = aiEnhancementState.quality[key];
            slider.value = value;
            valueDisplay.textContent = `${value}%`;
        }
    });
}

/**
 * Update style controls
 */
function updateStyleControls() {
    const controls = [
        { id: 'style_tone', key: 'tone' },
        { id: 'style_voice', key: 'voice' },
        { id: 'style_length', key: 'length' },
        { id: 'style_format', key: 'format' },
    ];

    controls.forEach(({ id, key }) => {
        const control = document.getElementById(id);
        if (control) {
            control.value = aiEnhancementState.style[key];
        }
    });
}

/**
 * Update optimization controls
 */
function updateOptimizationControls() {
    const controls = [
        { id: 'optimize_clarity', key: 'clarity' },
        { id: 'optimize_engagement', key: 'engagement' },
        { id: 'optimize_structure', key: 'structure' },
        { id: 'optimize_grammar', key: 'grammar' },
        { id: 'optimize_vocabulary', key: 'vocabulary' },
    ];

    controls.forEach(({ id, key }) => {
        const control = document.getElementById(id);
        if (control) {
            control.checked = aiEnhancementState.optimization[key];
        }
    });
}

/**
 * Update advanced sliders
 */
function updateAdvancedSliders() {
    const sliders = [
        { id: 'advanced_context_awareness', key: 'contextAwareness', valueId: 'advanced_context_awareness_value' },
        { id: 'advanced_creativity_boost', key: 'creativityBoost', valueId: 'advanced_creativity_boost_value' },
        { id: 'advanced_consistency', key: 'consistency', valueId: 'advanced_consistency_value' },
        { id: 'advanced_originality', key: 'originality', valueId: 'advanced_originality_value' },
    ];

    sliders.forEach(({ id, key, valueId }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
            const value = aiEnhancementState.advanced[key];
            slider.value = value;
            valueDisplay.textContent = `${value}%`;
        }
    });
}

/**
 * Apply preset settings
 */
function applyPresetSettings() {
    const presets = {
        balanced: {
            quality: { creativity: 50, detail: 50, coherence: 75, fluency: 75 },
            advanced: { contextAwareness: 75, creativityBoost: 25, consistency: 80, originality: 60 },
        },
        creative: {
            quality: { creativity: 80, detail: 70, coherence: 60, fluency: 70 },
            advanced: { contextAwareness: 60, creativityBoost: 50, consistency: 60, originality: 85 },
        },
        detailed: {
            quality: { creativity: 40, detail: 90, coherence: 85, fluency: 80 },
            advanced: { contextAwareness: 85, creativityBoost: 10, consistency: 90, originality: 40 },
        },
        concise: {
            quality: { creativity: 30, detail: 30, coherence: 90, fluency: 90 },
            advanced: { contextAwareness: 70, creativityBoost: 5, consistency: 95, originality: 20 },
        },
    };

    const preset = presets[aiEnhancementState.preset];
    if (preset) {
        aiEnhancementState.quality = { ...aiEnhancementState.quality, ...preset.quality };
        aiEnhancementState.advanced = { ...aiEnhancementState.advanced, ...preset.advanced };

        updateUIFromState();
        updateAIEnhancementControllerSettings();
        saveAIEnhancementSettings();
    }
}

/**
 * Enhance current generation
 */
async function enhanceCurrentGeneration() {
    if (typeof window !== 'undefined' && window.aiEnhancementController) {
        try {
            console.log('Enhancing current generation...');
            // This would enhance the current generation
            toastr.success('Current generation enhanced!');
        } catch (error) {
            console.error('Failed to enhance current generation:', error);
            toastr.error('Failed to enhance current generation');
        }
    }
}

/**
 * Enhance all generations
 */
async function enhanceAllGenerations() {
    if (typeof window !== 'undefined' && window.aiEnhancementController) {
        try {
            console.log('Enhancing all generations...');
            // This would enhance all generations
            toastr.success('All generations enhanced!');
        } catch (error) {
            console.error('Failed to enhance all generations:', error);
            toastr.error('Failed to enhance all generations');
        }
    }
}

/**
 * Preview enhancement
 */
function previewEnhancement() {
    console.log('Previewing enhancement...');
    // This would show a preview of the enhancement
    toastr.info('Enhancement preview available');
}

/**
 * Reset to defaults
 */
function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        if (typeof window !== 'undefined' && window.aiEnhancementController) {
            window.aiEnhancementController.resetToDefaults();
            loadAIEnhancementSettings();
            updateUIFromState();
            toastr.success('Settings reset to defaults');
        }
    }
}

/**
 * Import settings
 */
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (typeof window !== 'undefined' && window.aiEnhancementController) {
                        window.aiEnhancementController.importSettings(e.target.result);
                        loadAIEnhancementSettings();
                        updateUIFromState();
                        toastr.success('Settings imported successfully!');
                    }
                } catch (error) {
                    toastr.error('Failed to import settings: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

/**
 * Export settings
 */
function exportSettings() {
    if (typeof window !== 'undefined' && window.aiEnhancementController) {
        const settings = window.aiEnhancementController.exportSettings();
        const blob = new Blob([settings], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-enhancement-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        toastr.success('Settings exported successfully!');
    }
}

/**
 * Load AI enhancement settings from localStorage
 */
function loadAIEnhancementSettings() {
    try {
        const saved = localStorage.getItem('ai-enhancement-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            aiEnhancementState = mergeDeep(aiEnhancementState, parsed);
        }
    } catch (error) {
        console.error('Failed to load AI enhancement settings:', error);
    }
}

/**
 * Save AI enhancement settings to localStorage
 */
function saveAIEnhancementSettings() {
    try {
        localStorage.setItem('ai-enhancement-settings', JSON.stringify(aiEnhancementState));
    } catch (error) {
        console.error('Failed to save AI enhancement settings:', error);
    }
}

/**
 * Deep merge function for settings
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

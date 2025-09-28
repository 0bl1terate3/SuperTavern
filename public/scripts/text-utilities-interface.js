/**
 * Text Utilities Interface
 * Handles UI interactions for the Text Utilities
 */

let textUtilitiesState = {
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

/**
 * Initialize the text utilities interface
 */
export async function initializeTextUtilitiesInterface() {
    console.log('Initializing Text Utilities Interface...');

    try {
        // Load saved settings
        loadTextUtilitiesSettings();

        // Set up event listeners
        setupTextUtilitiesEventListeners();

        // Update UI from state
        updateUIFromState();

        console.log('Text Utilities Interface initialized');
    } catch (error) {
        console.error('Failed to initialize Text Utilities Interface:', error);
    }
}

/**
 * Set up event listeners for text utilities controls
 */
function setupTextUtilitiesEventListeners() {
    // Text formatting toggle
    const textFormatEnabled = document.getElementById('text_format_enabled');
    if (textFormatEnabled) {
        textFormatEnabled.addEventListener('change', (e) => {
            textUtilitiesState.enabled = e.target.checked;
            updateTextUtilitiesControllerSettings();
            saveTextUtilitiesSettings();
        });
    }

    // Text input
    const textInput = document.getElementById('text_input');
    if (textInput) {
        textInput.addEventListener('input', (e) => {
            textUtilitiesState.text = e.target.value;
            updateTextUtilitiesControllerSettings();
            saveTextUtilitiesSettings();
            updateTextAnalysis();
        });
    }

    // Text formatters
    setupTextFormatterControls();

    // Text analyzers
    setupTextAnalyzerControls();

    // Text generators
    setupTextGeneratorControls();

    // Text tools
    setupTextToolControls();

    // Text converters
    setupTextConverterControls();

    // Text actions
    setupTextActionControls();

    // Import/Export buttons
    setupTextUtilitiesImportExportControls();
}

/**
 * Set up text formatter controls
 */
function setupTextFormatterControls() {
    const textUppercase = document.getElementById('text_uppercase');
    if (textUppercase) {
        textUppercase.addEventListener('click', () => {
            formatText('uppercase');
        });
    }

    const textLowercase = document.getElementById('text_lowercase');
    if (textLowercase) {
        textLowercase.addEventListener('click', () => {
            formatText('lowercase');
        });
    }

    const textTitlecase = document.getElementById('text_titlecase');
    if (textTitlecase) {
        textTitlecase.addEventListener('click', () => {
            formatText('titlecase');
        });
    }

    const textSentencecase = document.getElementById('text_sentencecase');
    if (textSentencecase) {
        textSentencecase.addEventListener('click', () => {
            formatText('sentencecase');
        });
    }
}

/**
 * Set up text analyzer controls
 */
function setupTextAnalyzerControls() {
    const textAnalyze = document.getElementById('text_analyze');
    if (textAnalyze) {
        textAnalyze.addEventListener('click', () => {
            analyzeText();
        });
    }

    const textReadability = document.getElementById('text_readability');
    if (textReadability) {
        textReadability.addEventListener('click', () => {
            checkReadability();
        });
    }
}

/**
 * Set up text generator controls
 */
function setupTextGeneratorControls() {
    const textGenerate = document.getElementById('text_generate');
    if (textGenerate) {
        textGenerate.addEventListener('click', () => {
            generateText();
        });
    }

    const textCopy = document.getElementById('text_copy');
    if (textCopy) {
        textCopy.addEventListener('click', () => {
            copyText();
        });
    }
}

/**
 * Set up text tool controls
 */
function setupTextToolControls() {
    const textRemoveSpaces = document.getElementById('text_remove_spaces');
    if (textRemoveSpaces) {
        textRemoveSpaces.addEventListener('click', () => {
            processText('removeSpaces');
        });
    }

    const textRemoveLines = document.getElementById('text_remove_lines');
    if (textRemoveLines) {
        textRemoveLines.addEventListener('click', () => {
            processText('removeLines');
        });
    }

    const textReverse = document.getElementById('text_reverse');
    if (textReverse) {
        textReverse.addEventListener('click', () => {
            processText('reverse');
        });
    }

    const textSortLines = document.getElementById('text_sort_lines');
    if (textSortLines) {
        textSortLines.addEventListener('click', () => {
            processText('sortLines');
        });
    }

    const textDuplicate = document.getElementById('text_duplicate');
    if (textDuplicate) {
        textDuplicate.addEventListener('click', () => {
            processText('duplicate');
        });
    }

    const textClear = document.getElementById('text_clear');
    if (textClear) {
        textClear.addEventListener('click', () => {
            clearText();
        });
    }
}

/**
 * Set up text converter controls
 */
function setupTextConverterControls() {
    const textToMd = document.getElementById('text_to_md');
    if (textToMd) {
        textToMd.addEventListener('click', () => {
            convertText('markdown');
        });
    }

    const textToHtml = document.getElementById('text_to_html');
    if (textToHtml) {
        textToHtml.addEventListener('click', () => {
            convertText('html');
        });
    }

    const textToJson = document.getElementById('text_to_json');
    if (textToJson) {
        textToJson.addEventListener('click', () => {
            convertText('json');
        });
    }

    const textToCsv = document.getElementById('text_to_csv');
    if (textToCsv) {
        textToCsv.addEventListener('click', () => {
            convertText('csv');
        });
    }
}

/**
 * Set up text action controls
 */
function setupTextActionControls() {
    const textSave = document.getElementById('text_save');
    if (textSave) {
        textSave.addEventListener('click', () => {
            saveText();
        });
    }

    const textLoad = document.getElementById('text_load');
    if (textLoad) {
        textLoad.addEventListener('click', () => {
            loadText();
        });
    }

    const textExport = document.getElementById('text_export');
    if (textExport) {
        textExport.addEventListener('click', () => {
            exportText();
        });
    }

    const textReset = document.getElementById('text_reset');
    if (textReset) {
        textReset.addEventListener('click', () => {
            resetTextUtilities();
        });
    }
}

/**
 * Set up import/export controls
 */
function setupTextUtilitiesImportExportControls() {
    const textUtilsImport = document.getElementById('text_utils_import');
    if (textUtilsImport) {
        textUtilsImport.addEventListener('click', () => {
            importTextUtilitiesSettings();
        });
    }

    const textUtilsExport = document.getElementById('text_utils_export');
    if (textUtilsExport) {
        textUtilsExport.addEventListener('click', () => {
            exportTextUtilitiesSettings();
        });
    }
}

/**
 * Update text utilities controller settings
 */
function updateTextUtilitiesControllerSettings() {
    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        window.textUtilitiesController.updateSettings(textUtilitiesState);
    }
}

/**
 * Update UI from current state
 */
function updateUIFromState() {
    // Update text formatting toggle
    const textFormatEnabled = document.getElementById('text_format_enabled');
    if (textFormatEnabled) {
        textFormatEnabled.checked = textUtilitiesState.enabled;
    }

    // Update text input
    const textInput = document.getElementById('text_input');
    if (textInput) {
        textInput.value = textUtilitiesState.text;
    }

    // Update generator settings
    const generatorType = document.getElementById('generator_type');
    if (generatorType) {
        generatorType.value = textUtilitiesState.generators.type;
    }

    const generatorLength = document.getElementById('generator_length');
    if (generatorLength) {
        generatorLength.value = textUtilitiesState.generators.length;
    }
}

/**
 * Update text analysis display
 */
function updateTextAnalysis() {
    const text = document.getElementById('text_input')?.value || '';

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        const analysis = window.textUtilitiesController.analyzeText(text);

        // Update analysis displays
        const wordCount = document.getElementById('text_word_count');
        const charCount = document.getElementById('text_char_count');
        const lineCount = document.getElementById('text_line_count');
        const paragraphCount = document.getElementById('text_paragraph_count');

        if (wordCount) wordCount.value = analysis.wordCount;
        if (charCount) charCount.value = analysis.charCount;
        if (lineCount) lineCount.value = analysis.lineCount;
        if (paragraphCount) paragraphCount.value = analysis.paragraphCount;
    }
}

/**
 * Format text
 * @param {string} formatType Type of formatting to apply
 */
function formatText(formatType) {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        let formattedText = '';

        switch (formatType) {
            case 'uppercase':
                formattedText = window.textUtilitiesController.toUppercase(text);
                break;
            case 'lowercase':
                formattedText = window.textUtilitiesController.toLowercase(text);
                break;
            case 'titlecase':
                formattedText = window.textUtilitiesController.toTitleCase(text);
                break;
            case 'sentencecase':
                formattedText = window.textUtilitiesController.toSentenceCase(text);
                break;
        }

        textInput.value = formattedText;
        textUtilitiesState.text = formattedText;
        updateTextUtilitiesControllerSettings();
        saveTextUtilitiesSettings();
        updateTextAnalysis();

        toastr.success(`Text converted to ${formatType}`);
    }
}

/**
 * Analyze text
 */
function analyzeText() {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    updateTextAnalysis();
    toastr.success('Text analysis completed');
}

/**
 * Check readability
 */
function checkReadability() {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        const analysis = window.textUtilitiesController.analyzeText(text);
        const readability = analysis.readability;

        let level = 'Very Easy';
        if (readability < 30) level = 'Very Difficult';
        else if (readability < 50) level = 'Difficult';
        else if (readability < 60) level = 'Fairly Difficult';
        else if (readability < 70) level = 'Standard';
        else if (readability < 80) level = 'Fairly Easy';
        else if (readability < 90) level = 'Easy';

        toastr.info(`Readability Score: ${readability}/100 (${level})`);
    }
}

/**
 * Generate text
 */
function generateText() {
    const generatorType = document.getElementById('generator_type')?.value;
    const generatorLength = parseInt(document.getElementById('generator_length')?.value) || 100;
    const textInput = document.getElementById('text_input');

    if (!textInput) return;

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        let generatedText = '';

        switch (generatorType) {
            case 'lorem':
                generatedText = window.textUtilitiesController.generateLoremIpsum(generatorLength);
                break;
            case 'random':
                generatedText = window.textUtilitiesController.generateRandomText(generatorLength);
                break;
            case 'placeholder':
                generatedText = window.textUtilitiesController.generatePlaceholder(generatorLength);
                break;
            case 'password':
                generatedText = window.textUtilitiesController.generatePassword(generatorLength);
                break;
        }

        textInput.value = generatedText;
        textUtilitiesState.text = generatedText;
        updateTextUtilitiesControllerSettings();
        saveTextUtilitiesSettings();
        updateTextAnalysis();

        toastr.success(`Generated ${generatorType} text (${generatedText.length} characters)`);
    }
}

/**
 * Copy text to clipboard
 */
async function copyText() {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        const success = await window.textUtilitiesController.copyToClipboard(text);
        if (success) {
            toastr.success('Text copied to clipboard');
        } else {
            toastr.error('Failed to copy text to clipboard');
        }
    }
}

/**
 * Process text
 * @param {string} processType Type of processing to apply
 */
function processText(processType) {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        let processedText = '';

        switch (processType) {
            case 'removeSpaces':
                processedText = window.textUtilitiesController.removeExtraSpaces(text);
                break;
            case 'removeLines':
                processedText = window.textUtilitiesController.removeEmptyLines(text);
                break;
            case 'reverse':
                processedText = window.textUtilitiesController.reverseText(text);
                break;
            case 'sortLines':
                processedText = window.textUtilitiesController.sortLines(text);
                break;
            case 'duplicate':
                processedText = window.textUtilitiesController.duplicateText(text);
                break;
        }

        textInput.value = processedText;
        textUtilitiesState.text = processedText;
        updateTextUtilitiesControllerSettings();
        saveTextUtilitiesSettings();
        updateTextAnalysis();

        toastr.success(`Text processed: ${processType}`);
    }
}

/**
 * Convert text
 * @param {string} convertType Type of conversion to apply
 */
function convertText(convertType) {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        let convertedText = '';

        switch (convertType) {
            case 'markdown':
                convertedText = window.textUtilitiesController.toMarkdown(text);
                break;
            case 'html':
                convertedText = window.textUtilitiesController.toHTML(text);
                break;
            case 'json':
                convertedText = window.textUtilitiesController.toJSON(text);
                break;
            case 'csv':
                convertedText = window.textUtilitiesController.toCSV(text);
                break;
        }

        textInput.value = convertedText;
        textUtilitiesState.text = convertedText;
        updateTextUtilitiesControllerSettings();
        saveTextUtilitiesSettings();
        updateTextAnalysis();

        toastr.success(`Text converted to ${convertType.toUpperCase()}`);
    }
}

/**
 * Clear text
 */
function clearText() {
    const textInput = document.getElementById('text_input');
    if (textInput) {
        textInput.value = '';
        textUtilitiesState.text = '';
        updateTextUtilitiesControllerSettings();
        saveTextUtilitiesSettings();
        updateTextAnalysis();
        toastr.success('Text cleared');
    }
}

/**
 * Save text
 */
function saveText() {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    const name = prompt('Enter a name for this text:');
    if (name) {
        if (typeof window !== 'undefined' && window.textUtilitiesController) {
            window.textUtilitiesController.saveText(text, name);
            toastr.success('Text saved successfully');
        }
    }
}

/**
 * Load text
 */
function loadText() {
    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        const savedTexts = window.textUtilitiesController.getSavedTexts();

        if (savedTexts.length === 0) {
            toastr.warning('No saved texts found');
            return;
        }

        const textNames = savedTexts.map((text, index) => `${index + 1}. ${text.name}`).join('\n');
        const selection = prompt(`Select text to load:\n\n${textNames}\n\nEnter number:`);

        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < savedTexts.length) {
                const selectedText = savedTexts[index];
                const textInput = document.getElementById('text_input');
                if (textInput) {
                    textInput.value = selectedText.text;
                    textUtilitiesState.text = selectedText.text;
                    updateTextUtilitiesControllerSettings();
                    saveTextUtilitiesSettings();
                    updateTextAnalysis();
                    toastr.success(`Loaded: ${selectedText.name}`);
                }
            } else {
                toastr.error('Invalid selection');
            }
        }
    }
}

/**
 * Export text
 */
function exportText() {
    const textInput = document.getElementById('text_input');
    if (!textInput) return;

    const text = textInput.value;
    if (!text) {
        toastr.warning('Please enter some text first');
        return;
    }

    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        const filename = prompt('Enter filename (without extension):') || 'text-export';
        window.textUtilitiesController.exportText(text, `${filename}.txt`);
        toastr.success('Text exported successfully');
    }
}

/**
 * Reset text utilities
 */
function resetTextUtilities() {
    if (confirm('Are you sure you want to reset all text utilities? This will clear all settings and saved texts.')) {
        if (typeof window !== 'undefined' && window.textUtilitiesController) {
            // Reset state
            textUtilitiesState = {
                enabled: false,
                text: '',
                formatters: { uppercase: false, lowercase: false, titleCase: false, sentenceCase: false },
                analyzers: { wordCount: 0, charCount: 0, lineCount: 0, paragraphCount: 0, readability: 0 },
                generators: { type: 'lorem', length: 100 },
                tools: { removeSpaces: false, removeLines: false, reverse: false, sortLines: false },
                converters: { markdown: false, html: false, json: false, csv: false },
            };

            // Clear saved texts
            window.textUtilitiesController.savedTexts = [];

            // Update UI
            updateUIFromState();
            updateTextUtilitiesControllerSettings();
            saveTextUtilitiesSettings();

            toastr.success('Text utilities reset');
        }
    }
}

/**
 * Import text utilities settings
 */
function importTextUtilitiesSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    textUtilitiesState = { ...textUtilitiesState, ...settings };
                    updateUIFromState();
                    updateTextUtilitiesControllerSettings();
                    saveTextUtilitiesSettings();
                    toastr.success('Settings imported successfully!');
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
 * Export text utilities settings
 */
function exportTextUtilitiesSettings() {
    if (typeof window !== 'undefined' && window.textUtilitiesController) {
        const settings = window.textUtilitiesController.getSettings();
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'text-utilities-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        toastr.success('Settings exported successfully!');
    }
}

/**
 * Load text utilities settings from localStorage
 */
function loadTextUtilitiesSettings() {
    try {
        const saved = localStorage.getItem('text-utilities-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            textUtilitiesState = mergeDeep(textUtilitiesState, parsed);
        }
    } catch (error) {
        console.error('Failed to load text utilities settings:', error);
    }
}

/**
 * Save text utilities settings to localStorage
 */
function saveTextUtilitiesSettings() {
    try {
        localStorage.setItem('text-utilities-settings', JSON.stringify(textUtilitiesState));
    } catch (error) {
        console.error('Failed to save text utilities settings:', error);
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

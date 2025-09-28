/**
 * Developer Tools Interface
 * Handles UI interactions for the Developer Tools
 */

let developerToolsState = {
    debug: {
        enabled: false,
        console: '',
        logLevel: 'info',
    },
    api: {
        endpoint: '',
        method: 'GET',
        headers: {},
        body: '',
        savedRequests: [],
    },
    snippets: {
        language: 'javascript',
        name: '',
        code: '',
        savedSnippets: [],
    },
    testing: {
        autoRun: false,
        coverage: false,
        verbose: false,
        testResults: [],
    },
    utilities: {
        jsonFormatter: true,
        base64Encoder: true,
        urlEncoder: true,
        hashGenerator: true,
    },
};

/**
 * Initialize the developer tools interface
 */
export async function initializeDeveloperToolsInterface() {
    console.log('Initializing Developer Tools Interface...');

    try {
        // Load saved settings
        loadDeveloperToolsSettings();

        // Set up event listeners
        setupDeveloperToolsEventListeners();

        // Update UI from state
        updateUIFromState();

        console.log('Developer Tools Interface initialized');
    } catch (error) {
        console.error('Failed to initialize Developer Tools Interface:', error);
    }
}

/**
 * Set up event listeners for developer tools controls
 */
function setupDeveloperToolsEventListeners() {
    // Debug console toggle
    const debugEnabled = document.getElementById('debug_enabled');
    if (debugEnabled) {
        debugEnabled.addEventListener('change', (e) => {
            developerToolsState.debug.enabled = e.target.checked;
            updateDeveloperToolsControllerSettings();
            saveDeveloperToolsSettings();
        });
    }

    // Debug console actions
    const debugClear = document.getElementById('debug_clear');
    if (debugClear) {
        debugClear.addEventListener('click', () => {
            clearDebugConsole();
        });
    }

    const debugSave = document.getElementById('debug_save');
    if (debugSave) {
        debugSave.addEventListener('click', () => {
            saveDebugConsole();
        });
    }

    // API testing
    setupAPITestingControls();

    // Code snippets
    setupCodeSnippetControls();

    // Testing framework
    setupTestingFrameworkControls();

    // Development utilities
    setupDevelopmentUtilitiesControls();

    // Developer actions
    setupDeveloperActionsControls();

    // Import/Export buttons
    setupImportExportControls();
}

/**
 * Set up API testing controls
 */
function setupAPITestingControls() {
    const apiTest = document.getElementById('api_test');
    if (apiTest) {
        apiTest.addEventListener('click', () => {
            testAPIEndpoint();
        });
    }

    const apiSave = document.getElementById('api_save');
    if (apiSave) {
        apiSave.addEventListener('click', () => {
            saveAPIRequest();
        });
    }
}

/**
 * Set up code snippet controls
 */
function setupCodeSnippetControls() {
    const snippetSave = document.getElementById('snippet_save');
    if (snippetSave) {
        snippetSave.addEventListener('click', () => {
            saveCodeSnippet();
        });
    }

    const snippetRun = document.getElementById('snippet_run');
    if (snippetRun) {
        snippetRun.addEventListener('click', () => {
            runCodeSnippet();
        });
    }
}

/**
 * Set up testing framework controls
 */
function setupTestingFrameworkControls() {
    const testAutoRun = document.getElementById('test_auto_run');
    if (testAutoRun) {
        testAutoRun.addEventListener('change', (e) => {
            developerToolsState.testing.autoRun = e.target.checked;
            updateDeveloperToolsControllerSettings();
            saveDeveloperToolsSettings();
        });
    }

    const testCoverage = document.getElementById('test_coverage');
    if (testCoverage) {
        testCoverage.addEventListener('change', (e) => {
            developerToolsState.testing.coverage = e.target.checked;
            updateDeveloperToolsControllerSettings();
            saveDeveloperToolsSettings();
        });
    }

    const testVerbose = document.getElementById('test_verbose');
    if (testVerbose) {
        testVerbose.addEventListener('change', (e) => {
            developerToolsState.testing.verbose = e.target.checked;
            updateDeveloperToolsControllerSettings();
            saveDeveloperToolsSettings();
        });
    }

    const testRunAll = document.getElementById('test_run_all');
    if (testRunAll) {
        testRunAll.addEventListener('click', () => {
            runAllTests();
        });
    }

    const testWatch = document.getElementById('test_watch');
    if (testWatch) {
        testWatch.addEventListener('click', () => {
            startWatchMode();
        });
    }

    const testGenerate = document.getElementById('test_generate');
    if (testGenerate) {
        testGenerate.addEventListener('click', () => {
            generateTest();
        });
    }
}

/**
 * Set up development utilities controls
 */
function setupDevelopmentUtilitiesControls() {
    const utilJsonFormat = document.getElementById('util_json_format');
    if (utilJsonFormat) {
        utilJsonFormat.addEventListener('click', () => {
            formatJSON();
        });
    }

    const utilBase64Encode = document.getElementById('util_base64_encode');
    if (utilBase64Encode) {
        utilBase64Encode.addEventListener('click', () => {
            encodeDecodeBase64();
        });
    }

    const utilUrlEncode = document.getElementById('util_url_encode');
    if (utilUrlEncode) {
        utilUrlEncode.addEventListener('click', () => {
            encodeURL();
        });
    }

    const utilHashGenerate = document.getElementById('util_hash_generate');
    if (utilHashGenerate) {
        utilHashGenerate.addEventListener('click', () => {
            generateHash();
        });
    }
}

/**
 * Set up developer actions controls
 */
function setupDeveloperActionsControls() {
    const devReload = document.getElementById('dev_reload');
    if (devReload) {
        devReload.addEventListener('click', () => {
            reloadApplication();
        });
    }

    const devClearCache = document.getElementById('dev_clear_cache');
    if (devClearCache) {
        devClearCache.addEventListener('click', () => {
            clearCache();
        });
    }

    const devExportLogs = document.getElementById('dev_export_logs');
    if (devExportLogs) {
        devExportLogs.addEventListener('click', () => {
            exportLogs();
        });
    }

    const devSystemInfo = document.getElementById('dev_system_info');
    if (devSystemInfo) {
        devSystemInfo.addEventListener('click', () => {
            showSystemInfo();
        });
    }
}

/**
 * Set up import/export controls
 */
function setupImportExportControls() {
    const devImport = document.getElementById('dev_tools_import');
    if (devImport) {
        devImport.addEventListener('click', () => {
            importSettings();
        });
    }

    const devExport = document.getElementById('dev_tools_export');
    if (devExport) {
        devExport.addEventListener('click', () => {
            exportSettings();
        });
    }
}

/**
 * Update developer tools controller settings
 */
function updateDeveloperToolsControllerSettings() {
    if (typeof window !== 'undefined' && window.developerToolsController) {
        window.developerToolsController.updateSettings(developerToolsState);
    }
}

/**
 * Update UI from current state
 */
function updateUIFromState() {
    // Update debug console toggle
    const debugEnabled = document.getElementById('debug_enabled');
    if (debugEnabled) {
        debugEnabled.checked = developerToolsState.debug.enabled;
    }

    // Update testing checkboxes
    const testAutoRun = document.getElementById('test_auto_run');
    if (testAutoRun) {
        testAutoRun.checked = developerToolsState.testing.autoRun;
    }

    const testCoverage = document.getElementById('test_coverage');
    if (testCoverage) {
        testCoverage.checked = developerToolsState.testing.coverage;
    }

    const testVerbose = document.getElementById('test_verbose');
    if (testVerbose) {
        testVerbose.checked = developerToolsState.testing.verbose;
    }
}

/**
 * Clear debug console
 */
function clearDebugConsole() {
    if (typeof window !== 'undefined' && window.developerToolsController) {
        window.developerToolsController.clearConsole();
        toastr.success('Debug console cleared');
    }
}

/**
 * Save debug console
 */
function saveDebugConsole() {
    if (typeof window !== 'undefined' && window.developerToolsController) {
        window.developerToolsController.saveConsoleLog();
        toastr.success('Console log saved');
    }
}

/**
 * Test API endpoint
 */
async function testAPIEndpoint() {
    const endpoint = document.getElementById('api_endpoint')?.value;
    const method = document.getElementById('api_method')?.value;
    const headers = document.getElementById('api_headers')?.value;
    const body = document.getElementById('api_body')?.value;

    if (!endpoint) {
        toastr.error('Please enter an endpoint');
        return;
    }

    try {
        const request = {
            endpoint,
            method,
            headers: headers ? JSON.parse(headers) : {},
            body,
        };

        if (typeof window !== 'undefined' && window.developerToolsController) {
            const result = await window.developerToolsController.testAPI(request);
            console.log('API test result:', result);
            toastr.success(`API test completed: ${result.status} ${result.statusText}`);
        }
    } catch (error) {
        console.error('API test failed:', error);
        toastr.error('API test failed: ' + error.message);
    }
}

/**
 * Save API request
 */
function saveAPIRequest() {
    const endpoint = document.getElementById('api_endpoint')?.value;
    const method = document.getElementById('api_method')?.value;
    const headers = document.getElementById('api_headers')?.value;
    const body = document.getElementById('api_body')?.value;

    if (!endpoint) {
        toastr.error('Please enter an endpoint');
        return;
    }

    const request = {
        endpoint,
        method,
        headers: headers ? JSON.parse(headers) : {},
        body,
    };

    if (typeof window !== 'undefined' && window.developerToolsController) {
        window.developerToolsController.saveAPIRequest(request);
        toastr.success('API request saved');
    }
}

/**
 * Save code snippet
 */
function saveCodeSnippet() {
    const name = document.getElementById('snippet_name')?.value;
    const language = document.getElementById('snippet_language')?.value;
    const code = document.getElementById('snippet_code')?.value;

    if (!name || !code) {
        toastr.error('Please enter a name and code');
        return;
    }

    const snippet = {
        name,
        language,
        code,
    };

    if (typeof window !== 'undefined' && window.developerToolsController) {
        window.developerToolsController.saveCodeSnippet(snippet);
        toastr.success('Code snippet saved');
    }
}

/**
 * Run code snippet
 */
async function runCodeSnippet() {
    const language = document.getElementById('snippet_language')?.value;
    const code = document.getElementById('snippet_code')?.value;

    if (!code) {
        toastr.error('Please enter code to run');
        return;
    }

    try {
        if (typeof window !== 'undefined' && window.developerToolsController) {
            const result = await window.developerToolsController.runCodeSnippet(code, language);
            console.log('Code execution result:', result);
            toastr.success('Code executed successfully');
        }
    } catch (error) {
        console.error('Code execution failed:', error);
        toastr.error('Code execution failed: ' + error.message);
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    try {
        if (typeof window !== 'undefined' && window.developerToolsController) {
            const results = await window.developerToolsController.runTests();
            console.log('Test results:', results);
            toastr.success(`Tests completed: ${results.passed} passed, ${results.failed} failed`);
        }
    } catch (error) {
        console.error('Test execution failed:', error);
        toastr.error('Test execution failed: ' + error.message);
    }
}

/**
 * Start watch mode
 */
function startWatchMode() {
    console.log('Starting watch mode...');
    toastr.info('Watch mode started');
}

/**
 * Generate test
 */
function generateTest() {
    console.log('Generating test...');
    toastr.info('Test generation started');
}

/**
 * Format JSON
 */
function formatJSON() {
    const input = prompt('Enter JSON to format:');
    if (input) {
        try {
            if (typeof window !== 'undefined' && window.developerToolsController) {
                const formatted = window.developerToolsController.formatJSON(input);
                console.log('Formatted JSON:', formatted);
                toastr.success('JSON formatted successfully');
            }
        } catch (error) {
            toastr.error('JSON formatting failed: ' + error.message);
        }
    }
}

/**
 * Encode/Decode Base64
 */
function encodeDecodeBase64() {
    const input = prompt('Enter text to encode/decode:');
    if (input) {
        try {
            if (typeof window !== 'undefined' && window.developerToolsController) {
                const encoded = window.developerToolsController.base64EncodeDecode(input, true);
                console.log('Base64 encoded:', encoded);
                toastr.success('Base64 encoding completed');
            }
        } catch (error) {
            toastr.error('Base64 encoding failed: ' + error.message);
        }
    }
}

/**
 * Encode URL
 */
function encodeURL() {
    const input = prompt('Enter URL to encode:');
    if (input) {
        try {
            if (typeof window !== 'undefined' && window.developerToolsController) {
                const encoded = window.developerToolsController.encodeURL(input);
                console.log('URL encoded:', encoded);
                toastr.success('URL encoding completed');
            }
        } catch (error) {
            toastr.error('URL encoding failed: ' + error.message);
        }
    }
}

/**
 * Generate hash
 */
async function generateHash() {
    const input = prompt('Enter text to hash:');
    if (input) {
        try {
            if (typeof window !== 'undefined' && window.developerToolsController) {
                const hash = await window.developerToolsController.generateHash(input);
                console.log('Hash generated:', hash);
                toastr.success('Hash generation completed');
            }
        } catch (error) {
            toastr.error('Hash generation failed: ' + error.message);
        }
    }
}

/**
 * Reload application
 */
function reloadApplication() {
    if (confirm('Are you sure you want to reload the application?')) {
        if (typeof window !== 'undefined' && window.developerToolsController) {
            window.developerToolsController.reloadApplication();
        }
    }
}

/**
 * Clear cache
 */
function clearCache() {
    if (confirm('Are you sure you want to clear the cache?')) {
        if (typeof window !== 'undefined' && window.developerToolsController) {
            window.developerToolsController.clearCache();
            toastr.success('Cache cleared');
        }
    }
}

/**
 * Export logs
 */
function exportLogs() {
    if (typeof window !== 'undefined' && window.developerToolsController) {
        window.developerToolsController.exportLogs();
        toastr.success('Logs exported');
    }
}

/**
 * Show system info
 */
function showSystemInfo() {
    if (typeof window !== 'undefined' && window.developerToolsController) {
        const systemInfo = window.developerToolsController.getSystemInfo();
        console.log('System Info:', systemInfo);
        alert(`System Information:\n\n${JSON.stringify(systemInfo, null, 2)}`);
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
                    if (typeof window !== 'undefined' && window.developerToolsController) {
                        const settings = JSON.parse(e.target.result);
                        window.developerToolsController.updateSettings(settings);
                        loadDeveloperToolsSettings();
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
    if (typeof window !== 'undefined' && window.developerToolsController) {
        const settings = window.developerToolsController.getSettings();
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'developer-tools-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        toastr.success('Settings exported successfully!');
    }
}

/**
 * Load developer tools settings from localStorage
 */
function loadDeveloperToolsSettings() {
    try {
        const saved = localStorage.getItem('developer-tools-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            developerToolsState = mergeDeep(developerToolsState, parsed);
        }
    } catch (error) {
        console.error('Failed to load developer tools settings:', error);
    }
}

/**
 * Save developer tools settings to localStorage
 */
function saveDeveloperToolsSettings() {
    try {
        localStorage.setItem('developer-tools-settings', JSON.stringify(developerToolsState));
    } catch (error) {
        console.error('Failed to save developer tools settings:', error);
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

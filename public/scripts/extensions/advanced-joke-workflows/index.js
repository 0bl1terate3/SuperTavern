import { extension_settings, saveSettingsDebounced } from '../../extensions.js';
import { renderExtensionTemplate } from '../../index.js';

const path = '/scripts/extensions/advanced-joke-workflows';

/**
 * Advanced Joke Workflows Extension
 * Provides UI controls for the 6 advanced joke generation methods
 */

// Initialize settings if they don't exist
if (!extension_settings.advancedJokeWorkflows) {
    extension_settings.advancedJokeWorkflows = {
        enabled: false,
        steppedThinking: {
            enabled: true,
            topicPools: ['everyday_life', 'pop_culture', 'current_events'],
            autoRotate: true
        },
        guidedGenerations: {
            enabled: true,
            roleSegmentation: true,
            modules: [
                { role: "Topic Selector", prompt: "Pick a random funny topic for a joke." },
                { role: "Comedian", prompt: "Make a one-liner joke about {{topic_selector_output}}." }
            ]
        },
        objectiveDriven: {
            enabled: true,
            objectives: ['pun', 'dark', 'dad', 'pop_culture', 'absurd', 'wordplay', 'situational', 'parody'],
            autoRotate: true
        },
        memoryIntegration: {
            enabled: true,
            useChatSummaries: true,
            useLorebook: true,
            maxTopics: 10
        },
        topicRoulette: {
            enabled: true,
            swipeToRotate: true,
            pools: ['everyday_life', 'pop_culture', 'current_events', 'absurd_scenarios']
        },
        jokeScaffolding: {
            enabled: true,
            enforceStructure: true,
            structures: ['one_liner', 'setup_punchline', 'parody', 'dialogue', 'absurdism', 'wordplay', 'dark_humor', 'dad_joke']
        }
    };
}

// Load the extension template
async function loadAdvancedJokeWorkflowsTemplate() {
    const template = await renderExtensionTemplate(path, 'template');
    return template;
}

// Add the extension to the extensions menu
function addAdvancedJokeWorkflowsToMenu() {
    const extensionsMenu = document.getElementById('extensionsMenu');
    if (!extensionsMenu) return;

    const menuItem = document.createElement('div');
    menuItem.id = 'advancedJokeWorkflows';
    menuItem.className = 'menu_button';
    menuItem.innerHTML = `
        <div class="menu_icon">
            <i class="fa-solid fa-laugh-beam"></i>
        </div>
        <div class="menu_text">Advanced Joke Workflows</div>
    `;
    menuItem.addEventListener('click', showAdvancedJokeWorkflowsSettings);
    extensionsMenu.appendChild(menuItem);
}

// Show the settings popup
async function showAdvancedJokeWorkflowsSettings() {
    const template = await loadAdvancedJokeWorkflowsTemplate();
    const popup = new Popup(template, POPUP_TYPE.CONFIRM, 'Advanced Joke Workflows Settings', {
        wide: true,
        large: true,
        okButton: 'Save',
        cancelButton: 'Cancel'
    });

    const result = await popup.show();
    if (result) {
        saveAdvancedJokeWorkflowsSettings();
    }
}

// Save settings
function saveAdvancedJokeWorkflowsSettings() {
    const settings = extension_settings.advancedJokeWorkflows;

    // Main settings
    settings.enabled = document.getElementById('advancedJokeWorkflowsEnabled').checked;

    // Stepped Thinking settings
    settings.steppedThinking.enabled = document.getElementById('steppedThinkingEnabled').checked;
    settings.steppedThinking.autoRotate = document.getElementById('steppedThinkingAutoRotate').checked;

    // Get selected topic pools
    const topicPoolCheckboxes = document.querySelectorAll('input[name="topicPools"]:checked');
    settings.steppedThinking.topicPools = Array.from(topicPoolCheckboxes).map(cb => cb.value);

    // Guided Generations settings
    settings.guidedGenerations.enabled = document.getElementById('guidedGenerationsEnabled').checked;
    settings.guidedGenerations.roleSegmentation = document.getElementById('guidedGenerationsRoleSegmentation').checked;

    // Objective Driven settings
    settings.objectiveDriven.enabled = document.getElementById('objectiveDrivenEnabled').checked;
    settings.objectiveDriven.autoRotate = document.getElementById('objectiveDrivenAutoRotate').checked;

    // Get selected objectives
    const objectiveCheckboxes = document.querySelectorAll('input[name="objectives"]:checked');
    settings.objectiveDriven.objectives = Array.from(objectiveCheckboxes).map(cb => cb.value);

    // Memory Integration settings
    settings.memoryIntegration.enabled = document.getElementById('memoryIntegrationEnabled').checked;
    settings.memoryIntegration.useChatSummaries = document.getElementById('memoryIntegrationUseChatSummaries').checked;
    settings.memoryIntegration.useLorebook = document.getElementById('memoryIntegrationUseLorebook').checked;
    settings.memoryIntegration.maxTopics = parseInt(document.getElementById('memoryIntegrationMaxTopics').value);

    // Topic Roulette settings
    settings.topicRoulette.enabled = document.getElementById('topicRouletteEnabled').checked;
    settings.topicRoulette.swipeToRotate = document.getElementById('topicRouletteSwipeToRotate').checked;

    // Get selected pools for roulette
    const roulettePoolCheckboxes = document.querySelectorAll('input[name="roulettePools"]:checked');
    settings.topicRoulette.pools = Array.from(roulettePoolCheckboxes).map(cb => cb.value);

    // Joke Scaffolding settings
    settings.jokeScaffolding.enabled = document.getElementById('jokeScaffoldingEnabled').checked;
    settings.jokeScaffolding.enforceStructure = document.getElementById('jokeScaffoldingEnforceStructure').checked;

    // Get selected structures
    const structureCheckboxes = document.querySelectorAll('input[name="structures"]:checked');
    settings.jokeScaffolding.structures = Array.from(structureCheckboxes).map(cb => cb.value);

    saveSettingsDebounced();
    toastr.success('Advanced Joke Workflows settings saved!');
}

// Initialize the extension
function initAdvancedJokeWorkflows() {
    addAdvancedJokeWorkflowsToMenu();
}

// Initialize the extension
async function init() {
    console.log('Advanced Joke Workflows: Initializing');

    // Wait for SillyTavern to be ready
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
        if ($('#extensionsMenu').length > 0 && typeof Popup !== 'undefined') {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }

    if (attempts >= maxAttempts) {
        console.error('Advanced Joke Workflows: Failed to initialize - SillyTavern not ready');
        return;
    }

    initAdvancedJokeWorkflows();
    console.log('Advanced Joke Workflows: Initialized successfully');
}

// Load the extension when the page loads
jQuery(document).ready(function () {
    init();
});

export { initAdvancedJokeWorkflows };

import { extension_settings, saveSettingsDebounced } from '../../extensions.js';
import { renderExtensionTemplate } from '../../index.js';
import { eventSource, event_types } from '../../script.js';

const path = '/scripts/extensions/joke-prompt-inspector';

/**
 * Joke Prompt Inspector Extension
 * Integrates with Prompt Inspector to enforce joke scaffolding
 */

// Initialize settings if they don't exist
if (!extension_settings.jokePromptInspector) {
    extension_settings.jokePromptInspector = {
        enabled: false,
        autoInject: true,
        scaffolding: {
            enabled: true,
            enforceStructure: true,
            structures: ['one_liner', 'setup_punchline', 'parody', 'dialogue', 'absurdism', 'wordplay', 'dark_humor', 'dad_joke'],
            autoRotate: true
        },
        topicSelection: {
            enabled: true,
            useMemoryTopics: true,
            useRandomTopics: true,
            topicPools: ['everyday_life', 'pop_culture', 'current_events', 'absurd_scenarios']
        }
    };
}

// Joke scaffolding templates
const JOKE_SCAFFOLDING_TEMPLATES = {
    one_liner: `
1. Pick a topic: {topic}
2. Create a single, punchy joke about this topic
3. Make it memorable and funny
4. Keep it appropriate

Generate the joke:`,

    setup_punchline: `
1. Pick a topic: {topic}
2. Create a setup-punchline joke about this topic
3. Setup: [situation or context]
4. Punchline: [twist or surprise]
5. Make it funny and unexpected

Generate the joke:`,

    parody: `
1. Pick a topic: {topic}
2. Create a parody joke about this topic
3. Parody something well-known (song, movie, saying, etc.)
4. Make it clever and funny
5. Keep the original recognizable

Generate the joke:`,

    dialogue: `
1. Pick a topic: {topic}
2. Create a dialogue joke between two characters about this topic
3. Use natural conversation
4. Build to a funny punchline
5. Make it engaging and humorous

Generate the joke:`,

    absurdism: `
1. Pick a topic: {topic}
2. Create an absurd, impossible scenario joke about this topic
3. Make it hilariously ridiculous
4. Use impossible situations
5. Keep it creative and funny

Generate the joke:`,

    wordplay: `
1. Pick a topic: {topic}
2. Create a pun or wordplay joke about this topic
3. Use clever language tricks
4. Play with double meanings
5. Make it linguistically clever

Generate the joke:`,

    dark_humor: `
1. Pick a topic: {topic}
2. Create a dark humor joke about this topic
3. Keep it tasteful and not offensive
4. Use dark themes cleverly
5. Make it funny despite the darkness

Generate the joke:`,

    dad_joke: `
1. Pick a topic: {topic}
2. Create a dad joke about this topic
3. Make it corny and wholesome
4. Use classic dad joke structure
5. Make it groan-worthy but endearing

Generate the joke:`
};

// Topic pools for selection
const TOPIC_POOLS = {
    everyday_life: [
        "coffee addiction", "traffic jams", "grocery shopping", "social media",
        "online dating", "work meetings", "exercise", "cooking disasters",
        "pet ownership", "home improvement", "technology", "relationships"
    ],
    pop_culture: [
        "superhero movies", "streaming services", "viral TikTok dances", "celebrity drama",
        "reality TV", "video game releases", "music festivals", "fashion trends",
        "memes", "influencer culture", "podcasts", "anime"
    ],
    current_events: [
        "artificial intelligence", "climate change", "space exploration", "cryptocurrency",
        "social media trends", "remote work", "electric vehicles", "virtual reality",
        "sustainable living", "quantum computing", "blockchain", "metaverse"
    ],
    absurd_scenarios: [
        "zombie apocalypse", "time travel", "alien invasion", "superhero powers",
        "magic spells", "robot uprising", "parallel universes", "talking animals",
        "invisible objects", "flying cars", "teleportation", "mind reading"
    ]
};

let currentStructureIndex = 0;
let currentTopicPool = 'everyday_life';

// Load the extension template
async function loadJokePromptInspectorTemplate() {
    const template = await renderExtensionTemplate(path, 'template');
    return template;
}

// Add the extension to the extensions menu
function addJokePromptInspectorToMenu() {
    const extensionsMenu = document.getElementById('extensionsMenu');
    if (!extensionsMenu) return;

    const menuItem = document.createElement('div');
    menuItem.id = 'jokePromptInspector';
    menuItem.className = 'menu_button';
    menuItem.innerHTML = `
        <div class="menu_icon">
            <i class="fa-solid fa-microscope"></i>
        </div>
        <div class="menu_text">Joke Prompt Inspector</div>
    `;
    menuItem.addEventListener('click', showJokePromptInspectorSettings);
    extensionsMenu.appendChild(menuItem);
}

// Show the settings popup
async function showJokePromptInspectorSettings() {
    const template = await loadJokePromptInspectorTemplate();
    const popup = new Popup(template, POPUP_TYPE.CONFIRM, 'Joke Prompt Inspector Settings', {
        wide: true,
        large: true,
        okButton: 'Save',
        cancelButton: 'Cancel'
    });

    const result = await popup.show();
    if (result) {
        saveJokePromptInspectorSettings();
    }
}

// Save settings
function saveJokePromptInspectorSettings() {
    const settings = extension_settings.jokePromptInspector;

    // Main settings
    settings.enabled = document.getElementById('jokePromptInspectorEnabled').checked;
    settings.autoInject = document.getElementById('jokePromptInspectorAutoInject').checked;

    // Scaffolding settings
    settings.scaffolding.enabled = document.getElementById('scaffoldingEnabled').checked;
    settings.scaffolding.enforceStructure = document.getElementById('scaffoldingEnforceStructure').checked;
    settings.scaffolding.autoRotate = document.getElementById('scaffoldingAutoRotate').checked;

    // Get selected structures
    const structureCheckboxes = document.querySelectorAll('input[name="structures"]:checked');
    settings.scaffolding.structures = Array.from(structureCheckboxes).map(cb => cb.value);

    // Topic selection settings
    settings.topicSelection.enabled = document.getElementById('topicSelectionEnabled').checked;
    settings.topicSelection.useMemoryTopics = document.getElementById('topicSelectionUseMemoryTopics').checked;
    settings.topicSelection.useRandomTopics = document.getElementById('topicSelectionUseRandomTopics').checked;

    // Get selected topic pools
    const topicPoolCheckboxes = document.querySelectorAll('input[name="topicPools"]:checked');
    settings.topicSelection.topicPools = Array.from(topicPoolCheckboxes).map(cb => cb.value);

    saveSettingsDebounced();
    toastr.success('Joke Prompt Inspector settings saved!');
}

// Inject joke scaffolding into prompts
function injectJokeScaffolding(prompt) {
    if (!extension_settings.jokePromptInspector?.enabled || !extension_settings.jokePromptInspector?.autoInject) {
        return prompt;
    }

    const settings = extension_settings.jokePromptInspector;

    // Select topic
    let selectedTopic = '';
    if (settings.topicSelection?.enabled) {
        selectedTopic = selectTopicForJoke();
    }

    // Select structure
    let selectedStructure = '';
    if (settings.scaffolding?.enabled) {
        selectedStructure = selectStructureForJoke();
    }

    // Create scaffolding prompt
    const scaffoldingTemplate = JOKE_SCAFFOLDING_TEMPLATES[selectedStructure] || JOKE_SCAFFOLDING_TEMPLATES.one_liner;
    const scaffoldingPrompt = scaffoldingTemplate.replace('{topic}', selectedTopic);

    // Inject scaffolding into the prompt
    const enhancedPrompt = `${scaffoldingPrompt}\n\nOriginal prompt: ${prompt}`;

    return enhancedPrompt;
}

// Select topic for joke generation
function selectTopicForJoke() {
    const settings = extension_settings.jokePromptInspector?.topicSelection;
    if (!settings?.enabled) return 'random topic';

    const availablePools = settings.topicPools || ['everyday_life'];
    const poolName = availablePools[Math.floor(Math.random() * availablePools.length)];
    const pool = TOPIC_POOLS[poolName] || TOPIC_POOLS.everyday_life;

    // Add memory topics if enabled
    let allTopics = [...pool];
    if (settings.useMemoryTopics) {
        // This would integrate with the advanced joke workflows memory system
        // For now, we'll use a simple approach
        const memoryTopics = getMemoryTopicsFromChat();
        allTopics = [...allTopics, ...memoryTopics];
    }

    const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
    return randomTopic;
}

// Select structure for joke generation
function selectStructureForJoke() {
    const settings = extension_settings.jokePromptInspector?.scaffolding;
    if (!settings?.enabled) return 'one_liner';

    const structures = settings.structures || Object.keys(JOKE_SCAFFOLDING_TEMPLATES);

    if (settings.autoRotate) {
        const structure = structures[currentStructureIndex % structures.length];
        currentStructureIndex++;
        return structure;
    } else {
        return structures[Math.floor(Math.random() * structures.length)];
    }
}

// Get memory topics from chat (simplified version)
function getMemoryTopicsFromChat() {
    // This would integrate with the advanced joke workflows memory system
    // For now, return empty array
    return [];
}

// Event listeners for prompt interception
function setupPromptInterception() {
    // Listen for prompt events to inject joke scaffolding
    if (typeof eventSource !== 'undefined' && eventSource) {
        eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, async (data) => {
            if (!extension_settings.jokePromptInspector?.enabled) return;

            if (data.dryRun) return;

            // Check if this is a joke-related prompt
            const isJokePrompt = data.chat.some(message =>
                message.content && (
                    message.content.toLowerCase().includes('joke') ||
                    message.content.toLowerCase().includes('funny') ||
                    message.content.toLowerCase().includes('humor') ||
                    message.content.toLowerCase().includes('laugh')
                )
            );

            if (isJokePrompt) {
                // Inject joke scaffolding into the prompt
                data.chat.forEach(message => {
                    if (message.content) {
                        message.content = injectJokeScaffolding(message.content);
                    }
                });
            }
        });

        eventSource.on(event_types.GENERATE_AFTER_COMBINE_PROMPTS, async (data) => {
            if (!extension_settings.jokePromptInspector?.enabled) return;

            if (data.dryRun) return;

            // Check if this is a joke-related prompt
            const isJokePrompt = data.prompt && (
                data.prompt.toLowerCase().includes('joke') ||
                data.prompt.toLowerCase().includes('funny') ||
                data.prompt.toLowerCase().includes('humor') ||
                data.prompt.toLowerCase().includes('laugh')
            );

            if (isJokePrompt) {
                data.prompt = injectJokeScaffolding(data.prompt);
            }
        });
    } else {
        console.warn('Joke Prompt Inspector: EventSource not available, prompt interception disabled');
    }
}

// Initialize the extension
function initJokePromptInspector() {
    addJokePromptInspectorToMenu();
    setupPromptInterception();
}

// Initialize the extension
async function init() {
    console.log('Joke Prompt Inspector: Initializing');

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
        console.error('Joke Prompt Inspector: Failed to initialize - SillyTavern not ready');
        return;
    }

    initJokePromptInspector();
    console.log('Joke Prompt Inspector: Initialized successfully');
}

// Load the extension when the page loads
jQuery(document).ready(function () {
    init();
});

export { initJokePromptInspector };

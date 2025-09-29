import { generateQuietPrompt, getRequestHeaders } from '../script.js';
import { extension_settings } from './extensions.js';
import { eventSource, event_types } from '../script.js';

/**
 * Advanced Joke Workflows - Topic → Joke Generation System
 * Implements 6 advanced methods for sophisticated joke generation
 */

// Topic pools for different categories
const TOPIC_POOLS = {
    current_events: [
        "artificial intelligence", "climate change", "space exploration", "cryptocurrency",
        "social media trends", "remote work", "electric vehicles", "virtual reality",
        "sustainable living", "quantum computing", "blockchain", "metaverse"
    ],
    pop_culture: [
        "superhero movies", "streaming services", "viral TikTok dances", "celebrity drama",
        "reality TV", "video game releases", "music festivals", "fashion trends",
        "memes", "influencer culture", "podcasts", "anime"
    ],
    everyday_life: [
        "coffee addiction", "traffic jams", "grocery shopping", "social media",
        "online dating", "work meetings", "exercise", "cooking disasters",
        "pet ownership", "home improvement", "technology", "relationships"
    ],
    absurd_scenarios: [
        "zombie apocalypse", "time travel", "alien invasion", "superhero powers",
        "magic spells", "robot uprising", "parallel universes", "talking animals",
        "invisible objects", "flying cars", "teleportation", "mind reading"
    ],
    user_lorebook: [], // Will be populated from chat memory
    chat_history: [] // Will be populated from recent chat summaries
};

// Joke structure templates
const JOKE_STRUCTURES = {
    one_liner: "Create a single, punchy joke about {topic}",
    setup_punchline: "Create a setup-punchline joke about {topic}. Setup: [situation]. Punchline: [twist]",
    parody: "Create a parody joke about {topic} in the style of {style}",
    dialogue: "Create a dialogue joke between two characters about {topic}",
    absurdism: "Create an absurd, impossible scenario joke about {topic}",
    wordplay: "Create a pun or wordplay joke about {topic}",
    dark_humor: "Create a dark humor joke about {topic} (keep it tasteful)",
    dad_joke: "Create a dad joke about {topic}"
};

// Objective-driven joke variations
const JOKE_OBJECTIVES = {
    pun: "Make a clever pun about {topic}",
    dark: "Tell a dark joke about {topic} (keep it tasteful)",
    dad: "Make a dad joke about {topic}",
    pop_culture: "Blend {topic} with pop culture references",
    absurd: "Make an absurd, impossible scenario joke about {topic}",
    wordplay: "Use clever wordplay with {topic}",
    situational: "Create situational comedy about {topic}",
    parody: "Parody something well-known using {topic}"
};

class AdvancedJokeWorkflows {
    constructor() {
        this.currentTopicPool = 'everyday_life';
        this.currentObjective = 'pun';
        this.currentStructure = 'one_liner';
        this.topicRotation = 0;
        this.objectiveRotation = 0;
        this.structureRotation = 0;
        this.memoryTopics = [];
        this.chatSummaryTopics = [];

        this.initializeSettings();
        this.setupEventListeners();
    }

    initializeSettings() {
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
                    objectives: Object.keys(JOKE_OBJECTIVES),
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
                    pools: Object.keys(TOPIC_POOLS)
                },
                jokeScaffolding: {
                    enabled: true,
                    enforceStructure: true,
                    structures: Object.keys(JOKE_STRUCTURES)
                }
            };
        }
    }

    setupEventListeners() {
        // Only set up event listeners if eventSource and event_types are available
        if (typeof eventSource !== 'undefined' && eventSource && typeof event_types !== 'undefined' && event_types) {
            // Listen for chat events to extract topics
            if (event_types.MESSAGE_RECEIVED) {
                eventSource.on(event_types.MESSAGE_RECEIVED, (messageId, type) => {
                    if (extension_settings.advancedJokeWorkflows?.memoryIntegration?.enabled) {
                        this.extractTopicsFromMessage(messageId);
                    }
                });
            }

            // Listen for swipe events for topic roulette
            if (event_types.SWIPE_RIGHT) {
                eventSource.on(event_types.SWIPE_RIGHT, () => {
                    if (extension_settings.advancedJokeWorkflows?.topicRoulette?.enabled) {
                        this.rotateTopicPool();
                    }
                });
            }
        } else {
            console.log('🎭 Advanced Joke Workflows: Event system not available, skipping event listeners');
        }
    }

    /**
     * 1. Stepped Thinking with Topic Pools
     */
    async generateJokeWithSteppedThinking(context = '') {
        if (!extension_settings.advancedJokeWorkflows?.steppedThinking?.enabled) {
            return await this.generateBasicJoke(context);
        }

        try {
            // Phase 1: Topic Selection
            const selectedTopic = await this.selectTopicFromPool();

            // Phase 2: Joke Construction - Return a simple joke for now
            const steppedJokes = [
                `Why did the ${selectedTopic} cross the road? To get to the other side! 😄`,
                `What do you call a ${selectedTopic} with no teeth? A gummy ${selectedTopic}! 🐻`,
                `Why don't ${selectedTopic}s tell jokes? They'd crack each other up! 🥚`,
                `What do you call a ${selectedTopic} wearing a bowtie? So-${selectedTopic}-ticated! 🐟`
            ];

            const randomJoke = steppedJokes[Math.floor(Math.random() * steppedJokes.length)];
            return randomJoke;
        } catch (error) {
            console.error('Stepped thinking joke generation failed:', error);
            return "My joke generator needs a reboot! 🤖";
        }
    }

    async selectTopicFromPool() {
        const settings = extension_settings.advancedJokeWorkflows.steppedThinking;
        const availablePools = settings.topicPools || ['everyday_life'];
        const poolName = availablePools[this.topicRotation % availablePools.length];
        const pool = TOPIC_POOLS[poolName] || TOPIC_POOLS.everyday_life;

        if (settings.autoRotate) {
            this.topicRotation++;
        }

        // Add memory topics if available
        const allTopics = [...pool, ...this.memoryTopics, ...this.chatSummaryTopics];
        const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];

        return randomTopic;
    }

    async constructJokeFromTopic(topic, context) {
        const prompt = `You are a master comedian. Create a hilarious joke about "${topic}".

${context ? `Context: ${context}` : ''}

Requirements:
- Make it funny and creative
- Use the topic naturally
- Keep it appropriate
- Make it memorable

Generate a joke:`;

        try {
            const response = await generateQuietPrompt({ quietPrompt: prompt });
            return response || `Why did the ${topic} cross the road? To get to the other side! 😄`;
        } catch (error) {
            console.error('Error generating joke:', error);
            return `Why did the ${topic} cross the road? To get to the other side! 😄`;
        }
    }

    /**
     * 2. Guided Generations with Role Segmentation
     */
    async generateJokeWithGuidedGenerations(context = '') {
        if (!extension_settings.advancedJokeWorkflows?.guidedGenerations?.enabled) {
            return await this.generateBasicJoke(context);
        }

        try {
            const settings = extension_settings.advancedJokeWorkflows.guidedGenerations;
            const modules = settings.modules || [
                { role: "Topic Selector", prompt: "Pick a random funny topic for a joke." },
                { role: "Comedian", prompt: "Make a one-liner joke about {{topic_selector_output}}." }
            ];

            let currentOutput = context;
            let topic = '';

            // Execute each module in sequence
            for (const module of modules) {
                const modulePrompt = module.prompt.replace('{{topic_selector_output}}', currentOutput);
                const fullPrompt = `${module.role}: ${modulePrompt}`;

                const response = await generateQuietPrompt({ quietPrompt: fullPrompt });

                if (module.role === "Topic Selector") {
                    topic = response;
                }
                currentOutput = response;
            }

            return currentOutput;
        } catch (error) {
            console.error('Guided generations joke generation failed:', error);
            return "My joke generator needs a reboot! 🤖";
        }
    }

    /**
     * 3. Objective-Driven Joke Variations
     */
    async generateJokeWithObjective(context = '') {
        if (!extension_settings.advancedJokeWorkflows?.objectiveDriven?.enabled) {
            return await this.generateBasicJoke(context);
        }

        try {
            const settings = extension_settings.advancedJokeWorkflows.objectiveDriven;
            const objectives = settings.objectives || Object.keys(JOKE_OBJECTIVES);

            // Rotate through objectives
            const objective = objectives[this.objectiveRotation % objectives.length];
            this.objectiveRotation++;

            const objectiveTemplate = JOKE_OBJECTIVES[objective];
            const topic = await this.selectTopicFromPool();
            const prompt = objectiveTemplate.replace('{topic}', topic);

            const response = await generateQuietPrompt({ quietPrompt: prompt });
            return response || `Here's a ${objective} joke: Why did the ${topic} go to therapy? It had too many issues! 😄`;
        } catch (error) {
            console.error('Objective-driven joke generation failed:', error);
            return "My joke generator needs a reboot! 🤖";
        }
    }

    /**
     * 4. Memory-Integrated Humor
     */
    async generateJokeWithMemory(context = '') {
        if (!extension_settings.advancedJokeWorkflows?.memoryIntegration?.enabled) {
            return await this.generateBasicJoke(context);
        }

        try {
            // Extract topics from recent chat
            await this.extractTopicsFromRecentChat();

            // Use memory topics for joke generation
            const memoryTopics = [...this.memoryTopics, ...this.chatSummaryTopics];
            if (memoryTopics.length === 0) {
                return await this.generateBasicJoke(context);
            }

            const selectedTopic = memoryTopics[Math.floor(Math.random() * memoryTopics.length)];
            const joke = await this.constructJokeFromTopic(selectedTopic, context);

            return joke;
        } catch (error) {
            console.error('Memory-integrated joke generation failed:', error);
            return "My joke generator needs a reboot! 🤖";
        }
    }

    async extractTopicsFromRecentChat() {
        // This would integrate with chat summarization
        // For now, we'll use a simple approach
        const recentMessages = chat.slice(-10); // Last 10 messages
        const topics = [];

        recentMessages.forEach(message => {
            if (message.mes && typeof message.mes === 'string') {
                // Simple keyword extraction (in a real implementation, this would be more sophisticated)
                const words = message.mes.toLowerCase().split(/\s+/);
                const interestingWords = words.filter(word =>
                    word.length > 3 &&
                    !['the', 'and', 'but', 'for', 'with', 'this', 'that', 'they', 'them', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'these', 'so', 'use', 'her', 'him', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'has', 'had', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
                );
                topics.push(...interestingWords.slice(0, 3)); // Take first 3 interesting words
            }
        });

        this.chatSummaryTopics = [...new Set(topics)].slice(0, 10);
    }

    /**
     * 5. Topic Roulette with SwipeModelRoulette
     */
    rotateTopicPool() {
        if (!extension_settings.advancedJokeWorkflows?.topicRoulette?.enabled) {
            return;
        }

        const settings = extension_settings.advancedJokeWorkflows.topicRoulette;
        const pools = settings.pools || Object.keys(TOPIC_POOLS);

        this.currentTopicPool = pools[this.topicRotation % pools.length];
        this.topicRotation++;

        console.log(`Topic pool rotated to: ${this.currentTopicPool}`);
    }

    /**
     * 6. Joke Scaffolding via Prompt Inspector
     */
    async generateJokeWithScaffolding(context = '') {
        if (!extension_settings.advancedJokeWorkflows?.jokeScaffolding?.enabled) {
            return await this.generateBasicJoke(context);
        }

        try {
            const settings = extension_settings.advancedJokeWorkflows.jokeScaffolding;
            const structures = settings.structures || Object.keys(JOKE_STRUCTURES);

            // Rotate through structures
            const structure = structures[this.structureRotation % structures.length];
            this.structureRotation++;

            const topic = await this.selectTopicFromPool();
            const structureTemplate = JOKE_STRUCTURES[structure];
            const prompt = structureTemplate.replace('{topic}', topic);

            const response = await generateQuietPrompt({ quietPrompt: prompt });
            return response || `Here's a ${structure} joke about ${topic}: Why did the ${topic} cross the road? To get to the other side! 😄`;
        } catch (error) {
            console.error('Joke scaffolding generation failed:', error);
            return "My joke generator needs a reboot! 🤖";
        }
    }

    /**
     * Main joke generation method that combines all approaches
     */
    async generateAdvancedJoke(context = '', method = 'auto') {
        console.log('Advanced joke generation called with context:', context, 'method:', method);

        if (!extension_settings.advancedJokeWorkflows?.enabled) {
            console.log('Advanced workflows disabled, using basic joke');
            return await this.generateBasicJoke(context);
        }

        const methods = {
            'stepped': () => this.generateJokeWithSteppedThinking(context),
            'guided': () => this.generateJokeWithGuidedGenerations(context),
            'objective': () => this.generateJokeWithObjective(context),
            'memory': () => this.generateJokeWithMemory(context),
            'scaffolding': () => this.generateJokeWithScaffolding(context),
            'auto': () => this.generateJokeWithAllMethods(context)
        };

        const selectedMethod = methods[method] || methods.auto;
        const result = await selectedMethod();
        console.log('Advanced joke result:', result);
        return result;
    }

    async generateJokeWithAllMethods(context = '') {
        const methods = [
            () => this.generateJokeWithSteppedThinking(context),
            () => this.generateJokeWithGuidedGenerations(context),
            () => this.generateJokeWithObjective(context),
            () => this.generateJokeWithMemory(context),
            () => this.generateJokeWithScaffolding(context)
        ];

        // Randomly select a method
        const randomMethod = methods[Math.floor(Math.random() * methods.length)];
        return await randomMethod();
    }

    async generateBasicJoke(context = '') {
        // For slash commands, return a simple joke directly
        const basicJokes = [
            "Why did the chicken cross the road? To get to the other side! 😄",
            "What do you call a fake noodle? An impasta! 🍝",
            "Why don't scientists trust atoms? Because they make up everything! ⚛️",
            "What do you call a bear with no teeth? A gummy bear! 🐻",
            "Why did the math book look so sad? Because it had too many problems! 📚",
            "What do you call a fish wearing a bowtie? So-fish-ticated! 🐟",
            "Why don't eggs tell jokes? They'd crack each other up! 🥚",
            "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks! 🦕"
        ];

        const randomJoke = basicJokes[Math.floor(Math.random() * basicJokes.length)];
        return randomJoke;
    }

    extractTopicsFromMessage(messageId) {
        // Extract topics from a specific message
        const message = chat[messageId];
        if (message && message.mes) {
            const words = message.mes.toLowerCase().split(/\s+/);
            const interestingWords = words.filter(word =>
                word.length > 3 &&
                !['the', 'and', 'but', 'for', 'with', 'this', 'that', 'they', 'them', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'these', 'so', 'use', 'her', 'him', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'has', 'had', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
            );

            this.memoryTopics.push(...interestingWords.slice(0, 2));
            this.memoryTopics = [...new Set(this.memoryTopics)].slice(-20); // Keep last 20 topics
        }
    }

    // Utility methods
    getCurrentTopicPool() {
        return this.currentTopicPool;
    }

    getCurrentObjective() {
        return this.currentObjective;
    }

    getCurrentStructure() {
        return this.currentStructure;
    }

    getMemoryTopics() {
        return [...this.memoryTopics, ...this.chatSummaryTopics];
    }

    clearMemoryTopics() {
        this.memoryTopics = [];
        this.chatSummaryTopics = [];
    }
}

// Initialize the advanced joke workflows
let advancedJokeWorkflows = null;

// Initialize immediately without waiting for SillyTavern
function initializeAdvancedJokeWorkflows() {
    console.log('🎭 Advanced Joke Workflows: Initializing...');
    advancedJokeWorkflows = new AdvancedJokeWorkflows();
    console.log('🎭 Advanced Joke Workflows initialized successfully');
}

// Start initialization immediately
initializeAdvancedJokeWorkflows();

// Export functions for use in slash commands and other modules
export async function generateAdvancedJoke(context = '', method = 'auto') {
    if (!advancedJokeWorkflows) {
        console.warn('Advanced Joke Workflows not initialized yet, using fallback');
        return "Why did the chicken cross the road? To get to the other side! 😄";
    }
    return await advancedJokeWorkflows.generateAdvancedJoke(context, method);
}

export async function generateJokeWithSteppedThinking(context = '') {
    if (!advancedJokeWorkflows) {
        return "Why did the chicken cross the road? To get to the other side! 😄";
    }
    return await advancedJokeWorkflows.generateJokeWithSteppedThinking(context);
}

export async function generateJokeWithGuidedGenerations(context = '') {
    if (!advancedJokeWorkflows) {
        return "What do you call a fake noodle? An impasta! 🍝";
    }
    return await advancedJokeWorkflows.generateJokeWithGuidedGenerations(context);
}

export async function generateJokeWithObjective(context = '') {
    if (!advancedJokeWorkflows) {
        return "Why don't scientists trust atoms? Because they make up everything! ⚛️";
    }
    return await advancedJokeWorkflows.generateJokeWithObjective(context);
}

export async function generateJokeWithMemory(context = '') {
    if (!advancedJokeWorkflows) {
        return "What do you call a bear with no teeth? A gummy bear! 🐻";
    }
    return await advancedJokeWorkflows.generateJokeWithMemory(context);
}

export async function generateJokeWithScaffolding(context = '') {
    if (!advancedJokeWorkflows) {
        return "Why did the math book look so sad? Because it had too many problems! 📚";
    }
    return await advancedJokeWorkflows.generateJokeWithScaffolding(context);
}

export function rotateTopicPool() {
    if (!advancedJokeWorkflows) {
        console.warn('Advanced Joke Workflows not initialized yet');
        return;
    }
    advancedJokeWorkflows.rotateTopicPool();
}

export function getCurrentTopicPool() {
    if (!advancedJokeWorkflows) {
        return 'not_initialized';
    }
    return advancedJokeWorkflows.getCurrentTopicPool();
}

export function getCurrentObjective() {
    if (!advancedJokeWorkflows) {
        return 'not_initialized';
    }
    return advancedJokeWorkflows.getCurrentObjective();
}

export function getCurrentStructure() {
    if (!advancedJokeWorkflows) {
        return 'not_initialized';
    }
    return advancedJokeWorkflows.getCurrentStructure();
}

export function getMemoryTopics() {
    if (!advancedJokeWorkflows) {
        return [];
    }
    return advancedJokeWorkflows.getMemoryTopics();
}

export function clearMemoryTopics() {
    if (!advancedJokeWorkflows) {
        console.warn('Advanced Joke Workflows not initialized yet');
        return;
    }
    advancedJokeWorkflows.clearMemoryTopics();
}

console.log('🎭 Advanced Joke Workflows loaded! Use /advancedjoke, /steppedjoke, /guidedjoke, /objectivejoke, /memoryjoke, or /scaffoldjoke commands.');

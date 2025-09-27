import { generateQuietPrompt, getRequestHeaders } from '../script.js';
import { extension_settings } from './extensions.js';

/**
 * Creative Joke Generator - Native SuperTavern Feature
 * Generates absurd roasts, creative jokes, and amplifies humor with AI
 */

const JOKE_PROMPTS = {
    roast: `You are a master of creative roasts. Generate absurd, creative roasts that are hilarious but not mean-spirited. Use wild scenarios, impossible situations, and creative wordplay. Make them absurdly funny like:

"Yo uncle wallet drier than the sahara he opened that shit and a fly flew out of it"
"nigga one time you accidentally sat all the way down on a beer bottle"
"you be using q-tips that got the head of a lettuce instead of a cotton ball"

Generate creative roasts in this absurd, impossible scenario style.`,

    absurdify: `Take any normal situation and make it absurdly hilarious. Amplify everyday scenarios into impossible, ridiculous situations. Use the style of absurd comedy like:

"you felt a fart coming out so you put a tampon in so it can pop like a wine bottle"
"you was so excited to have yo first child to celebrate you threw it up spinned up in the sky and caught it with yo mouth"
"yo toilet paper is made out of floor tiles and the bed sheets you sleep on are made out of the inside of a bee hive"

Make normal things impossibly ridiculous and absurdly funny.`,

    amplify: `Take any text and amplify its absurdity to maximum hilarity. Make normal things impossibly ridiculous. Use creative, impossible scenarios and wild exaggeration.`,

    jokebattle: `You're in a joke battle. Generate creative, absurd jokes that escalate the humor. Use impossible scenarios, creative wordplay, and absurd situations. Make them hilariously over-the-top.`,

    wordplay: `Generate clever wordplay, puns, and linguistic humor. Use creative language tricks, double meanings, and clever twists on words and phrases.`,

    situational: `Create situational comedy based on absurd, impossible scenarios. Use everyday situations but make them hilariously ridiculous and over-the-top.`
};

const INTENSITY_MODIFIERS = {
    mild: "Keep it family-friendly and playful. No harsh language or extreme scenarios.",
    medium: "Use playful roasts and absurd scenarios. Some edgy humor is okay.",
    extreme: "Go full absurd comedy. Use impossible scenarios, wild exaggeration, and hilariously over-the-top situations."
};

/**
 * Generate a creative roast in the user's style
 * @param {string} target - The target to roast
 * @returns {Promise<string>} The generated roast
 */
export async function generateRoast(target = 'yourself') {
    try {
        const settings = getJokeSettings();
        const intensity = INTENSITY_MODIFIERS[settings.intensity] || INTENSITY_MODIFIERS.medium;

        const prompt = `${JOKE_PROMPTS.roast}

${intensity}

Target: ${target}

Generate a creative roast in the absurd comedy style:`;

        const response = await generateQuietPrompt({ quietPrompt: prompt });
        return response || "I'm having trouble thinking of a good roast right now. Try again!";
    } catch (error) {
        console.error('Error generating roast:', error);
        return "My roast generator is broken! 🔥";
    }
}

/**
 * Make any text absurd and hilarious
 * @param {string} text - The text to make absurd
 * @returns {Promise<string>} The absurdified text
 */
export async function absurdifyText(text) {
    try {
        const settings = getJokeSettings();
        const intensity = INTENSITY_MODIFIERS[settings.intensity] || INTENSITY_MODIFIERS.medium;

        const prompt = `${JOKE_PROMPTS.absurdify}

${intensity}

Original text: "${text}"

Make it absurd:`;

        const response = await generateQuietPrompt({ quietPrompt: prompt });
        return response || text; // Return original if generation fails
    } catch (error) {
        console.error('Error absurdifying text:', error);
        return text; // Return original if generation fails
    }
}

/**
 * Amplify the absurdity of any text to maximum hilarity
 * @param {string} text - The text to amplify
 * @returns {Promise<string>} The amplified text
 */
export async function amplifyAbsurdity(text) {
    try {
        const settings = getJokeSettings();
        const intensity = INTENSITY_MODIFIERS[settings.intensity] || INTENSITY_MODIFIERS.medium;

        const prompt = `${JOKE_PROMPTS.amplify}

${intensity}

Text: "${text}"

Amplify the absurdity:`;

        const response = await generateQuietPrompt({ quietPrompt: prompt });
        return response || text; // Return original if generation fails
    } catch (error) {
        console.error('Error amplifying absurdity:', error);
        return text; // Return original if generation fails
    }
}

/**
 * Start a joke battle with another character
 * @param {string} opponent - The opponent character
 * @returns {Promise<string>} The opening joke battle line
 */
export async function startJokeBattle(opponent = 'the AI') {
    try {
        const settings = getJokeSettings();
        const intensity = INTENSITY_MODIFIERS[settings.intensity] || INTENSITY_MODIFIERS.medium;

        const prompt = `${JOKE_PROMPTS.jokebattle}

${intensity}

Opponent: ${opponent}

Start the joke battle with an opening line:`;

        const response = await generateQuietPrompt({ quietPrompt: prompt });
        return response || "Let's battle! 🔥";
    } catch (error) {
        console.error('Error starting joke battle:', error);
        return "Battle mode activated! ⚔️";
    }
}

/**
 * Generate a joke in a specific style
 * @param {string} style - The joke style (roast, absurd, wordplay, situational)
 * @param {string} context - Optional context for the joke
 * @returns {Promise<string>} The generated joke
 */
export async function generateJoke(style = 'roast', context = '') {
    try {
        const settings = getJokeSettings();
        const intensity = INTENSITY_MODIFIERS[settings.intensity] || INTENSITY_MODIFIERS.medium;
        const promptTemplate = JOKE_PROMPTS[style] || JOKE_PROMPTS.roast;

        const prompt = `${promptTemplate}

${intensity}

${context ? `Context: ${context}` : ''}

Generate a ${style} joke:`;

        const response = await generateQuietPrompt({ quietPrompt: prompt });
        return response || "I'm drawing a blank on jokes right now! 😅";
    } catch (error) {
        console.error('Error generating joke:', error);
        return "My joke generator needs a reboot! 🤖";
    }
}

/**
 * Auto-absurdify incoming messages if enabled
 * @param {string} message - The message to potentially absurdify
 * @returns {Promise<string>} The potentially absurdified message
 */
export async function autoAbsurdifyMessage(message) {
    try {
        const settings = getJokeSettings();
        if (!settings.enabled || !settings.autoAbsurdify) {
            return message;
        }

        // Only absurdify certain types of messages (not system messages, etc.)
        if (message.length < 10 || message.includes('System:') || message.includes('[')) {
            return message;
        }

        // Random chance to absurdify (30% chance)
        if (Math.random() > 0.3) {
            return message;
        }

        return await absurdifyText(message);
    } catch (error) {
        console.error('Error in auto-absurdify:', error);
        return message;
    }
}

/**
 * Get joke generator settings
 * @returns {object} The current joke settings
 */
function getJokeSettings() {
    return {
        enabled: extension_settings.jokeGenerator?.enabled || false,
        intensity: extension_settings.jokeGenerator?.intensity || 'medium',
        defaultStyle: extension_settings.jokeGenerator?.defaultStyle || 'roast',
        autoAbsurdify: extension_settings.jokeGenerator?.autoAbsurdify || false,
        characterSpecific: extension_settings.jokeGenerator?.characterSpecific || false
    };
}

/**
 * Test the joke generator with a sample joke
 * @returns {Promise<string>} A test joke
 */
export async function testJokeGenerator() {
    try {
        const testPrompts = [
            "Generate a roast about someone who's always late",
            "Make this absurd: 'I went to the store today'",
            "Create a wordplay joke about computers",
            "Generate a situational comedy about cooking"
        ];

        const randomPrompt = testPrompts[Math.floor(Math.random() * testPrompts.length)];
        const response = await generateQuietPrompt({ quietPrompt: randomPrompt });
        return response || "Test joke generation successful! 🎉";
    } catch (error) {
        console.error('Error testing joke generator:', error);
        return "Joke generator test failed! 😅";
    }
}

// Initialize joke generator settings
if (typeof extension_settings.jokeGenerator === 'undefined') {
    extension_settings.jokeGenerator = {
        enabled: false,
        intensity: 'medium',
        defaultStyle: 'roast',
        autoAbsurdify: false,
        characterSpecific: false,
        customPrompts: {},
        favoriteJokes: [],
        jokeHistory: []
    };
}

console.log('🎭 Creative Joke Generator loaded! Use /roast, /absurdify, /jokebattle, or /amplify commands.');

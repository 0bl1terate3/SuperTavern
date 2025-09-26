/**
 * AI-Powered Random Character Generator
 * Uses the connected AI to generate unique, creative characters
 */

import { generateQuietPrompt } from '../script.js';
import { getRequestHeaders } from '../script.js';
import { getCharacters, select_rm_info } from '../script.js';

/**
 * Character generation templates and prompts
 */
const CHARACTER_GENERATION_PROMPTS = {
    system: `You are a creative character designer for an AI chat application. Generate unique, interesting characters with diverse backgrounds, personalities, and appearances. Each character should be fully developed and ready for roleplay conversations.`,

    main: `Create a unique character for an AI chat application. The character should be interesting, well-developed, and ready for roleplay conversations.

Requirements:
- Create a character with a unique name, appearance, personality, and background
- Make them interesting and engaging for conversations
- Include diverse characteristics (age, gender, ethnicity, profession, etc.)
- Give them a compelling backstory and motivations
- Make their personality distinct and memorable

Please respond with a JSON object containing the following fields:
{
    "name": "Character's full name",
    "description": "Physical description and appearance",
    "personality": "Personality traits, quirks, and behavioral patterns",
    "scenario": "Background story, setting, and current situation",
    "first_mes": "Opening message the character would send in a chat",
    "mes_example": "Example of how the character typically speaks",
    "tags": ["tag1", "tag2", "tag3"],
    "creator_notes": "Additional notes about the character"
}

Make the character creative, unique, and engaging. Avoid clichés and create someone truly interesting to talk to.`,

    themes: [
        "fantasy adventure",
        "sci-fi space exploration",
        "mystery detective",
        "romantic comedy",
        "horror supernatural",
        "historical period piece",
        "modern slice of life",
        "cyberpunk future",
        "steampunk Victorian",
        "post-apocalyptic survival",
        "academic university",
        "artistic creative",
        "military veteran",
        "medical professional",
        "culinary chef",
        "musical performer",
        "athletic sports",
        "nature environmentalist",
        "technology programmer",
        "business entrepreneur"
    ]
};

/**
 * Generate a fallback character when AI generation fails
 */
function generateFallbackCharacter() {
    const fallbackCharacters = [
        {
            name: "Luna Starweaver",
            description: "A mysterious woman with silver hair and eyes that seem to hold the cosmos. She wears flowing robes adorned with celestial patterns and carries an ancient tome.",
            personality: "Wise, mystical, and slightly enigmatic. Luna speaks in riddles and metaphors, always seeming to know more than she reveals.",
            scenario: "Luna is a cosmic scholar who travels between dimensions, collecting knowledge from different realms. She's currently in a quiet library between worlds.",
            first_mes: "*The silver-haired woman looks up from her ancient tome, eyes sparkling with starlight*\n\nAh, another seeker of knowledge has found their way to my sanctuary. Tell me, what mysteries do you wish to unravel?",
            mes_example: "*She traces patterns in the air with her finger, leaving trails of starlight*\n\nThe universe speaks in patterns, dear one. Every question is a thread in the great tapestry of existence.",
            tags: ["mystical", "wise", "cosmic", "scholar", "enigmatic"],
            creator_notes: "AI-Generated Fallback Character: A cosmic scholar with mystical knowledge"
        },
        {
            name: "Alex Chen",
            description: "A young tech entrepreneur with messy hair and bright, curious eyes. Always wearing a hoodie and carrying multiple devices.",
            personality: "Enthusiastic, innovative, and slightly chaotic. Alex is passionate about technology and solving problems with creative solutions.",
            scenario: "Alex is working on a revolutionary AI project in their garage-turned-lab, surrounded by prototypes and energy drinks.",
            first_mes: "*Looks up from a glowing screen, coffee in hand*\n\nOh hey! I was just debugging this neural network when you showed up. Want to see what I'm building?",
            mes_example: "*Excitedly gestures at various gadgets*\n\nDude, you won't believe what I just figured out! This algorithm could change everything!",
            tags: ["tech", "entrepreneur", "innovative", "young", "enthusiastic"],
            creator_notes: "AI-Generated Fallback Character: A passionate tech entrepreneur"
        },
        {
            name: "Captain Zara Voss",
            description: "A seasoned space explorer with weathered features and a confident stance. Wears a practical flight suit with various tools and gadgets attached.",
            personality: "Brave, resourceful, and slightly sarcastic. Zara has seen the galaxy and isn't easily impressed, but has a soft spot for those who show courage.",
            scenario: "Zara is the captain of the starship 'Nebula Runner', currently docked at a space station for repairs and resupply.",
            first_mes: "*Leans against the ship's console, arms crossed*\n\nWell, well. Another curious soul drawn to the stars. What brings you to my corner of the galaxy?",
            mes_example: "*Chuckles while checking ship diagnostics*\n\nKid, I've seen black holes that were less dangerous than some of the situations I've been in. But hey, that's what makes life interesting.",
            tags: ["space", "captain", "explorer", "brave", "experienced"],
            creator_notes: "AI-Generated Fallback Character: A veteran space explorer"
        }
    ];

    const randomIndex = Math.floor(Math.random() * fallbackCharacters.length);
    return fallbackCharacters[randomIndex];
}

/**
 * Generate a random character using AI
 */
export async function generateRandomCharacter() {
    try {
        console.log('Starting character generation...');

        // Show loading state
        showSurpriseLoading(true);

        // Select a random theme
        const randomTheme = CHARACTER_GENERATION_PROMPTS.themes[Math.floor(Math.random() * CHARACTER_GENERATION_PROMPTS.themes.length)];
        console.log('Selected theme:', randomTheme);

        // Create the generation prompt
        const prompt = `${CHARACTER_GENERATION_PROMPTS.main}\n\nTheme inspiration: ${randomTheme}`;
        console.log('Generated prompt length:', prompt.length);

        // Check if generateQuietPrompt is available
        if (typeof generateQuietPrompt !== 'function') {
            throw new Error('generateQuietPrompt function not available. Make sure you have an AI model connected.');
        }

        console.log('Calling AI generation...');

        // Try AI generation first, with simpler prompt
        let aiResponse;
        try {
            aiResponse = await generateQuietPrompt({
                quietPrompt: `Create a unique character for an AI chat application. Respond with a JSON object containing: name, description, personality, scenario, first_mes, mes_example, tags (array), and creator_notes. Theme: ${randomTheme}`,
                quietToLoud: false,
                skipWIAN: true,
                responseLength: 1500
            });
        } catch (aiError) {
            console.warn('AI generation failed, using fallback:', aiError);
            const fallbackData = generateFallbackCharacter();
            const character = await createCharacterFromData(fallbackData);
            showSurpriseSuccess(character.name);
            return character;
        }

        console.log('AI response received:', aiResponse);
        console.log('AI response type:', typeof aiResponse);
        console.log('AI response length:', aiResponse ? aiResponse.length : 'null/undefined');

        // Handle empty or invalid responses
        if (!aiResponse || aiResponse === '{}' || aiResponse.trim() === '') {
            console.warn('AI returned empty response, using fallback character generation');
            const characterData = generateFallbackCharacter();
            const character = await createCharacterFromData(characterData);
            showSurpriseSuccess(character.name);
            return character;
        }

        // Parse the AI response
        let characterData;
        try {
            // First, try to clean the response by removing markdown code blocks
            let cleanedResponse = aiResponse;

            // Remove markdown code blocks if present
            if (cleanedResponse.includes('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            if (cleanedResponse.includes('```')) {
                cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
            }

            // Remove any leading/trailing whitespace and newlines
            cleanedResponse = cleanedResponse.trim();

            // Try to find the JSON object in the response
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }

            console.log('Cleaned response:', cleanedResponse);
            characterData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.warn('Failed to parse AI response as JSON, attempting to extract JSON from response:', parseError);
            // Try to extract JSON from the response if it's wrapped in other text
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    characterData = JSON.parse(jsonMatch[0]);
                } catch (secondParseError) {
                    console.warn('Could not parse character data from AI response, using fallback');
                    const fallbackData = generateFallbackCharacter();
                    const character = await createCharacterFromData(fallbackData);
                    showSurpriseSuccess(character.name);
                    return character;
                }
            } else {
                console.warn('Could not parse character data from AI response, using fallback');
                const fallbackData = generateFallbackCharacter();
                const character = await createCharacterFromData(fallbackData);
                showSurpriseSuccess(character.name);
                return character;
            }
        }

        // Validate and normalize the character data
        if (!characterData || !characterData.name || !characterData.description) {
            console.warn('AI response missing required character fields, using fallback');
            const fallbackData = generateFallbackCharacter();
            const character = await createCharacterFromData(fallbackData);
            showSurpriseSuccess(character.name);
            return character;
        }

        // Normalize the character data to match expected format
        const normalizedData = {
            name: characterData.name || 'Unknown Character',
            description: characterData.description || 'A mysterious character',
            personality: characterData.personality || 'Friendly and engaging',
            scenario: characterData.scenario || 'A casual encounter',
            first_mes: characterData.first_mes || 'Hello! Nice to meet you!',
            mes_example: characterData.mes_example || (Array.isArray(characterData.mes) ? characterData.mes[0] : 'How are you doing today?'),
            tags: Array.isArray(characterData.tags) ? characterData.tags : ['ai-generated', 'friendly'],
            creator_notes: characterData.creator_notes || 'AI-Generated Character'
        };

        console.log('Normalized character data:', normalizedData);

        // Generate a random avatar using AI image generation (if available)
        const avatarUrl = await generateCharacterAvatar(normalizedData);

        // Create the character
        const character = await createCharacterFromData(normalizedData, avatarUrl);

        // Show success message
        showSurpriseSuccess(character.name);

        return character;

    } catch (error) {
        console.error('Error generating random character:', error);
        showSurpriseError(error.message);
        throw error;
    } finally {
        showSurpriseLoading(false);
    }
}

/**
 * Generate an AI avatar for the character
 */
async function generateCharacterAvatar(characterData) {
    try {
        // Check if Stable Diffusion or other image generation is available
        if (window.stableDiffusionAvailable) {
            const avatarPrompt = `Portrait of ${characterData.name}: ${characterData.description}. High quality, detailed, professional character portrait.`;

            // Use the existing Stable Diffusion integration
            const avatarResponse = await fetch('/api/stable-diffusion/generate', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    prompt: avatarPrompt,
                    negative_prompt: 'blurry, low quality, distorted, deformed',
                    width: 512,
                    height: 512,
                    steps: 20,
                    cfg_scale: 7.5
                })
            });

            if (avatarResponse.ok) {
                const avatarData = await avatarResponse.json();
                return avatarData.image_url;
            }
        }

        // Fallback to default avatar
        return null;

    } catch (error) {
        console.warn('Could not generate AI avatar, using default:', error);
        return null;
    }
}

/**
 * Create a character from the generated data
 */
async function createCharacterFromData(characterData, avatarUrl = null) {
    try {
        const formData = new FormData();
        formData.append('ch_name', characterData.name);
        formData.append('description', characterData.description);
        formData.append('personality', characterData.personality);
        formData.append('scenario', characterData.scenario);
        formData.append('first_mes', characterData.first_mes);
        formData.append('mes_example', characterData.mes_example);
        formData.append('creator_notes', `AI-Generated Character: ${characterData.creator_notes}`);
        formData.append('tags', characterData.tags.join(', '));

        // Add avatar if generated
        if (avatarUrl) {
            try {
                const avatarResponse = await fetch(avatarUrl);
                const avatarBlob = await avatarResponse.blob();
                formData.append('avatar', avatarBlob, `${characterData.name.replace(/\s+/g, '_')}.png`);
            } catch (avatarError) {
                console.warn('Could not fetch generated avatar:', avatarError);
            }
        }

        // Create the character
        const response = await fetch('/api/characters/create', {
            method: 'POST',
            headers: getRequestHeaders({ omitContentType: true }),
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Failed to create character: ${response.statusText}`);
        }

        const avatarName = await response.text();

        console.log('Refreshing character list...');

        // Follow the same pattern as the main character creation flow
        console.log('Calling getCharacters()...');
        await getCharacters();
        console.log('getCharacters() completed');

        // Use the same select_rm_info call as the main character creation
        console.log('Calling select_rm_info for character creation...');
        select_rm_info('char_create', avatarName);

        return {
            name: characterData.name,
            avatar: avatarName,
            data: characterData
        };

    } catch (error) {
        console.error('Error creating character:', error);
        throw error;
    }
}

/**
 * Show loading state for surprise button
 */
function showSurpriseLoading(loading) {
    const button = document.getElementById('rm_button_surprise');
    if (button) {
        if (loading) {
            button.classList.add('loading');
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
            button.disabled = false;
        }
    }
}

/**
 * Show success message
 */
function showSurpriseSuccess(characterName) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'surprise-success-message';
    successDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4ecdc4, #45b7d1);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            font-weight: 600;
            animation: surpriseSuccess 2s ease-out forwards;
        ">
            <i class="fa-solid fa-sparkles" style="font-size: 24px; margin-bottom: 10px;"></i>
            <div>✨ Surprise! ✨</div>
            <div style="margin-top: 5px; font-size: 18px;">${characterName} has been created!</div>
        </div>
    `;

    document.body.appendChild(successDiv);

    // Remove after animation
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 2000);
}

/**
 * Show error message
 */
function showSurpriseError(errorMessage) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'surprise-error-message';
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            font-weight: 600;
            animation: surpriseError 3s ease-out forwards;
        ">
            <i class="fa-solid fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
            <div>Oops! Something went wrong</div>
            <div style="margin-top: 5px; font-size: 14px; opacity: 0.9;">${errorMessage}</div>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // Remove after animation
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

/**
 * Initialize the surprise button functionality
 */
export function initSurpriseCharacterGenerator() {
    console.log('Initializing surprise character generator...');

    // Add click handler for surprise button
    $(document).on('click', '#rm_button_surprise', async function(e) {
        e.preventDefault();
        console.log('Surprise button clicked!');

        try {
            await generateRandomCharacter();
        } catch (error) {
            console.error('Surprise character generation failed:', error);
            showSurpriseError(`Generation failed: ${error.message}`);
        }
    });

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes surpriseSuccess {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
            }
            50% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.1);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(1);
            }
        }

        @keyframes surpriseError {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
            }
            20% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(1);
            }
        }

        .surprise-button.loading {
            animation: surpriseGradient 0.5s ease infinite;
        }
    `;
    document.head.appendChild(style);
}

// Auto-initialize when the script loads
$(document).ready(() => {
    initSurpriseCharacterGenerator();
});

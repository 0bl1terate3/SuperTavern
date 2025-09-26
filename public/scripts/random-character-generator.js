/**
 * AI-Powered Random Character Generator
 * Uses the connected AI to generate unique, creative characters
 */

import { generateQuietPrompt } from '../script.js';
import { getRequestHeaders } from '../script.js';

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

        // Generate the character using AI
        const aiResponse = await generateQuietPrompt({
            quietPrompt: prompt,
            quietToLoud: false,
            skipWIAN: true,
            responseLength: 2000,
            jsonSchema: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    personality: { type: "string" },
                    scenario: { type: "string" },
                    first_mes: { type: "string" },
                    mes_example: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    creator_notes: { type: "string" }
                },
                required: ["name", "description", "personality", "scenario", "first_mes", "mes_example", "tags", "creator_notes"]
            }
        });

        console.log('AI response received:', aiResponse);

        // Parse the AI response
        let characterData;
        try {
            characterData = JSON.parse(aiResponse);
        } catch (parseError) {
            console.warn('Failed to parse AI response as JSON, attempting to extract JSON from response:', parseError);
            // Try to extract JSON from the response if it's wrapped in other text
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                characterData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not parse character data from AI response');
            }
        }

        // Validate the character data
        if (!characterData.name || !characterData.description) {
            throw new Error('AI response missing required character fields');
        }

        // Generate a random avatar using AI image generation (if available)
        const avatarUrl = await generateCharacterAvatar(characterData);

        // Create the character
        const character = await createCharacterFromData(characterData, avatarUrl);

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

        // Refresh character list
        if (window.getCharacters) {
            await window.getCharacters();
        }

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

        // Test if button click is working
        showSurpriseSuccess('Button clicked! Testing...');

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

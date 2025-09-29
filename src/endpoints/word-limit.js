import express from 'express';

const router = express.Router();

// Simple word counting function
function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Apply word limit to text
function applyWordLimit(text, settings) {
    if (!settings || !settings.enabled || !text) {
        return text;
    }

    const wordCount = countWords(text);
    const limit = settings.targetWords > 0 ? settings.targetWords : settings.maxWords;

    // If within limits, return as-is
    if (wordCount <= limit + (settings.strict ? 0 : settings.tolerance)) {
        return text;
    }

    // If strict mode or over tolerance, truncate
    if (settings.strict || wordCount > limit + settings.tolerance) {
        const words = text.trim().split(/\s+/);
        const truncated = words.slice(0, limit).join(' ');
        return truncated + (words.length > limit ? '...' : '');
    }

    return text;
}

// Get word limit prompt addition
function getWordLimitPrompt(settings) {
    if (!settings || !settings.enabled) {
        return '';
    }

    const limit = settings.targetWords > 0 ? settings.targetWords : settings.maxWords;
    
    if (settings.targetWords > 0) {
        return `\n\n[IMPORTANT: Your response must be exactly ${settings.targetWords} words. Count carefully.]`;
    } else if (settings.strict) {
        return `\n\n[IMPORTANT: Keep your response under ${limit} words. Be concise.]`;
    } else {
        return `\n\n[IMPORTANT: Aim for around ${limit} words (±${settings.tolerance} words is acceptable).]`;
    }
}

/**
 * Apply word limit to response text
 */
router.post('/apply', (request, response) => {
    try {
        const { text, settings } = request.body;
        
        if (!text) {
            return response.json({ text: '', wordCount: 0 });
        }

        const processedText = applyWordLimit(text, settings);
        const wordCount = countWords(processedText);
        
        return response.json({ 
            text: processedText, 
            wordCount,
            limited: processedText !== text 
        });
    } catch (error) {
        console.error('Failed to apply word limit:', error);
        return response.status(500).json({ error: 'Failed to apply word limit' });
    }
});

/**
 * Get word limit prompt modification
 */
router.post('/prompt', (request, response) => {
    try {
        const { settings } = request.body;
        const promptAddition = getWordLimitPrompt(settings);
        
        return response.json({ promptAddition });
    } catch (error) {
        console.error('Failed to generate word limit prompt:', error);
        return response.status(500).json({ error: 'Failed to generate prompt' });
    }
});

/**
 * Count words in text
 */
router.post('/count', (request, response) => {
    try {
        const { text } = request.body;
        const wordCount = countWords(text);
        
        return response.json({ wordCount });
    } catch (error) {
        console.error('Failed to count words:', error);
        return response.status(500).json({ error: 'Failed to count words' });
    }
});

export { router };

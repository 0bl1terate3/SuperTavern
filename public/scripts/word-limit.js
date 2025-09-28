import { chat_metadata, generateQuietPrompt, saveChatDebounced } from '../script.js';

const WORD_LIMIT_METADATA_KEY = 'word_limit';
const MAX_AI_ATTEMPTS = 3;
const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'so', 'to', 'of', 'for', 'in', 'on', 'at', 'by', 'with', 'from', 'into', 'about',
    'over', 'under', 'between', 'through', 'during', 'before', 'after', 'up', 'down', 'out', 'off', 'than', 'as', 'if', 'then',
    'while', 'because', 'since', 'though', 'although', 'though', 'unless', 'without', 'within', 'beyond', 'around', 'near',
    'just', 'very', 'really', 'quite', 'still', 'also', 'even', 'too', 'ever', 'never', 'maybe', 'perhaps', 'almost',
]);
const FILLER_WORDS = new Set([
    'literally', 'actually', 'basically', 'seriously', 'simply', 'kinda', 'sorta', 'pretty', 'totally', 'completely',
    'extremely', 'highly', 'truly', 'honestly', 'definitely', 'probably', 'apparently', 'maybe', 'perhaps', 'somewhat',
]);

/**
 * Returns the currently active word limit stored in chat metadata.
 * @returns {number|null}
 */
export function getActiveWordLimit() {
    const limit = chat_metadata?.[WORD_LIMIT_METADATA_KEY];
    if (typeof limit !== 'number') {
        return null;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
        return null;
    }

    return Math.floor(limit);
}

/**
 * Updates the active word limit in chat metadata.
 * @param {number|null|undefined} limit
 */
export function setActiveWordLimit(limit) {
    if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
        delete chat_metadata[WORD_LIMIT_METADATA_KEY];
    } else {
        chat_metadata[WORD_LIMIT_METADATA_KEY] = Math.max(1, Math.floor(limit));
    }

    saveChatDebounced();
}

/**
 * Removes the active word limit from chat metadata.
 */
export function clearActiveWordLimit() {
    delete chat_metadata[WORD_LIMIT_METADATA_KEY];
    saveChatDebounced();
}

/**
 * Applies the configured word limit to the provided text, rewriting it if needed.
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.limit]
 * @param {boolean} [options.skipAi]
 * @returns {Promise<{
 *   text: string,
 *   applied: boolean,
 *   limit?: number,
 *   method?: string,
 *   attempts?: number,
 *   fallback?: boolean,
 *   details?: object,
 * }>}
 */
export async function applyWordLimitIfNeeded(text, { limit = null, skipAi = false } = {}) {
    if (!text) {
        return { text, applied: false };
    }

    const targetLimit = normalizeLimit(limit ?? getActiveWordLimit());
    if (!targetLimit) {
        return { text, applied: false };
    }

    const originalWords = splitWords(text);
    if (originalWords.length <= targetLimit) {
        return { text, applied: false, limit: targetLimit };
    }

    const attempts = [];
    if (!skipAi) {
        const aiResult = await tryRewriteWithAi(text, targetLimit, attempts);
        if (aiResult?.success && aiResult.words?.length === targetLimit) {
            const rewritten = joinWords(aiResult.words);
            return {
                text: rewritten,
                applied: true,
                method: 'ai',
                limit: targetLimit,
                attempts: attempts.length,
                details: buildAttemptDetails(aiResult),
            };
        }
    }

    const fallbackSource = selectFallbackSourceWords(originalWords, attempts, targetLimit);
    const fallbackWords = shrinkWordsToLimit(fallbackSource, targetLimit);
    const fallbackText = joinWords(fallbackWords);
    return {
        text: fallbackText,
        applied: true,
        method: 'fallback',
        fallback: true,
        limit: targetLimit,
        attempts: attempts.length,
        details: buildAttemptDetails({ words: fallbackWords, success: false }),
    };
}

function normalizeLimit(limit) {
    if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
        return null;
    }

    return Math.max(1, Math.floor(limit));
}

function buildAttemptDetails(result) {
    if (!result) {
        return undefined;
    }

    const wordCount = Array.isArray(result.words) ? result.words.length : null;
    return {
        success: Boolean(result.success),
        wordCount,
    };
}

async function tryRewriteWithAi(text, limit, attempts) {
    const schema = createSchema(limit);
    let useSchema = true;
    let lastAttempt = null;

    for (let attempt = 0; attempt < MAX_AI_ATTEMPTS; attempt++) {
        const prompt = buildPrompt(text, limit, attempt, lastAttempt);

        let response;
        try {
            response = await generateQuietPrompt({
                quietPrompt: prompt,
                quietToLoud: true,
                jsonSchema: useSchema ? schema : null,
                removeReasoning: true,
                trimToSentence: false,
            });
        } catch (error) {
            attempts.push({ error: error?.message ?? String(error) });
            if (useSchema) {
                useSchema = false;
                continue;
            }
            continue;
        }

        const parsed = parseWordLimitResponse(response, limit);
        attempts.push(parsed);
        lastAttempt = parsed;

        if (parsed.success) {
            return parsed;
        }

        if (parsed.schemaRejected) {
            useSchema = false;
        }
    }

    return null;
}

function createSchema(limit) {
    return {
        name: `word_limit_${limit}`,
        description: `Rewrite text using exactly ${limit} words`,
        strict: true,
        value: {
            type: 'object',
            properties: {
                words: {
                    type: 'array',
                    items: {
                        type: 'string',
                        pattern: '^[^\s]+$', // eslint-disable-line no-useless-escape
                    },
                    minItems: limit,
                    maxItems: limit,
                },
            },
            required: ['words'],
            additionalProperties: false,
        },
    };
}

function buildPrompt(text, limit, attempt, lastAttempt) {
    const lines = [
        `Rewrite the following roast-style reply so it contains exactly ${limit} words.`,
        'Keep the same subject, intent, and comedic tone.',
        'Respond ONLY with JSON in the form: {"words":["word1","word2",...]}',
        'Each entry in "words" must be a single word (spaces are not allowed). Use apostrophes for contractions when needed.',
        'Do not add explanations or extra commentary.',
    ];

    if (attempt > 0 && lastAttempt?.wordCount) {
        const preview = Array.isArray(lastAttempt.words)
            ? joinWords(lastAttempt.words).slice(0, 120)
            : (lastAttempt.normalized ?? '').slice(0, 120);
        lines.push(`Previous attempt used ${lastAttempt.wordCount} words (${preview || 'no preview'}). Adjust to exactly ${limit} words.`);
    }

    lines.push('Original message:');
    lines.push('"""');
    lines.push(text);
    lines.push('"""');
    return lines.join('\n');
}

function parseWordLimitResponse(response, limit) {
    const normalized = typeof response === 'string' ? response.trim() : '';
    const result = {
        raw: response,
        normalized,
        words: [],
        wordCount: 0,
        success: false,
    };

    if (!normalized) {
        return result;
    }

    const jsonMatch = normalized.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            const candidate = extractWordsFromParsedJson(parsed);
            if (Array.isArray(candidate)) {
                const cleaned = candidate.map(value => String(value ?? '').trim()).filter(Boolean);
                if (cleaned.every(item => !/\s/.test(item))) {
                    result.words = cleaned;
                    result.wordCount = cleaned.length;
                    result.success = cleaned.length === limit;
                    result.method = 'json';
                    return result;
                }
            }
        } catch (error) {
            result.jsonError = error?.message ?? String(error);
        }
    }

    const pipeCandidate = parseDelimitedWords(normalized, limit);
    if (pipeCandidate.success) {
        result.words = pipeCandidate.words;
        result.wordCount = pipeCandidate.words.length;
        result.success = pipeCandidate.words.length === limit;
        result.method = pipeCandidate.method;
        return result;
    }

    const plainWords = splitWords(normalized);
    result.words = plainWords;
    result.wordCount = plainWords.length;
    result.success = plainWords.length === limit;
    result.method = 'plain';
    return result;
}

function extractWordsFromParsedJson(parsed) {
    if (!parsed) {
        return null;
    }

    if (Array.isArray(parsed.words)) {
        return parsed.words;
    }

    if (parsed.result && Array.isArray(parsed.result.words)) {
        return parsed.result.words;
    }

    if (Array.isArray(parsed.tokens)) {
        return parsed.tokens;
    }

    return null;
}

function parseDelimitedWords(value, limit) {
    const cleanValue = value.replace(/[\[\]{}]/g, ''); // eslint-disable-line no-useless-escape
    const pipeSplit = cleanValue.split('|').map((part) => part.trim()).filter(Boolean);
    if (pipeSplit.length === limit && pipeSplit.every(word => word && !/\s/.test(word))) {
        return { success: true, words: pipeSplit, method: 'pipe' };
    }

    const newlineSplit = cleanValue.split(/\r?\n/).map(part => part.trim()).filter(Boolean);
    if (newlineSplit.length === limit && newlineSplit.every(word => word && !/\s/.test(word))) {
        return { success: true, words: newlineSplit, method: 'lines' };
    }

    return { success: false, words: [] };
}

function selectFallbackSourceWords(originalWords, attempts, limit) {
    const candidates = [];

    if (Array.isArray(originalWords) && originalWords.length) {
        candidates.push({ words: originalWords, score: Math.abs(originalWords.length - limit) });
    }

    if (Array.isArray(attempts)) {
        for (const attempt of attempts) {
            if (!Array.isArray(attempt?.words) || !attempt.words.length) {
                continue;
            }

            const score = Math.abs(attempt.words.length - limit);
            candidates.push({ words: attempt.words, score });
        }
    }

    candidates.sort((a, b) => a.score - b.score);
    return candidates[0]?.words ?? originalWords ?? [];
}

function shrinkWordsToLimit(words, limit) {
    if (!Array.isArray(words)) {
        return [];
    }

    const result = [...words];
    if (result.length <= limit) {
        return result;
    }

    removeByPredicate(result, limit, word => isPurePunctuation(word));
    removeByPredicate(result, limit, word => STOPWORDS.has(normalizeWord(word)));
    removeByPredicate(result, limit, word => FILLER_WORDS.has(normalizeWord(word)));

    if (result.length > limit) {
        removeShortestInteriorWords(result, limit);
    }

    if (result.length > limit) {
        return result.slice(0, limit);
    }

    return result;
}

function removeByPredicate(words, limit, predicate) {
    if (words.length <= limit) {
        return;
    }

    for (let i = words.length - 1; i >= 0 && words.length > limit; i--) {
        if (predicate(words[i])) {
            words.splice(i, 1);
        }
    }
}

function removeShortestInteriorWords(words, limit) {
    const candidates = words
        .map((word, index) => ({ index, word, normalized: normalizeWord(word) }))
        .filter(item => item.index !== 0 && item.index !== words.length - 1);

    candidates.sort((a, b) => {
        const lengthA = a.normalized.length || 1000;
        const lengthB = b.normalized.length || 1000;
        if (lengthA !== lengthB) {
            return lengthA - lengthB;
        }
        return a.index - b.index;
    });

    for (const candidate of candidates) {
        if (words.length <= limit) {
            break;
        }

        words.splice(candidate.index, 1);
        for (const other of candidates) {
            if (other.index > candidate.index) {
                other.index--;
            }
        }
    }
}

function isPurePunctuation(word) {
    return !normalizeWord(word);
}

function normalizeWord(word) {
    if (typeof word !== 'string') {
        return '';
    }

    return word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
}

function splitWords(text) {
    if (!text) {
        return [];
    }

    return text.trim().split(/\s+/).filter(Boolean);
}

function joinWords(words) {
    return words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export { WORD_LIMIT_METADATA_KEY };

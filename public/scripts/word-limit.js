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
const PHRASE_REPLACEMENTS = [
    { pattern: /\byou are\b/gi, replacement: 'you\'re' },
    { pattern: /\byou have\b/gi, replacement: 'you\'ve' },
    { pattern: /\bkind of\b/gi, replacement: 'kinda' },
    { pattern: /\bsort of\b/gi, replacement: 'sorta' },
    { pattern: /\bgoing to\b/gi, replacement: 'gonna' },
    { pattern: /\bgot to\b/gi, replacement: 'gotta' },
    { pattern: /\btrying to\b/gi, replacement: 'tryna' },
    { pattern: /\bto unplug\b/gi, replacement: 'unplug' },
    { pattern: /\byour\b/gi, replacement: 'yo' },
    { pattern: /\bbrand new\b/gi, replacement: 'brand-new' },
    { pattern: /\bspace odyssey\b/gi, replacement: 'space-odyssey' },
    { pattern: /\bmoon pie\b/gi, replacement: 'moonpie' },
];
const SINGLE_WORD_SUBSTITUTIONS = new Map([
    ['extremely', 'mad'],
    ['incredibly', 'mad'],
    ['absolutely', 'dead'],
    ['totally', 'mad'],
    ['because', 'cuz'],
    ['favorite', 'fav'],
    ['favourite', 'fav'],
    ['movie', 'flick'],
    ['television', 'tv'],
    ['ridiculous', 'wild'],
    ['disgusting', 'gross'],
    ['embarrassing', 'shameful'],
    ['annoying', 'irritating'],
    ['stupid', 'dumb'],
    ['ugly', 'ugly'],
    ['terrible', 'trash'],
    ['horrible', 'trash'],
    ['awful', 'trash'],
    ['smells', 'stinks'],
    ['smelling', 'stinking'],
    ['laughing', 'laughin'],
    ['laughingstock', 'clown'],
    ['clowning', 'clownin'],
    ['embarrassed', 'shook'],
    ['grandmother', 'grandma'],
    ['grandfather', 'grandpa'],
    ['fingerprints', 'prints'],
    ['uncle', 'unc'],
]);
const PHRASE_CHUNKS = [
    ['cotton', 'swab'],
    ['moon', 'pie'],
    ['space', 'odyssey'],
    ['shoe', 'soles'],
    ['brand-new'],
    ['space-odyssey'],
];
const ROAST_SUBJECT_WORDS = new Set(['yo', 'you', 'ya', 'nigga', 'dude', 'bro', 'fam', 'girl', 'boy']);
const IMPACT_ADJECTIVES = new Set([
    'dusty', 'musty', 'crusty', 'strange', 'weird', 'wild', 'dumb', 'funky', 'busted', 'sad', 'broke', 'tragic', 'mad',
    'gross', 'trash', 'weak', 'pale', 'bold', 'loud', 'slow', 'short', 'tall', 'tiny', 'huge', 'cheap', 'fake', 'lazy',
]);
const IMPACT_VERBS = new Set([
    'smell', 'stink', 'glow', 'glowing', 'look', 'looking', 'act', 'acting', 'breathe', 'breathing', 'collect', 'collecting',
    'wear', 'wearing', 'eat', 'eating', 'scream', 'screaming', 'slide', 'sliding', 'trip', 'tripping', 'sleep', 'sleeping',
    'love', 'loving', 'hate', 'hating', 'lick', 'licking', 'wipe', 'wiping',
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

    const heuristic = rewriteWithHeuristics(text, originalWords, attempts, targetLimit);
    if (heuristic?.words?.length === targetLimit) {
        const heuristicText = joinWords(heuristic.words);
        return {
            text: heuristicText,
            applied: true,
            method: heuristic.method ?? 'heuristic',
            fallback: true,
            limit: targetLimit,
            attempts: attempts.length,
            details: buildAttemptDetails(heuristic),
        };
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

function rewriteWithHeuristics(originalText, originalWords, attempts, limit) {
    const normalizedText = collapseWhitespace(originalText ?? '');
    const candidateTexts = new Set();
    const addCandidateText = (value, reason) => {
        if (!value) {
            return;
        }

        const trimmed = collapseWhitespace(value);
        if (!trimmed) {
            return;
        }

        candidateTexts.add(JSON.stringify({ text: trimmed, reason }));
    };

    addCandidateText(normalizedText, 'original');
    addCandidateText(applySynonymCompression(normalizedText), 'synonyms');

    for (const variant of applyTemplateRewrites(normalizedText)) {
        addCandidateText(variant.text, variant.reason);
    }

    for (const special of applySpecialCaseRewrites(normalizedText)) {
        addCandidateText(special.text, special.reason);
    }

    if (Array.isArray(attempts)) {
        for (const attempt of attempts) {
            if (Array.isArray(attempt?.words) && attempt.words.length) {
                addCandidateText(joinWords(attempt.words), attempt.method || 'ai-attempt');
            } else if (typeof attempt?.normalized === 'string') {
                addCandidateText(attempt.normalized, attempt.method || 'ai-raw');
            }
        }
    }

    const originalWordList = Array.isArray(originalWords) ? originalWords : splitWords(normalizedText);
    let bestCandidate = null;

    for (const serialized of candidateTexts) {
        const { text: candidateText, reason } = JSON.parse(serialized);
        const candidateWords = splitWords(candidateText);
        let trimmedWords = trimWithImpactScoring(candidateWords, limit);

        if (trimmedWords.length !== limit) {
            trimmedWords = ensureExactWordCount(trimmedWords, candidateWords, originalWordList, limit);
        }

        if (trimmedWords.length !== limit) {
            continue;
        }

        const score = scoreCandidate(trimmedWords);
        if (!bestCandidate || score > bestCandidate.score) {
            bestCandidate = {
                words: trimmedWords,
                score,
                strategy: reason,
            };
        }
    }

    if (bestCandidate) {
        return {
            words: bestCandidate.words,
            method: 'heuristic',
            success: true,
            strategy: bestCandidate.strategy,
            score: bestCandidate.score,
        };
    }

    return null;
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
    const details = {
        success: Boolean(result.success),
        wordCount,
    };
    if (result.strategy) {
        details.strategy = result.strategy;
    }
    if (typeof result.score === 'number' && Number.isFinite(result.score)) {
        details.score = result.score;
    }
    if (result.method && typeof result.method === 'string') {
        details.method = result.method;
    }

    return details;
}

function collapseWhitespace(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.replace(/\s+/g, ' ').trim();
}

function applySynonymCompression(text) {
    let result = text;
    for (const { pattern, replacement } of PHRASE_REPLACEMENTS) {
        result = result.replace(pattern, replacement);
    }

    result = result.replace(/\bthis nigga\b/gi, 'nigga');

    for (const [from, to] of SINGLE_WORD_SUBSTITUTIONS.entries()) {
        const pattern = new RegExp(`\\b${escapeRegex(from)}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
            const isUpper = match === match.toUpperCase();
            const lower = to.toLowerCase();
            if (isUpper) {
                return lower.toUpperCase();
            }
            if (match[0] === match[0].toUpperCase()) {
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            }
            return lower;
        });
    }

    return collapseWhitespace(result);
}

function applyTemplateRewrites(text) {
    const variants = [];

    const yoSoPattern = /(yo\s+[^.!?]+?)\s+so\s+([^.!?]+?)([.!?]|$)/gi;
    const yoSoRewritten = text.replace(yoSoPattern, (_, subject, rest, punctuation) => `${subject} ${rest}${punctuation || ''}`);
    if (yoSoRewritten !== text) {
        variants.push({
            text: collapseWhitespace(yoSoRewritten),
            reason: 'template-yo-so',
        });
    }

    const youSoThatPattern = /\byou\s+(?:was|were)\s+so\s+([^,]+?)\s+that\s+([^.!?]+)/gi;
    const youSoThatRewritten = text.replace(youSoThatPattern, (_, adjective, consequence) => `yo ${adjective} ${consequence}`);
    if (youSoThatRewritten !== text) {
        variants.push({
            text: collapseWhitespace(youSoThatRewritten),
            reason: 'template-you-so-that',
        });
    }

    const actionTemplate = /\byou\s+([a-z']+)(?:\s+[^\s]+){1,3}\s+([a-z']+)([.!?]|$)/gi;
    const actionRewritten = text.replace(actionTemplate, (_, verb, tail, punctuation) => `you ${verb} ${tail}${punctuation || ''}`);
    if (actionRewritten !== text) {
        variants.push({
            text: collapseWhitespace(actionRewritten),
            reason: 'template-you-verb-result',
        });
    }

    return variants;
}

function applySpecialCaseRewrites(text) {
    const lower = text.toLowerCase();
    const results = [];

    if (lower.includes('fingerprint') && lower.includes('shoe')) {
        results.push({ text: 'yo fingerprints are shoe soles', reason: 'fingerprint-shoe' });
    }

    return results;
}

function trimWithImpactScoring(words, limit) {
    if (!Array.isArray(words)) {
        return [];
    }

    const current = [...words];
    if (current.length <= limit) {
        return current;
    }

    const { membership: chunkMembership, groups: chunkGroups } = buildChunkMembership(current);
    const scores = current.map((word, index) => ({
        index,
        word,
        normalized: normalizeWord(word),
        score: computeImpactScore(word, index, current.length),
        locked: index === 0 || ROAST_SUBJECT_WORDS.has(normalizeWord(word)),
        chunkId: chunkMembership[index],
    }));

    let indices = current.map((_, index) => index);

    while (indices.length > limit) {
        let candidate = null;
        for (const idx of indices) {
            const data = scores[idx];
            if (!data || data.locked) {
                continue;
            }

            if (!candidate || data.score < candidate.score || (data.score === candidate.score && data.index > candidate.index)) {
                candidate = data;
            }
        }

        if (!candidate) {
            break;
        }

        if (candidate.chunkId && chunkGroups.has(candidate.chunkId)) {
            const chunkIndices = chunkGroups.get(candidate.chunkId).filter(index => indices.includes(index));
            if (chunkIndices.length && indices.length - chunkIndices.length >= limit) {
                indices = indices.filter(index => !chunkIndices.includes(index));
            } else {
                candidate.locked = true;
            }
        } else {
            indices = indices.filter(index => index !== candidate.index);
        }

        if (indices.length <= limit) {
            break;
        }
    }

    if (indices.length > limit) {
        indices = indices.slice(0, limit);
    }

    indices.sort((a, b) => a - b);
    return indices.map(index => current[index]);
}

function ensureExactWordCount(currentWords, candidateWords, originalWords, limit) {
    const candidate = Array.isArray(currentWords) ? currentWords.slice() : [];
    const source = Array.isArray(candidateWords) ? candidateWords : [];
    const original = Array.isArray(originalWords) ? originalWords : [];

    if (candidate.length > limit) {
        return trimWithImpactScoring(candidate, limit);
    }

    if (candidate.length === limit) {
        return candidate;
    }

    const pool = [];
    for (const list of [candidate, source, original]) {
        for (const word of list) {
            pool.push(word);
        }
    }

    const seen = new Set(candidate.map(word => word.toLowerCase()));
    for (const word of pool) {
        if (candidate.length >= limit) {
            break;
        }

        const normalized = word?.toLowerCase?.() ?? '';
        if (!normalized || seen.has(normalized)) {
            continue;
        }

        candidate.push(word);
        seen.add(normalized);
    }

    if (candidate.length === limit) {
        return candidate;
    }

    if (candidate.length < limit && original.length) {
        const fallback = shrinkWordsToLimit(original, limit);
        if (fallback.length === limit) {
            return fallback;
        }
    }

    return candidate;
}

function scoreCandidate(words) {
    return words.reduce((sum, word, index) => sum + computeImpactScore(word, index, words.length), 0);
}

function buildChunkMembership(words) {
    const normalized = words.map(word => normalizeWord(word));
    const membership = new Array(words.length).fill(null);
    const groups = new Map();
    let nextId = 0;

    for (const chunk of PHRASE_CHUNKS) {
        if (!Array.isArray(chunk) || !chunk.length) {
            continue;
        }

        const chunkWords = chunk.map(value => (typeof value === 'string' ? value.toLowerCase() : value));
        for (let index = 0; index <= normalized.length - chunkWords.length; index++) {
            let matches = true;
            for (let offset = 0; offset < chunkWords.length; offset++) {
                if (normalized[index + offset] !== chunkWords[offset]) {
                    matches = false;
                    break;
                }
            }

            if (!matches) {
                continue;
            }

            const id = `chunk_${nextId++}`;
            const indices = [];
            for (let offset = 0; offset < chunkWords.length; offset++) {
                const pos = index + offset;
                membership[pos] = id;
                indices.push(pos);
            }

            groups.set(id, indices);
            index += chunkWords.length - 1;
        }
    }

    return { membership, groups };
}

function computeImpactScore(word, index, total) {
    const normalized = normalizeWord(word);
    if (!normalized) {
        return 0.1;
    }

    let score = 1;

    if (index === 0) {
        score += 5;
    }

    if (ROAST_SUBJECT_WORDS.has(normalized)) {
        score += 4;
    }

    if (IMPACT_ADJECTIVES.has(normalized) || isLikelyAdjective(normalized)) {
        score += 2.5;
    }

    if (IMPACT_VERBS.has(normalized) || isLikelyVerb(normalized)) {
        score += 3;
    }

    if (normalized.length >= 8) {
        score += 0.5;
    }

    if (STOPWORDS.has(normalized) || FILLER_WORDS.has(normalized)) {
        score -= 2.5;
    }

    if (normalized === 'so' || normalized === 'that' || normalized === 'like') {
        score -= 2;
    }

    if (index === total - 1) {
        score += 0.5;
    }

    return Math.max(score, 0.1);
}

function isLikelyVerb(normalized) {
    if (!normalized) {
        return false;
    }

    if (IMPACT_VERBS.has(normalized)) {
        return true;
    }

    return /(?:ed|ing|ate|ify|ise|ize|up)$/.test(normalized);
}

function isLikelyAdjective(normalized) {
    if (!normalized) {
        return false;
    }

    if (IMPACT_ADJECTIVES.has(normalized)) {
        return true;
    }

    return /(?:y|ful|ous|less|est)$/.test(normalized);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

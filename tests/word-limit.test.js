/**
 * Tests for word limit functionality
 */

// Mock the required dependencies
const mockChatMetadata = {};
const mockSaveChatDebounced = jest.fn();

// Mock the script.js imports
jest.mock('../public/script.js', () => ({
    chat_metadata: mockChatMetadata,
    generateQuietPrompt: jest.fn(),
    saveChatDebounced: mockSaveChatDebounced,
}));

// Import the word limit functions
const {
    getActiveWordLimit,
    setActiveWordLimit,
    clearActiveWordLimit,
    applyWordLimitIfNeeded,
} = require('../public/scripts/word-limit.js');

describe('Word Limit Functionality', () => {
    beforeEach(() => {
        // Clear chat metadata before each test
        Object.keys(mockChatMetadata).forEach(key => delete mockChatMetadata[key]);
        mockSaveChatDebounced.mockClear();
    });

    describe('getActiveWordLimit', () => {
        it('should return null when no limit is set', () => {
            expect(getActiveWordLimit()).toBeNull();
        });

        it('should return null for invalid limits', () => {
            mockChatMetadata.word_limit = 0;
            expect(getActiveWordLimit()).toBeNull();

            mockChatMetadata.word_limit = -5;
            expect(getActiveWordLimit()).toBeNull();

            mockChatMetadata.word_limit = 'invalid';
            expect(getActiveWordLimit()).toBeNull();
        });

        it('should return the correct limit when set', () => {
            mockChatMetadata.word_limit = 7;
            expect(getActiveWordLimit()).toBe(7);

            mockChatMetadata.word_limit = 15.8;
            expect(getActiveWordLimit()).toBe(15);
        });
    });

    describe('setActiveWordLimit', () => {
        it('should set a valid word limit', () => {
            setActiveWordLimit(10);
            expect(mockChatMetadata.word_limit).toBe(10);
            expect(mockSaveChatDebounced).toHaveBeenCalled();
        });

        it('should clear invalid limits', () => {
            setActiveWordLimit(0);
            expect(mockChatMetadata.word_limit).toBeUndefined();

            setActiveWordLimit(-5);
            expect(mockChatMetadata.word_limit).toBeUndefined();

            setActiveWordLimit('invalid');
            expect(mockChatMetadata.word_limit).toBeUndefined();
        });

        it('should floor decimal values', () => {
            setActiveWordLimit(7.8);
            expect(mockChatMetadata.word_limit).toBe(7);
        });
    });

    describe('clearActiveWordLimit', () => {
        it('should remove the word limit', () => {
            mockChatMetadata.word_limit = 10;
            clearActiveWordLimit();
            expect(mockChatMetadata.word_limit).toBeUndefined();
            expect(mockSaveChatDebounced).toHaveBeenCalled();
        });
    });

    describe('applyWordLimitIfNeeded', () => {
        it('should return original text when no limit is set', async () => {
            const result = await applyWordLimitIfNeeded('This is a test message');
            expect(result.applied).toBe(false);
            expect(result.text).toBe('This is a test message');
        });

        it('should return original text when under limit', async () => {
            mockChatMetadata.word_limit = 10;
            const result = await applyWordLimitIfNeeded('Short message');
            expect(result.applied).toBe(false);
            expect(result.text).toBe('Short message');
        });

        it('should apply word limit when over limit', async () => {
            mockChatMetadata.word_limit = 3;
            const result = await applyWordLimitIfNeeded('This is a very long message that exceeds the limit');
            expect(result.applied).toBe(true);
            expect(result.limit).toBe(3);
            expect(result.text.split(' ').length).toBe(3);
        });

        it('should handle empty text', async () => {
            const result = await applyWordLimitIfNeeded('');
            expect(result.applied).toBe(false);
            expect(result.text).toBe('');
        });

        it('should handle null/undefined text', async () => {
            const result = await applyWordLimitIfNeeded(null);
            expect(result.applied).toBe(false);
            expect(result.text).toBe(null);
        });
    });
});

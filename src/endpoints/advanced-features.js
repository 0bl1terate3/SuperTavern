import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import { generateTimestamp, humanizedISO8601DateTime } from '../util.js';

export const router = express.Router();

// ============================================================================
// FEATURE 4: Mood Tracking & Visualization
// ============================================================================

router.post('/mood/track', (request, response) => {
    try {
        const { chat_id, message_id, mood, intensity, timestamp } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const moodFile = path.join(request.user.directories.root, 'mood-data', `${chat_id}.json`);
        const moodDir = path.dirname(moodFile);
        
        if (!fs.existsSync(moodDir)) {
            fs.mkdirSync(moodDir, { recursive: true });
        }

        let moodData = { entries: [], timeline: [] };
        if (fs.existsSync(moodFile)) {
            moodData = JSON.parse(fs.readFileSync(moodFile, 'utf8'));
        }

        const entry = {
            message_id,
            mood: mood || 'neutral',
            intensity: intensity || 50,
            timestamp: timestamp || new Date().toISOString(),
        };

        moodData.entries.push(entry);
        moodData.timeline = buildMoodTimeline(moodData.entries);

        writeFileAtomicSync(moodFile, JSON.stringify(moodData, null, 2), 'utf8');
        
        return response.json({ success: true, mood_data: moodData });
    } catch (error) {
        console.error('Error tracking mood:', error);
        return response.status(500).json({ error: 'Failed to track mood' });
    }
});

router.post('/mood/get', (request, response) => {
    try {
        const { chat_id } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const moodFile = path.join(request.user.directories.root, 'mood-data', `${chat_id}.json`);
        
        if (!fs.existsSync(moodFile)) {
            return response.json({ entries: [], timeline: [], visualization: [] });
        }

        const moodData = JSON.parse(fs.readFileSync(moodFile, 'utf8'));
        moodData.visualization = generateMoodVisualization(moodData.entries);
        
        return response.json(moodData);
    } catch (error) {
        console.error('Error getting mood data:', error);
        return response.status(500).json({ error: 'Failed to get mood data' });
    }
});

// ============================================================================
// FEATURE 5: Prompt Templates Library
// ============================================================================

router.post('/templates/create', (request, response) => {
    try {
        const { name, category, content, tags, is_public } = request.body;
        
        if (!name || !content) {
            return response.status(400).json({ error: 'Name and content are required' });
        }

        const templatesFile = path.join(request.user.directories.root, 'prompt-templates.json');
        let templates = [];
        
        if (fs.existsSync(templatesFile)) {
            templates = JSON.parse(fs.readFileSync(templatesFile, 'utf8'));
        }

        const template = {
            id: generateTimestamp(),
            name,
            category: category || 'general',
            content,
            tags: tags || [],
            is_public: is_public || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            usage_count: 0,
            rating: 0,
            reviews: [],
        };

        templates.push(template);
        writeFileAtomicSync(templatesFile, JSON.stringify(templates, null, 2), 'utf8');
        
        return response.json({ success: true, template });
    } catch (error) {
        console.error('Error creating template:', error);
        return response.status(500).json({ error: 'Failed to create template' });
    }
});

router.get('/templates/list', (request, response) => {
    try {
        const templatesFile = path.join(request.user.directories.root, 'prompt-templates.json');
        
        if (!fs.existsSync(templatesFile)) {
            return response.json({ templates: [] });
        }

        const templates = JSON.parse(fs.readFileSync(templatesFile, 'utf8'));
        const { category, tags, search } = request.query;

        let filtered = templates;
        
        if (category) {
            filtered = filtered.filter(t => t.category === category);
        }
        if (tags) {
            const tagArray = tags.split(',');
            filtered = filtered.filter(t => tagArray.some(tag => t.tags.includes(tag)));
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(t => 
                t.name.toLowerCase().includes(searchLower) ||
                t.content.toLowerCase().includes(searchLower)
            );
        }

        return response.json({ templates: filtered });
    } catch (error) {
        console.error('Error listing templates:', error);
        return response.status(500).json({ error: 'Failed to list templates' });
    }
});

// ============================================================================
// FEATURE 6: Conversation Export
// ============================================================================

router.post('/export/story', async (request, response) => {
    try {
        const { chat_id, format, options } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const exportFormat = format || 'markdown';
        const exportOptions = options || {};

        // Load chat data (would integrate with existing chat system)
        const exportData = {
            title: exportOptions.title || 'Untitled Story',
            author: exportOptions.author || 'Anonymous',
            format: exportFormat,
            timestamp: new Date().toISOString(),
            download_url: `/api/export/download/${chat_id}`,
        };

        return response.json({ success: true, export: exportData });
    } catch (error) {
        console.error('Error exporting story:', error);
        return response.status(500).json({ error: 'Failed to export story' });
    }
});

// ============================================================================
// FEATURE 9: AI Director Mode
// ============================================================================

router.post('/director/suggest', async (request, response) => {
    try {
        const { chat_id, context, suggestion_type } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const suggestionTypes = ['plot_twist', 'character_action', 'dialogue', 'pacing', 'conflict'];
        const type = suggestion_type || 'plot_twist';

        // Generate suggestions (would use AI in production)
        const suggestions = generateDirectorSuggestions(context, type);

        return response.json({ success: true, suggestions });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        return response.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

// ============================================================================
// FEATURE 10: Memory Palace System
// ============================================================================

router.post('/memory/store', (request, response) => {
    try {
        const { character_id, memory_type, content, importance, tags } = request.body;
        
        if (!character_id || !content) {
            return response.status(400).json({ error: 'Character ID and content are required' });
        }

        const memoryFile = path.join(request.user.directories.root, 'memory-palace', `${character_id}.json`);
        const memoryDir = path.dirname(memoryFile);
        
        if (!fs.existsSync(memoryDir)) {
            fs.mkdirSync(memoryDir, { recursive: true });
        }

        let memories = [];
        if (fs.existsSync(memoryFile)) {
            memories = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        }

        const memory = {
            id: generateTimestamp(),
            type: memory_type || 'fact',
            content,
            importance: importance || 50,
            tags: tags || [],
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
            access_count: 0,
            decay_rate: 0,
        };

        memories.push(memory);
        writeFileAtomicSync(memoryFile, JSON.stringify(memories, null, 2), 'utf8');
        
        return response.json({ success: true, memory });
    } catch (error) {
        console.error('Error storing memory:', error);
        return response.status(500).json({ error: 'Failed to store memory' });
    }
});

router.post('/memory/search', (request, response) => {
    try {
        const { character_id, query, limit } = request.body;
        
        if (!character_id || !query) {
            return response.status(400).json({ error: 'Character ID and query are required' });
        }

        const memoryFile = path.join(request.user.directories.root, 'memory-palace', `${character_id}.json`);
        
        if (!fs.existsSync(memoryFile)) {
            return response.json({ memories: [] });
        }

        const memories = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        
        // Simple search (would use semantic search in production)
        const queryLower = query.toLowerCase();
        const results = memories
            .filter(m => m.content.toLowerCase().includes(queryLower))
            .sort((a, b) => b.importance - a.importance)
            .slice(0, limit || 10);

        return response.json({ memories: results });
    } catch (error) {
        console.error('Error searching memories:', error);
        return response.status(500).json({ error: 'Failed to search memories' });
    }
});

// ============================================================================
// FEATURE 11: Character Evolution Tracker
// ============================================================================

router.post('/evolution/snapshot', (request, response) => {
    try {
        const { character_id, traits, milestone, notes } = request.body;
        
        if (!character_id) {
            return response.status(400).json({ error: 'Character ID is required' });
        }

        const evolutionFile = path.join(request.user.directories.root, 'character-evolution', `${character_id}.json`);
        const evolutionDir = path.dirname(evolutionFile);
        
        if (!fs.existsSync(evolutionDir)) {
            fs.mkdirSync(evolutionDir, { recursive: true });
        }

        let evolution = { snapshots: [], timeline: [] };
        if (fs.existsSync(evolutionFile)) {
            evolution = JSON.parse(fs.readFileSync(evolutionFile, 'utf8'));
        }

        const snapshot = {
            id: generateTimestamp(),
            timestamp: new Date().toISOString(),
            traits: traits || {},
            milestone: milestone || '',
            notes: notes || '',
            message_count: 0,
        };

        evolution.snapshots.push(snapshot);
        evolution.timeline = buildEvolutionTimeline(evolution.snapshots);

        writeFileAtomicSync(evolutionFile, JSON.stringify(evolution, null, 2), 'utf8');
        
        return response.json({ success: true, snapshot });
    } catch (error) {
        console.error('Error creating evolution snapshot:', error);
        return response.status(500).json({ error: 'Failed to create snapshot' });
    }
});

// ============================================================================
// FEATURE 12: Conversation Replay
// ============================================================================

router.post('/replay/save', (request, response) => {
    try {
        const { chat_id, parameters, messages } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const replayFile = path.join(request.user.directories.root, 'replays', `${chat_id}.json`);
        const replayDir = path.dirname(replayFile);
        
        if (!fs.existsSync(replayDir)) {
            fs.mkdirSync(replayDir, { recursive: true });
        }

        const replay = {
            id: generateTimestamp(),
            chat_id,
            parameters: parameters || {},
            messages: messages || [],
            created_at: new Date().toISOString(),
        };

        writeFileAtomicSync(replayFile, JSON.stringify(replay, null, 2), 'utf8');
        
        return response.json({ success: true, replay });
    } catch (error) {
        console.error('Error saving replay:', error);
        return response.status(500).json({ error: 'Failed to save replay' });
    }
});

// ============================================================================
// FEATURE 13: Message Bookmarks & Annotations
// ============================================================================

router.post('/bookmarks/add', (request, response) => {
    try {
        const { chat_id, message_id, note, tags, category } = request.body;
        
        if (!chat_id || message_id === undefined) {
            return response.status(400).json({ error: 'Chat ID and message ID are required' });
        }

        const bookmarksFile = path.join(request.user.directories.root, 'bookmarks', `${chat_id}.json`);
        const bookmarksDir = path.dirname(bookmarksFile);
        
        if (!fs.existsSync(bookmarksDir)) {
            fs.mkdirSync(bookmarksDir, { recursive: true });
        }

        let bookmarks = [];
        if (fs.existsSync(bookmarksFile)) {
            bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
        }

        const bookmark = {
            id: generateTimestamp(),
            message_id,
            note: note || '',
            tags: tags || [],
            category: category || 'general',
            created_at: new Date().toISOString(),
        };

        bookmarks.push(bookmark);
        writeFileAtomicSync(bookmarksFile, JSON.stringify(bookmarks, null, 2), 'utf8');
        
        return response.json({ success: true, bookmark });
    } catch (error) {
        console.error('Error adding bookmark:', error);
        return response.status(500).json({ error: 'Failed to add bookmark' });
    }
});

router.post('/bookmarks/list', (request, response) => {
    try {
        const { chat_id } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const bookmarksFile = path.join(request.user.directories.root, 'bookmarks', `${chat_id}.json`);
        
        if (!fs.existsSync(bookmarksFile)) {
            return response.json({ bookmarks: [] });
        }

        const bookmarks = JSON.parse(fs.readFileSync(bookmarksFile, 'utf8'));
        return response.json({ bookmarks });
    } catch (error) {
        console.error('Error listing bookmarks:', error);
        return response.status(500).json({ error: 'Failed to list bookmarks' });
    }
});

// ============================================================================
// FEATURE 14: Conversation Statistics
// ============================================================================

router.post('/stats/calculate', (request, response) => {
    try {
        const { chat_id, messages } = request.body;
        
        if (!chat_id || !messages) {
            return response.status(400).json({ error: 'Chat ID and messages are required' });
        }

        const stats = calculateConversationStats(messages);
        
        return response.json({ success: true, stats });
    } catch (error) {
        console.error('Error calculating stats:', error);
        return response.status(500).json({ error: 'Failed to calculate stats' });
    }
});

// ============================================================================
// FEATURE 16: Message Templates & Macros
// ============================================================================

router.post('/message-templates/save', (request, response) => {
    try {
        const { name, content, variables, category } = request.body;
        
        if (!name || !content) {
            return response.status(400).json({ error: 'Name and content are required' });
        }

        const templatesFile = path.join(request.user.directories.root, 'message-templates.json');
        let templates = [];
        
        if (fs.existsSync(templatesFile)) {
            templates = JSON.parse(fs.readFileSync(templatesFile, 'utf8'));
        }

        const template = {
            id: generateTimestamp(),
            name,
            content,
            variables: variables || [],
            category: category || 'general',
            created_at: new Date().toISOString(),
            usage_count: 0,
        };

        templates.push(template);
        writeFileAtomicSync(templatesFile, JSON.stringify(templates, null, 2), 'utf8');
        
        return response.json({ success: true, template });
    } catch (error) {
        console.error('Error saving message template:', error);
        return response.status(500).json({ error: 'Failed to save template' });
    }
});

router.get('/message-templates/list', (request, response) => {
    try {
        const templatesFile = path.join(request.user.directories.root, 'message-templates.json');
        
        if (!fs.existsSync(templatesFile)) {
            return response.json({ templates: [] });
        }

        const templates = JSON.parse(fs.readFileSync(templatesFile, 'utf8'));
        return response.json({ templates });
    } catch (error) {
        console.error('Error listing message templates:', error);
        return response.status(500).json({ error: 'Failed to list templates' });
    }
});

// ============================================================================
// Helper Functions
// ============================================================================

function buildMoodTimeline(entries) {
    return entries.map(entry => ({
        timestamp: entry.timestamp,
        mood: entry.mood,
        intensity: entry.intensity,
    }));
}

function generateMoodVisualization(entries) {
    const moodColors = {
        happy: '#FFD700',
        sad: '#4169E1',
        angry: '#DC143C',
        excited: '#FF69B4',
        calm: '#98FB98',
        neutral: '#D3D3D3',
    };

    return entries.map(entry => ({
        x: entry.timestamp,
        y: entry.intensity,
        color: moodColors[entry.mood] || moodColors.neutral,
        label: entry.mood,
    }));
}

function generateDirectorSuggestions(context, type) {
    const suggestions = {
        plot_twist: [
            'Introduce an unexpected revelation about a character\'s past',
            'Create a sudden conflict that changes the dynamic',
            'Reveal a hidden connection between characters',
        ],
        character_action: [
            'Have the character make a bold decision',
            'Introduce a moral dilemma',
            'Create an opportunity for character growth',
        ],
        dialogue: [
            'Add subtext to the conversation',
            'Introduce tension through what\'s left unsaid',
            'Have a character reveal vulnerability',
        ],
        pacing: [
            'Slow down for emotional impact',
            'Speed up with rapid-fire exchanges',
            'Add a pause for reflection',
        ],
        conflict: [
            'Escalate existing tension',
            'Introduce external pressure',
            'Create internal conflict for a character',
        ],
    };

    return suggestions[type] || suggestions.plot_twist;
}

function buildEvolutionTimeline(snapshots) {
    return snapshots.map((snapshot, index) => ({
        index,
        timestamp: snapshot.timestamp,
        milestone: snapshot.milestone,
        trait_changes: index > 0 ? compareTraits(snapshots[index - 1].traits, snapshot.traits) : {},
    }));
}

function compareTraits(oldTraits, newTraits) {
    const changes = {};
    for (const trait in newTraits) {
        if (oldTraits[trait] !== newTraits[trait]) {
            changes[trait] = {
                old: oldTraits[trait],
                new: newTraits[trait],
            };
        }
    }
    return changes;
}

function calculateConversationStats(messages) {
    const stats = {
        total_messages: messages.length,
        word_count: 0,
        character_count: 0,
        average_message_length: 0,
        by_character: {},
        most_used_words: {},
        response_times: [],
        conversation_length_minutes: 0,
    };

    messages.forEach((msg, index) => {
        const words = msg.mes.split(/\s+/).length;
        const chars = msg.mes.length;

        stats.word_count += words;
        stats.character_count += chars;

        if (!stats.by_character[msg.name]) {
            stats.by_character[msg.name] = {
                message_count: 0,
                word_count: 0,
                average_length: 0,
            };
        }

        stats.by_character[msg.name].message_count++;
        stats.by_character[msg.name].word_count += words;

        // Track word frequency
        msg.mes.toLowerCase().split(/\s+/).forEach(word => {
            if (word.length > 3) {
                stats.most_used_words[word] = (stats.most_used_words[word] || 0) + 1;
            }
        });

        // Calculate response times
        if (index > 0 && msg.send_date && messages[index - 1].send_date) {
            const timeDiff = new Date(msg.send_date) - new Date(messages[index - 1].send_date);
            stats.response_times.push(timeDiff);
        }
    });

    stats.average_message_length = stats.word_count / stats.total_messages;

    // Calculate average response time
    if (stats.response_times.length > 0) {
        const avgResponseTime = stats.response_times.reduce((a, b) => a + b, 0) / stats.response_times.length;
        stats.average_response_time_seconds = Math.round(avgResponseTime / 1000);
    }

    // Get top 10 most used words
    stats.top_words = Object.entries(stats.most_used_words)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

    return stats;
}

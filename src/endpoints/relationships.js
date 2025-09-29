import path from 'node:path';
import fs from 'node:fs';

import express from 'express';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import { generateTimestamp } from '../util.js';

export const router = express.Router();

/**
 * Get all relationships for a character or group
 */
router.post('/get', (request, response) => {
    try {
        const { character_id, group_id } = request.body;
        
        if (!character_id && !group_id) {
            return response.status(400).json({ error: 'Character ID or Group ID is required' });
        }

        const relationshipsFile = path.join(
            request.user.directories.root,
            'relationships',
            `${character_id || group_id}.json`
        );
        
        if (!fs.existsSync(relationshipsFile)) {
            return response.json({ relationships: [], graph: { nodes: [], edges: [] } });
        }
        
        const data = JSON.parse(fs.readFileSync(relationshipsFile, 'utf8'));
        return response.json(data);
    } catch (error) {
        console.error('Error getting relationships:', error);
        return response.status(500).json({ error: 'Failed to get relationships' });
    }
});

/**
 * Create or update a relationship
 */
router.post('/update', (request, response) => {
    try {
        const { 
            character_id,
            from_character,
            to_character,
            relationship_type,
            strength,
            notes,
            tags,
        } = request.body;
        
        if (!character_id || !from_character || !to_character) {
            return response.status(400).json({ error: 'Character IDs are required' });
        }

        const relationshipsDir = path.join(request.user.directories.root, 'relationships');
        if (!fs.existsSync(relationshipsDir)) {
            fs.mkdirSync(relationshipsDir, { recursive: true });
        }

        const relationshipsFile = path.join(relationshipsDir, `${character_id}.json`);
        let data = { relationships: [], graph: { nodes: [], edges: [] } };
        
        if (fs.existsSync(relationshipsFile)) {
            data = JSON.parse(fs.readFileSync(relationshipsFile, 'utf8'));
        }

        // Find existing relationship
        const existingIndex = data.relationships.findIndex(
            r => r.from === from_character && r.to === to_character
        );

        const relationship = {
            id: existingIndex >= 0 ? data.relationships[existingIndex].id : generateTimestamp(),
            from: from_character,
            to: to_character,
            type: relationship_type || 'neutral', // friend, rival, romantic, family, neutral, enemy
            strength: strength !== undefined ? strength : 50, // 0-100
            notes: notes || '',
            tags: tags || [],
            created_at: existingIndex >= 0 ? data.relationships[existingIndex].created_at : new Date().toISOString(),
            updated_at: new Date().toISOString(),
            interaction_count: existingIndex >= 0 ? data.relationships[existingIndex].interaction_count + 1 : 1,
        };

        if (existingIndex >= 0) {
            data.relationships[existingIndex] = relationship;
        } else {
            data.relationships.push(relationship);
        }

        // Update graph structure
        updateGraphStructure(data);

        writeFileAtomicSync(relationshipsFile, JSON.stringify(data, null, 2), 'utf8');
        
        return response.json({ success: true, relationship });
    } catch (error) {
        console.error('Error updating relationship:', error);
        return response.status(500).json({ error: 'Failed to update relationship' });
    }
});

/**
 * Analyze conversation for relationship updates
 */
router.post('/analyze', async (request, response) => {
    try {
        const { character_id, messages, characters } = request.body;
        
        if (!character_id || !messages || !characters) {
            return response.status(400).json({ error: 'Character ID, messages, and characters list are required' });
        }

        // Analyze sentiment and interactions
        const analysis = analyzeInteractions(messages, characters);
        
        return response.json({
            success: true,
            suggested_updates: analysis.suggestions,
            sentiment_scores: analysis.sentiments,
            interaction_counts: analysis.interactions,
        });
    } catch (error) {
        console.error('Error analyzing relationships:', error);
        return response.status(500).json({ error: 'Failed to analyze relationships' });
    }
});

/**
 * Get relationship graph for visualization
 */
router.post('/graph', (request, response) => {
    try {
        const { character_id, group_id, depth } = request.body;
        
        if (!character_id && !group_id) {
            return response.status(400).json({ error: 'Character ID or Group ID is required' });
        }

        const relationshipsFile = path.join(
            request.user.directories.root,
            'relationships',
            `${character_id || group_id}.json`
        );
        
        if (!fs.existsSync(relationshipsFile)) {
            return response.json({ nodes: [], edges: [], clusters: [] });
        }
        
        const data = JSON.parse(fs.readFileSync(relationshipsFile, 'utf8'));
        
        // Build graph with depth limit
        const maxDepth = depth || 2;
        const graph = buildRelationshipGraph(data.relationships, maxDepth);
        
        return response.json(graph);
    } catch (error) {
        console.error('Error getting relationship graph:', error);
        return response.status(500).json({ error: 'Failed to get relationship graph' });
    }
});

/**
 * Delete a relationship
 */
router.post('/delete', (request, response) => {
    try {
        const { character_id, relationship_id } = request.body;
        
        if (!character_id || !relationship_id) {
            return response.status(400).json({ error: 'Character ID and relationship ID are required' });
        }

        const relationshipsFile = path.join(
            request.user.directories.root,
            'relationships',
            `${character_id}.json`
        );
        
        if (!fs.existsSync(relationshipsFile)) {
            return response.status(404).json({ error: 'No relationships found' });
        }
        
        const data = JSON.parse(fs.readFileSync(relationshipsFile, 'utf8'));
        data.relationships = data.relationships.filter(r => r.id !== relationship_id);
        
        updateGraphStructure(data);
        
        writeFileAtomicSync(relationshipsFile, JSON.stringify(data, null, 2), 'utf8');
        
        return response.json({ success: true });
    } catch (error) {
        console.error('Error deleting relationship:', error);
        return response.status(500).json({ error: 'Failed to delete relationship' });
    }
});

/**
 * Helper: Update graph structure from relationships
 */
function updateGraphStructure(data) {
    const nodes = new Map();
    const edges = [];

    data.relationships.forEach(rel => {
        // Add nodes
        if (!nodes.has(rel.from)) {
            nodes.set(rel.from, {
                id: rel.from,
                label: rel.from,
                connections: 0,
            });
        }
        if (!nodes.has(rel.to)) {
            nodes.set(rel.to, {
                id: rel.to,
                label: rel.to,
                connections: 0,
            });
        }

        // Add edge
        edges.push({
            from: rel.from,
            to: rel.to,
            type: rel.type,
            strength: rel.strength,
            label: rel.type,
            color: getRelationshipColor(rel.type),
            width: Math.max(1, rel.strength / 20),
        });

        nodes.get(rel.from).connections++;
        nodes.get(rel.to).connections++;
    });

    data.graph = {
        nodes: Array.from(nodes.values()),
        edges: edges,
    };
}

/**
 * Helper: Get color for relationship type
 */
function getRelationshipColor(type) {
    const colors = {
        friend: '#4CAF50',
        romantic: '#E91E63',
        family: '#9C27B0',
        rival: '#FF9800',
        enemy: '#F44336',
        neutral: '#9E9E9E',
    };
    return colors[type] || colors.neutral;
}

/**
 * Helper: Analyze interactions from messages
 */
function analyzeInteractions(messages, characters) {
    const interactions = {};
    const sentiments = {};
    const suggestions = [];

    // Count interactions between characters
    for (let i = 0; i < messages.length - 1; i++) {
        const current = messages[i];
        const next = messages[i + 1];
        
        if (current.name !== next.name) {
            const pair = `${current.name}-${next.name}`;
            interactions[pair] = (interactions[pair] || 0) + 1;
            
            // Simple sentiment analysis (would use AI in production)
            const sentiment = analyzeSentiment(current.mes + ' ' + next.mes);
            sentiments[pair] = sentiment;
        }
    }

    // Generate suggestions
    for (const pair in interactions) {
        const [from, to] = pair.split('-');
        const count = interactions[pair];
        const sentiment = sentiments[pair];
        
        if (count > 5) {
            suggestions.push({
                from,
                to,
                type: sentiment > 0.5 ? 'friend' : sentiment < -0.5 ? 'rival' : 'neutral',
                strength: Math.min(100, count * 10),
                reason: `${count} interactions detected with ${sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral'} sentiment`,
            });
        }
    }

    return { interactions, sentiments, suggestions };
}

/**
 * Helper: Simple sentiment analysis
 */
function analyzeSentiment(text) {
    const positive = ['love', 'like', 'happy', 'great', 'wonderful', 'friend', 'thank'];
    const negative = ['hate', 'dislike', 'angry', 'terrible', 'awful', 'enemy', 'fight'];
    
    let score = 0;
    const lower = text.toLowerCase();
    
    positive.forEach(word => {
        if (lower.includes(word)) score += 0.1;
    });
    negative.forEach(word => {
        if (lower.includes(word)) score -= 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
}

/**
 * Helper: Build relationship graph with depth
 */
function buildRelationshipGraph(relationships, maxDepth) {
    const nodes = new Map();
    const edges = [];
    const clusters = [];

    relationships.forEach(rel => {
        if (!nodes.has(rel.from)) {
            nodes.set(rel.from, {
                id: rel.from,
                label: rel.from,
                level: 0,
                group: getRelationshipCluster(rel.type),
            });
        }
        if (!nodes.has(rel.to)) {
            nodes.set(rel.to, {
                id: rel.to,
                label: rel.to,
                level: 1,
                group: getRelationshipCluster(rel.type),
            });
        }

        edges.push({
            from: rel.from,
            to: rel.to,
            label: `${rel.type} (${rel.strength})`,
            color: getRelationshipColor(rel.type),
            value: rel.strength,
        });
    });

    return {
        nodes: Array.from(nodes.values()),
        edges,
        clusters,
    };
}

/**
 * Helper: Get cluster for relationship type
 */
function getRelationshipCluster(type) {
    const clusters = {
        friend: 'allies',
        romantic: 'intimate',
        family: 'family',
        rival: 'conflict',
        enemy: 'conflict',
        neutral: 'neutral',
    };
    return clusters[type] || 'neutral';
}

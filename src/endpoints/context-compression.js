import path from 'node:path';
import fs from 'node:fs';

import express from 'express';
import { sync as writeFileAtomicSync } from 'write-file-atomic';

export const router = express.Router();

/**
 * Compress chat context using AI summarization
 */
router.post('/compress', async (request, response) => {
    try {
        const { messages, compression_level, preserve_recent } = request.body;
        
        if (!messages || !Array.isArray(messages)) {
            return response.status(400).json({ error: 'Messages array is required' });
        }

        const level = compression_level || 'medium'; // low, medium, high
        const preserveCount = preserve_recent || 10;

        // Split messages into compress and preserve
        const toCompress = messages.slice(0, -preserveCount);
        const toPreserve = messages.slice(-preserveCount);

        if (toCompress.length === 0) {
            return response.json({ 
                compressed: false,
                messages: messages,
                summary: null,
            });
        }

        // Build summary prompt based on compression level
        const compressionRatios = {
            low: 0.7,    // Keep 70% of content
            medium: 0.5, // Keep 50% of content
            high: 0.3,   // Keep 30% of content
        };

        const ratio = compressionRatios[level] || 0.5;
        const targetLength = Math.floor(toCompress.length * ratio);

        // Create summary structure
        const summary = {
            original_count: toCompress.length,
            compressed_count: targetLength,
            compression_ratio: ratio,
            timestamp: new Date().toISOString(),
            key_points: [],
            character_states: {},
            important_events: [],
        };

        // Extract key information (this would use AI in production)
        const keyMessages = extractKeyMessages(toCompress, targetLength);
        summary.key_points = keyMessages.map(msg => ({
            speaker: msg.name,
            content: msg.mes,
            importance: msg.importance || 'medium',
        }));

        // Combine compressed and preserved messages
        const compressedMessages = [
            {
                name: 'System',
                mes: `[Context Summary: ${toCompress.length} messages compressed. Key events preserved below.]`,
                is_system: true,
                send_date: new Date().toISOString(),
                extra: { summary: summary },
            },
            ...keyMessages,
            ...toPreserve,
        ];

        return response.json({
            compressed: true,
            messages: compressedMessages,
            summary: summary,
            original_count: messages.length,
            new_count: compressedMessages.length,
            tokens_saved_estimate: Math.floor((messages.length - compressedMessages.length) * 50),
        });
    } catch (error) {
        console.error('Error compressing context:', error);
        return response.status(500).json({ error: 'Failed to compress context' });
    }
});

/**
 * Expand a compressed summary back to original messages
 */
router.post('/expand', (request, response) => {
    try {
        const { chat_id, summary_id } = request.body;
        
        if (!chat_id || !summary_id) {
            return response.status(400).json({ error: 'Chat ID and summary ID are required' });
        }

        const summariesFile = path.join(request.user.directories.root, 'summaries', `${chat_id}.json`);
        
        if (!fs.existsSync(summariesFile)) {
            return response.status(404).json({ error: 'No summaries found' });
        }
        
        const summaries = JSON.parse(fs.readFileSync(summariesFile, 'utf8'));
        const summary = summaries.find(s => s.id === summary_id);
        
        if (!summary || !summary.original_messages) {
            return response.status(404).json({ error: 'Summary not found or no original messages stored' });
        }

        return response.json({
            success: true,
            messages: summary.original_messages,
        });
    } catch (error) {
        console.error('Error expanding summary:', error);
        return response.status(500).json({ error: 'Failed to expand summary' });
    }
});

/**
 * Get compression statistics for a chat
 */
router.post('/stats', (request, response) => {
    try {
        const { chat_id } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const summariesFile = path.join(request.user.directories.root, 'summaries', `${chat_id}.json`);
        
        if (!fs.existsSync(summariesFile)) {
            return response.json({
                total_compressions: 0,
                total_messages_compressed: 0,
                total_tokens_saved: 0,
                compression_history: [],
            });
        }
        
        const summaries = JSON.parse(fs.readFileSync(summariesFile, 'utf8'));
        
        const stats = {
            total_compressions: summaries.length,
            total_messages_compressed: summaries.reduce((sum, s) => sum + s.original_count, 0),
            total_tokens_saved: summaries.reduce((sum, s) => sum + (s.tokens_saved || 0), 0),
            compression_history: summaries.map(s => ({
                timestamp: s.timestamp,
                original_count: s.original_count,
                compressed_count: s.compressed_count,
                ratio: s.compression_ratio,
            })),
        };

        return response.json(stats);
    } catch (error) {
        console.error('Error getting compression stats:', error);
        return response.status(500).json({ error: 'Failed to get compression stats' });
    }
});

/**
 * Helper function to extract key messages
 * In production, this would use AI to determine importance
 */
function extractKeyMessages(messages, targetCount) {
    // Simple heuristic: prioritize longer messages and those with questions
    const scored = messages.map(msg => {
        let score = msg.mes.length;
        if (msg.mes.includes('?')) score += 100;
        if (msg.mes.includes('!')) score += 50;
        if (msg.name !== 'You') score += 30; // Prioritize character messages
        
        return { ...msg, importance_score: score };
    });

    // Sort by importance and take top N
    scored.sort((a, b) => b.importance_score - a.importance_score);
    return scored.slice(0, targetCount).sort((a, b) => 
        new Date(a.send_date) - new Date(b.send_date)
    );
}

/**
 * Auto-compress when context gets too large
 */
router.post('/auto-compress', async (request, response) => {
    try {
        const { chat_id, threshold, compression_level } = request.body;
        
        if (!chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const messageThreshold = threshold || 100;
        
        // This would integrate with the chat loading system
        // For now, return configuration
        return response.json({
            success: true,
            auto_compress_enabled: true,
            threshold: messageThreshold,
            compression_level: compression_level || 'medium',
        });
    } catch (error) {
        console.error('Error setting auto-compress:', error);
        return response.status(500).json({ error: 'Failed to set auto-compress' });
    }
});

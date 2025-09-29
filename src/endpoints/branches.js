import path from 'node:path';
import fs from 'node:fs';

import express from 'express';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import { generateTimestamp } from '../util.js';

export const router = express.Router();

/**
 * Get all branches for a chat
 */
router.post('/get', (request, response) => {
    try {
        if (!request.body || !request.body.chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const branchesFile = path.join(request.user.directories.root, 'branches', `${request.body.chat_id}.json`);
        
        if (!fs.existsSync(branchesFile)) {
            return response.json({ branches: [], tree: {} });
        }
        
        const branchData = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));
        return response.json(branchData);
    } catch (error) {
        console.error('Error getting branches:', error);
        return response.status(500).json({ error: 'Failed to get branches' });
    }
});

/**
 * Create a new branch from a message
 */
router.post('/create', (request, response) => {
    try {
        const { chat_id, message_id, branch_name, branch_description } = request.body;
        
        if (!chat_id || message_id === undefined) {
            return response.status(400).json({ error: 'Chat ID and message ID are required' });
        }

        const branchesDir = path.join(request.user.directories.root, 'branches');
        if (!fs.existsSync(branchesDir)) {
            fs.mkdirSync(branchesDir, { recursive: true });
        }

        const branchesFile = path.join(branchesDir, `${chat_id}.json`);
        let branchData = { branches: [], tree: {} };
        
        if (fs.existsSync(branchesFile)) {
            branchData = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));
        }

        const branch = {
            id: generateTimestamp(),
            name: branch_name || `Branch ${branchData.branches.length + 1}`,
            description: branch_description || '',
            parent_message_id: message_id,
            created_at: new Date().toISOString(),
            message_count: 0,
            last_modified: new Date().toISOString(),
        };

        branchData.branches.push(branch);
        
        // Update tree structure
        if (!branchData.tree[message_id]) {
            branchData.tree[message_id] = [];
        }
        branchData.tree[message_id].push(branch.id);

        writeFileAtomicSync(branchesFile, JSON.stringify(branchData, null, 2), 'utf8');
        
        return response.json({ success: true, branch });
    } catch (error) {
        console.error('Error creating branch:', error);
        return response.status(500).json({ error: 'Failed to create branch' });
    }
});

/**
 * Switch to a different branch
 */
router.post('/switch', (request, response) => {
    try {
        const { chat_id, branch_id } = request.body;
        
        if (!chat_id || !branch_id) {
            return response.status(400).json({ error: 'Chat ID and branch ID are required' });
        }

        const branchesFile = path.join(request.user.directories.root, 'branches', `${chat_id}.json`);
        
        if (!fs.existsSync(branchesFile)) {
            return response.status(404).json({ error: 'No branches found' });
        }
        
        const branchData = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));
        const branch = branchData.branches.find(b => b.id === branch_id);
        
        if (!branch) {
            return response.status(404).json({ error: 'Branch not found' });
        }

        return response.json({ success: true, branch, parent_message_id: branch.parent_message_id });
    } catch (error) {
        console.error('Error switching branch:', error);
        return response.status(500).json({ error: 'Failed to switch branch' });
    }
});

/**
 * Delete a branch
 */
router.post('/delete', (request, response) => {
    try {
        const { chat_id, branch_id } = request.body;
        
        if (!chat_id || !branch_id) {
            return response.status(400).json({ error: 'Chat ID and branch ID are required' });
        }

        const branchesFile = path.join(request.user.directories.root, 'branches', `${chat_id}.json`);
        
        if (!fs.existsSync(branchesFile)) {
            return response.status(404).json({ error: 'No branches found' });
        }
        
        const branchData = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));
        const branchIndex = branchData.branches.findIndex(b => b.id === branch_id);
        
        if (branchIndex === -1) {
            return response.status(404).json({ error: 'Branch not found' });
        }

        const branch = branchData.branches[branchIndex];
        branchData.branches.splice(branchIndex, 1);

        // Update tree structure
        for (const messageId in branchData.tree) {
            branchData.tree[messageId] = branchData.tree[messageId].filter(id => id !== branch_id);
        }

        writeFileAtomicSync(branchesFile, JSON.stringify(branchData, null, 2), 'utf8');
        
        return response.json({ success: true });
    } catch (error) {
        console.error('Error deleting branch:', error);
        return response.status(500).json({ error: 'Failed to delete branch' });
    }
});

/**
 * Update branch metadata
 */
router.post('/update', (request, response) => {
    try {
        const { chat_id, branch_id, name, description } = request.body;
        
        if (!chat_id || !branch_id) {
            return response.status(400).json({ error: 'Chat ID and branch ID are required' });
        }

        const branchesFile = path.join(request.user.directories.root, 'branches', `${chat_id}.json`);
        
        if (!fs.existsSync(branchesFile)) {
            return response.status(404).json({ error: 'No branches found' });
        }
        
        const branchData = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));
        const branch = branchData.branches.find(b => b.id === branch_id);
        
        if (!branch) {
            return response.status(404).json({ error: 'Branch not found' });
        }

        if (name !== undefined) branch.name = name;
        if (description !== undefined) branch.description = description;
        branch.last_modified = new Date().toISOString();

        writeFileAtomicSync(branchesFile, JSON.stringify(branchData, null, 2), 'utf8');
        
        return response.json({ success: true, branch });
    } catch (error) {
        console.error('Error updating branch:', error);
        return response.status(500).json({ error: 'Failed to update branch' });
    }
});

/**
 * Get branch tree visualization data
 */
router.post('/tree', (request, response) => {
    try {
        if (!request.body || !request.body.chat_id) {
            return response.status(400).json({ error: 'Chat ID is required' });
        }

        const branchesFile = path.join(request.user.directories.root, 'branches', `${request.body.chat_id}.json`);
        
        if (!fs.existsSync(branchesFile)) {
            return response.json({ nodes: [], edges: [] });
        }
        
        const branchData = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));
        
        // Build tree visualization data
        const nodes = branchData.branches.map(branch => ({
            id: branch.id,
            label: branch.name,
            description: branch.description,
            message_count: branch.message_count,
            created_at: branch.created_at,
        }));

        const edges = [];
        for (const messageId in branchData.tree) {
            const childBranches = branchData.tree[messageId];
            childBranches.forEach(branchId => {
                edges.push({
                    from: messageId,
                    to: branchId,
                });
            });
        }

        return response.json({ nodes, edges, tree: branchData.tree });
    } catch (error) {
        console.error('Error getting branch tree:', error);
        return response.status(500).json({ error: 'Failed to get branch tree' });
    }
});

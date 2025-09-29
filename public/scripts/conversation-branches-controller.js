/**
 * Conversation Branches Controller
 * Manages conversation branching and timeline visualization
 */

class ConversationBranchesController {
    constructor() {
        this.state = {
            enabled: false,
            currentBranch: null,
            branches: [],
            tree: {},
            activeChatId: null,
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the conversation branches controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Conversation Branches Controller...');

            // Load saved settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('Conversation Branches Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Conversation Branches Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (typeof window !== 'undefined') {
            // Listen for chat loaded events
            document.addEventListener('chatLoaded', async (event) => {
                if (event.detail && event.detail.id) {
                    await this.loadBranchesForChat(event.detail.id);
                }
            });

            // Listen for message context menu
            document.addEventListener('contextmenu', (event) => {
                if (event.target.closest('.mes')) {
                    this.handleMessageContextMenu(event);
                }
            });
        }
    }

    /**
     * Load branches for a chat
     */
    async loadBranchesForChat(chatId) {
        try {
            const response = await fetch('/api/branches/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.branches = data.branches || [];
                this.state.tree = data.tree || {};
                this.state.activeChatId = chatId;
                
                this.emit('branchesLoaded', data);
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading branches:', error);
        }
    }

    /**
     * Create a new branch from a message
     */
    async createBranch(messageId, name, description) {
        if (!this.state.activeChatId) {
            console.error('No active chat');
            return null;
        }

        try {
            const response = await fetch('/api/branches/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.state.activeChatId,
                    message_id: messageId,
                    branch_name: name,
                    branch_description: description,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.branches.push(data.branch);
                
                this.emit('branchCreated', data.branch);
                this.updateUI();
                
                return data.branch;
            }
        } catch (error) {
            console.error('Error creating branch:', error);
        }

        return null;
    }

    /**
     * Switch to a different branch
     */
    async switchBranch(branchId) {
        if (!this.state.activeChatId) {
            console.error('No active chat');
            return false;
        }

        try {
            const response = await fetch('/api/branches/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.state.activeChatId,
                    branch_id: branchId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.currentBranch = data.branch;
                
                this.emit('branchSwitched', data);
                
                // Reload chat from branch point
                if (typeof window.openCharacterChat === 'function') {
                    // This would integrate with existing chat loading
                    console.log('Switching to branch:', data.branch.name);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error switching branch:', error);
        }

        return false;
    }

    /**
     * Delete a branch
     */
    async deleteBranch(branchId) {
        if (!this.state.activeChatId) {
            console.error('No active chat');
            return false;
        }

        try {
            const response = await fetch('/api/branches/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.state.activeChatId,
                    branch_id: branchId,
                }),
            });

            if (response.ok) {
                this.state.branches = this.state.branches.filter(b => b.id !== branchId);
                
                this.emit('branchDeleted', branchId);
                this.updateUI();
                
                return true;
            }
        } catch (error) {
            console.error('Error deleting branch:', error);
        }

        return false;
    }

    /**
     * Update branch metadata
     */
    async updateBranch(branchId, updates) {
        if (!this.state.activeChatId) {
            console.error('No active chat');
            return false;
        }

        try {
            const response = await fetch('/api/branches/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.state.activeChatId,
                    branch_id: branchId,
                    ...updates,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const branchIndex = this.state.branches.findIndex(b => b.id === branchId);
                if (branchIndex >= 0) {
                    this.state.branches[branchIndex] = data.branch;
                }
                
                this.emit('branchUpdated', data.branch);
                this.updateUI();
                
                return true;
            }
        } catch (error) {
            console.error('Error updating branch:', error);
        }

        return false;
    }

    /**
     * Get branch tree visualization data
     */
    async getBranchTree() {
        if (!this.state.activeChatId) {
            return { nodes: [], edges: [] };
        }

        try {
            const response = await fetch('/api/branches/tree', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: this.state.activeChatId }),
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting branch tree:', error);
        }

        return { nodes: [], edges: [] };
    }

    /**
     * Show branch creation dialog
     */
    showBranchDialog(messageId) {
        const dialog = `
            <div class="branch-dialog">
                <h3>Create New Branch</h3>
                <div class="branch-form">
                    <label>Branch Name:</label>
                    <input type="text" id="branch-name" placeholder="Alternate Path" />
                    
                    <label>Description:</label>
                    <textarea id="branch-description" placeholder="What if they chose differently?"></textarea>
                    
                    <div class="branch-actions">
                        <button id="branch-create-btn" class="menu_button">Create Branch</button>
                        <button id="branch-cancel-btn" class="menu_button">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Show dialog (would integrate with existing popup system)
        if (typeof window.callGenericPopup === 'function') {
            window.callGenericPopup(dialog, 'POPUP_TYPE.INPUT').then(async (result) => {
                if (result) {
                    const name = document.getElementById('branch-name')?.value || 'New Branch';
                    const description = document.getElementById('branch-description')?.value || '';
                    await this.createBranch(messageId, name, description);
                }
            });
        }
    }

    /**
     * Show branch timeline visualization
     */
    showBranchTimeline() {
        if (this.state.branches.length === 0) {
            console.log('No branches to display');
            return;
        }

        // This would create a visual timeline
        // Integration with existing UI framework
        console.log('Showing branch timeline:', this.state.branches);
        
        this.emit('timelineShown', this.state.branches);
    }

    /**
     * Handle message context menu
     */
    handleMessageContextMenu(event) {
        if (!this.state.enabled) return;

        const messageElement = event.target.closest('.mes');
        if (!messageElement) return;

        const messageId = messageElement.getAttribute('mesid');
        if (messageId === null) return;

        // Add "Create Branch" option to context menu
        // This would integrate with existing context menu system
        console.log('Branch option available for message:', messageId);
    }

    /**
     * Update UI
     */
    updateUI() {
        if (typeof window === 'undefined') return;

        // Update branch count display
        const branchCount = document.getElementById('branch-count');
        if (branchCount) {
            branchCount.textContent = this.state.branches.length;
        }

        // Update branch list
        const branchList = document.getElementById('branch-list');
        if (branchList) {
            branchList.innerHTML = this.state.branches.map(branch => `
                <div class="branch-item" data-branch-id="${branch.id}">
                    <div class="branch-name">${branch.name}</div>
                    <div class="branch-description">${branch.description}</div>
                    <div class="branch-meta">
                        <span>${branch.message_count} messages</span>
                        <span>${new Date(branch.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="branch-actions">
                        <button class="branch-switch" data-branch-id="${branch.id}">Switch</button>
                        <button class="branch-delete" data-branch-id="${branch.id}">Delete</button>
                    </div>
                </div>
            `).join('');

            // Attach event listeners
            branchList.querySelectorAll('.branch-switch').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const branchId = e.target.getAttribute('data-branch-id');
                    this.switchBranch(branchId);
                });
            });

            branchList.querySelectorAll('.branch-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const branchId = e.target.getAttribute('data-branch-id');
                    if (confirm('Delete this branch?')) {
                        this.deleteBranch(branchId);
                    }
                });
            });
        }
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.state = { ...this.state, ...newSettings };
        this.saveSettings();
        this.emit('settingsUpdated', this.state);
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.state };
    }

    /**
     * Load settings from localStorage
     */
    async loadSettings() {
        try {
            const saved = localStorage.getItem('conversation-branches-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load conversation branches settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('conversation-branches-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save conversation branches settings:', error);
        }
    }

    /**
     * Event emitter methods
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Create global instance
const conversationBranchesController = new ConversationBranchesController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            conversationBranchesController.initialize().catch(console.error);
        });
    } else {
        conversationBranchesController.initialize().catch(console.error);
    }

    // Expose globally
    window.conversationBranchesController = conversationBranchesController;
}

export { conversationBranchesController, ConversationBranchesController };

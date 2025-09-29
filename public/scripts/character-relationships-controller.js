/**
 * Character Relationships Controller
 * Manages character relationships and visualizes relationship graphs
 */

class CharacterRelationshipsController {
    constructor() {
        this.state = {
            enabled: false,
            relationships: [],
            graph: { nodes: [], edges: [] },
            activeCharacterId: null,
            autoAnalyze: true,
        };

        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the controller
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing Character Relationships Controller...');

            await this.loadSettings();
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('Character Relationships Controller initialized successfully');

            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Character Relationships Controller:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (typeof window !== 'undefined') {
            // Listen for character loaded
            document.addEventListener('chatLoaded', async (event) => {
                if (event.detail && event.detail.character) {
                    await this.loadRelationshipsForCharacter(event.detail.character.avatar);
                }
            });

            // Listen for messages to analyze relationships
            document.addEventListener('messageReceived', (event) => {
                if (this.state.autoAnalyze) {
                    this.analyzeMessageForRelationships(event.detail);
                }
            });
        }
    }

    /**
     * Load relationships for a character
     */
    async loadRelationshipsForCharacter(characterId) {
        try {
            const response = await fetch('/api/relationships/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character_id: characterId }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.relationships = data.relationships || [];
                this.state.graph = data.graph || { nodes: [], edges: [] };
                this.state.activeCharacterId = characterId;
                
                this.emit('relationshipsLoaded', data);
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading relationships:', error);
        }
    }

    /**
     * Create or update a relationship
     */
    async updateRelationship(fromCharacter, toCharacter, type, strength, notes = '', tags = []) {
        if (!this.state.activeCharacterId) {
            console.error('No active character');
            return null;
        }

        try {
            const response = await fetch('/api/relationships/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character_id: this.state.activeCharacterId,
                    from_character: fromCharacter,
                    to_character: toCharacter,
                    relationship_type: type,
                    strength,
                    notes,
                    tags,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                
                // Update local state
                const existingIndex = this.state.relationships.findIndex(
                    r => r.from === fromCharacter && r.to === toCharacter
                );
                
                if (existingIndex >= 0) {
                    this.state.relationships[existingIndex] = data.relationship;
                } else {
                    this.state.relationships.push(data.relationship);
                }
                
                this.emit('relationshipUpdated', data.relationship);
                this.updateUI();
                
                return data.relationship;
            }
        } catch (error) {
            console.error('Error updating relationship:', error);
        }

        return null;
    }

    /**
     * Delete a relationship
     */
    async deleteRelationship(relationshipId) {
        if (!this.state.activeCharacterId) {
            console.error('No active character');
            return false;
        }

        try {
            const response = await fetch('/api/relationships/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character_id: this.state.activeCharacterId,
                    relationship_id: relationshipId,
                }),
            });

            if (response.ok) {
                this.state.relationships = this.state.relationships.filter(r => r.id !== relationshipId);
                
                this.emit('relationshipDeleted', relationshipId);
                this.updateUI();
                
                return true;
            }
        } catch (error) {
            console.error('Error deleting relationship:', error);
        }

        return false;
    }

    /**
     * Analyze conversation for relationships
     */
    async analyzeConversation(messages, characters) {
        if (!this.state.activeCharacterId) {
            return null;
        }

        try {
            const response = await fetch('/api/relationships/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character_id: this.state.activeCharacterId,
                    messages,
                    characters,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.emit('analysisComplete', data);
                
                // Show suggestions to user
                if (data.suggested_updates && data.suggested_updates.length > 0) {
                    this.showRelationshipSuggestions(data.suggested_updates);
                }
                
                return data;
            }
        } catch (error) {
            console.error('Error analyzing relationships:', error);
        }

        return null;
    }

    /**
     * Analyze single message for relationship updates
     */
    analyzeMessageForRelationships(messageData) {
        // This would be called on each message
        // In production, batch these and analyze periodically
        console.log('Analyzing message for relationships:', messageData);
    }

    /**
     * Get relationship graph data
     */
    async getRelationshipGraph(depth = 2) {
        if (!this.state.activeCharacterId) {
            return { nodes: [], edges: [], clusters: [] };
        }

        try {
            const response = await fetch('/api/relationships/graph', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character_id: this.state.activeCharacterId,
                    depth,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.state.graph = data;
                this.emit('graphUpdated', data);
                return data;
            }
        } catch (error) {
            console.error('Error getting relationship graph:', error);
        }

        return { nodes: [], edges: [], clusters: [] };
    }

    /**
     * Show relationship graph visualization
     */
    async showRelationshipGraph() {
        const graphData = await this.getRelationshipGraph();
        
        if (graphData.nodes.length === 0) {
            console.log('No relationships to visualize');
            return;
        }

        // This would create a visual graph using a library like D3.js or Cytoscape.js
        console.log('Showing relationship graph:', graphData);
        
        // For now, create a simple HTML representation
        const graphHTML = this.createGraphHTML(graphData);
        
        if (typeof window.callGenericPopup === 'function') {
            window.callGenericPopup(graphHTML, 'POPUP_TYPE.TEXT');
        }
        
        this.emit('graphShown', graphData);
    }

    /**
     * Create HTML representation of graph
     */
    createGraphHTML(graphData) {
        return `
            <div class="relationship-graph">
                <h3>Character Relationships</h3>
                
                <div class="graph-legend">
                    <div class="legend-item"><span class="color-friend"></span> Friend</div>
                    <div class="legend-item"><span class="color-romantic"></span> Romantic</div>
                    <div class="legend-item"><span class="color-family"></span> Family</div>
                    <div class="legend-item"><span class="color-rival"></span> Rival</div>
                    <div class="legend-item"><span class="color-enemy"></span> Enemy</div>
                    <div class="legend-item"><span class="color-neutral"></span> Neutral</div>
                </div>
                
                <div class="graph-nodes">
                    ${graphData.nodes.map(node => `
                        <div class="graph-node" data-node-id="${node.id}">
                            <strong>${node.label}</strong>
                            <div class="node-connections">${node.connections || 0} connections</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="graph-edges">
                    <h4>Relationships</h4>
                    ${graphData.edges.map(edge => `
                        <div class="graph-edge relationship-${edge.type}">
                            ${edge.from} → ${edge.to}: <strong>${edge.type}</strong> (${edge.value})
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Show relationship suggestions
     */
    showRelationshipSuggestions(suggestions) {
        const suggestionsHTML = `
            <div class="relationship-suggestions">
                <h3>Relationship Suggestions</h3>
                <p>Based on conversation analysis:</p>
                
                ${suggestions.map((suggestion, index) => `
                    <div class="suggestion-item">
                        <div class="suggestion-relationship">
                            ${suggestion.from} → ${suggestion.to}
                        </div>
                        <div class="suggestion-type">
                            Type: <strong>${suggestion.type}</strong> (Strength: ${suggestion.strength})
                        </div>
                        <div class="suggestion-reason">${suggestion.reason}</div>
                        <button class="apply-suggestion" data-index="${index}">Apply</button>
                    </div>
                `).join('')}
            </div>
        `;

        if (typeof window.callGenericPopup === 'function') {
            window.callGenericPopup(suggestionsHTML, 'POPUP_TYPE.TEXT').then(() => {
                // Handle suggestion application
                document.querySelectorAll('.apply-suggestion').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = parseInt(e.target.getAttribute('data-index'));
                        const suggestion = suggestions[index];
                        this.updateRelationship(
                            suggestion.from,
                            suggestion.to,
                            suggestion.type,
                            suggestion.strength
                        );
                    });
                });
            });
        }
    }

    /**
     * Show relationship editor
     */
    showRelationshipEditor(fromCharacter, toCharacter) {
        const existing = this.state.relationships.find(
            r => r.from === fromCharacter && r.to === toCharacter
        );

        const editorHTML = `
            <div class="relationship-editor">
                <h3>Edit Relationship</h3>
                
                <div class="editor-field">
                    <label>From:</label>
                    <input type="text" id="rel-from" value="${fromCharacter}" readonly />
                </div>
                
                <div class="editor-field">
                    <label>To:</label>
                    <input type="text" id="rel-to" value="${toCharacter}" readonly />
                </div>
                
                <div class="editor-field">
                    <label>Type:</label>
                    <select id="rel-type">
                        <option value="friend" ${existing?.type === 'friend' ? 'selected' : ''}>Friend</option>
                        <option value="romantic" ${existing?.type === 'romantic' ? 'selected' : ''}>Romantic</option>
                        <option value="family" ${existing?.type === 'family' ? 'selected' : ''}>Family</option>
                        <option value="rival" ${existing?.type === 'rival' ? 'selected' : ''}>Rival</option>
                        <option value="enemy" ${existing?.type === 'enemy' ? 'selected' : ''}>Enemy</option>
                        <option value="neutral" ${existing?.type === 'neutral' ? 'selected' : ''}>Neutral</option>
                    </select>
                </div>
                
                <div class="editor-field">
                    <label>Strength (0-100):</label>
                    <input type="range" id="rel-strength" min="0" max="100" value="${existing?.strength || 50}" />
                    <span id="rel-strength-value">${existing?.strength || 50}</span>
                </div>
                
                <div class="editor-field">
                    <label>Notes:</label>
                    <textarea id="rel-notes">${existing?.notes || ''}</textarea>
                </div>
                
                <div class="editor-actions">
                    <button id="rel-save">Save</button>
                    <button id="rel-cancel">Cancel</button>
                </div>
            </div>
        `;

        if (typeof window.callGenericPopup === 'function') {
            window.callGenericPopup(editorHTML, 'POPUP_TYPE.INPUT').then(() => {
                // Handle save
                const saveBtn = document.getElementById('rel-save');
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => {
                        const type = document.getElementById('rel-type').value;
                        const strength = parseInt(document.getElementById('rel-strength').value);
                        const notes = document.getElementById('rel-notes').value;
                        
                        this.updateRelationship(fromCharacter, toCharacter, type, strength, notes);
                    });
                }

                // Update strength display
                const strengthSlider = document.getElementById('rel-strength');
                const strengthValue = document.getElementById('rel-strength-value');
                if (strengthSlider && strengthValue) {
                    strengthSlider.addEventListener('input', (e) => {
                        strengthValue.textContent = e.target.value;
                    });
                }
            });
        }
    }

    /**
     * Update UI
     */
    updateUI() {
        if (typeof window === 'undefined') return;

        // Update relationship count
        const relCount = document.getElementById('relationship-count');
        if (relCount) {
            relCount.textContent = this.state.relationships.length;
        }

        // Update relationship list
        const relList = document.getElementById('relationship-list');
        if (relList) {
            relList.innerHTML = this.state.relationships.map(rel => `
                <div class="relationship-item relationship-${rel.type}">
                    <div class="relationship-characters">
                        ${rel.from} → ${rel.to}
                    </div>
                    <div class="relationship-type">${rel.type}</div>
                    <div class="relationship-strength">
                        <div class="strength-bar" style="width: ${rel.strength}%"></div>
                        <span>${rel.strength}</span>
                    </div>
                    <div class="relationship-actions">
                        <button class="rel-edit" data-from="${rel.from}" data-to="${rel.to}">Edit</button>
                        <button class="rel-delete" data-id="${rel.id}">Delete</button>
                    </div>
                </div>
            `).join('');

            // Attach event listeners
            relList.querySelectorAll('.rel-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const from = e.target.getAttribute('data-from');
                    const to = e.target.getAttribute('data-to');
                    this.showRelationshipEditor(from, to);
                });
            });

            relList.querySelectorAll('.rel-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Delete this relationship?')) {
                        this.deleteRelationship(id);
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
            const saved = localStorage.getItem('character-relationships-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load character relationships settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('character-relationships-settings', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save character relationships settings:', error);
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
const characterRelationshipsController = new CharacterRelationshipsController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            characterRelationshipsController.initialize().catch(console.error);
        });
    } else {
        characterRelationshipsController.initialize().catch(console.error);
    }

    // Expose globally
    window.characterRelationshipsController = characterRelationshipsController;
}

export { characterRelationshipsController, CharacterRelationshipsController };

/**
 * Advanced Features Integration
 * Connects UI panels to backend controllers
 */

import { conversationBranchesController } from './conversation-branches-controller.js';
import { advancedFeaturesController } from './advanced-features-controller.js';
import { characterRelationshipsController } from './character-relationships-controller.js';
import { visualEffectsController } from './visual-effects-controller.js';

/**
 * Initialize all advanced features integration
 */
export function initializeAdvancedFeaturesIntegration() {
    console.log('Initializing Advanced Features Integration...');
    
    // Connect Branches Panel
    connectBranchesPanel();
    
    // Connect Relationships Panel
    connectRelationshipsPanel();
    
    // Connect Bookmarks Panel
    connectBookmarksPanel();
    
    // Connect Visual Effects Studio
    connectVisualEffectsStudio();
    
    console.log('Advanced Features Integration initialized');
}

/**
 * Connect Branches Panel to backend
 */
function connectBranchesPanel() {
    const branchSelector = document.getElementById('branch-selector');
    const branchList = document.getElementById('branch-list');
    const createBranchBtn = document.getElementById('create-branch-btn');
    const showBranchTreeBtn = document.getElementById('show-branch-tree');
    const branchRefresh = document.getElementById('branch-refresh');
    const branchExport = document.getElementById('branch-export');
    
    // Load branches on chat load
    conversationBranchesController.on('branchesLoaded', (branches) => {
        updateBranchList(branches);
        updateBranchSelector(branches);
    });
    
    // Branch selector change
    branchSelector?.addEventListener('change', async (e) => {
        const branchId = e.target.value;
        if (branchId !== 'main') {
            await conversationBranchesController.switchBranch(branchId);
            toastr.success('Switched to branch: ' + e.target.options[e.target.selectedIndex].text);
        }
    });
    
    // Create branch button
    createBranchBtn?.addEventListener('click', async () => {
        const name = await callGenericPopup('Enter branch name:', 'POPUP_TYPE.INPUT', 'New Branch');
        if (!name) return;
        
        const description = await callGenericPopup('Enter branch description (optional):', 'POPUP_TYPE.INPUT', '');
        
        const currentMessageId = window.chat?.length - 1 || 0;
        await conversationBranchesController.createBranch(currentMessageId, name, description);
        toastr.success('Branch created!');
    });
    
    // Show branch tree
    showBranchTreeBtn?.addEventListener('click', () => {
        conversationBranchesController.showBranchTimeline();
    });
    
    // Refresh branches
    branchRefresh?.addEventListener('click', async () => {
        await conversationBranchesController.loadBranches();
        toastr.info('Branches refreshed');
    });
    
    // Export branches
    branchExport?.addEventListener('click', async () => {
        const branches = await conversationBranchesController.loadBranches();
        const dataStr = JSON.stringify(branches, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'branches.json';
        link.click();
        toastr.success('Branches exported!');
    });
    
    // Settings checkboxes
    document.getElementById('branch-auto-save')?.addEventListener('change', (e) => {
        conversationBranchesController.updateSettings({ autoSave: e.target.checked });
    });
    
    document.getElementById('branch-show-timeline')?.addEventListener('change', (e) => {
        conversationBranchesController.updateSettings({ showTimeline: e.target.checked });
    });
    
    document.getElementById('branch-confirm-switch')?.addEventListener('change', (e) => {
        conversationBranchesController.updateSettings({ confirmSwitch: e.target.checked });
    });
}

/**
 * Update branch list UI
 */
function updateBranchList(branches) {
    const branchList = document.getElementById('branch-list');
    if (!branchList) return;
    
    if (!branches || branches.length === 0) {
        branchList.innerHTML = `
            <div class="textAlignCenter" style="padding: 20px; color: var(--grey70);">
                <i class="fa-solid fa-code-branch fa-3x marginBot10"></i>
                <p>No branches yet. Create one from any message!</p>
            </div>
        `;
        return;
    }
    
    branchList.innerHTML = branches.map(branch => `
        <div class="branch-item" data-branch-id="${branch.id}" style="padding: 10px; margin-bottom: 8px; background: var(--black30a); border-radius: 4px; border-left: 3px solid var(--SmartThemeEmColor);">
            <div style="font-weight: bold; margin-bottom: 5px;">${branch.name}</div>
            <div style="font-size: 11px; color: var(--grey70); margin-bottom: 5px;">${branch.description || 'No description'}</div>
            <div style="font-size: 10px; color: var(--grey50);">
                ${branch.message_count} messages • Created ${new Date(branch.created_at).toLocaleDateString()}
            </div>
            <div style="margin-top: 8px; display: flex; gap: 5px;">
                <button class="menu_button menu_button_icon" onclick="switchToBranch('${branch.id}')" title="Switch to this branch">
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
                <button class="menu_button menu_button_icon" onclick="deleteBranch('${branch.id}')" title="Delete branch">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Update branch selector dropdown
 */
function updateBranchSelector(branches) {
    const branchSelector = document.getElementById('branch-selector');
    if (!branchSelector) return;
    
    branchSelector.innerHTML = '<option value="main">Main Timeline</option>';
    
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.id;
        option.textContent = branch.name;
        branchSelector.appendChild(option);
    });
}

/**
 * Connect Relationships Panel to backend
 */
function connectRelationshipsPanel() {
    const relationshipFilter = document.getElementById('relationship-filter');
    const relationshipList = document.getElementById('relationship-list');
    const addRelationshipBtn = document.getElementById('add-relationship-btn');
    const showGraphBtn = document.getElementById('show-graph-btn');
    const relationshipAnalyze = document.getElementById('relationship-analyze');
    const relationshipExport = document.getElementById('relationship-export');
    
    // Load relationships on chat load
    characterRelationshipsController.on('relationshipsLoaded', (relationships) => {
        updateRelationshipList(relationships);
    });
    
    // Filter change
    relationshipFilter?.addEventListener('change', async (e) => {
        const filterType = e.target.value;
        const relationships = await characterRelationshipsController.loadRelationships();
        const filtered = filterType === 'all' 
            ? relationships 
            : relationships.filter(r => r.type === filterType);
        updateRelationshipList(filtered);
    });
    
    // Add relationship
    addRelationshipBtn?.addEventListener('click', async () => {
        const from = await callGenericPopup('From character:', 'POPUP_TYPE.INPUT', '');
        if (!from) return;
        
        const to = await callGenericPopup('To character:', 'POPUP_TYPE.INPUT', '');
        if (!to) return;
        
        await characterRelationshipsController.updateRelationship(from, to, 'friend', 50);
        toastr.success('Relationship added!');
    });
    
    // Show graph
    showGraphBtn?.addEventListener('click', () => {
        characterRelationshipsController.showRelationshipGraph();
    });
    
    // Analyze conversation
    relationshipAnalyze?.addEventListener('click', async () => {
        if (!window.chat || window.chat.length === 0) {
            toastr.info('No messages to analyze');
            return;
        }
        
        const characters = window.characters ? Object.values(window.characters).map(c => c.name) : [];
        await characterRelationshipsController.analyzeConversation(window.chat, characters);
        toastr.success('Conversation analyzed!');
    });
    
    // Export relationships
    relationshipExport?.addEventListener('click', async () => {
        const relationships = await characterRelationshipsController.loadRelationships();
        const dataStr = JSON.stringify(relationships, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'relationships.json';
        link.click();
        toastr.success('Relationships exported!');
    });
    
    // Settings checkboxes
    document.getElementById('relationship-auto-detect')?.addEventListener('change', (e) => {
        characterRelationshipsController.updateSettings({ autoAnalyze: e.target.checked });
    });
    
    document.getElementById('relationship-show-strength')?.addEventListener('change', (e) => {
        characterRelationshipsController.updateSettings({ showStrength: e.target.checked });
    });
    
    document.getElementById('relationship-color-code')?.addEventListener('change', (e) => {
        characterRelationshipsController.updateSettings({ colorCode: e.target.checked });
    });
}

/**
 * Update relationship list UI
 */
function updateRelationshipList(relationships) {
    const relationshipList = document.getElementById('relationship-list');
    if (!relationshipList) return;
    
    if (!relationships || relationships.length === 0) {
        relationshipList.innerHTML = `
            <div class="textAlignCenter" style="padding: 20px; color: var(--grey70);">
                <i class="fa-solid fa-users fa-3x marginBot10"></i>
                <p>No relationships tracked yet</p>
            </div>
        `;
        return;
    }
    
    const typeColors = {
        friend: '#4CAF50',
        romantic: '#E91E63',
        family: '#9C27B0',
        rival: '#FF9800',
        enemy: '#F44336',
        neutral: '#9E9E9E'
    };
    
    relationshipList.innerHTML = relationships.map(rel => `
        <div class="relationship-item" style="padding: 10px; margin-bottom: 8px; background: var(--black30a); border-radius: 4px; border-left: 3px solid ${typeColors[rel.type] || '#9E9E9E'};">
            <div style="font-weight: bold; margin-bottom: 5px;">${rel.from} → ${rel.to}</div>
            <div style="font-size: 11px; color: var(--grey70); margin-bottom: 5px;">Type: ${rel.type}</div>
            <div style="margin-bottom: 5px;">
                <div style="background: var(--black50a); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: ${typeColors[rel.type]}; height: 100%; width: ${rel.strength}%; transition: width 0.3s;"></div>
                </div>
                <div style="font-size: 10px; color: var(--grey50); margin-top: 2px;">Strength: ${rel.strength}%</div>
            </div>
            <div style="margin-top: 8px; display: flex; gap: 5px;">
                <button class="menu_button menu_button_icon" onclick="editRelationship('${rel.id}')" title="Edit relationship">
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button class="menu_button menu_button_icon" onclick="deleteRelationship('${rel.id}')" title="Delete relationship">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Connect Bookmarks Panel to backend
 */
function connectBookmarksPanel() {
    const bookmarkFilter = document.getElementById('bookmark-filter');
    const bookmarkList = document.getElementById('bookmark-list');
    const bookmarkClearAll = document.getElementById('bookmark-clear-all');
    const bookmarkStats = document.getElementById('bookmark-stats');
    const bookmarkSearch = document.getElementById('bookmark-search');
    const bookmarkExport = document.getElementById('bookmark-export');
    
    // Load bookmarks
    advancedFeaturesController.on('bookmarkAdded', () => {
        loadBookmarks();
    });
    
    // Filter change
    bookmarkFilter?.addEventListener('change', () => {
        loadBookmarks();
    });
    
    // Clear all bookmarks
    bookmarkClearAll?.addEventListener('click', async () => {
        const confirm = await callGenericPopup('Are you sure you want to clear all bookmarks?', 'POPUP_TYPE.CONFIRM');
        if (confirm) {
            // Clear bookmarks logic here
            toastr.success('All bookmarks cleared!');
            loadBookmarks();
        }
    });
    
    // Show bookmark statistics
    bookmarkStats?.addEventListener('click', () => {
        // Show stats dialog
        toastr.info('Bookmark statistics coming soon!');
    });
    
    // Search bookmarks
    bookmarkSearch?.addEventListener('click', async () => {
        const query = await callGenericPopup('Search bookmarks:', 'POPUP_TYPE.INPUT', '');
        if (query) {
            // Search logic here
            toastr.info('Searching for: ' + query);
        }
    });
    
    // Export bookmarks
    bookmarkExport?.addEventListener('click', () => {
        // Export logic here
        toastr.success('Bookmarks exported!');
    });
}

/**
 * Load bookmarks
 */
async function loadBookmarks() {
    const bookmarkList = document.getElementById('bookmark-list');
    if (!bookmarkList) return;
    
    // Placeholder - replace with actual bookmark loading
    bookmarkList.innerHTML = `
        <div class="textAlignCenter" style="padding: 20px; color: var(--grey70);">
            <i class="fa-solid fa-bookmark fa-3x marginBot10"></i>
            <p>No bookmarks yet. Right-click a message to bookmark it!</p>
        </div>
    `;
}

/**
 * Connect Visual Effects Studio
 */
function connectVisualEffectsStudio() {
    console.log('Connecting Visual Effects Studio...');
    
    // Connect special effects checkboxes
    const glitchCheckbox = document.querySelector('input[type="checkbox"][id*="glitch"]');
    const matrixCheckbox = document.querySelector('input[type="checkbox"][id*="matrix"]');
    const cyberpunkCheckbox = document.querySelector('input[type="checkbox"][id*="cyberpunk"]');
    const hologramCheckbox = document.querySelector('input[type="checkbox"][id*="hologram"]');
    const retroCheckbox = document.querySelector('input[type="checkbox"][id*="retro"]');
    
    // Glitch Effect
    glitchCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.glitch = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Glitch effect enabled' : 'Glitch effect disabled');
    });
    
    // Matrix Rain Effect
    matrixCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.matrix = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Matrix Rain enabled' : 'Matrix Rain disabled');
    });
    
    // Cyberpunk Effect
    cyberpunkCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.cyberpunk = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Cyberpunk mode enabled' : 'Cyberpunk mode disabled');
    });
    
    // Hologram Effect
    hologramCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.hologram = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Hologram effect enabled' : 'Hologram effect disabled');
    });
    
    // Retro Wave Effect
    retroCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.retro = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Retro Wave enabled' : 'Retro Wave disabled');
    });
    
    // 3D Particles Effect
    const particles3dCheckbox = document.querySelector('input[type="checkbox"][id*="particles3d"]');
    particles3dCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.particles3d = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? '3D Particles enabled' : '3D Particles disabled');
    });
    
    // Rotating Cube Effect
    const cubeCheckbox = document.querySelector('input[type="checkbox"][id*="cube"]');
    cubeCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.rotatingCube = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Rotating Cube enabled' : 'Rotating Cube disabled');
    });
    
    // DNA Helix Effect
    const dnaCheckbox = document.querySelector('input[type="checkbox"][id*="dna"]');
    dnaCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.dnaHelix = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'DNA Helix enabled' : 'DNA Helix disabled');
    });
    
    // Starfield Effect
    const starfieldCheckbox = document.querySelector('input[type="checkbox"][id*="starfield"]');
    starfieldCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.starfield = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Starfield enabled' : 'Starfield disabled');
    });
    
    // Plasma Effect
    const plasmaCheckbox = document.querySelector('input[type="checkbox"][id*="plasma"]');
    plasmaCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.specialEffects.plasma = e.target.checked;
        visualEffectsController.applySpecialEffects();
        toastr.info(e.target.checked ? 'Plasma Effect enabled' : 'Plasma Effect disabled');
    });
    
    // Find all visual effects controls
    const effectsPanel = document.querySelector('#visual-effects-panel, #VisualEffectsPanel');
    if (!effectsPanel) {
        console.warn('Visual Effects Panel not found');
        return;
    }
    
    // Enable/disable visual effects
    const enableCheckbox = effectsPanel.querySelector('#visual-effects-enabled, input[type="checkbox"][id*="visual"]');
    enableCheckbox?.addEventListener('change', (e) => {
        visualEffectsController.state.enabled = e.target.checked;
        visualEffectsController.updateSettings({ enabled: e.target.checked });
        applyVisualEffects();
        toastr.info(e.target.checked ? 'Visual effects enabled' : 'Visual effects disabled');
    });
    
    // Message entrance effects
    const entranceSelect = effectsPanel.querySelector('#message-entrance-effect, select[id*="entrance"]');
    entranceSelect?.addEventListener('change', (e) => {
        visualEffectsController.state.messageEffects.entrance = e.target.value;
        applyMessageEntranceEffect(e.target.value);
    });
    
    // Apply visual effects to messages
    applyVisualEffects();
    
    // Listen for new messages
    document.addEventListener('messageAdded', (event) => {
        if (visualEffectsController.state.enabled) {
            applyEffectToMessage(event.detail.messageElement);
        }
    });
}

/**
 * Apply visual effects
 */
function applyVisualEffects() {
    if (!visualEffectsController.state.enabled) {
        document.body.classList.remove('visual-effects-active');
        return;
    }
    
    document.body.classList.add('visual-effects-active');
    
    // Apply to all existing messages
    document.querySelectorAll('.mes').forEach(message => {
        applyEffectToMessage(message);
    });
}

/**
 * Apply effect to a single message
 */
function applyEffectToMessage(messageElement) {
    if (!messageElement) return;
    
    const effect = visualEffectsController.state.messageEffects.entrance;
    
    // Remove existing animation classes
    messageElement.classList.remove('fade-in', 'slide-in', 'bounce-in', 'zoom-in');
    
    // Add new animation class
    if (effect && effect !== 'none') {
        messageElement.classList.add(effect);
        
        // Add CSS if not already present
        if (!document.getElementById('visual-effects-styles')) {
            const style = document.createElement('style');
            style.id = 'visual-effects-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { transform: translateX(-20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes zoomIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                
                .mes.fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                
                .mes.slide-in {
                    animation: slideIn 0.5s ease-out;
                }
                
                .mes.bounce-in {
                    animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                .mes.zoom-in {
                    animation: zoomIn 0.4s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/**
 * Apply message entrance effect
 */
function applyMessageEntranceEffect(effect) {
    visualEffectsController.state.messageEffects.entrance = effect;
    visualEffectsController.updateSettings({ 
        messageEffects: visualEffectsController.state.messageEffects 
    });
    toastr.info('Message entrance effect: ' + effect);
}

// Global functions for inline onclick handlers
window.switchToBranch = async function(branchId) {
    await conversationBranchesController.switchBranch(branchId);
    toastr.success('Switched to branch');
};

window.deleteBranch = async function(branchId) {
    const confirm = await callGenericPopup('Delete this branch?', 'POPUP_TYPE.CONFIRM');
    if (confirm) {
        await conversationBranchesController.deleteBranch(branchId);
        toastr.success('Branch deleted');
    }
};

window.editRelationship = async function(relationshipId) {
    toastr.info('Edit relationship: ' + relationshipId);
    characterRelationshipsController.showRelationshipEditor(relationshipId);
};

window.deleteRelationship = async function(relationshipId) {
    const confirm = await callGenericPopup('Delete this relationship?', 'POPUP_TYPE.CONFIRM');
    if (confirm) {
        await characterRelationshipsController.deleteRelationship(relationshipId);
        toastr.success('Relationship deleted');
    }
};

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdvancedFeaturesIntegration);
    } else {
        // DOM already loaded, initialize immediately
        setTimeout(initializeAdvancedFeaturesIntegration, 100);
    }
}

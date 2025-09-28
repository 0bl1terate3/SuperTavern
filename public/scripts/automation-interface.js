/**
 * Automation Interface
 * Handles UI interactions for the Automation Hub
 */

let automationState = {
    autoResponses: {
        enabled: false,
        triggers: [],
    },
    scheduled: {
        enabled: false,
        schedules: [],
    },
    workflows: {
        enabled: false,
        workflows: [],
    },
    smartFeatures: {
        smartReplies: false,
        moodDetection: false,
        contextAware: false,
    },
    analytics: {
        responsesSent: 0,
        scheduledMessages: 0,
        workflowsExecuted: 0,
    },
};

/**
 * Initialize the automation interface
 */
export async function initializeAutomationInterface() {
    console.log('Initializing Automation Interface...');

    try {
        // Load saved settings
        loadAutomationSettings();

        // Set up event listeners
        setupAutomationEventListeners();

        // Update UI from state
        updateUIFromState();

        // Update analytics
        updateAnalytics();

        console.log('Automation Interface initialized');
    } catch (error) {
        console.error('Failed to initialize Automation Interface:', error);
    }
}

/**
 * Set up event listeners for automation controls
 */
function setupAutomationEventListeners() {
    // Auto-responses toggle
    const autoResponsesEnabled = document.getElementById('automation_auto_responses_enabled');
    if (autoResponsesEnabled) {
        autoResponsesEnabled.addEventListener('change', (e) => {
            automationState.autoResponses.enabled = e.target.checked;
            updateAutomationControllerSettings();
            saveAutomationSettings();
        });
    }

    // Scheduled messages toggle
    const scheduledEnabled = document.getElementById('automation_scheduled_enabled');
    if (scheduledEnabled) {
        scheduledEnabled.addEventListener('change', (e) => {
            automationState.scheduled.enabled = e.target.checked;
            updateAutomationControllerSettings();
            saveAutomationSettings();
        });
    }

    // Workflows toggle
    const workflowsEnabled = document.getElementById('automation_workflows_enabled');
    if (workflowsEnabled) {
        workflowsEnabled.addEventListener('change', (e) => {
            automationState.workflows.enabled = e.target.checked;
            updateAutomationControllerSettings();
            saveAutomationSettings();
        });
    }

    // Smart features toggles
    const smartReplies = document.getElementById('automation_smart_replies');
    if (smartReplies) {
        smartReplies.addEventListener('change', (e) => {
            automationState.smartFeatures.smartReplies = e.target.checked;
            updateAutomationControllerSettings();
            saveAutomationSettings();
        });
    }

    const moodDetection = document.getElementById('automation_mood_detection');
    if (moodDetection) {
        moodDetection.addEventListener('change', (e) => {
            automationState.smartFeatures.moodDetection = e.target.checked;
            updateAutomationControllerSettings();
            saveAutomationSettings();
        });
    }

    const contextAware = document.getElementById('automation_context_aware');
    if (contextAware) {
        contextAware.addEventListener('change', (e) => {
            automationState.smartFeatures.contextAware = e.target.checked;
            updateAutomationControllerSettings();
            saveAutomationSettings();
        });
    }

    // Action buttons
    const addTriggerBtn = document.getElementById('automation_add_trigger');
    if (addTriggerBtn) {
        addTriggerBtn.addEventListener('click', () => {
            showAddTriggerDialog();
        });
    }

    const addScheduleBtn = document.getElementById('automation_add_schedule');
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', () => {
            showAddScheduleDialog();
        });
    }

    const addWorkflowBtn = document.getElementById('automation_add_workflow');
    if (addWorkflowBtn) {
        addWorkflowBtn.addEventListener('click', () => {
            showAddWorkflowDialog();
        });
    }

    const testAllBtn = document.getElementById('automation_test_all');
    if (testAllBtn) {
        testAllBtn.addEventListener('click', () => {
            testAllAutomations();
        });
    }

    const exportBtn = document.getElementById('automation_export_config');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportAutomationConfig();
        });
    }

    const importBtn = document.getElementById('automation_import_config');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            importAutomationConfig();
        });
    }

    const analyticsBtn = document.getElementById('automation_reset_stats');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', () => {
            showAnalyticsDialog();
        });
    }
}

/**
 * Update automation controller settings
 */
function updateAutomationControllerSettings() {
    if (typeof window !== 'undefined' && window.automationController) {
        window.automationController.updateSettings(automationState);
    }
}

/**
 * Update UI from current state
 */
function updateUIFromState() {
    // Update checkboxes
    const autoResponsesEnabled = document.getElementById('automation_auto_responses_enabled');
    if (autoResponsesEnabled) {
        autoResponsesEnabled.checked = automationState.autoResponses.enabled;
    }

    const scheduledEnabled = document.getElementById('automation_scheduled_enabled');
    if (scheduledEnabled) {
        scheduledEnabled.checked = automationState.scheduled.enabled;
    }

    const workflowsEnabled = document.getElementById('automation_workflows_enabled');
    if (workflowsEnabled) {
        workflowsEnabled.checked = automationState.workflows.enabled;
    }

    const smartReplies = document.getElementById('automation_smart_replies');
    if (smartReplies) {
        smartReplies.checked = automationState.smartFeatures.smartReplies;
    }

    const moodDetection = document.getElementById('automation_mood_detection');
    if (moodDetection) {
        moodDetection.checked = automationState.smartFeatures.moodDetection;
    }

    const contextAware = document.getElementById('automation_context_aware');
    if (contextAware) {
        contextAware.checked = automationState.smartFeatures.contextAware;
    }

    // Update lists
    updateTriggerList();
    updateScheduleList();
    updateWorkflowList();
}

/**
 * Update trigger list display
 */
function updateTriggerList() {
    const triggerList = document.getElementById('automation-trigger-list');
    if (!triggerList) return;

    triggerList.innerHTML = '';

    if (automationState.autoResponses.triggers.length === 0) {
        triggerList.innerHTML = '<div class="automation-empty">No triggers configured</div>';
        return;
    }

    automationState.autoResponses.triggers.forEach(trigger => {
        const item = document.createElement('div');
        item.className = 'automation-item';
        item.innerHTML = `
            <div class="automation-item-info">
                <div class="automation-item-name">${trigger.name}</div>
                <div class="automation-item-details">${trigger.type}: "${trigger.pattern}"</div>
            </div>
            <div class="automation-item-actions">
                <button class="automation-edit-btn" onclick="editTrigger('${trigger.id}')">Edit</button>
                <button class="automation-delete-btn" onclick="deleteTrigger('${trigger.id}')">Delete</button>
            </div>
        `;
        triggerList.appendChild(item);
    });
}

/**
 * Update schedule list display
 */
function updateScheduleList() {
    const scheduleList = document.getElementById('automation-schedule-list');
    if (!scheduleList) return;

    scheduleList.innerHTML = '';

    if (automationState.scheduled.schedules.length === 0) {
        scheduleList.innerHTML = '<div class="automation-empty">No schedules configured</div>';
        return;
    }

    automationState.scheduled.schedules.forEach(schedule => {
        const item = document.createElement('div');
        item.className = 'automation-item';
        item.innerHTML = `
            <div class="automation-item-info">
                <div class="automation-item-name">${schedule.name}</div>
                <div class="automation-item-details">${schedule.time} ${schedule.interval ? `(${schedule.interval})` : ''}</div>
            </div>
            <div class="automation-item-actions">
                <button class="automation-edit-btn" onclick="editSchedule('${schedule.id}')">Edit</button>
                <button class="automation-delete-btn" onclick="deleteSchedule('${schedule.id}')">Delete</button>
            </div>
        `;
        scheduleList.appendChild(item);
    });
}

/**
 * Update workflow list display
 */
function updateWorkflowList() {
    const workflowList = document.getElementById('automation-workflow-list');
    if (!workflowList) return;

    workflowList.innerHTML = '';

    if (automationState.workflows.workflows.length === 0) {
        workflowList.innerHTML = '<div class="automation-empty">No workflows configured</div>';
        return;
    }

    automationState.workflows.workflows.forEach(workflow => {
        const item = document.createElement('div');
        item.className = 'automation-item';
        item.innerHTML = `
            <div class="automation-item-info">
                <div class="automation-item-name">${workflow.name}</div>
                <div class="automation-item-details">${workflow.conditions.length} conditions, ${workflow.actions.length} actions</div>
            </div>
            <div class="automation-item-actions">
                <button class="automation-edit-btn" onclick="editWorkflow('${workflow.id}')">Edit</button>
                <button class="automation-delete-btn" onclick="deleteWorkflow('${workflow.id}')">Delete</button>
            </div>
        `;
        workflowList.appendChild(item);
    });
}

/**
 * Update analytics display
 */
function updateAnalytics() {
    const responsesEl = document.getElementById('automation-stat-responses');
    const scheduledEl = document.getElementById('automation-stat-scheduled');
    const workflowsEl = document.getElementById('automation-stat-workflows');

    if (responsesEl) responsesEl.textContent = automationState.analytics.responsesSent;
    if (scheduledEl) scheduledEl.textContent = automationState.analytics.scheduledMessages;
    if (workflowsEl) workflowsEl.textContent = automationState.analytics.workflowsExecuted;
}

/**
 * Show add trigger dialog
 */
function showAddTriggerDialog() {
    const name = prompt('Trigger name:');
    if (!name) return;

    const pattern = prompt('Trigger pattern:');
    if (!pattern) return;

    const type = prompt('Trigger type (contains/startsWith/endsWith/regex):', 'contains');
    if (!type) return;

    const response = prompt('Auto-response message:');
    if (!response) return;

    const trigger = {
        name,
        pattern,
        type,
        response,
    };

    if (typeof window !== 'undefined' && window.automationController) {
        window.automationController.addTrigger(trigger);
        automationState.autoResponses.triggers = window.automationController.getSettings().autoResponses.triggers;
        updateTriggerList();
        saveAutomationSettings();
    }
}

/**
 * Show add schedule dialog
 */
function showAddScheduleDialog() {
    const name = prompt('Schedule name:');
    if (!name) return;

    const message = prompt('Message to send:');
    if (!message) return;

    const time = prompt('Schedule time (YYYY-MM-DD HH:MM):');
    if (!time) return;

    const interval = prompt('Repeat interval (optional, e.g., 5m, 1h, 1d):', '');

    const schedule = {
        name,
        message,
        time,
        interval: interval || null,
    };

    if (typeof window !== 'undefined' && window.automationController) {
        window.automationController.addSchedule(schedule);
        automationState.scheduled.schedules = window.automationController.getSettings().scheduled.schedules;
        updateScheduleList();
        saveAutomationSettings();
    }
}

/**
 * Show add workflow dialog
 */
function showAddWorkflowDialog() {
    const name = prompt('Workflow name:');
    if (!name) return;

    const workflow = {
        name,
        conditions: [],
        actions: [],
    };

    automationState.workflows.workflows.push(workflow);
    updateWorkflowList();
    saveAutomationSettings();
}

/**
 * Test all automations
 */
function testAllAutomations() {
    if (typeof window !== 'undefined' && window.automationController) {
        window.automationController.testAll();
        toastr.success('All automations tested successfully!');
    }
}

/**
 * Export automation configuration
 */
function exportAutomationConfig() {
    if (typeof window !== 'undefined' && window.automationController) {
        const config = window.automationController.exportConfig();
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'automation-config.json';
        a.click();
        URL.revokeObjectURL(url);
        toastr.success('Automation configuration exported!');
    }
}

/**
 * Import automation configuration
 */
function importAutomationConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (typeof window !== 'undefined' && window.automationController) {
                        window.automationController.importConfig(e.target.result);
                        loadAutomationSettings();
                        updateUIFromState();
                        toastr.success('Automation configuration imported!');
                    }
                } catch (error) {
                    toastr.error('Failed to import configuration: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

/**
 * Show analytics dialog
 */
function showAnalyticsDialog() {
    const stats = automationState.analytics;
    const message = `
        Automation Analytics:

        Auto-responses sent: ${stats.responsesSent}
        Scheduled messages: ${stats.scheduledMessages}
        Workflows executed: ${stats.workflowsExecuted}

        Total automations: ${stats.responsesSent + stats.scheduledMessages + stats.workflowsExecuted}
    `;
    alert(message);
}

/**
 * Load automation settings from localStorage
 */
function loadAutomationSettings() {
    try {
        const saved = localStorage.getItem('automation-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            automationState = mergeDeep(automationState, parsed);
        }
    } catch (error) {
        console.error('Failed to load automation settings:', error);
    }
}

/**
 * Save automation settings to localStorage
 */
function saveAutomationSettings() {
    try {
        localStorage.setItem('automation-settings', JSON.stringify(automationState));
    } catch (error) {
        console.error('Failed to save automation settings:', error);
    }
}

/**
 * Deep merge function for settings
 */
function mergeDeep(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = mergeDeep(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

// Global functions for inline event handlers
window.editTrigger = function(triggerId) {
    console.log('Edit trigger:', triggerId);
    // TODO: Implement trigger editing
};

window.deleteTrigger = function(triggerId) {
    if (confirm('Are you sure you want to delete this trigger?')) {
        if (typeof window !== 'undefined' && window.automationController) {
            window.automationController.removeTrigger(triggerId);
            automationState.autoResponses.triggers = window.automationController.getSettings().autoResponses.triggers;
            updateTriggerList();
            saveAutomationSettings();
        }
    }
};

window.editSchedule = function(scheduleId) {
    console.log('Edit schedule:', scheduleId);
    // TODO: Implement schedule editing
};

window.deleteSchedule = function(scheduleId) {
    if (confirm('Are you sure you want to delete this schedule?')) {
        // TODO: Implement schedule deletion
        console.log('Delete schedule:', scheduleId);
    }
};

window.editWorkflow = function(workflowId) {
    console.log('Edit workflow:', workflowId);
    // TODO: Implement workflow editing
};

window.deleteWorkflow = function(workflowId) {
    if (confirm('Are you sure you want to delete this workflow?')) {
        // TODO: Implement workflow deletion
        console.log('Delete workflow:', workflowId);
    }
};

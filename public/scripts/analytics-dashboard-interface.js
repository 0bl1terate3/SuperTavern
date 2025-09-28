/**
 * Analytics Dashboard Interface
 * Handles UI interactions for the Analytics Dashboard
 */

let analyticsDashboardState = {
    enabled: false,
    conversation: {
        totalMessages: 0,
        aiResponses: 0,
        userMessages: 0,
        charactersUsed: 0,
    },
    usage: {
        sessionTime: 0,
        avgResponseTime: 0,
        tokensUsed: 0,
        costEstimate: 0,
    },
    performance: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        errorRate: 0,
    },
    behavior: {
        mostUsedFeatures: 'chat',
        peakHours: '9:00 AM - 5:00 PM',
        avgSessionLength: 30,
        retention: 85,
    },
    visualization: {
        chartType: 'line',
        timeRange: '24h',
        data: [],
    },
};

/**
 * Initialize the analytics dashboard interface
 */
export async function initializeAnalyticsDashboardInterface() {
    console.log('Initializing Analytics Dashboard Interface...');

    try {
        // Load saved settings
        loadAnalyticsDashboardSettings();

        // Set up event listeners
        setupAnalyticsDashboardEventListeners();

        // Update UI from state
        updateUIFromState();

        // Start periodic updates
        startPeriodicUpdates();

        console.log('Analytics Dashboard Interface initialized');
    } catch (error) {
        console.error('Failed to initialize Analytics Dashboard Interface:', error);
    }
}

/**
 * Set up event listeners for analytics dashboard controls
 */
function setupAnalyticsDashboardEventListeners() {
    // Statistics toggle
    const statsEnabled = document.getElementById('stats_enabled');
    if (statsEnabled) {
        statsEnabled.addEventListener('change', (e) => {
            analyticsDashboardState.enabled = e.target.checked;
            updateAnalyticsDashboardControllerSettings();
            saveAnalyticsDashboardSettings();
        });
    }

    // Behavior controls
    const behaviorMostUsed = document.getElementById('behavior_most_used_features');
    if (behaviorMostUsed) {
        behaviorMostUsed.addEventListener('change', (e) => {
            analyticsDashboardState.behavior.mostUsedFeatures = e.target.value;
            updateAnalyticsDashboardControllerSettings();
            saveAnalyticsDashboardSettings();
        });
    }

    // Visualization controls
    const vizChartType = document.getElementById('viz_chart_type');
    if (vizChartType) {
        vizChartType.addEventListener('change', (e) => {
            analyticsDashboardState.visualization.chartType = e.target.value;
            updateAnalyticsDashboardControllerSettings();
            saveAnalyticsDashboardSettings();
        });
    }

    const vizTimeRange = document.getElementById('viz_time_range');
    if (vizTimeRange) {
        vizTimeRange.addEventListener('change', (e) => {
            analyticsDashboardState.visualization.timeRange = e.target.value;
            updateAnalyticsDashboardControllerSettings();
            saveAnalyticsDashboardSettings();
        });
    }

    // Action buttons
    setupAnalyticsActionButtons();

    // Import/Export buttons
    setupAnalyticsImportExportControls();
}

/**
 * Set up analytics action buttons
 */
function setupAnalyticsActionButtons() {
    const analyticsRefresh = document.getElementById('analytics_refresh');
    if (analyticsRefresh) {
        analyticsRefresh.addEventListener('click', () => {
            refreshAnalytics();
        });
    }

    const analyticsExportReport = document.getElementById('analytics_export_report');
    if (analyticsExportReport) {
        analyticsExportReport.addEventListener('click', () => {
            exportAnalyticsReport();
        });
    }

    const analyticsScheduleReport = document.getElementById('analytics_schedule_report');
    if (analyticsScheduleReport) {
        analyticsScheduleReport.addEventListener('click', () => {
            scheduleAnalyticsReport();
        });
    }

    const analyticsSetAlerts = document.getElementById('analytics_set_alerts');
    if (analyticsSetAlerts) {
        analyticsSetAlerts.addEventListener('click', () => {
            setAnalyticsAlerts();
        });
    }

    const vizGenerate = document.getElementById('viz_generate');
    if (vizGenerate) {
        vizGenerate.addEventListener('click', () => {
            generateChart();
        });
    }

    const vizExport = document.getElementById('viz_export');
    if (vizExport) {
        vizExport.addEventListener('click', () => {
            exportChart();
        });
    }
}

/**
 * Set up analytics import/export controls
 */
function setupAnalyticsImportExportControls() {
    const analyticsExport = document.getElementById('analytics_export');
    if (analyticsExport) {
        analyticsExport.addEventListener('click', () => {
            exportAnalyticsData();
        });
    }

    const analyticsReset = document.getElementById('analytics_reset');
    if (analyticsReset) {
        analyticsReset.addEventListener('click', () => {
            resetAnalyticsData();
        });
    }
}

/**
 * Update analytics dashboard controller settings
 */
function updateAnalyticsDashboardControllerSettings() {
    if (typeof window !== 'undefined' && window.analyticsDashboardController) {
        window.analyticsDashboardController.updateSettings(analyticsDashboardState);
    }
}

/**
 * Update UI from current state
 */
function updateUIFromState() {
    // Update statistics toggle
    const statsEnabled = document.getElementById('stats_enabled');
    if (statsEnabled) {
        statsEnabled.checked = analyticsDashboardState.enabled;
    }

    // Update behavior controls
    const behaviorMostUsed = document.getElementById('behavior_most_used_features');
    if (behaviorMostUsed) {
        behaviorMostUsed.value = analyticsDashboardState.behavior.mostUsedFeatures;
    }

    // Update visualization controls
    const vizChartType = document.getElementById('viz_chart_type');
    if (vizChartType) {
        vizChartType.value = analyticsDashboardState.visualization.chartType;
    }

    const vizTimeRange = document.getElementById('viz_time_range');
    if (vizTimeRange) {
        vizTimeRange.value = analyticsDashboardState.visualization.timeRange;
    }

    // Update all statistics displays
    updateStatisticsDisplays();
}

/**
 * Update statistics displays
 */
function updateStatisticsDisplays() {
    // Update conversation stats
    const totalMessages = document.getElementById('stats_total_messages');
    const aiResponses = document.getElementById('stats_ai_responses');
    const userMessages = document.getElementById('stats_user_messages');
    const characters = document.getElementById('stats_characters');

    if (totalMessages) totalMessages.value = analyticsDashboardState.conversation.totalMessages;
    if (aiResponses) aiResponses.value = analyticsDashboardState.conversation.aiResponses;
    if (userMessages) userMessages.value = analyticsDashboardState.conversation.userMessages;
    if (characters) characters.value = analyticsDashboardState.conversation.charactersUsed;

    // Update usage stats
    const sessionTime = document.getElementById('usage_session_time');
    const avgResponse = document.getElementById('usage_avg_response');
    const tokens = document.getElementById('usage_tokens_used');
    const cost = document.getElementById('usage_cost_estimate');

    if (sessionTime) sessionTime.value = `${Math.floor(analyticsDashboardState.usage.sessionTime / 60)}h ${analyticsDashboardState.usage.sessionTime % 60}m`;
    if (avgResponse) avgResponse.value = `${Math.round(analyticsDashboardState.usage.avgResponseTime / 1000)}s`;
    if (tokens) tokens.value = analyticsDashboardState.usage.tokensUsed;
    if (cost) cost.value = `$${analyticsDashboardState.usage.costEstimate.toFixed(2)}`;

    // Update performance stats
    const memory = document.getElementById('perf_memory_usage');
    const cpu = document.getElementById('perf_cpu_usage');
    const latency = document.getElementById('perf_network_latency');
    const errorRate = document.getElementById('perf_error_rate');

    if (memory) memory.value = `${analyticsDashboardState.performance.memoryUsage} MB`;
    if (cpu) cpu.value = `${analyticsDashboardState.performance.cpuUsage}%`;
    if (latency) latency.value = `${analyticsDashboardState.performance.networkLatency}ms`;
    if (errorRate) errorRate.value = `${analyticsDashboardState.performance.errorRate}%`;

    // Update behavior stats
    const peakHours = document.getElementById('behavior_peak_hours');
    const avgSession = document.getElementById('behavior_avg_session');
    const retention = document.getElementById('behavior_retention');

    if (peakHours) peakHours.value = analyticsDashboardState.behavior.peakHours;
    if (avgSession) avgSession.value = `${analyticsDashboardState.behavior.avgSessionLength}m`;
    if (retention) retention.value = `${analyticsDashboardState.behavior.retention}%`;
}

/**
 * Start periodic updates
 */
function startPeriodicUpdates() {
    // Update statistics every 5 seconds
    setInterval(() => {
        if (analyticsDashboardState.enabled) {
            updateStatisticsFromController();
        }
    }, 5000);
}

/**
 * Update statistics from controller
 */
function updateStatisticsFromController() {
    if (typeof window !== 'undefined' && window.analyticsDashboardController) {
        const settings = window.analyticsDashboardController.getSettings();
        analyticsDashboardState = { ...analyticsDashboardState, ...settings };
        updateStatisticsDisplays();
    }
}

/**
 * Refresh analytics
 */
function refreshAnalytics() {
    if (typeof window !== 'undefined' && window.analyticsDashboardController) {
        // Force update from controller
        updateStatisticsFromController();
        toastr.success('Analytics refreshed');
    }
}

/**
 * Export analytics report
 */
function exportAnalyticsReport() {
    if (typeof window !== 'undefined' && window.analyticsDashboardController) {
        const data = window.analyticsDashboardController.exportAnalyticsData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toastr.success('Analytics report exported');
    }
}

/**
 * Schedule analytics report
 */
function scheduleAnalyticsReport() {
    const schedule = prompt('Enter schedule (e.g., "daily", "weekly", "monthly"):');
    if (schedule) {
        console.log(`Scheduling analytics report: ${schedule}`);
        toastr.success(`Analytics report scheduled for ${schedule}`);
    }
}

/**
 * Set analytics alerts
 */
function setAnalyticsAlerts() {
    const alertType = prompt('Enter alert type (e.g., "high_memory", "slow_response"):');
    const threshold = prompt('Enter threshold value:');

    if (alertType && threshold) {
        console.log(`Setting alert: ${alertType} > ${threshold}`);
        toastr.success(`Alert set for ${alertType} > ${threshold}`);
    }
}

/**
 * Generate chart
 */
function generateChart() {
    const chartType = document.getElementById('viz_chart_type')?.value;
    const timeRange = document.getElementById('viz_time_range')?.value;

    if (typeof window !== 'undefined' && window.analyticsDashboardController) {
        const chartData = window.analyticsDashboardController.generateChartData(chartType, timeRange);
        console.log('Chart data:', chartData);
        toastr.success(`Chart generated: ${chartData.totalMessages} messages in ${timeRange}`);
    }
}

/**
 * Export chart
 */
function exportChart() {
    console.log('Exporting chart...');
    toastr.success('Chart exported');
}

/**
 * Export analytics data
 */
function exportAnalyticsData() {
    if (typeof window !== 'undefined' && window.analyticsDashboardController) {
        const data = window.analyticsDashboardController.exportAnalyticsData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analytics-data.json';
        a.click();
        URL.revokeObjectURL(url);
        toastr.success('Analytics data exported');
    }
}

/**
 * Reset analytics data
 */
function resetAnalyticsData() {
    if (confirm('Are you sure you want to reset all analytics data? This cannot be undone.')) {
        if (typeof window !== 'undefined' && window.analyticsDashboardController) {
            window.analyticsDashboardController.resetAnalyticsData();
            loadAnalyticsDashboardSettings();
            updateUIFromState();
            toastr.success('Analytics data reset');
        }
    }
}

/**
 * Load analytics dashboard settings from localStorage
 */
function loadAnalyticsDashboardSettings() {
    try {
        const saved = localStorage.getItem('analytics-dashboard-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            analyticsDashboardState = mergeDeep(analyticsDashboardState, parsed);
        }
    } catch (error) {
        console.error('Failed to load analytics dashboard settings:', error);
    }
}

/**
 * Save analytics dashboard settings to localStorage
 */
function saveAnalyticsDashboardSettings() {
    try {
        localStorage.setItem('analytics-dashboard-settings', JSON.stringify(analyticsDashboardState));
    } catch (error) {
        console.error('Failed to save analytics dashboard settings:', error);
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

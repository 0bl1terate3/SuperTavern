import { debounce, download } from './utils.js';

const DEFAULT_TOPIC_ENTRIES = [
    'Space exploration',
    'Ancient myths',
    'Cooking tips',
    'Cyberpunk slang',
    'Fun animal facts',
];

const MAX_RECENT_TOPICS = 8;

const DEFAULT_SETTINGS = {
    multiUser: {
        enabled: false,
        crossTalk: true,
        privateSideChats: true,
        conflictResolution: true,
        role: 'participant',
        clientId: '',
    },
    sharedMemory: {
        enabled: false,
        projectScoped: true,
        privacyControls: true,
        maxEntries: 100,
        entries: {},
    },
    gamification: {
        enabled: false,
        xp: 0,
        level: 1,
        achievements: [],
        counters: {
            message_sent: 0,
            message_received: 0,
            remote_message: 0,
        },
        lastActivity: 0,
    },
    accessibility: {
        highContrast: false,
        dyslexiaFriendly: false,
        reducedMotion: false,
        focusManagement: true,
    },
    team: {
        analyticsEnabled: false,
        memberStats: {},
    },
    customization: {
        dynamicThemes: false,
    },
    voiceAudio: {
        speech: {
            enabled: false,
            autoPlay: true,
            voice: 'default',
            rate: 1.0,
            pitch: 1.0,
            volume: 0.8,
            language: 'en-US',
            voices: [],
            characterVoices: {},
            lastUsedVoice: null,
        },
        microphone: {
            enabled: false,
            autoStart: false,
            continuous: false,
            language: 'en-US',
            interimResults: true,
            maxAlternatives: 1,
            confidence: 0.7,
            timeout: 5000,
            silenceDetection: true,
            silenceThreshold: 2000,
        },
        ambient: {
            enabled: false,
            volume: 0.3,
            fadeInDuration: 2000,
            fadeOutDuration: 2000,
            crossfade: true,
            soundscapes: [],
            activeSoundscape: null,
            loop: true,
            randomize: false,
            moodSync: false,
        },
        mood: {
            enabled: false,
            sensitivity: 0.5,
            detectionMethod: 'sentiment',
            moodVoices: {
                happy: { rate: 1.1, pitch: 1.05, volume: 0.9 },
                sad: { rate: 0.9, pitch: 0.95, volume: 0.7 },
                excited: { rate: 1.2, pitch: 1.1, volume: 1.0 },
                calm: { rate: 0.8, pitch: 0.9, volume: 0.6 },
                angry: { rate: 1.3, pitch: 1.2, volume: 0.95 },
                neutral: { rate: 1.0, pitch: 1.0, volume: 0.8 },
            },
            currentMood: 'neutral',
            moodHistory: [],
            autoDetect: true,
        },
        character: {
            enabled: false,
            voiceProfiles: {},
            autoAssign: true,
            voiceMatching: 'name',
            defaultVoice: null,
            voiceCache: {},
        },
        accessibility: {
            enabled: false,
            highContrast: false,
            reducedMotion: false,
            screenReader: false,
            voiceDescriptions: false,
            audioCues: true,
            hapticFeedback: false,
        },
        advanced: {
            audioContext: null,
            gainNode: null,
            compressor: null,
            equalizer: null,
            reverb: null,
            echo: null,
            noiseReduction: false,
            audioProcessing: false,
            realTimeAnalysis: false,
            audioVisualization: false,
        },
    },
    jokeGenerator: {
        enabled: false,
        intensity: 'medium',
        defaultStyle: 'roast',
        autoAbsurdify: false,
        characterSpecific: false,
        customPrompts: {},
        favoriteJokes: [],
        jokeHistory: [],
    },
    topics: {
        enabled: false,
        mode: 'random',
        blend: 'directive',
        placement: 'system',
        frequency: 1,
        selectedLists: [],
        lists: [],
        sequence: {
            listIndex: 0,
            entryIndices: {},
        },
        lastTopic: null,
    },
};

const CROSS_TALK_REGEX = /^\/([^\s]+)\s+([\s\S]+)$/;
const BROADCAST_CHANNEL = 'supertavern-multiuser';
const MAX_SHARED_SUMMARY_LENGTH = 280;

let state = deepClone(DEFAULT_SETTINGS);
let dependencies = {
    eventSource: null,
    event_types: null,
    getChat: null,
    insertRemoteMessage: null,
    reloadCurrentChat: null,
    getCurrentChatId: null,
    getActiveGroup: null,
    getActiveCharacter: null,
    getLocalUserIdentity: null,
    saveSettingsDebounced: null,
};

let broadcastChannel = null;
let listenersRegistered = false;
let lastStatus = 'Offline';
const processedMessages = new Set();
const remoteMessageVersions = new Map();

const schedulePersist = debounce(() => dependencies.saveSettingsDebounced?.(), 800);

const topicsElements = {
    container: null,
    lists: null,
    recent: null,
    importInput: null,
};

const topicRuntime = {
    counter: 0,
    pending: null,
    pendingCounter: null,
    recent: [],
    lastDirective: null,
};

export function configureSuperTavern(newDependencies) {
    dependencies = { ...dependencies, ...newDependencies };
    registerCoreListeners();
}

export function initializeSuperTavernUI() {
    const panel = getPanel();
    if (!panel || panel.dataset.supertavernInitialized === 'true') {
        return;
    }

    panel.dataset.supertavernInitialized = 'true';

    panel.querySelectorAll('[data-supertavern-setting]').forEach((element) => {
        const path = element.getAttribute('data-supertavern-setting');
        if (!path) {
            return;
        }

        if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            element.addEventListener('change', () => {
                const changed = setStateValue(path, element.checked);
                if (!changed) {
                    return;
                }

                applyState();
                render();
                schedulePersist();
            });
        } else if (element instanceof HTMLInputElement && element.type === 'number') {
            element.addEventListener('change', () => {
                const numericValue = Number(element.value);
                const normalized = Number.isFinite(numericValue) ? numericValue : 1;
                const changed = setStateValue(path, normalized);
                if (!changed) {
                    element.value = String(getStateValue(path) ?? normalized);
                    return;
                }

                applyState();
                render();
                schedulePersist();
            });
        } else if (element instanceof HTMLSelectElement) {
            element.addEventListener('change', () => {
                const changed = setStateValue(path, element.value);
                if (!changed) {
                    return;
                }

                applyState();
                render();
                schedulePersist();
            });
        }
    });

    panel.querySelector('#supertavern-shared-memory-export')?.addEventListener('click', exportSharedMemorySnapshot);
    panel.querySelector('#supertavern-shared-memory-clear')?.addEventListener('click', clearSharedMemory);

    // Joke Generator Test Button
    panel.querySelector('#joke-generator-test')?.addEventListener('click', async () => {
        try {
            const { testJokeGenerator } = await import('./creative-joke-generator.js');
            const result = await testJokeGenerator();
            toastr.success(`Joke Generator Test: ${result}`);
        } catch (error) {
            console.error('Joke generator test failed:', error);
            toastr.error('Joke generator test failed!');
        }
    });

    // Joke Generator Settings Visibility Toggle
    const jokeEnabledCheckbox = panel.querySelector('input[data-supertavern-setting="jokeGenerator.enabled"]');
    const jokeSettingsDiv = panel.querySelector('[data-supertavern-requires="jokeGenerator.enabled"]');

    if (jokeEnabledCheckbox && jokeSettingsDiv) {
        // Function to toggle visibility
        const toggleJokeSettings = () => {
            if (jokeEnabledCheckbox.checked) {
                jokeSettingsDiv.style.display = 'block';
            } else {
                jokeSettingsDiv.style.display = 'none';
            }
        };

        // Initial state
        toggleJokeSettings();

        // Listen for changes
        jokeEnabledCheckbox.addEventListener('change', toggleJokeSettings);
    }

    topicsElements.container = panel.querySelector('#supertavern-topics');
    topicsElements.lists = panel.querySelector('#supertavern-topics-lists');
    topicsElements.recent = panel.querySelector('#supertavern-topics-recent-list');
    topicsElements.importInput = panel.querySelector('#supertavern-topics-import-input');

    panel.querySelector('#supertavern-topics-add')?.addEventListener('click', () => {
        addTopicList();
    });

    panel.querySelector('#supertavern-topics-export')?.addEventListener('click', exportTopicLists);
    panel.querySelector('#supertavern-topics-import')?.addEventListener('click', () => topicsElements.importInput?.click());
    topicsElements.importInput?.addEventListener('change', handleTopicImport);


    render();
}

export async function loadSuperTavernState(savedState = {}) {
    state = mergeDeep(deepClone(DEFAULT_SETTINGS), savedState ?? {});
    normalizeTopicState();
    ensureClientId();
    applyState();

    // Initialize voice controller with loaded settings
    if (typeof window !== 'undefined' && window.voiceAudioController) {
        try {
            await window.voiceAudioController.updateSettings(state.voiceAudio);
        } catch (error) {
            console.error('Failed to update voice controller settings:', error);
        }
    }

    render();
}

export function getSuperTavernState() {
    return state;
}

function registerCoreListeners() {
    if (listenersRegistered) {
        return;
    }

    if (!dependencies.eventSource || !dependencies.event_types) {
        return;
    }

    dependencies.eventSource.on(dependencies.event_types.MESSAGE_SENT, handleMessageSent);
    dependencies.eventSource.on(dependencies.event_types.MESSAGE_RECEIVED, handleMessageReceived);
    listenersRegistered = true;
}

function handleMessageSent(messageId) {
    const message = getMessageById(messageId);
    if (!message) {
        return;
    }

    if (state.multiUser.enabled) {
        ensureClientId();
        const channel = ensureMultiUserChannel();
        if (channel) {
            broadcastLocalMessage(message);
        }
    }

    let changed = false;

    if (state.sharedMemory.enabled) {
        changed = updateSharedMemory(message, { direction: 'sent' }) || changed;
    }

    if (state.gamification.enabled && !message.extra?.supertavernRemote) {
        addExperience('message_sent');
        changed = true;
    }

    if (state.team.analyticsEnabled) {
        changed = updateTeamAnalytics(message) || changed;
    }

    if (state.customization.dynamicThemes) {
        updateDynamicTheme();
    }

    if (changed) {
        render();
        schedulePersist();
    }
}

function handleMessageReceived(messageId, type) {
    const message = getMessageById(messageId);
    if (!message) {
        return;
    }

    let changed = false;

    if (state.sharedMemory.enabled) {
        changed = updateSharedMemory(message, { direction: 'received', type }) || changed;
    }

    if (state.gamification.enabled) {
        if (message.extra?.supertavernRemote) {
            addExperience('remote_message');
        } else if (!message.is_user) {
            addExperience('message_received');
        }
        changed = true;
    }

    if (state.team.analyticsEnabled) {
        changed = updateTeamAnalytics(message) || changed;
    }

    if (state.customization.dynamicThemes) {
        updateDynamicTheme();
    }

    if (changed) {
        render();
        schedulePersist();
    }
}

function getMessageById(messageId) {
    const chat = dependencies.getChat?.();
    if (!Array.isArray(chat)) {
        return null;
    }

    return chat[messageId] ?? null;
}

function ensureMultiUserChannel() {
    if (!state.multiUser.enabled) {
        return null;
    }

    if (broadcastChannel) {
        return broadcastChannel;
    }

    if (typeof window.BroadcastChannel !== 'function') {
        setMultiUserStatus('Unsupported');
        return null;
    }

    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL);
    broadcastChannel.onmessage = (event) => {
        onBroadcastMessage(event.data);
    };
    setMultiUserStatus('Connected');
    return broadcastChannel;
}

function teardownMultiUserChannel() {
    if (!broadcastChannel) {
        return;
    }

    broadcastChannel.close();
    broadcastChannel = null;
    setMultiUserStatus('Offline');
}

function broadcastLocalMessage(message) {
    if (!message.is_user || message.extra?.supertavernRemote) {
        return;
    }

    const channel = ensureMultiUserChannel();
    if (!channel) {
        return;
    }

    const identity = dependencies.getLocalUserIdentity?.() || {};
    const prepared = prepareBroadcastPayload(message, identity);
    if (!prepared) {
        return;
    }

    processedMessages.add(prepared.id);
    channel.postMessage(prepared);
}

function prepareBroadcastPayload(message, identity) {
    const clone = {
        ...message,
        extra: { ...message.extra },
    };

    const broadcastId = clone.extra?.supertavernMessageId || createClientId();
    clone.extra.supertavernMessageId = broadcastId;

    const match = state.multiUser.crossTalk ? message.mes?.match(CROSS_TALK_REGEX) : null;
    let target = null;
    let sanitizedText = message.mes;
    if (match) {
        target = match[1];
        sanitizedText = match[2];
        clone.extra.supertavernPrivateRecipients = target;
    }

    const payload = {
        id: broadcastId,
        clientId: state.multiUser.clientId,
        timestamp: Date.now(),
        room: getRoomKey(),
        message: {
            name: clone.name,
            mes: sanitizedText,
            send_date: clone.send_date,
            extra: {
                supertavernRemote: true,
                supertavernOriginRole: state.multiUser.role,
                supertavernOriginHandle: identity.handle || identity.name || '',
            },
        },
        rawText: message.mes,
        role: state.multiUser.role,
        handle: identity.handle || identity.name || '',
        avatar: identity.avatar || '',
        target,
        version: 1,
    };

    return payload;
}

async function onBroadcastMessage(payload) {
    if (!payload || typeof payload !== 'object') {
        return;
    }

    if (!state.multiUser.enabled) {
        return;
    }

    if (payload.clientId === state.multiUser.clientId) {
        return;
    }

    if (payload.room && payload.room !== getRoomKey()) {
        return;
    }

    if (processedMessages.has(payload.id)) {
        if (state.multiUser.conflictResolution) {
            updateExistingRemoteMessage(payload);
        }
        return;
    }

    const message = transformPayloadToMessage(payload);
    if (!message) {
        return;
    }

    processedMessages.add(payload.id);
    remoteMessageVersions.set(payload.id, payload.timestamp ?? Date.now());

    await dependencies.insertRemoteMessage?.(message, { broadcastId: payload.id, eventTag: 'supertavern_remote' });
    render();
    schedulePersist();
}

function transformPayloadToMessage(payload) {
    const identity = dependencies.getLocalUserIdentity?.() || {};
    const localName = (identity.name || '').toLowerCase();
    const isModerator = state.multiUser.role === 'moderator';
    const target = (payload.target || '').toLowerCase();
    const isPrivate = Boolean(target);
    const isRecipient = target && localName === target.toLowerCase();

    if (isPrivate && state.multiUser.privateSideChats && !isRecipient && !isModerator) {
        return null;
    }

    const messageText = isPrivate && payload.message?.mes ? payload.message.mes : payload.rawText ?? payload.message?.mes ?? '';

    const message = {
        name: payload.message?.name || payload.handle || 'Participant',
        is_user: true,
        is_system: false,
        send_date: payload.message?.send_date || new Date().toISOString(),
        mes: messageText,
        extra: {
            ...(payload.message?.extra || {}),
            supertavernRemote: true,
            supertavernMessageId: payload.id,
            supertavernOriginRole: payload.role || 'participant',
            supertavernOriginHandle: payload.handle || payload.message?.name || '',
        },
    };

    if (payload.avatar) {
        message.force_avatar = payload.avatar;
    }

    if (isPrivate) {
        message.extra.supertavernPrivateRecipients = payload.target;
        if (!isRecipient && isModerator) {
            message.mes = `(Whisper to ${payload.target}) ${payload.message?.mes ?? ''}`;
        }
    }

    return message;
}

function updateExistingRemoteMessage(payload) {
    const chat = dependencies.getChat?.();
    if (!Array.isArray(chat)) {
        return;
    }

    const index = chat.findIndex((mes) => mes?.extra?.supertavernMessageId === payload.id);
    if (index === -1) {
        return;
    }

    const currentTimestamp = remoteMessageVersions.get(payload.id) ?? 0;
    if ((payload.timestamp ?? 0) < currentTimestamp) {
        return;
    }

    remoteMessageVersions.set(payload.id, payload.timestamp ?? Date.now());
    chat[index].mes = payload.rawText ?? payload.message?.mes ?? chat[index].mes;
    chat[index].extra = {
        ...chat[index].extra,
        supertavernRemote: true,
        supertavernMessageId: payload.id,
        supertavernRevision: (chat[index].extra?.supertavernRevision ?? 0) + 1,
    };
    dependencies.reloadCurrentChat?.();
}

function updateSharedMemory(message, { direction, type }) {
    if (!state.sharedMemory.enabled) {
        return false;
    }

    if (state.sharedMemory.privacyControls && message.extra?.supertavernPrivateRecipients) {
        return false;
    }

    const projectKey = getMemoryKey();
    const entries = getMemoryEntries(projectKey);
    const highlight = extractHighlight(message);

    if (!highlight) {
        return false;
    }

    const entry = {
        id: message.extra?.supertavernMessageId || createClientId(),
        author: message.name,
        role: message.extra?.supertavernOriginRole || (message.is_user ? 'participant' : 'assistant'),
        text: highlight,
        timestamp: Date.now(),
        direction,
        type,
    };

    entries.push(entry);

    while (entries.length > (state.sharedMemory.maxEntries || 100)) {
        entries.shift();
    }

    if (state.gamification.enabled) {
        addExperience('shared_memory');
    }

    return true;
}

function extractHighlight(message) {
    const raw = String(message.mes || '').trim();
    if (!raw) {
        return '';
    }

    let text = raw.replace(/\s+/g, ' ');
    if (text.length > MAX_SHARED_SUMMARY_LENGTH) {
        text = `${text.slice(0, MAX_SHARED_SUMMARY_LENGTH - 1)}…`;
    }

    return text;
}

function getMemoryEntries(projectKey) {
    if (!state.sharedMemory.entries[projectKey]) {
        state.sharedMemory.entries[projectKey] = [];
    }

    return state.sharedMemory.entries[projectKey];
}

function updateTeamAnalytics(message) {
    const stats = state.team.memberStats;
    const key = (message.extra?.supertavernOriginHandle || message.name || 'participant').toLowerCase();
    const displayName = message.extra?.supertavernOriginHandle || message.name || 'Participant';
    const role = message.extra?.supertavernOriginRole || (message.is_user ? 'participant' : 'assistant');

    if (!stats[key]) {
        stats[key] = {
            name: displayName,
            role,
            messages: 0,
        };
    }

    stats[key].messages += 1;
    stats[key].role = role;
    return true;
}

function addExperience(kind) {
    const xpMap = {
        message_sent: 5,
        message_received: 2,
        remote_message: 6,
        shared_memory: 3,
        feature_toggle: 8,
    };

    const xpGain = xpMap[kind] ?? 1;
    state.gamification.xp += xpGain;
    state.gamification.counters[kind] = (state.gamification.counters[kind] ?? 0) + 1;
    state.gamification.lastActivity = Date.now();

    const newLevel = Math.max(1, Math.floor(state.gamification.xp / 100) + 1);
    if (newLevel !== state.gamification.level) {
        state.gamification.level = newLevel;
        grantAchievement('level-' + newLevel, `Reached level ${newLevel}`);
    }

    if (kind === 'remote_message') {
        grantAchievement('collaboration', 'Welcomed a collaborator');
    }

    if (state.gamification.counters.message_sent === 1) {
        grantAchievement('first-message', 'Sent your first message');
    }

    if (state.gamification.counters.message_sent === 100) {
        grantAchievement('hundred-messages', 'Sent 100 messages');
    }

    updateDynamicTheme();
}

function grantAchievement(id, label) {
    if (state.gamification.achievements.includes(id)) {
        return;
    }

    state.gamification.achievements.push(id);
    window.toastr?.success(label, 'Achievement unlocked');
}

function render() {
    syncUIFromState();
    updateConditionalBlocks();
    renderMultiUserStatus();
    renderSharedMemory();
    renderTeamAnalytics();
    renderGamification();
    renderTopics();
    applyAccessibilityClasses();
    updateDynamicTheme();
}

function syncUIFromState() {
    const panel = getPanel();
    if (!panel) {
        return;
    }

    panel.querySelectorAll('[data-supertavern-setting]').forEach((element) => {
        const path = element.getAttribute('data-supertavern-setting');
        if (!path) {
            return;
        }

        const value = getStateValue(path);

        if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            if (element.checked !== Boolean(value)) {
                element.checked = Boolean(value);
            }
        } else if (element instanceof HTMLInputElement && element.type === 'number') {
            const numericValue = Number(value ?? 0);
            if (Number(element.value) !== numericValue) {
                element.value = String(Number.isFinite(numericValue) ? numericValue : 0);
            }
        } else if (element instanceof HTMLSelectElement) {
            if (element.value !== String(value)) {
                element.value = String(value);
            }
        }
    });
}

function updateConditionalBlocks() {
    const panel = getPanel();
    if (!panel) {
        return;
    }

    panel.querySelectorAll('[data-supertavern-requires]').forEach((element) => {
        const requirement = element.getAttribute('data-supertavern-requires');
        const isActive = Boolean(getStateValue(requirement));
        element.toggleAttribute('hidden', !isActive);
    });
}

function renderMultiUserStatus() {
    const statusElement = document.getElementById('supertavern-multiuser-status');
    if (!statusElement) {
        return;
    }

    statusElement.textContent = lastStatus;
}

function renderSharedMemory() {
    const list = document.getElementById('supertavern-shared-memory-list');
    if (!list) {
        return;
    }

    list.textContent = '';

    const projectKey = getMemoryKey();
    const entries = getMemoryEntries(projectKey);

    if (!entries.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Shared memory will collect highlights from the active project.';
        list.append(empty);
        return;
    }

    for (const entry of entries) {
        const item = document.createElement('li');
        const time = document.createElement('time');
        time.dateTime = new Date(entry.timestamp).toISOString();
        time.textContent = new Date(entry.timestamp).toLocaleString();

        const text = document.createElement('span');
        text.textContent = `${entry.author}: ${entry.text}`;

        item.append(time, text);
        list.append(item);
    }
}

function renderTeamAnalytics() {
    const list = document.getElementById('supertavern-team-analytics');
    if (!list) {
        return;
    }

    list.textContent = '';

    if (!state.team.analyticsEnabled) {
        return;
    }

    const values = Object.values(state.team.memberStats || {});
    if (!values.length) {
        const empty = document.createElement('li');
        empty.textContent = 'No activity recorded yet.';
        list.append(empty);
        return;
    }

    values.sort((a, b) => b.messages - a.messages);

    for (const member of values) {
        const item = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = `${member.name} (${member.role})`;
        const count = document.createElement('span');
        count.textContent = `${member.messages.toLocaleString()} messages`;
        item.append(name, count);
        list.append(item);
    }
}

function renderGamification() {
    const levelElement = document.getElementById('supertavern-xp-level');
    const progressElement = document.getElementById('supertavern-xp-progress');
    const xpValueElement = document.getElementById('supertavern-xp-value');
    const achievementsElement = document.getElementById('supertavern-achievements');

    if (!levelElement || !progressElement || !xpValueElement || !achievementsElement) {
        return;
    }

    if (!state.gamification.enabled) {
        achievementsElement.textContent = '';
        return;
    }

    const xp = state.gamification.xp;
    const currentLevel = Math.max(1, Math.floor(xp / 100) + 1);
    const xpIntoLevel = xp % 100;

    levelElement.textContent = `Level ${currentLevel}`;
    progressElement.value = xpIntoLevel;
    progressElement.max = 100;
    xpValueElement.textContent = `${xp.toLocaleString()} XP`;

    achievementsElement.textContent = '';
    if (!state.gamification.achievements.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Complete activities to unlock achievements.';
        achievementsElement.append(empty);
        return;
    }

    for (const achievement of state.gamification.achievements) {
        const item = document.createElement('li');
        item.textContent = `✔ ${formatAchievementLabel(achievement)}`;
        achievementsElement.append(item);
    }
}

function formatAchievementLabel(id) {
    if (id.startsWith('level-')) {
        return `Reached ${id.replace('level-', 'level ')}`;
    }

    const labels = {
        'first-message': 'Sent the first message',
        'hundred-messages': 'Sent 100 messages',
        collaboration: 'Welcomed a collaborator',
    };

    return labels[id] || id;
}

function renderTopics() {
    const container = topicsElements.container;
    if (!container || !topicsElements.lists) {
        return;
    }

    container.dataset.mode = state.topics?.mode ?? 'random';

    const listsContainer = topicsElements.lists;
    listsContainer.textContent = '';

    const lists = Array.isArray(state.topics?.lists) ? state.topics.lists : [];
    if (!lists.length) {
        const empty = document.createElement('div');
        empty.className = 'supertavern-topics-empty';
        empty.textContent = 'Add a topic list or import a .txt file to start injecting new themes.';
        listsContainer.append(empty);
    } else {
        for (const list of lists) {
            listsContainer.append(renderTopicCard(list));
        }
    }

    renderTopicsRecent();
}

function renderTopicCard(list) {
    const card = document.createElement('article');
    card.className = 'supertavern-topic-card';
    card.dataset.id = list.id;
    card.dataset.active = String(state.topics.selectedLists?.includes(list.id));

    const header = document.createElement('header');
    const selectLabel = document.createElement('label');
    const selectCheckbox = document.createElement('input');
    selectCheckbox.type = 'checkbox';
    selectCheckbox.checked = state.topics.selectedLists?.includes(list.id);
    selectCheckbox.addEventListener('change', () => {
        toggleTopicList(list.id, selectCheckbox.checked);
    });

    const titleSpan = document.createElement('span');
    titleSpan.textContent = list.name || 'Topic list';
    selectLabel.append(selectCheckbox, titleSpan);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'menu_button';
    removeButton.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';
    removeButton.addEventListener('click', () => removeTopicList(list.id));

    header.append(selectLabel, removeButton);

    const nameField = document.createElement('label');
    nameField.className = 'supertavern-topics-field';
    const nameLabel = document.createElement('span');
    nameLabel.textContent = 'List name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'text_pole';
    nameInput.value = list.name || '';
    nameInput.addEventListener('change', () => {
        const newName = updateTopicListName(list.id, nameInput.value);
        titleSpan.textContent = newName;
    });
    nameField.append(nameLabel, nameInput);

    const metaRow = document.createElement('div');
    metaRow.className = 'supertavern-topic-meta';

    const weightWrapper = document.createElement('label');
    weightWrapper.className = 'supertavern-topic-weight';
    const weightLabel = document.createElement('span');
    weightLabel.textContent = 'Weight';
    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.min = '1';
    weightInput.max = '99';
    weightInput.className = 'text_pole';
    weightInput.value = list.weight ?? 1;
    weightInput.addEventListener('change', () => {
        updateTopicListWeight(list.id, Number(weightInput.value));
    });
    weightWrapper.append(weightLabel, weightInput);

    const countElement = document.createElement('span');
    countElement.className = 'supertavern-topic-count';
    updateTopicCountLabel(countElement, list);

    metaRow.append(weightWrapper, countElement);

    const entriesField = document.createElement('label');
    entriesField.className = 'supertavern-topics-field';
    const entriesLabel = document.createElement('span');
    entriesLabel.textContent = 'Topics (one per line)';
    const entriesTextarea = document.createElement('textarea');
    entriesTextarea.value = Array.isArray(list.entries) ? list.entries.join('\n') : '';
    entriesTextarea.addEventListener('change', () => {
        updateTopicListEntries(list.id, entriesTextarea.value);
        const updated = getTopicListById(list.id);
        updateTopicCountLabel(countElement, updated ?? list);
    });
    entriesField.append(entriesLabel, entriesTextarea);

    card.append(header, nameField, metaRow, entriesField);
    return card;
}

function updateTopicCountLabel(target, list) {
    if (!target || !list) {
        return;
    }

    const count = Array.isArray(list.entries) ? list.entries.length : 0;
    target.textContent = `${count} topic${count === 1 ? '' : 's'}`;
}

function renderTopicsRecent() {
    const listElement = topicsElements.recent;
    if (!listElement) {
        return;
    }

    listElement.textContent = '';

    if (!topicRuntime.recent.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Topic cues will appear here after the next generation.';
        listElement.append(empty);
        return;
    }

    for (const item of topicRuntime.recent) {
        const entry = document.createElement('li');
        const label = item.listName ? `${item.topic} — ${item.listName}` : item.topic;
        entry.textContent = label;

        if (item.usedAt) {
            const time = document.createElement('time');
            const timestamp = new Date(item.usedAt);
            time.dateTime = timestamp.toISOString();
            time.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            entry.append(time);
        }

        listElement.append(entry);
    }
}

function addTopicList(name = '', entries = [], options = {}) {
    const list = createTopicList(name || `List ${state.topics.lists.length + 1}`, entries, options.id);
    if (typeof options.weight === 'number') {
        list.weight = Math.max(1, Math.min(99, Math.round(options.weight)));
    }
    state.topics.lists.push(list);
    if (!state.topics.selectedLists.includes(list.id)) {
        state.topics.selectedLists.push(list.id);
    }

    normalizeTopicState();
    renderTopics();
    schedulePersist();
    return list;
}

function removeTopicList(id) {
    const index = state.topics.lists.findIndex((item) => item.id === id);
    if (index === -1) {
        return;
    }

    state.topics.lists.splice(index, 1);
    state.topics.selectedLists = state.topics.selectedLists.filter((listId) => listId !== id);

    normalizeTopicState();
    renderTopics();
    schedulePersist();
}

function toggleTopicList(id, enabled) {
    const selected = new Set(state.topics.selectedLists || []);
    if (enabled) {
        selected.add(id);
    } else {
        selected.delete(id);
    }

    state.topics.selectedLists = Array.from(selected);
    normalizeTopicState();
    renderTopics();
    schedulePersist();
}

function updateTopicListName(id, name) {
    const list = getTopicListById(id);
    if (!list) {
        return 'Topic list';
    }

    const trimmed = name?.trim() || 'Topic list';
    if (list.name !== trimmed) {
        list.name = trimmed;
        schedulePersist();
    }

    return trimmed;
}

function updateTopicListWeight(id, weight) {
    const list = getTopicListById(id);
    if (!list) {
        return;
    }

    const normalized = Math.max(1, Math.min(99, Math.round(Number(weight) || 1)));
    if (list.weight !== normalized) {
        list.weight = normalized;
        schedulePersist();
    }
}

function updateTopicListEntries(id, text) {
    const list = getTopicListById(id);
    if (!list) {
        return;
    }

    const entries = parseTopicsFromText(text);
    list.entries = entries;
    normalizeTopicState();
    schedulePersist();
}

function exportTopicLists() {
    normalizeTopicState();
    const payload = {
        exportedAt: new Date().toISOString(),
        topics: {
            enabled: state.topics.enabled,
            mode: state.topics.mode,
            blend: state.topics.blend,
            placement: state.topics.placement,
            frequency: state.topics.frequency,
            selectedLists: state.topics.selectedLists,
            lists: state.topics.lists.map(({ id, name, weight, entries }) => ({ id, name, weight, entries })),
        },
    };

    download(JSON.stringify(payload, null, 2), 'supertavern-topics.json', 'application/json');
    window.toastr?.success('Topic lists exported.', 'AI Topics');
}

async function handleTopicImport(event) {
    const input = event.target;
    const file = input?.files?.[0];

    if (!file) {
        return;
    }

    try {
        const fileName = file.name.replace(/\.[^.]+$/, '');
        const text = await file.text();

        if (file.name.endsWith('.json')) {
            const data = JSON.parse(text);
            if (Array.isArray(data?.topics?.lists)) {
                const createdIds = [];
                for (const list of data.topics.lists) {
                    const created = addTopicList(
                        list.name,
                        Array.isArray(list.entries) ? list.entries : [],
                        { id: list.id, weight: list.weight },
                    );
                    createdIds.push(created.id);
                }

                if (Array.isArray(data.topics.selectedLists)) {
                    state.topics.selectedLists = data.topics.selectedLists.filter((id) => createdIds.includes(id));
                }

                state.topics.mode = data.topics.mode ?? state.topics.mode;
                state.topics.blend = data.topics.blend ?? state.topics.blend;
                state.topics.placement = data.topics.placement ?? state.topics.placement;
                state.topics.frequency = data.topics.frequency ?? state.topics.frequency;
            } else if (Array.isArray(data)) {
                addTopicList(fileName, data);
            }
        } else {
            const entries = parseTopicsFromText(text);
            if (!entries.length) {
                throw new Error('No topics found in file');
            }
            addTopicList(fileName || 'Imported topics', entries);
        }

        normalizeTopicState();
        renderTopics();
        schedulePersist();
        window.toastr?.success('Topics imported.', 'AI Topics');
    } catch (error) {
        console.error('Failed to import topics', error);
        window.toastr?.error('Could not import topics.', 'AI Topics');
    } finally {
        if (topicsElements.importInput) {
            topicsElements.importInput.value = '';
        }
    }
}

function parseTopicsFromText(text) {
    return String(text || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line, index, array) => line && array.indexOf(line) === index);
}

function createTopicListId() {
    try {
        return crypto?.randomUUID?.() ?? `topic-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    } catch {
        return `topic-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }
}

function createTopicList(name, entries, id = undefined) {
    return {
        id: id || createTopicListId(),
        name: name?.trim() || 'Topic list',
        weight: 1,
        entries: Array.isArray(entries)
            ? entries.map((entry) => String(entry).trim()).filter(Boolean)
            : [],
    };
}

function getTopicListById(id) {
    return state.topics.lists.find((item) => item.id === id);
}

function normalizeTopicState() {
    if (!state.topics || typeof state.topics !== 'object') {
        state.topics = deepClone(DEFAULT_SETTINGS.topics);
    }

    if (!Array.isArray(state.topics.lists)) {
        state.topics.lists = [];
    }

    for (const list of state.topics.lists) {
        list.id = list.id || createTopicListId();
        list.name = list.name?.trim() || 'Topic list';
        list.weight = Math.max(1, Math.min(99, Math.round(Number(list.weight) || 1)));
        list.entries = Array.isArray(list.entries)
            ? list.entries.map((entry) => String(entry).trim()).filter(Boolean)
            : [];
    }

    if (!state.topics.lists.length) {
        state.topics.lists.push(createTopicList('Starter topics', DEFAULT_TOPIC_ENTRIES));
    }

    if (!Array.isArray(state.topics.selectedLists)) {
        state.topics.selectedLists = [];
    }

    const availableIds = state.topics.lists.map((list) => list.id);
    state.topics.selectedLists = state.topics.selectedLists.filter((id) => availableIds.includes(id));
    if (!state.topics.selectedLists.length && availableIds.length) {
        state.topics.selectedLists = [availableIds[0]];
    }

    if (!state.topics.sequence || typeof state.topics.sequence !== 'object') {
        state.topics.sequence = { listIndex: 0, entryIndices: {} };
    }

    if (!state.topics.sequence.entryIndices || typeof state.topics.sequence.entryIndices !== 'object') {
        state.topics.sequence.entryIndices = {};
    }

    for (const listId of Object.keys(state.topics.sequence.entryIndices)) {
        if (!availableIds.includes(listId)) {
            delete state.topics.sequence.entryIndices[listId];
        }
    }

    for (const list of state.topics.lists) {
        if (!Number.isInteger(state.topics.sequence.entryIndices[list.id])) {
            state.topics.sequence.entryIndices[list.id] = 0;
        }

        if (list.entries.length) {
            state.topics.sequence.entryIndices[list.id] = Math.max(
                0,
                Math.min(list.entries.length - 1, state.topics.sequence.entryIndices[list.id]),
            );
        } else {
            state.topics.sequence.entryIndices[list.id] = 0;
        }
    }

    const mode = state.topics.mode;
    if (!['random', 'sequential', 'weighted'].includes(mode)) {
        state.topics.mode = 'random';
    }

    if (!['directive', 'hint'].includes(state.topics.blend)) {
        state.topics.blend = 'directive';
    }

    if (!['system', 'user'].includes(state.topics.placement)) {
        state.topics.placement = 'system';
    }

    state.topics.frequency = Math.max(1, Math.min(99, Math.round(Number(state.topics.frequency) || 1)));

    const selectedCount = state.topics.selectedLists.length;
    if (!selectedCount) {
        state.topics.sequence.listIndex = 0;
    } else {
        state.topics.sequence.listIndex = Math.max(
            0,
            Math.min(state.topics.sequence.listIndex ?? 0, selectedCount - 1),
        );
    }
}

function resetTopicRuntime() {
    topicRuntime.counter = 0;
    topicRuntime.pending = null;
    topicRuntime.pendingCounter = null;
    topicRuntime.recent = [];
    topicRuntime.lastDirective = null;
    renderTopicsRecent();
}

function getActiveTopicLists() {
    const ids = state.topics.selectedLists?.length ? state.topics.selectedLists : state.topics.lists.map((list) => list.id);
    const listMap = new Map(state.topics.lists.map((list) => [list.id, list]));
    return ids
        .map((id) => listMap.get(id))
        .filter((list) => list && list.entries.length);
}

function evaluateTopicSelection() {
    const frequency = Math.max(1, Math.round(Number(state.topics.frequency) || 1));
    const activeLists = getActiveTopicLists();
    const counter = topicRuntime.pendingCounter ?? topicRuntime.counter;
    const nextCounter = counter + 1;

    if (!activeLists.length) {
        return { selection: null, counterAfter: Math.min(nextCounter, Math.max(frequency - 1, 0)) };
    }

    if (nextCounter < frequency) {
        return { selection: null, counterAfter: nextCounter };
    }

    const selection = selectTopicFromLists(activeLists, state.topics.mode);
    if (!selection) {
        return { selection: null, counterAfter: Math.min(nextCounter, Math.max(frequency - 1, 0)) };
    }

    return { selection, counterAfter: 0 };
}

function selectTopicFromLists(lists, mode) {
    if (!lists.length) {
        return null;
    }

    if (mode === 'sequential') {
        const order = lists.map((list) => list.id);
        if (!order.length) {
            return null;
        }

        let listIndex = state.topics.sequence.listIndex ?? 0;
        if (listIndex >= order.length) {
            listIndex = 0;
        }

        const listId = order[listIndex];
        const list = getTopicListById(listId);
        if (!list || !list.entries.length) {
            return null;
        }

        const entryIndex = state.topics.sequence.entryIndices?.[listId] ?? 0;
        const normalizedIndex = Math.max(0, Math.min(list.entries.length - 1, entryIndex));
        const topic = list.entries[normalizedIndex];

        return {
            listId,
            listName: list.name,
            topic,
            mode,
            nextEntryIndex: (normalizedIndex + 1) % list.entries.length,
            nextListIndex: (listIndex + 1) % order.length,
        };
    }

    if (mode === 'weighted') {
        const totalWeight = lists.reduce((sum, list) => sum + Math.max(1, Number(list.weight) || 1), 0);
        if (totalWeight <= 0) {
            return null;
        }

        let roll = Math.random() * totalWeight;
        let selected = lists[0];
        for (const list of lists) {
            const weight = Math.max(1, Number(list.weight) || 1);
            if (roll < weight) {
                selected = list;
                break;
            }
            roll -= weight;
        }

        const entryIndex = Math.floor(Math.random() * selected.entries.length);
        return {
            listId: selected.id,
            listName: selected.name,
            topic: selected.entries[entryIndex],
            mode,
        };
    }

    // random
    const selected = lists[Math.floor(Math.random() * lists.length)];
    const entryIndex = Math.floor(Math.random() * selected.entries.length);
    return {
        listId: selected.id,
        listName: selected.name,
        topic: selected.entries[entryIndex],
        mode,
    };
}

function applyTopicSelection(selection) {
    if (!selection) {
        return;
    }

    if (selection.mode === 'sequential') {
        if (typeof selection.nextEntryIndex === 'number') {
            state.topics.sequence.entryIndices[selection.listId] = selection.nextEntryIndex;
        }
        if (typeof selection.nextListIndex === 'number') {
            state.topics.sequence.listIndex = selection.nextListIndex;
        }
    }

    topicRuntime.recent.unshift({
        topic: selection.topic,
        listName: selection.listName,
        usedAt: Date.now(),
    });

    if (topicRuntime.recent.length > MAX_RECENT_TOPICS) {
        topicRuntime.recent.length = MAX_RECENT_TOPICS;
    }

    state.topics.lastTopic = {
        topic: selection.topic,
        listId: selection.listId,
        usedAt: new Date().toISOString(),
    };

    renderTopicsRecent();
    schedulePersist();
}

function buildTopicDirective(selection) {
    const topic = selection.topic;
    const listName = selection.listName;
    const blend = state.topics.blend ?? 'directive';
    const placement = state.topics.placement ?? 'system';

    const directive = blend === 'hint'
        ? `If it feels natural, weave in a reference to "${topic}".`
        : `Make sure to include something related to "${topic}".`;

    return {
        topic,
        listId: selection.listId,
        listName,
        directive,
        placement,
    };
}

export function maybeGetTopicPrompt({ simulate = false } = {}) {
    normalizeTopicState();

    if (!state.topics.enabled) {
        if (!simulate) {
            resetTopicRuntime();
        } else {
            topicRuntime.pending = null;
            topicRuntime.pendingCounter = null;
        }
        topicRuntime.lastDirective = null;
        return null;
    }

    if (!simulate && topicRuntime.pending) {
        const pending = topicRuntime.pending;
        topicRuntime.pending = null;
        topicRuntime.pendingCounter = null;
        topicRuntime.counter = pending?.counterAfter ?? topicRuntime.counter;
        if (!pending?.selection) {
            topicRuntime.lastDirective = null;
            return null;
        }
        applyTopicSelection(pending.selection);
        const directive = buildTopicDirective(pending.selection);
        topicRuntime.lastDirective = directive;
        return directive;
    }

    const evaluation = evaluateTopicSelection();
    if (!evaluation) {
        topicRuntime.lastDirective = null;
        return null;
    }

    if (simulate) {
        topicRuntime.pending = evaluation;
        topicRuntime.pendingCounter = evaluation.counterAfter;
        return evaluation.selection ? buildTopicDirective(evaluation.selection) : null;
    }

    topicRuntime.pending = null;
    topicRuntime.pendingCounter = null;
    topicRuntime.counter = evaluation.counterAfter ?? topicRuntime.counter;
    if (!evaluation.selection) {
        topicRuntime.lastDirective = null;
        return null;
    }

    applyTopicSelection(evaluation.selection);
    const directive = buildTopicDirective(evaluation.selection);
    topicRuntime.lastDirective = directive;
    return directive;
}

export function consumeTopicDirective() {
    const directive = topicRuntime.lastDirective ?? null;
    topicRuntime.lastDirective = null;
    return directive;
}

function applyAccessibilityClasses() {
    const root = document.documentElement;
    const body = document.body;
    if (!root || !body) {
        return;
    }

    root.classList.toggle('supertavern-high-contrast', Boolean(state.accessibility.highContrast));
    root.classList.toggle('supertavern-dyslexia', Boolean(state.accessibility.dyslexiaFriendly));
    root.classList.toggle('supertavern-reduced-motion', Boolean(state.accessibility.reducedMotion));
    body.classList.toggle('supertavern-focus-tools', Boolean(state.accessibility.focusManagement));
}

function updateDynamicTheme() {
    const body = document.body;
    if (!body) {
        return;
    }

    if (!state.customization.dynamicThemes) {
        body.classList.remove('supertavern-dynamic-theme');
        document.documentElement.style.removeProperty('--supertavern-theme-alpha');
        return;
    }

    body.classList.add('supertavern-dynamic-theme');
    const xp = state.gamification.enabled ? state.gamification.xp : 0;
    const intensity = Math.min(0.35, 0.1 + (xp % 100) / 500);
    document.documentElement.style.setProperty('--supertavern-theme-alpha', intensity.toFixed(3));
}

function applyState() {
    ensureClientId();

    if (!state.multiUser.enabled) {
        teardownMultiUserChannel();
    }

    applyAccessibilityClasses();
    updateDynamicTheme();
}

function ensureClientId() {
    if (!state.multiUser.clientId) {
        state.multiUser.clientId = createClientId();
    }
}

function getStateValue(path) {
    return path.split('.').reduce((accumulator, key) => {
        if (accumulator && typeof accumulator === 'object') {
            return accumulator[key];
        }
        return undefined;
    }, state);
}

function setStateValue(path, value) {
    const keys = path.split('.');
    let target = state;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (typeof target[key] !== 'object' || target[key] === null) {
            target[key] = {};
        }
        target = target[key];
    }

    const lastKey = keys[keys.length - 1];
    if (target[lastKey] === value) {
        return false;
    }

    target[lastKey] = value;

    if (path === 'topics.frequency') {
        const numeric = Math.max(1, Math.min(99, Math.round(Number(target[lastKey]) || 1)));
        target[lastKey] = numeric;
    }

    if (path.startsWith('multiUser') && path !== 'multiUser.clientId') {
        if (!state.multiUser.enabled) {
            teardownMultiUserChannel();
        } else {
            ensureMultiUserChannel();
        }
    }

    if (path.startsWith('topics.')) {
        normalizeTopicState();

        if (path === 'topics.enabled' && !value) {
            resetTopicRuntime();
        }

        if (path === 'topics.mode') {
            // Reset counters when switching selection strategies for predictability
            topicRuntime.counter = 0;
        }
    }

    if (path.startsWith('accessibility')) {
        applyAccessibilityClasses();
    }

    if (path.startsWith('customization')) {
        updateDynamicTheme();
    }

    if (path === 'gamification.enabled') {
        schedulePersist();
    }

    if (path === 'team.analyticsEnabled' && !value) {
        state.team.memberStats = {};
    }

    if (path === 'sharedMemory.enabled' && !value) {
        // Keep stored data but stop updating until re-enabled
        renderSharedMemory();
    }

    if (path.endsWith('enabled') && state.gamification.enabled) {
        addExperience('feature_toggle');
    }

    // Update voice controller settings if voice settings changed
    if (path.startsWith('voiceAudio.') && typeof window !== 'undefined' && window.voiceAudioController) {
        try {
            window.voiceAudioController.updateSettings(state.voiceAudio);
        } catch (error) {
            console.error('Failed to update voice controller:', error);
        }
    }

    return true;
}

function exportSharedMemorySnapshot() {
    const projectKey = getMemoryKey();
    const entries = getMemoryEntries(projectKey);
    const payload = {
        project: projectKey,
        generatedAt: new Date().toISOString(),
        entries,
    };

    const blob = JSON.stringify(payload, null, 2);
    download(blob, `supertavern-memory-${projectKey}.json`, 'application/json');
}

function clearSharedMemory() {
    if (!window.confirm('Clear the shared memory for this project?')) {
        return;
    }

    const key = getMemoryKey();
    state.sharedMemory.entries[key] = [];
    renderSharedMemory();
    schedulePersist();
}

function getMemoryKey() {
    if (!state.sharedMemory.projectScoped) {
        return 'global';
    }

    return getRoomKey();
}

function getRoomKey() {
    const group = dependencies.getActiveGroup?.();
    if (group) {
        return `group:${group}`;
    }

    const chatId = dependencies.getCurrentChatId?.();
    if (chatId !== undefined && chatId !== null) {
        return `chat:${chatId}`;
    }

    const character = dependencies.getActiveCharacter?.();
    if (character) {
        return `character:${character}`;
    }

    return 'global';
}

function setMultiUserStatus(status) {
    lastStatus = status;
    renderMultiUserStatus();
}

function deepClone(obj) {
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }

    return JSON.parse(JSON.stringify(obj));
}

function mergeDeep(target, source) {
    const output = Array.isArray(target) ? [...target] : { ...target };
    if (source && typeof source === 'object') {
        Object.keys(source).forEach((key) => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = mergeDeep(output[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}

function createClientId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `client-${Math.random().toString(36).slice(2, 12)}`;
}

function getPanel() {
    return document.getElementById('supertavern-settings-panel');
}


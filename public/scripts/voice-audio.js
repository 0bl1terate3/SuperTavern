// Voice & Audio drawer logic
// Provides text-to-speech playback, voice input, ambient backgrounds, and mood synchronization.

import { settings, saveSettingsDebounced, eventSource, event_types } from '../script.js';
import { getContext } from './st-context.js';
import { setValueByPath } from './utils.js';
import { Popup, POPUP_RESULT, POPUP_TYPE } from './popup.js';
import { t } from './i18n.js';

const DEFAULT_STATE = {
    tts: {
        enabled: false,
        voice: '',
    },
    input: {
        enabled: false,
        pushToTalk: false,
    },
    background: {
        enabled: false,
        style: 'tavern',
    },
    characters: {
        sync: false,
        defaultProfile: 'storyteller',
        profiles: {},
    },
    mood: {
        sync: false,
        preset: 'serene',
    },
};

const VOICE_PROFILES = {
    storyteller: { rate: 1.0, pitch: 1.0, label: 'Storyteller' },
    heroic: { rate: 1.08, pitch: 0.95, label: 'Heroic' },
    mysterious: { rate: 0.9, pitch: 0.82, label: 'Mysterious' },
    playful: { rate: 1.18, pitch: 1.2, label: 'Playful' },
    robotic: { rate: 1.0, pitch: 0.7, label: 'Robotic' },
};

const MOOD_PRESETS = {
    serene: { rate: 0.92, pitch: 1.05, background: 'forest' },
    tense: { rate: 1.08, pitch: 0.88, background: 'storm' },
    romantic: { rate: 0.9, pitch: 1.18, background: 'tavern' },
    mystic: { rate: 0.85, pitch: 0.95, background: 'sci-fi' },
};

const PUSH_TO_TALK_KEY = 'Space';
const PUSH_TO_TALK_MODIFIER = 'shiftKey';

let panel = null;
let isInitialized = false;
let isUpdatingUi = false;

let voiceAudioState = clone(DEFAULT_STATE);

const speechController = new SpeechPlaybackController();
const voiceInputController = new VoiceInputController();
const ambientController = new AmbientSoundscape();

let voicesBound = false;

export function initVoiceAudioDrawer() {
    if (isInitialized) {
        return;
    }

    panel = document.getElementById('voice-audio-panel');
    if (!panel) {
        return;
    }

    setupListeners();
    updateSupportAvailability();
    refreshVoiceDropdown();
    applyVoiceAudioStateToUi();

    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    if (!voicesBound && speechController.isSupported()) {
        voicesBound = true;
        speechController.onVoicesChanged(() => {
            refreshVoiceDropdown();
            applyVoiceAudioStateToUi();
        });
    }

    isInitialized = true;
}

export function loadVoiceAudioSettings(saved = {}) {
    voiceAudioState = merge(DEFAULT_STATE, saved ?? {});
    if (settings) {
        settings.voice_audio = clone(voiceAudioState);
    }

    refreshVoiceDropdown();
    applyVoiceAudioStateToUi();
    applyAllEffects();
}

export function getVoiceAudioState() {
    return clone(voiceAudioState);
}

function setupListeners() {
    panel.querySelectorAll('[data-voice-audio-setting]').forEach((element) => {
        const path = element.getAttribute('data-voice-audio-setting');
        if (!path) {
            return;
        }

        if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            element.addEventListener('change', () => {
                if (isUpdatingUi) {
                    return;
                }
                setStateValue(path, element.checked);
            });
        } else if (element instanceof HTMLSelectElement) {
            element.addEventListener('change', () => {
                if (isUpdatingUi) {
                    return;
                }
                setStateValue(path, element.value);
            });
        }
    });

    panel.querySelector('#voice_audio_tts_preview')?.addEventListener('click', onPreviewVoice);
    panel.querySelector('#voice_audio_input_calibrate')?.addEventListener('click', onCalibrateMicrophone);
    panel.querySelector('#voice_audio_background_preview')?.addEventListener('click', onPreviewBackground);
    panel.querySelector('#voice_audio_character_customize')?.addEventListener('click', onCustomizeCharacterVoices);
    panel.querySelector('#voice_audio_mood_sync')?.addEventListener('click', onSyncMood);
}

function updateSupportAvailability() {
    const ttsElements = panel.querySelectorAll('[data-voice-audio-setting^="tts"], #voice_audio_tts_preview');
    const inputElements = panel.querySelectorAll('[data-voice-audio-setting^="input"], #voice_audio_input_calibrate');
    const backgroundElements = panel.querySelectorAll('[data-voice-audio-setting^="background"], #voice_audio_background_preview');

    if (!speechController.isSupported()) {
        ttsElements.forEach((el) => el.setAttribute('disabled', 'true'));
        panel.querySelector('#voice_audio_tts_enabled')?.parentElement?.setAttribute('title', t('Browser speech synthesis is not available'));
    }

    if (!voiceInputController.isSupported()) {
        inputElements.forEach((el) => el.setAttribute('disabled', 'true'));
        panel.querySelector('#voice_audio_input_enabled')?.parentElement?.setAttribute('title', t('Browser speech recognition is not available'));
    }

    if (!ambientController.isSupported()) {
        backgroundElements.forEach((el) => el.setAttribute('disabled', 'true'));
        panel.querySelector('#voice_audio_background_enabled')?.parentElement?.setAttribute('title', t('Web Audio API is not available'));
    }
}

function onMessageReceived(messageId, type) {
    if (!voiceAudioState.tts.enabled || !speechController.isSupported()) {
        return;
    }

    const context = getContext();
    const chat = context.chat ?? [];
    const message = chat[messageId];
    if (!message || message.is_user) {
        return;
    }

    const text = message.mes ?? '';
    if (!text.trim()) {
        return;
    }

    const characterName = message.name || 'Story';
    const profileKey = resolveCharacterProfile(characterName);
    const profile = VOICE_PROFILES[profileKey] ?? VOICE_PROFILES.storyteller;
    const mood = voiceAudioState.mood.sync ? (MOOD_PRESETS[voiceAudioState.mood.preset] ?? null) : null;

    const modifiers = combineModifiers(profile, mood);
    speechController.speak(text, {
        voiceId: voiceAudioState.tts.voice,
        pitch: modifiers.pitch,
        rate: modifiers.rate,
    });
}

function onPreviewVoice() {
    if (!speechController.isSupported()) {
        return;
    }

    const previewText = t('This is how responses will sound with your current settings.');
    const profile = VOICE_PROFILES[voiceAudioState.characters.defaultProfile] ?? VOICE_PROFILES.storyteller;
    const mood = voiceAudioState.mood.sync ? (MOOD_PRESETS[voiceAudioState.mood.preset] ?? null) : null;
    const modifiers = combineModifiers(profile, mood);

    speechController.speak(previewText, {
        voiceId: voiceAudioState.tts.voice,
        pitch: modifiers.pitch,
        rate: modifiers.rate,
        replaceQueue: true,
    });
}

async function onCalibrateMicrophone() {
    if (!voiceInputController.isSupported()) {
        return;
    }

    try {
        const level = await voiceInputController.calibrate();
        if (Number.isFinite(level)) {
            const percentage = Math.round(level * 100);
            toastr.success(t('Microphone ready. Average input level: ${percentage}%').replace('${percentage}', String(percentage)));
        } else {
            toastr.success(t('Microphone ready.'));
        }
    }
    catch (err) {
        console.error('Microphone calibration failed', err);
        toastr.error(t('Unable to access the microphone. Check browser permissions.'));
    }
}

function onPreviewBackground() {
    if (!ambientController.isSupported()) {
        return;
    }

    ambientController.preview(voiceAudioState.background.style);
}

async function onCustomizeCharacterVoices() {
    const context = getContext();
    const chat = context.chat ?? [];
    const uniqueCharacters = new Set();
    for (const message of chat) {
        if (message && !message.is_user && message.name) {
            uniqueCharacters.add(message.name);
        }
    }

    if (!uniqueCharacters.size) {
        toastr.info(t('Start a conversation to customize character voices.'));
        return;
    }

    const container = document.createElement('div');
    container.className = 'voice-audio-customizer flex-container flexFlowColumn gap10';

    uniqueCharacters.forEach((name) => {
        const row = document.createElement('div');
        row.className = 'voice-audio-customizer__row flex-container gap10 alignitemscenter';

        const label = document.createElement('label');
        label.textContent = name;
        label.className = 'voice-audio-customizer__label flex1';

        const select = document.createElement('select');
        select.className = 'text_pole flex1';
        select.dataset.character = name;

        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = t('Use default profile');
        select.appendChild(defaultOption);

        Object.entries(VOICE_PROFILES).forEach(([key, profile]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = profile.label;
            select.appendChild(option);
        });

        const savedProfile = voiceAudioState.characters.profiles?.[name];
        select.value = savedProfile ?? 'default';

        row.appendChild(label);
        row.appendChild(select);
        container.appendChild(row);
    });

    const popup = new Popup(container, POPUP_TYPE.CONFIRM, '', {
        okButton: t('Save'),
        cancelButton: t('Cancel'),
        allowVerticalScrolling: true,
        wide: true,
    });

    const result = await popup.show();
    if (result !== POPUP_RESULT.AFFIRMATIVE) {
        return;
    }

    const newProfiles = { ...voiceAudioState.characters.profiles };
    container.querySelectorAll('select').forEach((select) => {
        const character = select.dataset.character;
        if (!character) {
            return;
        }
        const value = select.value;
        if (value === 'default') {
            delete newProfiles[character];
        } else {
            newProfiles[character] = value;
        }
    });

    setStateValue('characters.profiles', newProfiles);
}

function onSyncMood() {
    if (!voiceAudioState.mood.sync) {
        setStateValue('mood.sync', true, { updateUi: true });
    }

    const preset = MOOD_PRESETS[voiceAudioState.mood.preset];
    if (preset?.background) {
        setStateValue('background.style', preset.background, { updateUi: true });
    }

    applyMoodEffects();
    if (voiceAudioState.background.enabled) {
        ambientController.start(voiceAudioState.background.style);
    }
}

function resolveCharacterProfile(characterName) {
    if (!voiceAudioState.characters.sync) {
        return voiceAudioState.characters.defaultProfile;
    }

    return voiceAudioState.characters.profiles?.[characterName] ?? voiceAudioState.characters.defaultProfile;
}

function combineModifiers(profile, mood) {
    const pitch = clamp((profile?.pitch ?? 1) * (mood?.pitch ?? 1), 0.5, 2);
    const rate = clamp((profile?.rate ?? 1) * (mood?.rate ?? 1), 0.5, 2);
    return { pitch, rate };
}

function refreshVoiceDropdown() {
    if (!panel) {
        return;
    }

    const select = panel.querySelector('#voice_audio_tts_voice');
    if (!(select instanceof HTMLSelectElement)) {
        return;
    }

    if (!speechController.isSupported()) {
        select.innerHTML = '';
        const option = document.createElement('option');
        option.value = '';
        option.textContent = t('Speech synthesis unavailable');
        select.appendChild(option);
        select.setAttribute('disabled', 'true');
        return;
    }

    const voices = speechController.getVoices();
    const currentValue = voiceAudioState.tts.voice;
    select.innerHTML = '';

    if (!voices.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = t('Loading voices…');
        select.appendChild(option);
        return;
    }

    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.label}`;
        select.appendChild(option);
    });

    const hasSelectedVoice = voices.some((voice) => voice.id === currentValue);
    if (!hasSelectedVoice) {
        voiceAudioState.tts.voice = voices[0]?.id ?? '';
        persistState(false);
        applyTtsEffects();
    }

    select.value = voiceAudioState.tts.voice;
}

function applyVoiceAudioStateToUi() {
    if (!panel) {
        return;
    }

    isUpdatingUi = true;
    try {
        panel.querySelectorAll('[data-voice-audio-setting]').forEach((element) => {
            const path = element.getAttribute('data-voice-audio-setting');
            if (!path) {
                return;
            }
            const value = getValueByPath(voiceAudioState, path);
            if (element instanceof HTMLInputElement && element.type === 'checkbox') {
                element.checked = Boolean(value);
            } else if (element instanceof HTMLSelectElement) {
                if (value !== undefined && value !== null) {
                    element.value = String(value);
                }
            }
        });
        updatePushToTalkHint();
    }
    finally {
        isUpdatingUi = false;
    }
}

function applyAllEffects() {
    applyTtsEffects();
    applyInputEffects();
    applyBackgroundEffects();
    applyMoodEffects();
}

function applyTtsEffects() {
    speechController.setEnabled(voiceAudioState.tts.enabled);
    speechController.setVoice(voiceAudioState.tts.voice);
}

function applyInputEffects() {
    voiceInputController.setEnabled(voiceAudioState.input.enabled && voiceInputController.isSupported());
    voiceInputController.setPushToTalk(voiceAudioState.input.pushToTalk);
    updatePushToTalkHint();
}

function applyBackgroundEffects() {
    if (!ambientController.isSupported()) {
        return;
    }

    if (voiceAudioState.background.enabled) {
        ambientController.start(voiceAudioState.background.style);
    } else {
        ambientController.stop();
    }
}

function applyMoodEffects() {
    if (!voiceAudioState.mood.sync) {
        return;
    }

    const preset = MOOD_PRESETS[voiceAudioState.mood.preset];
    if (!preset) {
        return;
    }

    if (voiceAudioState.background.enabled && preset.background) {
        ambientController.start(preset.background);
    }
}

function updatePushToTalkHint() {
    const button = panel?.querySelector('#voice_audio_input_calibrate');
    if (!(button instanceof HTMLButtonElement)) {
        return;
    }

    if (voiceAudioState.input.enabled && voiceAudioState.input.pushToTalk) {
        button.setAttribute('title', t('Hold Shift + Space to speak while this mode is enabled.'));
        button.classList.add('push-to-talk');
    } else {
        button.setAttribute('title', t('Calibrate microphone levels'));
        button.classList.remove('push-to-talk');
    }
}

function setStateValue(path, value, options = {}) {
    const { updateUi = false } = options;
    if (Object.is(getValueByPath(voiceAudioState, path), value)) {
        return;
    }

    setValueByPath(voiceAudioState, path, value);
    persistState();
    applyEffectsForPath(path);
    if (updateUi) {
        applyVoiceAudioStateToUi();
    }
}

function persistState(triggerSave = true) {
    if (settings) {
        settings.voice_audio = clone(voiceAudioState);
    }

    if (triggerSave) {
        saveSettingsDebounced();
    }
}

function applyEffectsForPath(path) {
    if (path.startsWith('tts.')) {
        applyTtsEffects();
    } else if (path.startsWith('input.')) {
        applyInputEffects();
    } else if (path.startsWith('background.')) {
        applyBackgroundEffects();
    } else if (path.startsWith('mood.')) {
        applyMoodEffects();
    } else if (path.startsWith('characters.')) {
        applyTtsEffects();
    }
}

function getValueByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current == null) {
            return undefined;
        }
        current = current[part];
    }
    return current;
}

function merge(target, source) {
    const output = clone(target);
    Object.entries(source ?? {}).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            output[key] = merge(output[key] ?? {}, value);
        } else {
            output[key] = value;
        }
    });
    return output;
}

function clone(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

class SpeechPlaybackController {
    constructor() {
        this.enabled = false;
        this.voiceId = '';
        this.availableVoices = [];
        this.voiceChangeHandlers = new Set();
        this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';

        if (this.supported) {
            this.refreshVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                this.refreshVoices();
            };
        }
    }

    isSupported() {
        return this.supported;
    }

    onVoicesChanged(callback) {
        if (typeof callback === 'function') {
            this.voiceChangeHandlers.add(callback);
            if (this.availableVoices.length) {
                callback();
            }
        }
    }

    refreshVoices() {
        if (!this.supported) {
            return;
        }

        const voices = window.speechSynthesis.getVoices();
        this.availableVoices = voices.map((voice) => ({
            id: `${voice.voiceURI}`,
            voice,
            label: `${voice.name} (${voice.lang})`,
        })).sort((a, b) => a.label.localeCompare(b.label));

        this.voiceChangeHandlers.forEach((callback) => callback());
    }

    getVoices() {
        return this.availableVoices.map(({ id, label }) => ({ id, label }));
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        if (!this.enabled) {
            this.cancel();
        }
    }

    setVoice(voiceId) {
        this.voiceId = voiceId ?? '';
    }

    getVoiceById(voiceId) {
        return this.availableVoices.find((voice) => voice.id === voiceId)?.voice ?? null;
    }

    speak(text, options = {}) {
        if (!this.supported || !this.enabled) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.getVoiceById(options.voiceId ?? this.voiceId);
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }

        utterance.pitch = clamp(options.pitch ?? 1, 0.5, 2);
        utterance.rate = clamp(options.rate ?? 1, 0.5, 2);
        if (options.replaceQueue) {
            this.cancel();
        }

        window.speechSynthesis.speak(utterance);
    }

    cancel() {
        if (!this.supported) {
            return;
        }
        window.speechSynthesis.cancel();
    }
}

class VoiceInputController {
    constructor() {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
            this.supported = false;
            return;
        }

        this.supported = true;
        this.enabled = false;
        this.pushToTalk = false;
        this.recognition = new Recognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = navigator.language || 'en-US';
        this.recognition.onresult = (event) => this.onResult(event);
        this.recognition.onend = () => this.onEnd();
        this.active = false;
        this.pttKeyDown = false;

        this.keydownHandler = (event) => this.onKeyDown(event);
        this.keyupHandler = (event) => this.onKeyUp(event);
    }

    isSupported() {
        return this.supported;
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        if (!this.supported) {
            return;
        }

        if (!this.enabled) {
            this.stop();
            window.removeEventListener('keydown', this.keydownHandler, true);
            window.removeEventListener('keyup', this.keyupHandler, true);
        } else if (!this.pushToTalk) {
            this.start();
        }
    }

    setPushToTalk(enabled) {
        this.pushToTalk = !!enabled;
        if (!this.supported) {
            return;
        }

        if (this.pushToTalk) {
            this.stop();
            window.addEventListener('keydown', this.keydownHandler, true);
            window.addEventListener('keyup', this.keyupHandler, true);
        } else {
            window.removeEventListener('keydown', this.keydownHandler, true);
            window.removeEventListener('keyup', this.keyupHandler, true);
            if (this.enabled) {
                this.start();
            }
        }
    }

    onKeyDown(event) {
        if (!this.enabled || !this.pushToTalk) {
            return;
        }

        if (event.code === PUSH_TO_TALK_KEY && event[PUSH_TO_TALK_MODIFIER] && !event.repeat) {
            event.preventDefault();
            this.pttKeyDown = true;
            this.start();
        }
    }

    onKeyUp(event) {
        if (!this.enabled || !this.pushToTalk) {
            return;
        }

        if (event.code === PUSH_TO_TALK_KEY) {
            this.pttKeyDown = false;
            this.stop();
        }
    }

    start() {
        if (!this.supported || this.active) {
            return;
        }

        try {
            this.recognition.start();
            this.active = true;
        }
        catch (error) {
            console.warn('Voice recognition failed to start', error);
        }
    }

    stop() {
        if (!this.supported || !this.active) {
            return;
        }

        try {
            this.recognition.stop();
        }
        catch (error) {
            console.warn('Voice recognition failed to stop', error);
        }
        finally {
            this.active = false;
        }
    }

    onResult(event) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
            }
        }

        if (!finalTranscript.trim()) {
            return;
        }

        const textarea = document.getElementById('send_textarea');
        if (!(textarea instanceof HTMLTextAreaElement)) {
            return;
        }

        const shouldAddSpace = textarea.value && !textarea.value.endsWith(' ');
        const insertion = shouldAddSpace ? ` ${finalTranscript.trim()} ` : `${finalTranscript.trim()} `;
        textarea.value += insertion;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    onEnd() {
        this.active = false;
        if (this.enabled && !this.pushToTalk && !this.pttKeyDown) {
            this.start();
        }
    }

    async calibrate() {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Media devices unavailable');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextImpl) {
            stream.getTracks().forEach((track) => track.stop());
            return NaN;
        }

        const context = new AudioContextImpl();
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        let samples = 0;
        let total = 0;

        await new Promise((resolve) => {
            const sample = () => {
                analyser.getByteTimeDomainData(data);
                let sum = 0;
                for (const value of data) {
                    const normalized = (value - 128) / 128;
                    sum += Math.abs(normalized);
                }
                total += sum / data.length;
                samples += 1;

                if (samples >= 30) {
                    resolve();
                } else {
                    requestAnimationFrame(sample);
                }
            };
            sample();
        });

        stream.getTracks().forEach((track) => track.stop());
        context.close();
        return total / samples;
    }
}

class AmbientSoundscape {
    constructor() {
        this.context = null;
        this.gainNode = null;
        this.sources = [];
        this.activeStyle = null;
        this.previewTimeout = null;
        this.AudioContextImpl = window.AudioContext || window.webkitAudioContext;
    }

    isSupported() {
        return typeof this.AudioContextImpl === 'function';
    }

    async ensureContext() {
        if (!this.isSupported()) {
            return null;
        }

        if (!this.context) {
            this.context = new this.AudioContextImpl();
        }

        if (this.context.state === 'suspended') {
            try {
                await this.context.resume();
            }
            catch (err) {
                console.warn('Failed to resume audio context', err);
            }
        }

        return this.context;
    }

    async start(style) {
        const context = await this.ensureContext();
        if (!context) {
            return;
        }

        this.stop(false);
        this.activeStyle = style;

        this.gainNode = context.createGain();
        this.gainNode.gain.value = 0;
        this.gainNode.connect(context.destination);

        this.sources = createAmbientNodes(style, context, this.gainNode);
        this.sources.forEach((node) => {
            if (typeof node.start === 'function') {
                node.start();
            }
        });

        this.gainNode.gain.linearRampToValueAtTime(getStyleGain(style), context.currentTime + 1.5);
    }

    stop(fade = true) {
        if (!this.context || !this.gainNode) {
            return;
        }

        const context = this.context;
        const gainNode = this.gainNode;
        const sources = this.sources;

        if (fade) {
            gainNode.gain.cancelScheduledValues(context.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.8);
            setTimeout(() => stopNodes(sources), 900);
        } else {
            stopNodes(sources);
        }

        this.sources = [];
        try {
            gainNode.disconnect();
        }
        catch (error) {
            console.warn('Failed to disconnect ambient gain node', error);
        }
        this.gainNode = null;
        this.activeStyle = null;
    }

    async preview(style) {
        await this.start(style);
        clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => this.stop(), 10000);
    }
}

function stopNodes(nodes) {
    nodes.forEach((node) => {
        try {
            if (typeof node.stop === 'function') {
                node.stop();
            }
            if (typeof node.disconnect === 'function') {
                node.disconnect();
            }
        }
        catch (error) {
            console.warn('Failed to stop ambient node', error);
        }
    });
}

function createAmbientNodes(style, context, gainNode) {
    const nodes = [];
    const config = AMBIENT_CONFIG[style] ?? AMBIENT_CONFIG.tavern;

    if (config.noise) {
        const noiseSource = createNoiseSource(context, config.noise.amplitude);
        let currentNode = noiseSource;
        if (config.noise.filter) {
            const filter = context.createBiquadFilter();
            filter.type = config.noise.filter.type;
            filter.frequency.value = config.noise.filter.frequency;
            if (config.noise.filter.Q) {
                filter.Q.value = config.noise.filter.Q;
            }
            currentNode.connect(filter);
            currentNode = filter;
            nodes.push(filter);
        }
        currentNode.connect(gainNode);
        nodes.push(noiseSource);
    }

    if (Array.isArray(config.tones)) {
        for (const tone of config.tones) {
            const oscillator = context.createOscillator();
            oscillator.type = tone.type;
            oscillator.frequency.value = tone.frequency;

            const toneGain = context.createGain();
            toneGain.gain.value = tone.gain;
            oscillator.connect(toneGain).connect(gainNode);
            nodes.push(oscillator, toneGain);
        }
    }

    return nodes;
}

function createNoiseSource(context, amplitude = 0.3) {
    const bufferSize = context.sampleRate * 4;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * amplitude;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
}

const AMBIENT_CONFIG = {
    tavern: {
        noise: { amplitude: 0.25, filter: { type: 'lowshelf', frequency: 350 } },
        tones: [
            { type: 'sine', frequency: 220, gain: 0.02 },
            { type: 'triangle', frequency: 440, gain: 0.01 },
        ],
    },
    'sci-fi': {
        noise: { amplitude: 0.18, filter: { type: 'highpass', frequency: 800 } },
        tones: [
            { type: 'sawtooth', frequency: 60, gain: 0.04 },
            { type: 'square', frequency: 160, gain: 0.015 },
        ],
    },
    forest: {
        noise: { amplitude: 0.28, filter: { type: 'bandpass', frequency: 1600, Q: 1.2 } },
        tones: [
            { type: 'sine', frequency: 660, gain: 0.008 },
            { type: 'sine', frequency: 880, gain: 0.006 },
        ],
    },
    storm: {
        noise: { amplitude: 0.32, filter: { type: 'lowpass', frequency: 400 } },
        tones: [
            { type: 'sine', frequency: 35, gain: 0.05 },
            { type: 'sawtooth', frequency: 55, gain: 0.03 },
        ],
    },
};

function getStyleGain(style) {
    switch (style) {
        case 'storm':
            return 0.35;
        case 'sci-fi':
            return 0.25;
        case 'forest':
            return 0.2;
        default:
            return 0.22;
    }
}

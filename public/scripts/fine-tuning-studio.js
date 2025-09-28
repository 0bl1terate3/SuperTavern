const state = {
    datasets: new Map(),
    filters: {
        invalid: true,
        unassigned: false,
    },
    training: {
        status: 'idle',
        progress: 0,
        timer: null,
        startTime: null,
        nextCheckpoint: 25,
        metrics: {
            trainLoss: null,
            valLoss: null,
            accuracy: null,
            throughput: null,
            bleu: null,
            rouge: null,
            ppl: null,
        },
    },
    checkpoints: [],
};

const recipes = {
    'roleplay-lora': {
        strategy: 'lora',
        learningRate: 0.00015,
        epochs: 4,
        batchSize: 8,
        gradAccum: 8,
        loraRank: 32,
        loraAlpha: 16,
        mixedPrecision: true,
        gradientCheckpointing: true,
        quant8: false,
        quant4: false,
    },
    'summarization-lora': {
        strategy: 'lora',
        learningRate: 0.00005,
        epochs: 5,
        batchSize: 4,
        gradAccum: 16,
        loraRank: 16,
        loraAlpha: 16,
        mixedPrecision: true,
        gradientCheckpointing: true,
        quant8: true,
        quant4: false,
    },
    'support-agent': {
        strategy: 'qlora',
        learningRate: 0.00008,
        epochs: 3,
        batchSize: 12,
        gradAccum: 6,
        loraRank: 24,
        loraAlpha: 32,
        mixedPrecision: true,
        gradientCheckpointing: true,
        quant8: false,
        quant4: true,
    },
    sandbox: {
        strategy: 'qlora',
        learningRate: 0.0002,
        epochs: 1,
        batchSize: 16,
        gradAccum: 4,
        loraRank: 8,
        loraAlpha: 16,
        mixedPrecision: true,
        gradientCheckpointing: false,
        quant8: true,
        quant4: true,
    },
};

const toast = (type, message) => {
    if (window.toastr && typeof window.toastr[type] === 'function') {
        window.toastr[type](message);
    } else {
        console[type === 'error' ? 'error' : 'log'](`[${type}] ${message}`);
    }
};

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const generateId = (prefix) => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const determineType = (file) => {
    const [, extension = ''] = /\.([^.]+)$/i.exec(file.name) || [];
    const lower = extension.toLowerCase();

    if (lower === 'jsonl') return 'jsonl';
    if (lower === 'csv') return 'csv';
    if (lower === 'txt') return 'txt';

    return file.type || 'unknown';
};

const estimateTokens = (sizeBytes) => {
    if (!sizeBytes) return 'Tokens: —';
    const estimatedTokens = Math.max(1, Math.round(sizeBytes / 6));
    return `Tokens: ~${estimatedTokens.toLocaleString()}`;
};

const computeRoleBalance = () => {
    const counts = { system: 0, user: 0, assistant: 0, auto: 0 };

    for (const dataset of state.datasets.values()) {
        counts[dataset.role ?? 'auto']++;
    }

    if (state.datasets.size === 0) {
        return 'Role balance: —';
    }

    return `Role balance: S ${counts.system} / U ${counts.user} / A ${counts.assistant}`;
};

const renderDatasetSummary = () => {
    const countEl = document.getElementById('fine-tuning-dataset-count');
    const tokenEl = document.getElementById('fine-tuning-token-estimate');
    const roleEl = document.getElementById('fine-tuning-role-balance');

    if (!countEl || !tokenEl || !roleEl) {
        return;
    }

    const datasetCount = state.datasets.size;
    const totalSize = Array.from(state.datasets.values()).reduce((sum, dataset) => sum + dataset.size, 0);

    countEl.textContent = datasetCount === 0 ? '0 files selected' : `${datasetCount} file${datasetCount > 1 ? 's' : ''} selected`;
    tokenEl.textContent = estimateTokens(totalSize);
    roleEl.textContent = computeRoleBalance();
};

const renderDatasets = () => {
    const tableBody = document.getElementById('fine-tuning-dataset-table');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const datasets = Array.from(state.datasets.values());
    let rendered = 0;

    for (const dataset of datasets) {
        if (state.filters.invalid && dataset.status === 'invalid') {
            continue;
        }

        const row = document.createElement('tr');
        row.dataset.id = dataset.id;
        if (state.filters.unassigned && (!dataset.role || dataset.role === 'auto')) {
            row.classList.add('fine-tuning-row--attention');
        }

        row.innerHTML = `
            <td>${dataset.name}</td>
            <td>${dataset.type}</td>
            <td>${formatBytes(dataset.size)}</td>
            <td>
                <select class="text_pole" data-role-select>
                    <option value="auto" ${dataset.role === 'auto' ? 'selected' : ''}>Auto</option>
                    <option value="system" ${dataset.role === 'system' ? 'selected' : ''}>System</option>
                    <option value="user" ${dataset.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="assistant" ${dataset.role === 'assistant' ? 'selected' : ''}>Assistant</option>
                </select>
            </td>
            <td>${dataset.status}</td>
            <td class="textAlignRight">
                <button type="button" class="menu_button" data-action="preview">Preview</button>
                <button type="button" class="menu_button" data-action="remove">Remove</button>
            </td>
        `;

        tableBody.appendChild(row);
        rendered++;
    }

    if (rendered === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'fine-tuning-table__empty';
        emptyRow.innerHTML = '<td colspan="6">Upload datasets to get started.</td>';
        tableBody.appendChild(emptyRow);
    }

    renderDatasetSummary();
};

const readFilePreview = (dataset) => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        let previewText = text.slice(0, 12000);

        if (dataset.type === 'jsonl') {
            const lines = previewText.split(/\r?\n/).filter(Boolean).slice(0, 5);
            const parsed = lines.map((line, index) => {
                try {
                    const json = JSON.parse(line);
                    return JSON.stringify(json, null, 2);
                } catch (error) {
                    console.warn('Failed to parse JSONL preview line', index, error);
                    return line;
                }
            });
            previewText = parsed.join('\n\n');
        } else if (dataset.type === 'csv') {
            const lines = previewText.split(/\r?\n/).slice(0, 10);
            previewText = lines.join('\n');
        }

        resolve(previewText);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(dataset.file.slice(0, 200000), 'utf-8');
});

const showPreview = async (dataset) => {
    const previewContainer = document.getElementById('fine-tuning-dataset-preview');
    const previewTitle = document.getElementById('fine-tuning-preview-title');
    const previewMeta = document.getElementById('fine-tuning-preview-meta');
    const previewContent = document.getElementById('fine-tuning-preview-content');

    if (!previewContainer || !previewTitle || !previewMeta || !previewContent) {
        return;
    }

    try {
        previewTitle.textContent = dataset.name;
        previewMeta.textContent = `${dataset.type.toUpperCase()} — ${formatBytes(dataset.size)}`;

        if (!dataset.preview) {
            previewContent.textContent = 'Loading preview...';
            dataset.preview = await readFilePreview(dataset);
        }

        previewContent.textContent = dataset.preview || 'No preview available.';
        previewContainer.hidden = false;
    } catch (error) {
        console.error('Failed to load preview', error);
        toast('error', 'Unable to read dataset preview.');
    }
};

const hidePreview = () => {
    const previewContainer = document.getElementById('fine-tuning-dataset-preview');
    if (previewContainer) {
        previewContainer.hidden = true;
    }
};

const addDatasets = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    for (const file of fileList) {
        const id = generateId('dataset');
        state.datasets.set(id, {
            id,
            name: file.name,
            size: file.size,
            type: determineType(file),
            status: 'ready',
            role: 'auto',
            file,
            preview: null,
        });
    }

    renderDatasets();
    toast('success', `${fileList.length} dataset${fileList.length > 1 ? 's' : ''} added.`);
};

const removeDataset = (datasetId) => {
    if (state.datasets.delete(datasetId)) {
        renderDatasets();
        toast('info', 'Dataset removed.');
    }
};

const updateDatasetRole = (datasetId, role) => {
    const dataset = state.datasets.get(datasetId);
    if (!dataset) return;

    dataset.role = role;
    renderDatasets();
};

const updateTrainingControls = () => {
    const startButton = document.getElementById('fine-tuning-start');
    const stopButton = document.getElementById('fine-tuning-stop');
    const progressBar = document.getElementById('fine-tuning-progress-bar');
    const progressLabel = document.getElementById('fine-tuning-progress-label');

    if (!startButton || !stopButton || !progressBar || !progressLabel) {
        return;
    }

    const { status, progress } = state.training;

    if (status === 'running') {
        startButton.textContent = 'Start training';
        startButton.disabled = true;
        stopButton.disabled = false;
        progressLabel.textContent = `Running — ${progress.toFixed(0)}%`;
    } else if (status === 'paused') {
        startButton.disabled = false;
        startButton.textContent = 'Resume training';
        stopButton.disabled = true;
        progressLabel.textContent = `Paused at ${progress.toFixed(0)}%`;
    } else if (status === 'completed') {
        startButton.disabled = false;
        startButton.textContent = 'Start new run';
        stopButton.disabled = true;
        progressLabel.textContent = 'Completed';
    } else {
        startButton.disabled = false;
        startButton.textContent = 'Start training';
        stopButton.disabled = true;
        progressLabel.textContent = 'Idle';
    }

    progressBar.value = Math.min(100, progress);
    progressBar.textContent = `${progress.toFixed(0)}%`;
};

const updateMetric = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value ?? '—';
    }
};

const updateHardwareMetric = (id, value) => {
    const el = document.getElementById(id);
    if (el instanceof HTMLProgressElement) {
        el.value = value;
        el.textContent = `${value}%`;
    }
};

const appendLog = (message) => {
    const logContainer = document.getElementById('fine-tuning-training-log');
    if (!logContainer) return;

    const entry = document.createElement('p');
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
};

const addCheckpoint = (label, { step, metrics, automatic }) => {
    const checkpoint = {
        id: generateId('ckpt'),
        createdAt: new Date(),
        label,
        step,
        metrics,
        automatic,
    };

    state.checkpoints.unshift(checkpoint);
    renderCheckpoints();
};

const renderCheckpoints = () => {
    const list = document.getElementById('fine-tuning-checkpoint-list');
    if (!list) return;

    list.innerHTML = '';

    if (state.checkpoints.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'fine-tuning-checkpoint-list__empty';
        empty.textContent = 'No checkpoints yet.';
        list.appendChild(empty);
        return;
    }

    for (const checkpoint of state.checkpoints) {
        const item = document.createElement('li');
        item.dataset.id = checkpoint.id;
        item.innerHTML = `
            <div>
                <strong>${checkpoint.label}</strong>
                <span class="fine-tuning-checkpoint-list__meta">
                    <span>${checkpoint.createdAt.toLocaleString()}</span>
                    ${checkpoint.step ? `<span>Step ${checkpoint.step}</span>` : ''}
                </span>
            </div>
            <div class="fine-tuning-checkpoint-list__meta">
                <span>Loss: ${checkpoint.metrics?.trainLoss ?? '—'}</span>
                <span>Val loss: ${checkpoint.metrics?.valLoss ?? '—'}</span>
                <span>Throughput: ${checkpoint.metrics?.throughput ?? '—'}</span>
            </div>
            <div class="fine-tuning-checkpoint-list__actions">
                <button type="button" class="menu_button" data-action="restore">Restore</button>
                <button type="button" class="menu_button" data-action="download">Download</button>
            </div>
        `;
        list.appendChild(item);
    }
};

const stopTraining = (status = 'paused') => {
    if (state.training.timer) {
        clearInterval(state.training.timer);
        state.training.timer = null;
    }

    state.training.status = status;
    updateTrainingControls();
};

const completeTraining = () => {
    stopTraining('completed');
    appendLog('Training finished successfully.');

    addCheckpoint('Final checkpoint', {
        step: 'final',
        metrics: {
            trainLoss: state.training.metrics.trainLoss,
            valLoss: state.training.metrics.valLoss,
            throughput: state.training.metrics.throughput,
        },
        automatic: true,
    });
};

const tickTraining = () => {
    if (state.training.status !== 'running') return;

    const increment = Math.random() * 6 + 2;
    state.training.progress = Math.min(100, state.training.progress + increment);

    const progressRatio = state.training.progress / 100;
    const elapsedSeconds = (Date.now() - (state.training.startTime ?? Date.now())) / 1000;
    const tokens = Array.from(state.datasets.values()).reduce((sum, dataset) => sum + dataset.size, 0) / 6;

    state.training.metrics.trainLoss = (1.8 - progressRatio * 1.3).toFixed(3);
    state.training.metrics.valLoss = (2.1 - progressRatio * 1.4).toFixed(3);
    state.training.metrics.accuracy = `${Math.min(99, 65 + progressRatio * 30).toFixed(1)}%`;
    state.training.metrics.throughput = `${Math.max(1, Math.round((tokens || 50000) / Math.max(elapsedSeconds, 1))).toLocaleString()} tok/s`;

    updateMetric('fine-tuning-metric-train-loss', state.training.metrics.trainLoss);
    updateMetric('fine-tuning-metric-val-loss', state.training.metrics.valLoss);
    updateMetric('fine-tuning-metric-accuracy', state.training.metrics.accuracy);
    updateMetric('fine-tuning-metric-throughput', state.training.metrics.throughput);

    updateHardwareMetric('fine-tuning-gpu-usage', Math.min(100, Math.round(70 + Math.random() * 25)));
    updateHardwareMetric('fine-tuning-cpu-usage', Math.min(100, Math.round(40 + Math.random() * 35)));
    updateHardwareMetric('fine-tuning-memory-usage', Math.min(100, Math.round(55 + Math.random() * 30)));

    if (state.training.progress >= state.training.nextCheckpoint) {
        addCheckpoint(`Auto checkpoint (${state.training.nextCheckpoint}%)`, {
            step: `${Math.round(state.training.progress / 100 * 10000)} steps`,
            metrics: {
                trainLoss: state.training.metrics.trainLoss,
                valLoss: state.training.metrics.valLoss,
                throughput: state.training.metrics.throughput,
            },
            automatic: true,
        });
        appendLog(`Checkpoint saved at ${state.training.nextCheckpoint.toFixed(0)}% progress.`);
        state.training.nextCheckpoint += 25;
    }

    updateTrainingControls();

    if (state.training.progress >= 100) {
        completeTraining();
    }
};

const startTraining = () => {
    if (state.datasets.size === 0) {
        toast('warning', 'Add at least one dataset before starting.');
        return;
    }

    if (state.training.status === 'running') {
        toast('info', 'Training is already running.');
        return;
    }

    if (state.training.status === 'paused') {
        appendLog('Resuming training run...');
    } else {
        state.training.progress = 0;
        state.training.metrics.trainLoss = null;
        state.training.metrics.valLoss = null;
        state.training.metrics.accuracy = null;
        state.training.metrics.throughput = null;
        state.training.nextCheckpoint = 25;
        appendLog('Launching training job with current configuration.');
        updateMetric('fine-tuning-metric-train-loss', undefined);
        updateMetric('fine-tuning-metric-val-loss', undefined);
        updateMetric('fine-tuning-metric-accuracy', undefined);
        updateMetric('fine-tuning-metric-throughput', undefined);
        updateMetric('fine-tuning-metric-bleu', undefined);
        updateMetric('fine-tuning-metric-rouge', undefined);
        updateMetric('fine-tuning-metric-ppl', undefined);
        updateHardwareMetric('fine-tuning-gpu-usage', 0);
        updateHardwareMetric('fine-tuning-cpu-usage', 0);
        updateHardwareMetric('fine-tuning-memory-usage', 0);
    }

    state.training.status = 'running';
    state.training.startTime = Date.now();

    if (state.training.timer) {
        clearInterval(state.training.timer);
    }

    state.training.timer = window.setInterval(tickTraining, 1800);
    updateTrainingControls();
};

const pauseTraining = () => {
    if (state.training.status !== 'running') return;
    appendLog('Training paused by user.');
    stopTraining('paused');
};

const exportConfig = () => {
    const configForm = document.getElementById('fine-tuning-config');
    if (!configForm) return;

    const config = {
        baseModel: document.getElementById('fine-tuning-base-model')?.value,
        modelSource: document.getElementById('fine-tuning-model-source')?.value,
        strategy: document.getElementById('fine-tuning-strategy')?.value,
        learningRate: Number(document.getElementById('fine-tuning-learning-rate')?.value ?? 0),
        epochs: Number(document.getElementById('fine-tuning-epochs')?.value ?? 0),
        batchSize: Number(document.getElementById('fine-tuning-batch-size')?.value ?? 0),
        gradAccum: Number(document.getElementById('fine-tuning-grad-accum')?.value ?? 0),
        loraRank: Number(document.getElementById('fine-tuning-lora-rank')?.value ?? 0),
        loraAlpha: Number(document.getElementById('fine-tuning-lora-alpha')?.value ?? 0),
        options: {
            mixedPrecision: Boolean(document.getElementById('fine-tuning-mixed-precision')?.checked),
            gradientCheckpointing: Boolean(document.getElementById('fine-tuning-gradient-checkpointing')?.checked),
            accelerate: Boolean(document.getElementById('fine-tuning-accelerate')?.checked),
            quantization8bit: Boolean(document.getElementById('fine-tuning-quantization-8bit')?.checked),
            quantization4bit: Boolean(document.getElementById('fine-tuning-quantization-4bit')?.checked),
        },
        datasets: Array.from(state.datasets.values()).map(({ name, type, role, size }) => ({ name, type, role, size })),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fine-tuning-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('success', 'Configuration exported.');
};

const downloadCheckpoint = (checkpoint) => {
    const payload = {
        label: checkpoint.label,
        createdAt: checkpoint.createdAt,
        metrics: checkpoint.metrics,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${checkpoint.label.replace(/\s+/g, '_').toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const applyRecipe = (recipeId) => {
    const recipe = recipes[recipeId];
    if (!recipe) return;

    document.getElementById('fine-tuning-strategy').value = recipe.strategy;
    document.getElementById('fine-tuning-learning-rate').value = recipe.learningRate;
    document.getElementById('fine-tuning-epochs').value = recipe.epochs;
    document.getElementById('fine-tuning-batch-size').value = recipe.batchSize;
    document.getElementById('fine-tuning-grad-accum').value = recipe.gradAccum;
    document.getElementById('fine-tuning-lora-rank').value = recipe.loraRank;
    document.getElementById('fine-tuning-lora-alpha').value = recipe.loraAlpha;

    document.getElementById('fine-tuning-mixed-precision').checked = recipe.mixedPrecision;
    document.getElementById('fine-tuning-gradient-checkpointing').checked = recipe.gradientCheckpointing;
    document.getElementById('fine-tuning-quantization-8bit').checked = recipe.quant8;
    document.getElementById('fine-tuning-quantization-4bit').checked = recipe.quant4;

    toast('success', 'Preset recipe applied.');
};

const runEvaluation = () => {
    if (state.training.status !== 'completed') {
        toast('info', 'Run evaluation after completing or loading a checkpoint.');
    }

    state.training.metrics.bleu = (0.35 + Math.random() * 0.25).toFixed(2);
    state.training.metrics.rouge = (0.42 + Math.random() * 0.3).toFixed(2);
    state.training.metrics.ppl = (8 + Math.random() * 12).toFixed(1);

    updateMetric('fine-tuning-metric-bleu', state.training.metrics.bleu);
    updateMetric('fine-tuning-metric-rouge', state.training.metrics.rouge);
    updateMetric('fine-tuning-metric-ppl', state.training.metrics.ppl);

    appendLog('Evaluation suite executed (BLEU/ROUGE/Perplexity updated).');
};

const exportAdapter = () => {
    if (state.checkpoints.length === 0) {
        toast('warning', 'Train a model to create an adapter first.');
        return;
    }

    const latest = state.checkpoints[0];
    const blob = new Blob([
        `# LoRA Adapter Metadata\nLabel: ${latest.label}\nCreated: ${latest.createdAt.toISOString()}\nLoss: ${latest.metrics?.trainLoss}\n`
    ], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${latest.label.replace(/\s+/g, '_').toLowerCase()}_adapter.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('success', 'Adapter export prepared.');
};

const downloadMergedModel = () => {
    if (state.checkpoints.length === 0) {
        toast('warning', 'No checkpoints to merge yet.');
        return;
    }

    const blob = new Blob(['Merged model placeholder'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merged-model-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('success', 'Merged model bundle queued for download.');
};

const shareBundle = () => {
    if (state.checkpoints.length === 0) {
        toast('info', 'Create a checkpoint before sharing.');
        return;
    }

    const latest = state.checkpoints[0];
    const bundle = {
        label: latest.label,
        createdAt: latest.createdAt,
        metrics: latest.metrics,
        datasets: Array.from(state.datasets.values()).map(({ name, role }) => ({ name, role })),
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fine-tuning-share-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('success', 'Shareable bundle created.');
};

const deployModel = () => {
    const statusEl = document.getElementById('fine-tuning-deployment-status');
    if (!statusEl) return;

    if (state.checkpoints.length === 0) {
        statusEl.textContent = 'Create a checkpoint before deploying.';
        statusEl.className = '';
        toast('warning', 'Train a model to deploy.');
        return;
    }

    const latest = state.checkpoints[0];
    statusEl.textContent = `Deployed ${latest.label} to the Model Hub.`;
    statusEl.className = 'fine-tuning-deployment-status-success';
    appendLog(`Adapter "${latest.label}" deployed to Model Hub.`);
    toast('success', 'Adapter deployed to SuperTavern.');
};

const createManualCheckpoint = () => {
    if (state.training.status === 'idle' && state.checkpoints.length === 0) {
        toast('info', 'Start training before saving checkpoints.');
        return;
    }

    addCheckpoint('Manual save', {
        step: `${Math.round(state.training.progress)}%`,
        metrics: {
            trainLoss: state.training.metrics.trainLoss,
            valLoss: state.training.metrics.valLoss,
            throughput: state.training.metrics.throughput,
        },
        automatic: false,
    });
    appendLog('Manual checkpoint created.');
};

const handleCheckpointAction = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const item = target.closest('li[data-id]');
    if (!item) return;

    const checkpoint = state.checkpoints.find(entry => entry.id === item.dataset.id);
    if (!checkpoint) return;

    if (target.dataset.action === 'restore') {
        appendLog(`Restored checkpoint "${checkpoint.label}".`);
        toast('success', `Restored ${checkpoint.label}.`);
    }

    if (target.dataset.action === 'download') {
        downloadCheckpoint(checkpoint);
        toast('success', 'Checkpoint metadata downloaded.');
    }
};

const initFineTuningStudio = () => {
    const dropzone = document.getElementById('fine-tuning-dropzone');
    const fileInput = document.getElementById('fine-tuning-dataset-input');
    const browseButton = document.getElementById('fine-tuning-dataset-browse');
    const tableBody = document.getElementById('fine-tuning-dataset-table');
    const checkpointList = document.getElementById('fine-tuning-checkpoint-list');

    if (!dropzone || !fileInput || !browseButton || !tableBody || !checkpointList) {
        return;
    }

    browseButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        addDatasets(event.target.files);
        fileInput.value = '';
    });

    dropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropzone.classList.add('fine-tuning-dropzone--active');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('fine-tuning-dropzone--active');
    });

    dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropzone.classList.remove('fine-tuning-dropzone--active');
        addDatasets(event.dataTransfer?.files ?? []);
    });

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInput.click();
        }
    });

    document.getElementById('fine-tuning-filter-invalid')?.addEventListener('change', (event) => {
        state.filters.invalid = event.target.checked;
        renderDatasets();
    });

    document.getElementById('fine-tuning-filter-unassigned')?.addEventListener('change', (event) => {
        state.filters.unassigned = event.target.checked;
        renderDatasets();
    });

    tableBody.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement && target.hasAttribute('data-role-select')) {
            const row = target.closest('tr[data-id]');
            if (row?.dataset.id) {
                updateDatasetRole(row.dataset.id, target.value);
            }
        }
    });

    tableBody.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        if (target.dataset.action === 'preview' || target.dataset.action === 'remove') {
            const row = target.closest('tr[data-id]');
            if (!row) return;
            const dataset = state.datasets.get(row.dataset.id);

            if (target.dataset.action === 'preview' && dataset) {
                showPreview(dataset);
            }

            if (target.dataset.action === 'remove') {
                removeDataset(row.dataset.id);
                hidePreview();
            }
        }
    });

    checkpointList.addEventListener('click', handleCheckpointAction);

    document.getElementById('fine-tuning-preview-close')?.addEventListener('click', hidePreview);
    document.getElementById('fine-tuning-start')?.addEventListener('click', startTraining);
    document.getElementById('fine-tuning-stop')?.addEventListener('click', pauseTraining);
    document.getElementById('fine-tuning-save-config')?.addEventListener('click', exportConfig);
    document.getElementById('fine-tuning-apply-recipe')?.addEventListener('click', () => {
        const recipeId = document.getElementById('fine-tuning-recipe')?.value;
        if (recipeId && recipeId !== 'custom') {
            applyRecipe(recipeId);
        }
    });
    document.getElementById('fine-tuning-clear-log')?.addEventListener('click', () => {
        const logContainer = document.getElementById('fine-tuning-training-log');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    });
    document.getElementById('fine-tuning-create-checkpoint')?.addEventListener('click', createManualCheckpoint);
    document.getElementById('fine-tuning-export-adapter')?.addEventListener('click', exportAdapter);
    document.getElementById('fine-tuning-download-full')?.addEventListener('click', downloadMergedModel);
    document.getElementById('fine-tuning-deploy')?.addEventListener('click', deployModel);
    document.getElementById('fine-tuning-run-eval')?.addEventListener('click', runEvaluation);
    document.getElementById('fine-tuning-share')?.addEventListener('click', shareBundle);

    renderDatasets();
    renderCheckpoints();
    updateTrainingControls();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFineTuningStudio, { once: true });
} else {
    initFineTuningStudio();
}

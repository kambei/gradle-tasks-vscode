const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let currentPanel = undefined;
let taskResults = new Map(); // Store task execution results

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Gradle Tasks Visualizer extension is now active!');

    // Register commands
    const openCommand = vscode.commands.registerCommand('gradle-tasks.open', () => {
        createOrShowPanel(context);
    });

    const refreshCommand = vscode.commands.registerCommand('gradle-tasks.refresh', () => {
        if (currentPanel) {
            loadGradleTasks();
        }
    });

    const runTaskCommand = vscode.commands.registerCommand('gradle-tasks.runTask', () => {
        if (currentPanel) {
            currentPanel.webview.postMessage({ command: 'showTaskSelector' });
        }
    });

    const zoomInCommand = vscode.commands.registerCommand('gradle-tasks.zoomIn', () => {
        if (currentPanel) {
            currentPanel.webview.postMessage({ command: 'zoomIn' });
        }
    });

    const zoomOutCommand = vscode.commands.registerCommand('gradle-tasks.zoomOut', () => {
        if (currentPanel) {
            currentPanel.webview.postMessage({ command: 'zoomOut' });
        }
    });

    context.subscriptions.push(openCommand, refreshCommand, runTaskCommand, zoomInCommand, zoomOutCommand);

    // Handle webview messages
    if (currentPanel) {
        setupWebviewMessageHandler(context);
    }
}

function createOrShowPanel(context) {
    const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

    if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
        return;
    }

    // Create and show panel
    currentPanel = vscode.window.createWebviewPanel(
        'gradleTasksVisualizer',
        'Gradle Tasks Visualizer',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
        }
    );

    // Set webview content
    currentPanel.webview.html = getWebviewContent(context);

    // Handle messages from webview
    setupWebviewMessageHandler(context);

    // Handle panel disposal
    currentPanel.onDidDispose(
        () => {
            currentPanel = undefined;
        },
        null,
        context.subscriptions
    );

    // Load tasks when panel is ready
    currentPanel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'ready') {
                loadGradleTasks();
            }
        },
        null,
        context.subscriptions
    );
}

function setupWebviewMessageHandler(context) {
    if (!currentPanel) return;

    currentPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'runTask':
                    await runGradleTask(message.taskName);
                    break;
                case 'getTaskDetails':
                    getTaskDetails(message.taskName);
                    break;
                case 'refresh':
                    loadGradleTasks();
                    break;
            }
        },
        null,
        context.subscriptions
    );
}

function getGradleCommand() {
    const config = vscode.workspace.getConfiguration('gradleTasks');
    const useWrapper = config.get('gradleWrapper', true);
    const customCommand = config.get('gradleCommand', 'gradle');

    if (useWrapper) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            const wrapperPath = path.join(workspaceFolder.uri.fsPath, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
            if (fs.existsSync(wrapperPath)) {
                // Use absolute path for wrapper to avoid path issues
                if (process.platform === 'win32') {
                    return wrapperPath;
                } else {
                    // Make sure wrapper is executable
                    try {
                        fs.chmodSync(wrapperPath, '755');
                    } catch (e) {
                        console.warn(`[Gradle Tasks] Could not set executable permission on gradlew: ${e.message}`);
                    }
                    return wrapperPath;
                }
            }
        }
    }

    return customCommand;
}

function getWorkspacePath() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
}

function loadGradleTasks() {
    if (!currentPanel) return;

    const gradleCommand = getGradleCommand();
    const workspacePath = getWorkspacePath();

    console.log(`[Gradle Tasks] Loading tasks with command: ${gradleCommand} in ${workspacePath}`);

    currentPanel.webview.postMessage({
        command: 'loading',
        message: 'Loading Gradle tasks...'
    });

    // Try to get tasks in JSON format first (Gradle 5.1+), fallback to plain text
    // Use --console=plain to avoid ANSI codes and get clean output
    const command = `${gradleCommand} tasks --all --console=plain`;
    console.log(`[Gradle Tasks] Executing: ${command}`);
    
    exec(command, 
        { 
            cwd: workspacePath,
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
        },
        (error, stdout, stderr) => {
            if (error) {
                const errorMsg = stderr && stderr.trim() ? stderr.trim() : error.message;
                console.error(`[Gradle Tasks] Error loading tasks:`, error);
                console.error(`[Gradle Tasks] stderr:`, stderr);
                console.error(`[Gradle Tasks] stdout:`, stdout);
                currentPanel.webview.postMessage({
                    command: 'error',
                    message: `Failed to load tasks: ${errorMsg}\n\nCommand: ${gradleCommand}\nWorking directory: ${workspacePath}`
                });
                return;
            }

            console.log(`[Gradle Tasks] Command output length: ${stdout.length} characters`);
            console.log(`[Gradle Tasks] First 500 chars of output:`, stdout.substring(0, 500));

            // Parse tasks from output
            const tasks = parseGradleTasks(stdout);
            console.log(`[Gradle Tasks] Parsed ${tasks.length} tasks`);
            
            if (tasks.length === 0) {
                console.warn(`[Gradle Tasks] No tasks found. Full output:`, stdout);
                currentPanel.webview.postMessage({
                    command: 'error',
                    message: `No Gradle tasks found. Make sure you are in a Gradle project.\n\nCommand: ${gradleCommand}\nWorking directory: ${workspacePath}\n\nOutput preview:\n${stdout.substring(0, 500)}...`
                });
                return;
            }
            
            // Get task dependencies
            getTaskDependencies(tasks, gradleCommand, workspacePath);
        }
    );
}

function parseGradleTasks(output) {
    const tasks = [];
    const lines = output.split('\n');
    let currentGroup = '';
    let inTasksSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Check if we're in the tasks section - look for various patterns
        if (!inTasksSection) {
            // Look for "---" separator with "Tasks" or task listing indicators
            if ((trimmed.includes('---') && (trimmed.includes('Tasks') || trimmed.includes('Task'))) ||
                trimmed.match(/^All tasks runnable from root project/i) ||
                trimmed.match(/^Tasks runnable from root project/i)) {
                inTasksSection = true;
                console.log(`[Gradle Tasks] Found tasks section at line ${i + 1}`);
                continue;
            }
            continue;
        }

        // Check for end of tasks section
        if (trimmed.includes('---') && !trimmed.includes('Tasks')) {
            // Might be end of section, but continue parsing in case there are more sections
        }

        // Check for group headers - more flexible pattern
        const groupMatch = trimmed.match(/^([A-Za-z\s&]+)\s+tasks?$/i);
        if (groupMatch) {
            currentGroup = groupMatch[1].trim();
            console.log(`[Gradle Tasks] Found group: ${currentGroup}`);
            continue;
        }

        // Skip empty lines and separators
        if (!trimmed || trimmed === '---' || trimmed.match(/^=+$/)) {
            continue;
        }

        // Parse task line - more flexible patterns
        // Pattern 1: taskName - description
        // Pattern 2: taskName - description (with parentheses)
        // Pattern 3: taskName (no description)
        let taskMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9:_-]+)\s*-\s*(.+)$/);
        if (!taskMatch) {
            // Try pattern without description
            taskMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9:_-]+)\s*$/);
            if (taskMatch) {
                const taskName = taskMatch[1].trim();
                tasks.push({
                    name: taskName,
                    description: '',
                    group: currentGroup || 'Other',
                    dependencies: [],
                    result: taskResults.get(taskName) || null
                });
                continue;
            }
        } else {
            const taskName = taskMatch[1].trim();
            const description = taskMatch[2].trim();
            
            tasks.push({
                name: taskName,
                description: description,
                group: currentGroup || 'Other',
                dependencies: [],
                result: taskResults.get(taskName) || null
            });
        }
    }

    // If no tasks found with the standard parsing, try alternative parsing
    if (tasks.length === 0) {
        console.log(`[Gradle Tasks] Standard parsing found no tasks, trying alternative parsing`);
        // Try to find any line that looks like a task name
        for (const line of lines) {
            const trimmed = line.trim();
            // Look for lines that start with a letter and contain only task-name-like characters
            const taskMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9:_-]+)(\s|$)/);
            if (taskMatch && !trimmed.includes('---') && !trimmed.match(/tasks?$/i)) {
                const taskName = taskMatch[1].trim();
                // Skip if it looks like a header or separator
                if (taskName.length > 1 && !taskName.match(/^(All|Tasks|Task|Build|Verification|Documentation|Help|Other)$/i)) {
                    tasks.push({
                        name: taskName,
                        description: '',
                        group: 'Other',
                        dependencies: [],
                        result: taskResults.get(taskName) || null
                    });
                }
            }
        }
    }

    return tasks;
}

function getTaskDependencies(tasks, gradleCommand, workspacePath) {
    // Get task dependencies using Gradle's task dependency report
    exec(`${gradleCommand} taskReport --console=plain 2>/dev/null || ${gradleCommand} tasks --all --console=plain`, 
        { cwd: workspacePath },
        (error, stdout, stderr) => {
            // Try to get dependencies for each task
            const tasksWithDeps = tasks.map(task => {
                // Extract dependencies from task name patterns
                // Common patterns: build depends on compile, test depends on compileTest, etc.
                const deps = inferDependencies(task.name, tasks);
                return { ...task, dependencies: deps };
            });

            if (currentPanel) {
                currentPanel.webview.postMessage({
                    command: 'tasksLoaded',
                    tasks: tasksWithDeps
                });
            }
        }
    );
}

function inferDependencies(taskName, allTasks) {
    const dependencies = [];
    
    // Common dependency patterns
    const patterns = {
        'build': ['compile', 'test', 'jar'],
        'test': ['compileTest'],
        'compileTest': ['compile'],
        'jar': ['compile'],
        'war': ['compile', 'jar'],
        'assemble': ['jar'],
        'check': ['test'],
        'clean': []
    };

    // Check patterns
    for (const [pattern, deps] of Object.entries(patterns)) {
        if (taskName.includes(pattern) || taskName === pattern) {
            deps.forEach(dep => {
                const found = allTasks.find(t => t.name.includes(dep) || t.name === dep);
                if (found) {
                    dependencies.push(found.name);
                }
            });
        }
    }

    return dependencies;
}

async function runGradleTask(taskName) {
    if (!currentPanel) return;

    const gradleCommand = getGradleCommand();
    const workspacePath = getWorkspacePath();

    currentPanel.webview.postMessage({
        command: 'taskRunning',
        taskName: taskName
    });

    return new Promise((resolve) => {
        const startTime = Date.now();
        
        exec(`${gradleCommand} ${taskName} --console=plain`, 
            { cwd: workspacePath },
            (error, stdout, stderr) => {
                const duration = Date.now() - startTime;
                const success = !error;
                
                const result = {
                    taskName: taskName,
                    success: success,
                    duration: duration,
                    output: stdout,
                    error: error ? error.message : null,
                    timestamp: new Date().toISOString()
                };

                taskResults.set(taskName, result);

                if (currentPanel) {
                    currentPanel.webview.postMessage({
                        command: 'taskCompleted',
                        result: result
                    });
                }

                // Show notification
                if (success) {
                    vscode.window.showInformationMessage(`Task "${taskName}" completed successfully in ${(duration / 1000).toFixed(2)}s`);
                } else {
                    vscode.window.showErrorMessage(`Task "${taskName}" failed: ${error.message}`);
                }

                resolve(result);
            }
        );
    });
}

function getTaskDetails(taskName) {
    const gradleCommand = getGradleCommand();
    const workspacePath = getWorkspacePath();

    exec(`${gradleCommand} help --task ${taskName}`, 
        { cwd: workspacePath },
        (error, stdout, stderr) => {
            if (currentPanel) {
                currentPanel.webview.postMessage({
                    command: 'taskDetails',
                    taskName: taskName,
                    details: stdout
                });
            }
        }
    );
}

function getWebviewContent(context) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gradle Tasks Visualizer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            overflow: hidden;
            height: 100vh;
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        .toolbar {
            padding: 10px;
            background-color: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .toolbar button {
            padding: 6px 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }

        .toolbar button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .toolbar button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .toolbar .status {
            margin-left: auto;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .tasks-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }

        .task-group {
            margin-bottom: 20px;
        }

        .group-header {
            font-size: 14px;
            font-weight: 600;
            padding: 8px 12px;
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
            border-radius: 4px;
            margin-bottom: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
        }

        .group-header:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .group-header .toggle {
            font-size: 12px;
            opacity: 0.7;
        }

        .group-header.collapsed .toggle::before {
            content: '▶';
        }

        .group-header.expanded .toggle::before {
            content: '▼';
        }

        .task-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .task-item {
            padding: 8px 12px;
            margin: 2px 0;
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background-color 0.2s;
        }

        .task-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .task-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .task-item.running {
            animation: pulse 1.5s infinite;
        }

        .task-info {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .task-name {
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 2px;
        }

        .task-description {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            opacity: 0.8;
        }

        .task-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }

        .status-indicator.success {
            background-color: #4caf50;
        }

        .status-indicator.failure {
            background-color: #f44336;
        }

        .status-indicator.running {
            background-color: #2196f3;
            animation: pulse 1.5s infinite;
        }

        .status-indicator.pending {
            background-color: #9e9e9e;
        }

        .task-actions {
            display: flex;
            gap: 4px;
        }

        .task-actions button {
            padding: 4px 8px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }

        .task-actions button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .task-output-section {
            display: block;
            margin-top: 8px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            font-size: 11px;
        }

        .output-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
            cursor: pointer;
            user-select: none;
        }

        .output-header:hover {
            opacity: 0.8;
        }

        .output-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }

        .output-status.running {
            color: #2196f3;
        }

        .output-status.success {
            color: #4caf50;
        }

        .output-status.failure {
            color: #f44336;
        }

        .output-content {
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-break: break-word;
            background-color: var(--vscode-textBlockQuote-background);
            padding: 8px;
            border-radius: 3px;
            margin-top: 8px;
            display: none;
        }

        .task-output-section.expanded .output-content {
            display: block;
        }

        .output-content.empty {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        .output-close {
            cursor: pointer;
            padding: 2px 6px;
            opacity: 0.7;
        }

        .output-close:hover {
            opacity: 1;
        }


        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .loading {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 40px 20px;
        }

        .error {
            text-align: center;
            color: #f44336;
            padding: 40px 20px;
            white-space: pre-wrap;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="toolbar">
            <button onclick="refreshTasks()">🔄 Refresh</button>
            <button id="runButton" onclick="runSelectedTask()" disabled>▶️ Run Task</button>
            <div class="status" id="status">Ready</div>
        </div>
        <div class="tasks-container" id="tasksContainer">
            <div class="loading" id="loading" style="display: none;">Loading tasks...</div>
            <div class="error" id="error" style="display: none;"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let tasks = [];
        let selectedTask = null;
        let collapsedGroups = new Set();
        let expandedTasks = new Set();

        const tasksContainer = document.getElementById('tasksContainer');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const status = document.getElementById('status');
        const runButton = document.getElementById('runButton');

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'ready':
                    vscode.postMessage({ command: 'ready' });
                    break;
                case 'loading':
                    showLoading(message.message);
                    break;
                case 'tasksLoaded':
                    tasks = message.tasks;
                    hideLoading();
                    renderTaskList();
                    break;
                case 'error':
                    showError(message.message);
                    break;
                case 'taskRunning':
                    updateTaskStatus(message.taskName, 'running');
                    break;
                case 'taskCompleted':
                    updateTaskResult(message.result);
                    break;
            }
        });

        // Notify extension that webview is ready
        vscode.postMessage({ command: 'ready' });

        function showLoading(message) {
            loading.textContent = message;
            loading.style.display = 'block';
            error.style.display = 'none';
        }

        function hideLoading() {
            loading.style.display = 'none';
        }

        function showError(message) {
            error.textContent = message;
            error.style.display = 'block';
            loading.style.display = 'none';
        }

        function refreshTasks() {
            vscode.postMessage({ command: 'refresh' });
            showLoading('Refreshing tasks...');
        }

        function runSelectedTask() {
            if (selectedTask) {
                vscode.postMessage({ command: 'runTask', taskName: selectedTask });
            }
        }

        function toggleGroup(groupName) {
            if (collapsedGroups.has(groupName)) {
                collapsedGroups.delete(groupName);
            } else {
                collapsedGroups.add(groupName);
            }
            renderTaskList();
        }

        function selectTask(taskName) {
            selectedTask = taskName;
            runButton.disabled = !taskName;
            renderTaskList();
        }

        function runTask(taskName) {
            // Expand the output section for this task
            expandedTasks.add(taskName);
            vscode.postMessage({ command: 'runTask', taskName: taskName });
            renderTaskList();
        }

        function toggleTaskOutput(taskName) {
            if (expandedTasks.has(taskName)) {
                expandedTasks.delete(taskName);
            } else {
                expandedTasks.add(taskName);
            }
            renderTaskList();
        }

        function renderTaskList() {
            // Clear container
            tasksContainer.innerHTML = '';
            
            if (tasks.length === 0) {
                showError('No Gradle tasks found. Make sure you are in a Gradle project.');
                return;
            }

            status.textContent = \`\${tasks.length} tasks loaded\`;

            // Group tasks by their group
            const groups = {};
            tasks.forEach(task => {
                const groupName = task.group || 'Other';
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(task);
            });

            // Sort groups alphabetically
            const sortedGroups = Object.keys(groups).sort();

            sortedGroups.forEach(groupName => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'task-group';

                const header = document.createElement('div');
                header.className = \`group-header \${collapsedGroups.has(groupName) ? 'collapsed' : 'expanded'}\`;
                header.innerHTML = \`
                    <span>\${groupName}</span>
                    <span class="toggle"></span>
                \`;
                header.onclick = () => toggleGroup(groupName);
                groupDiv.appendChild(header);

                const taskList = document.createElement('ul');
                taskList.className = 'task-list';
                taskList.style.display = collapsedGroups.has(groupName) ? 'none' : 'block';

                groups[groupName].forEach(task => {
                    const taskItem = document.createElement('li');
                    taskItem.className = \`task-item \${selectedTask === task.name ? 'selected' : ''} \${task.running ? 'running' : ''}\`;
                    taskItem.setAttribute('data-task', task.name);

                    let statusClass = 'pending';
                    if (task.result) {
                        statusClass = task.result.success ? 'success' : 'failure';
                    }
                    if (task.running) {
                        statusClass = 'running';
                    }

                    const isExpanded = expandedTasks.has(task.name);
                    const hasOutput = task.running || task.result;

                    taskItem.innerHTML = \`
                        <div style="width: 100%;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div class="task-info" style="flex: 1;">
                                    <div class="task-name">\${task.name}</div>
                                    \${task.description ? \`<div class="task-description">\${task.description}</div>\` : ''}
                                </div>
                                <div class="task-status">
                                    <span class="status-indicator \${statusClass}"></span>
                                    \${task.result ? \`
                                        <span>\${task.result.success ? '✓' : '✗'} \${(task.result.duration / 1000).toFixed(2)}s</span>
                                    \` : ''}
                                </div>
                                <div class="task-actions">
                                    <button onclick="event.stopPropagation(); runTask('\${task.name}')">Run</button>
                                </div>
                            </div>
                            \${hasOutput ? \`
                                <div class="task-output-section \${isExpanded ? 'expanded' : ''}">
                                    <div class="output-header" onclick="event.stopPropagation(); toggleTaskOutput('\${task.name}')">
                                        <div class="output-status \${statusClass}">
                                            \${task.running ? '⏳ Running...' : task.result ? (task.result.success ? '✓ Completed' : '✗ Failed') : 'Pending'}
                                            \${task.result ? \` - \${(task.result.duration / 1000).toFixed(2)}s\` : ''}
                                        </div>
                                        <span class="output-close">\${isExpanded ? '▼' : '▶'}</span>
                                    </div>
                                    \${isExpanded ? \`
                                        <div class="output-content \${task.result && !task.result.output && !task.result.error ? 'empty' : ''}">
                                            \${task.running ? 'Task is running...' : ''}
                                            \${task.result ? (
                                                task.result.error ? 
                                                    \`Error: \${task.result.error}\n\n\${task.result.output || 'No output'}\` : 
                                                    (task.result.output || 'Task completed with no output')
                                            ) : ''}
                                        </div>
                                    \` : ''}
                                </div>
                            \` : ''}
                        </div>
                    \`;

                    taskItem.onclick = () => selectTask(task.name);
                    taskList.appendChild(taskItem);
                });

                groupDiv.appendChild(taskList);
                tasksContainer.appendChild(groupDiv);
            });
        }

        function updateTaskStatus(taskName, status) {
            const task = tasks.find(t => t.name === taskName);
            if (task) {
                task.running = status === 'running';
                // Auto-expand when task starts running
                if (status === 'running') {
                    expandedTasks.add(taskName);
                }
            }
            renderTaskList();
        }

        function updateTaskResult(result) {
            const task = tasks.find(t => t.name === result.taskName);
            if (task) {
                task.result = result;
                task.running = false;
                // Keep output expanded after completion
                expandedTasks.add(result.taskName);
            }
            renderTaskList();
            status.textContent = \`Task "\${result.taskName}" \${result.success ? 'completed' : 'failed'}\`;
        }
    </script>
</body>
</html>`;
}

function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};


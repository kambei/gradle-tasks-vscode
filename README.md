# Gradle Tasks Visualizer - VS Code Extension

A Visual Studio Code and Cursor extension for viewing and executing Gradle tasks in an organized list view.

## Features

- 📋 **Task List** - Organized list of all Gradle tasks grouped by category
- 🎯 **Task Execution** - Run tasks directly from the list
- ✅ **Result Tracking** - Visual feedback showing task execution results (success/failure)
- 📊 **Execution Output** - View task output and execution status in expandable sections
- ⚡ **Real-time Updates** - See task execution status in real-time

## Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code or Cursor
2. Go to the Extensions view (`Ctrl+Shift+X`)
3. Search for "Gradle Tasks Visualizer"
4. Click Install

### From Source (Development)

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to open a new Extension Development Host window
5. The extension will be loaded in the new window

**Note**: This extension requires Gradle to be installed and available in your system PATH, or a Gradle wrapper (`gradlew` or `gradlew.bat`) in your project root.

## Usage

1. Open a Gradle project in VS Code or Cursor
2. Open Gradle Tasks Visualizer using one of these methods:
   - **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Gradle Tasks: Open Gradle Tasks Visualizer"
   - **Context Menu**: Right-click on `build.gradle` or `build.gradle.kts` in the Explorer panel and select "Open Gradle Tasks Visualizer"
3. The tasks panel will open showing all your Gradle tasks organized by group
4. Use the toolbar buttons:
   - **Refresh**: Reload tasks from your Gradle project
   - **Run Task**: Execute the selected task (select a task first by clicking on it)
5. Click "Run" on any task to execute it - an output section will appear showing execution status and results
6. Click on group headers to expand/collapse task groups

## Configuration

The extension can be configured through VS Code settings:

- `gradleTasks.gradleCommand`: The Gradle command to use (default: `"gradle"`)
  - Examples: `"gradle"`, `"./gradlew"`, `"gradlew.bat"`
- `gradleTasks.gradleWrapper`: Whether to use Gradle wrapper if available (default: `true`)

To configure, go to Settings (`Ctrl+,`) and search for "Gradle Tasks".

## Commands

- `Gradle Tasks: Open Gradle Tasks Visualizer` - Opens the tasks panel

**Note**: Other actions like refreshing tasks and running tasks are available through the UI buttons within the tasks panel, not as separate commands.

## Features in Detail

### Task List

Tasks are displayed in a grouped list, with:
- **Grouping**: Tasks are organized by their Gradle task groups (Build, Verification, Documentation, etc.)
- **Collapsible Groups**: Click on group headers to expand or collapse task groups
- **Status Indicators**:
  - Gray: Pending (not yet executed)
  - Green: Successfully executed
  - Red: Failed execution
  - Blue (pulsing): Currently running
- **Task Information**: Each task shows its name, description, and current status

### Task Execution

- Click on any task to select it, or click the "Run" button directly on a task
- When you run a task, an output section appears below it showing:
  - Real-time execution status (Running/Completed/Failed)
  - Execution duration
  - Full task output
  - Error messages (if the task fails)
- The output section can be expanded or collapsed by clicking on its header
- Execution results are also displayed in VS Code notifications

## Development

### Prerequisites

- Visual Studio Code or Cursor
- Node.js and npm
- Gradle installed or Gradle wrapper in project

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run compile
   ```
4. Press `F5` to open a new Extension Development Host window

### Building

```bash
# Compile the extension
npm run compile

# Watch for changes during development
npm run watch

# Package the extension (requires vsce)
npm run package
```

### Icon Generation

The extension includes scripts to generate PNG icons from SVG:

```bash
# Generate both main icon and activity bar icon
npm run create-icons

# Or generate individually
npm run create-main-icon
npm run create-activity-icon
```

**Note**: Icon generation requires the `canvas` npm package and system dependencies. To install on Fedora/RHEL:
```bash
sudo dnf install cairo-devel giflib-devel libjpeg-turbo-devel pango-devel
npm install canvas --save-dev
```

Alternatively, you can use the provided SVG icon (`media/gradle-tasks-icon.svg`) and convert it to PNG using other tools like Inkscape or online converters.

## How It Works

1. The extension detects Gradle projects by looking for `build.gradle` or `build.gradle.kts` files
2. It executes `gradle tasks --all` to retrieve all available tasks
3. Tasks are parsed and organized by their Gradle task groups
4. Tasks are displayed in a grouped list view
5. When a task is executed, the extension runs `gradle <taskName>` and tracks the result
6. Results are displayed in the task's output section with status indicators and full output

## Limitations

- Task execution output is shown in the expandable output sections; full output can also be viewed in the terminal
- Very large projects with many tasks may require scrolling through the list

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please open an issue on GitHub.

<br>

## Support Me

If you find this extension helpful, consider supporting me on Ko-fi!

[Support me on Ko-fi](https://ko-fi.com/kambei)

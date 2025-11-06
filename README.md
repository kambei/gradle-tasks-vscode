# Gradle Tasks Visualizer - VS Code Extension

A Visual Studio Code and Cursor extension for visualizing Gradle tasks and their execution results.

## Features

- 📊 **Task Visualization** - Interactive graph showing all Gradle tasks and their dependencies
- 🎯 **Task Execution** - Run tasks directly from the visualization
- ✅ **Result Tracking** - Visual feedback showing task execution results (success/failure)
- 🔗 **Dependency Graph** - See task dependencies and relationships
- 🎨 **Interactive UI** - Pan, zoom, and explore your task graph
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
3. The visualization panel will open showing all your Gradle tasks
4. Click on any task node to see details and run it
5. Use the toolbar buttons to:
   - **Refresh**: Reload tasks from your Gradle project
   - **Run Task**: Execute a selected task
   - **Zoom In/Out**: Adjust the graph zoom level
   - **Reset Zoom**: Return to default view

## Configuration

The extension can be configured through VS Code settings:

- `gradleTasks.gradleCommand`: The Gradle command to use (default: `"gradle"`)
  - Examples: `"gradle"`, `"./gradlew"`, `"gradlew.bat"`
- `gradleTasks.gradleWrapper`: Whether to use Gradle wrapper if available (default: `true`)

To configure, go to Settings (`Ctrl+,`) and search for "Gradle Tasks".

## Commands

- `Gradle Tasks: Open Gradle Tasks Visualizer` - Opens the visualization panel
- `Gradle Tasks: Refresh Tasks` - Reloads tasks from the Gradle project
- `Gradle Tasks: Run Task` - Executes a selected task
- `Gradle Tasks: Zoom In` - Increases zoom level
- `Gradle Tasks: Zoom Out` - Decreases zoom level

## Features in Detail

### Task Visualization

Tasks are displayed as nodes in a graph, with:
- **Color coding**:
  - Gray: Pending (not yet executed)
  - Green: Successfully executed
  - Red: Failed execution
  - Pulsing: Currently running
- **Grouping**: Tasks are organized by their Gradle task groups
- **Dependencies**: Lines connect tasks to show dependency relationships

### Task Execution

- Click on any task node to see its details
- Click "Run Task" in the popup to execute it
- Execution results are displayed with:
  - Success/failure status
  - Execution duration
  - Timestamp
  - Output (in the notification)

### Interactive Controls

- **Pan**: Click and drag to move around the graph
- **Zoom**: Use mouse wheel or zoom buttons
- **Task Details**: Click on any task node to see information and run it

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
3. Task dependencies are inferred from common patterns and task names
4. Tasks are rendered in a hierarchical graph layout
5. When a task is executed, the extension runs `gradle <taskName>` and tracks the result
6. Results are displayed visually on the task nodes

## Limitations

- Task dependencies are inferred from common patterns. For exact dependencies, Gradle's dependency resolution would need to be queried directly
- Large projects with many tasks may require zooming/panning to navigate effectively
- Task execution output is shown in notifications; full output can be viewed in the terminal

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

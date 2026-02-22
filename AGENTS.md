# AGENTS.md - Developer Guidelines for WhatsApp Electron

## Project Overview

WhatsApp Electron is a multi-account WhatsApp client built on Electron. It uses vanilla JavaScript with CommonJS modules (require/module.exports).

## Build & Development Commands

### Installation
```bash
npm install
```

### Running the Application
```bash
npm run start
```

### Linting & Formatting (Biome)
```bash
npm run check    # Check for issues (lint)
npm run lint     # Alias for check
npm run lint:fix # Fix auto-fixable issues
npm run format   # Format code
```

### Building
```bash
npm run dist      # Build for current platform
npm run dist:linux # Build for Linux
npm run dist:windows # Build for Windows
npm run pack      # Create unpacked directory
npm run clean     # Remove dist folder
```

### Testing
**No test framework is currently configured.** If adding tests, use:
```bash
# Example commands (not yet implemented)
npm test              # Run all tests
npm test -- --run     # Run single test file
```

## Code Style Guidelines

### General Conventions
- **Language**: JavaScript (ES6+) with CommonJS modules
- **Module System**: `require()` for imports, `module.exports` for exports
- **Indentation**: Use tabs for indentation (as seen in existing code)
- **Curly Braces**: Opening brace on same line (`class WhatsAppElectron {`)
- **Semicolons**: Use semicolons at end of statements

### Naming Conventions
- **Classes**: PascalCase (e.g., `WhatsAppElectron`)
- **Methods/Variables**: camelCase (e.g., `createWindow`, `this.store`)
- **Constants**: PascalCase for module-level constants (e.g., `Constants`, `Store`)
- **Event Names**: kebab-case strings (e.g., `"init-resources"`)
- **File Names**: kebab-case (e.g., `index-bw.js`, `preload-bv.js`)

### Import Order
1. Electron built-in modules (e.g., `require('electron')`)
2. Third-party dependencies (e.g., `require('electron-store')`)
3. Node.js built-in modules (e.g., `require('node:path')`)
4. Local modules (e.g., `require('./constants')`)

```javascript
const { app, BrowserWindow } = require('electron');
const Store = require('electron-store');
const path = require('node:path');
const fs = require('node:fs');
```

### Class Structure
```javascript
class ClassName {
    constructor() {
        // Initialize properties
    }

    methodName() {
        // Method implementation
    }
}
```

### Error Handling
- Use try-catch for async operations that may fail
- Return early on error conditions to avoid nested conditionals
- Log errors to console for debugging

### IPC Communication
- Use `ipcMain` for main process handlers
- Use `ipcRenderer` (via preload) for renderer communication
- Define all event names as constants in `constants.js`

### Electron Best Practices
- Use `app.requestSingleInstanceLock()` to prevent multiple instances
- Store window bounds using `electron-store` for persistence
- Use `webContentsView` for multiple views in single window
- Set `contextIsolation: false` when preload scripts need full access

### Working with Views
- Create views with `WebContentsView` and unique partitions
- Always set preload script for isolated contexts
- Use `setTimeout` after loading URL before sending init events (2000ms delay observed)

### Menu & Tray
- Use `Menu.buildFromTemplate()` for application menus
- Use `Tray` for system tray icon with context menu
- Handle window hide/show logic in tray click handlers

### Platform-Specific Code
- Use `process.platform` to detect OS ("win32", "linux", "darwin")
- Adjust UI offsets for different platforms in `constants.js`

## File Organization

```
src/
  index.js       # Main process entry point
  constants.js   # App constants and configuration
  index-bw.html  # Main window HTML
  preload-bw.js  # Preload for main window
  preload-bv.js  # Preload for WhatsApp views
```

## Important Constants

All IPC event names are defined in `src/constants.js`:
- `Constants.event.*` - All event name constants
- `Constants.whatsapp.*` - WhatsApp web URLs and user agents
- `Constants.offsets.*` - Window/view position offsets for different platforms

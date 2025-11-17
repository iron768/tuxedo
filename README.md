# Tuxedo - Yukon Scene Editor

A visual scene editor for CPPS Yukon built with Vue 3, TypeScript, and Phaser 3.

## Features

- 🎨 Visual scene editing with drag-and-drop support
- 🖼️ Asset loading and management from Yukon project
- 📦 Prefab support with automatic loading and property overrides
- 📐 Camera controls (pan, zoom)
- 🎯 Object selection and property editing
- 🔍 Scene hierarchy browser
- 🎮 Real-time preview with Phaser 3
- 💾 Save/load scene files
- 🐛 Structured logging for debugging

## Prerequisites

- Node.js 18+ and pnpm
- Running tuxedo-core server (see `../tuxedo-core/README.md`)

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

Edit `src/config/index.ts` to customize:
- Server URL and paths
- Editor behavior (autosave, grid)
- Camera settings (zoom speed, limits)
- Logging preferences

## Development

```bash
# Start development server (http://localhost:8080)
pnpm dev
```

The editor will connect to the tuxedo-core API server at `http://localhost:3000`.

## Building for Production

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
tuxedo/
├── src/
│   ├── api/              # API client for tuxedo-core
│   ├── components/       # Vue components
│   │   ├── ObjectList.vue
│   │   └── PropertiesPanel.vue
│   ├── config/           # Configuration
│   ├── phaser/           # Phaser scene management
│   │   ├── CameraController.ts
│   │   ├── GameObjectFactory.ts
│   │   └── PhaserScene.ts
│   ├── stores/           # Pinia state management
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utilities and logging
│   ├── views/            # Page components
│   │   ├── Home.vue
│   │   └── SceneEditor.vue
│   └── App.vue
├── public/               # Static assets
└── package.json
```

## Usage Guide

### Opening a Scene

1. Start the development server
2. Navigate to `http://localhost:8080`
3. Browse the scene list
4. Click on a scene to open it in the editor

### Camera Controls

**Mouse:**
- **Scroll wheel**: Zoom in/out
- **Middle mouse/Right click + drag**: Pan camera

**Keyboard:**
- **Arrow keys**: Pan camera
- **+ / -**: Zoom in/out
- **Shift + =**: Zoom in (alternative)

### Editing Objects

1. Click on an object in the scene or object list to select it
2. Edit properties in the right panel:
   - Position (X, Y)
   - Origin (anchor point)
   - Scale
   - Rotation (angle)
3. Changes update in real-time

### Scene Objects List

- Displays all objects in the scene
- Ordered from foreground (top) to background (bottom)
- Click to select objects
- Shows object type and label

## Logging

The editor uses a structured logging system. Open browser console to see logs:

```typescript
// Logs are namespaced and formatted
[12:34:56] [phaser] Scene loaded
[12:34:56] [api] Making request to /api/scenes/Town
```

Enable specific namespaces in `src/config/index.ts`:
```typescript
logging: {
  enabled: true,
  level: 'debug',
  namespaces: ['phaser', 'api', 'scene'] // Or ['*'] for all
}
```

## Troubleshooting

### Assets not loading
- Ensure tuxedo-core is running on port 3000
- Check that `yukon/assets/` directory exists and is accessible
- Verify pack files are properly formatted JSON
- Check browser console for 404 errors

### Scene not displaying
- Check console for Phaser errors
- Verify scene JSON format is correct
- Ensure texture pack files are loaded
- Check camera position and zoom level

### Port already in use
Change the port in `vite.config.ts`:
```typescript
server: {
  port: 8081 // Change port here
}
```

## Development Tips

### Hot Module Replacement (HMR)
- Vue components reload automatically
- Phaser scenes require manual refresh (F5)
- CSS changes apply instantly

### Debugging Phaser
```typescript
// Enable Phaser debug logging
import { logger } from '@/utils/logger'
logger.setLevel(LogLevel.DEBUG)
logger.enableNamespaces('phaser')
```

### Component Development
New components should be placed in `src/components/` and follow the naming convention:
- PascalCase for component names
- Composition API with `<script setup>`
- TypeScript for type safety

## Contributing

1. Follow the existing code style
2. Use the logging system instead of `console.log`
3. Add TypeScript types for all new code
4. Test changes with multiple scenes
5. Update documentation for new features

## Related Projects

- **tuxedo-core**: Backend API server (Go)
- **yukon**: Yukon game client (Phaser 3)

## License

See main project LICENSE file.

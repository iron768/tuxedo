/**
 * Tuxedo Editor Configuration
 * Central configuration for the editor
 */

export interface EditorConfig {
  // Server configuration
  server: {
    url: string
    assetsPath: string
  }

  // Project paths
  project: {
    yukonPath: string
    scenesPath: string
    assetsPath: string
  }

  // Asset loading
  assets: {
    mediaSubdirectories: string[]
  }

  // Editor behavior
  editor: {
    autoSave: boolean
    autoSaveInterval: number // milliseconds
    grid: {
      enabled: boolean
      size: number
      snap: boolean
    }
    camera: {
      defaultZoom: number
      minZoom: number
      maxZoom: number
      panSpeed: number
      zoomSpeed: number
    }
  }

  // Logging
  logging: {
    enabled: boolean
    level: 'debug' | 'info' | 'warn' | 'error'
    namespaces: string[]
  }
}

const config: EditorConfig = {
  server: {
    url: import.meta.env.VITE_SERVER_URL || 'http://localhost:3000',
    assetsPath: '/assets'
  },

  project: {
    yukonPath: '../yukon',
    scenesPath: 'src/scenes',
    assetsPath: 'assets'
  },

  assets: {
    // All subdirectories in yukon/assets/media/ to search for pack files
    mediaSubdirectories: [
      'games',
      'rooms',
      'interface',
      'artifacts',
      'clothing',
      'crumbs',
      'flash',
      'furniture',
      'igloos',
      'mainmenu',
      'misc',
      'music',
      'penguin',
      'postcards',
      'preload',
      'puffles',
      'shared',
      'sounds'
    ]
  },

  editor: {
    autoSave: false,
    autoSaveInterval: 30000, // 30 seconds
    grid: {
      enabled: false,
      size: 32,
      snap: false
    },
    camera: {
      defaultZoom: 1.0,
      minZoom: 0.1,
      maxZoom: 3.0,
      panSpeed: 20,
      zoomSpeed: 0.1
    }
  },

  logging: {
    enabled: import.meta.env.DEV,
    level: import.meta.env.DEV ? 'debug' : 'info',
    namespaces: ['*'] // Enable all namespaces in dev
  }
}

export default config

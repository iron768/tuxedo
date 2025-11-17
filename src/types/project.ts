/**
 * Project and asset type definitions
 */

export interface ProjectInfo {
  name: string
  path: string
  sceneCount: number
  folders: string[]
}

export interface AssetInfo {
  name: string
  path: string
  type: string
  size: number
}

export interface ProjectConfig {
  assetsPath: string
  scenesPath: string
  serverUrl: string
  autoSave: boolean
  gridSize: number
  snapToGrid: boolean
}

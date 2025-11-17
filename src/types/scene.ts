/**
 * Scene-related type definitions
 */

export interface Scene {
  id: string
  sceneType: string
  settings: SceneSettings
  displayList: GameObject[]
  lists?: ObjectList[]
  meta?: SceneMeta
  plainObjects?: unknown[]
}

export interface SceneSettings {
  sceneKey: string
  borderWidth: number
  borderHeight: number
  preloadPackFiles: string[]
  compilerInsertSpaces?: boolean
  javaScriptInitFieldsInConstructor?: boolean
  exportClass?: boolean
  superClassName?: string
  preloadMethodName?: string
  createMethodName?: string
}

export interface SceneMeta {
  app: string
  url: string
  contentType: string
  version: number
}

export interface ObjectList {
  id: string
  label: string
  objectIds: string[]
}

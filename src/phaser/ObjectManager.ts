/**
 * Object manager for Phaser scene editor
 * Handles creation and management of game objects in the scene
 */

import Phaser from 'phaser'
import type { Scene, GameObject } from '@/types'
import { GameObjectFactory, type PhaserGameObject } from './GameObjectFactory'
import { AssetLoader } from './AssetLoader'

export class ObjectManager {
  private scene: Phaser.Scene
  private factory: GameObjectFactory
  private assetLoader: AssetLoader
  private gameObjects: Map<string, PhaserGameObject> = new Map()

  constructor(scene: Phaser.Scene, factory: GameObjectFactory, assetLoader: AssetLoader) {
    this.scene = scene
    this.factory = factory
    this.assetLoader = assetLoader
  }

  /**
   * Load and create all objects for a scene
   */
  async loadAndCreateObjects(sceneData: Scene): Promise<void> {
    // Clear existing objects
    this.clear()

    // Before creating objects, ensure all prefab textures are loaded
    await this.loadPrefabTextures(sceneData.displayList || [])

    // Create objects from display list
    if (sceneData.displayList) {
      console.log(`Creating ${sceneData.displayList.length} objects`)
      for (let index = 0; index < sceneData.displayList.length; index++) {
        const item = sceneData.displayList[index]
        // First items in array should be at the back (lower depth)
        // Index is used directly: 0 = back, higher numbers = front
        await this.createGameObject(item, index)
      }
      console.log('All objects created')
    }
  }

  /**
   * Create a single game object
   */
  async createGameObject(item: GameObject, depth?: number): Promise<PhaserGameObject | null> {
    const gameObj = await this.factory.createFromItem(item)

    if (gameObj) {
      // Set depth to maintain layer order from scene file
      // Lower index = back layer, higher index = front layer
      if (depth !== undefined) {
        gameObj.shape.setDepth(depth)
        gameObj.label.setDepth(10000) // Labels always on top of everything
      }

      this.gameObjects.set(item.id, gameObj)

      // Recursively register children of containers so they can be selected
      if (gameObj.children && gameObj.children.size > 0) {
        this.registerChildren(gameObj.children)
      }

      return gameObj
    }

    return null
  }

  /**
   * Recursively register container children as selectable objects
   */
  private registerChildren(children: Map<string, PhaserGameObject>): void {
    children.forEach((childObj, childId) => {
      this.gameObjects.set(childId, childObj)

      // Recursively register nested children
      if (childObj.children && childObj.children.size > 0) {
        this.registerChildren(childObj.children)
      }
    })
  }

  /**
   * Pre-load textures needed by prefabs and regular items before creating game objects
   */
  private async loadPrefabTextures(items: GameObject[]): Promise<void> {
    // Collect all texture keys from items (including non-prefab items)
    const textureKeys = new Set<string>()
    this.collectTextureKeys(items, textureKeys)

    // Load textures for all collected keys using AssetLoader
    if (textureKeys.size > 0) {
      console.log(`Loading ${textureKeys.size} textures from display list`)
      // Create a minimal object structure for AssetLoader
      const tempObj = {
        type: 'Container',
        list: Array.from(textureKeys).map(key => ({
          type: 'Image',
          texture: { key }
        }))
      } as GameObject
      await this.assetLoader.loadPrefabTextures(tempObj)
    }

    // Also load actual prefab data
    for (const item of items) {
      await this.collectPrefabData(item)
    }
  }

  /**
   * Collect texture keys from items recursively
   */
  private collectTextureKeys(items: GameObject[], keys: Set<string>): void {
    for (const item of items) {
      if (item.texture?.key) {
        keys.add(item.texture.key)
      }
      if (item.list) {
        this.collectTextureKeys(item.list, keys)
      }
    }
  }

  /**
   * Recursively collect and load prefab data
   */
  private async collectPrefabData(item: GameObject): Promise<void> {
    if (item.prefabId) {
      const { prefabLoader } = await import('./PrefabLoader')
      const prefab = await prefabLoader.loadPrefab(item.prefabId)
      if (prefab) {
        await this.assetLoader.loadPrefabTextures(prefab)
      }
    }
    if (item.list) {
      for (const child of item.list) {
        await this.collectPrefabData(child)
      }
    }
  }

  /**
   * Get a game object by ID
   */
  getObject(id: string): PhaserGameObject | undefined {
    return this.gameObjects.get(id)
  }

  /**
   * Get all game objects
   */
  getAllObjects(): Map<string, PhaserGameObject> {
    return this.gameObjects
  }

  /**
   * Check if an object exists
   */
  hasObject(id: string): boolean {
    return this.gameObjects.has(id)
  }

  /**
   * Remove a game object
   */
  removeObject(id: string): void {
    const obj = this.gameObjects.get(id)
    if (obj) {
      if (obj.shape) obj.shape.destroy()
      if (obj.label) obj.label.destroy()
      this.gameObjects.delete(id)
    }
  }

  /**
   * Clear all game objects
   */
  clear(): void {
    this.gameObjects.forEach(obj => {
      if (obj.shape) obj.shape.destroy()
      if (obj.label) obj.label.destroy()
    })
    this.gameObjects.clear()
  }
}

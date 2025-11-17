import type { Scene, GameObject } from '@/types'
import { logger } from '@/utils/logger'
import config from '@/config'

const NAMESPACE = 'prefab'

/**
 * PrefabLoader handles loading and caching of prefab definitions
 */
export class PrefabLoader {
  private cache: Map<string, GameObject> = new Map()
  private loading: Map<string, Promise<GameObject | null>> = new Map()

  /**
   * Load a prefab by its ID
   * Returns the root GameObject from the prefab's displayList
   */
  async loadPrefab(prefabId: string): Promise<GameObject | null> {
    // Check cache first
    if (this.cache.has(prefabId)) {
      logger.debug(NAMESPACE, `Prefab ${prefabId} loaded from cache`)
      return this.cache.get(prefabId)!
    }

    // Check if already loading
    if (this.loading.has(prefabId)) {
      logger.debug(NAMESPACE, `Prefab ${prefabId} already loading, waiting...`)
      return this.loading.get(prefabId)!
    }

    // Start loading
    const loadPromise = this.fetchPrefab(prefabId)
    this.loading.set(prefabId, loadPromise)

    try {
      const prefab = await loadPromise
      if (prefab) {
        this.cache.set(prefabId, prefab)
        logger.info(NAMESPACE, `Prefab ${prefabId} loaded successfully`)
      }
      return prefab
    } finally {
      this.loading.delete(prefabId)
    }
  }

  /**
   * Fetch prefab from server
   */
  private async fetchPrefab(prefabId: string): Promise<GameObject | null> {
    try {
      const response = await fetch(`${config.server.url}/api/prefab/${prefabId}`)

      if (!response.ok) {
        logger.error(
          NAMESPACE,
          `Failed to fetch prefab ${prefabId}: ${response.status} ${response.statusText}`
        )
        return null
      }

      const scene: Scene = await response.json()

      if (scene.sceneType !== 'PREFAB') {
        logger.warn(NAMESPACE, `Scene ${prefabId} is not a PREFAB, got ${scene.sceneType}`)
        return null
      }

      if (!scene.displayList || scene.displayList.length === 0) {
        logger.warn(NAMESPACE, `Prefab ${prefabId} has no displayList`)
        return null
      }

      // Return the root container (usually the first item in displayList)
      const root = scene.displayList[0]
      logger.debug(NAMESPACE, `Prefab ${prefabId} root: ${root.type} - ${root.label}`)
      return root
    } catch (error) {
      logger.error(NAMESPACE, `Error loading prefab ${prefabId}:`, error)
      return null
    }
  }

  /**
   * Create an instance of a prefab with property overrides
   */
  async instantiatePrefab(instance: GameObject): Promise<GameObject | null> {
    if (!instance.prefabId) {
      logger.warn(NAMESPACE, 'GameObject has no prefabId')
      return null
    }

    const prefab = await this.loadPrefab(instance.prefabId)
    if (!prefab) {
      logger.error(NAMESPACE, `Failed to load prefab ${instance.prefabId}`)
      return null
    }

    // Deep clone the prefab
    const cloned = this.deepClone(prefab)

    // Apply instance overrides based on unlock properties
    const unlock = instance.unlock || []
    const mergedObject: GameObject = {
      ...cloned,
      id: instance.id, // Always use instance ID
      label: instance.label || cloned.label // Use instance label if provided
    }

    // Apply unlocked properties
    unlock.forEach(prop => {
      if (instance[prop] !== undefined) {
        (mergedObject as Record<string, unknown>)[prop] = instance[prop]
      }
    })

    // Also copy over any properties not in unlock but present in instance
    // This handles scope, components, and component properties
    Object.keys(instance).forEach(key => {
      if (
        key !== 'prefabId' &&
        key !== 'unlock' &&
        key !== 'id' &&
        key !== 'label' &&
        instance[key] !== undefined
      ) {
        (mergedObject as Record<string, unknown>)[key] = instance[key]
      }
    })

    logger.debug(NAMESPACE, `Instantiated prefab ${instance.prefabId} as ${instance.label}`, {
      unlock,
      overrides: Object.keys(instance).filter(k => k !== 'prefabId' && k !== 'unlock')
    })

    return mergedObject
  }

  /**
   * Deep clone a GameObject
   */
  private deepClone(obj: GameObject): GameObject {
    return JSON.parse(JSON.stringify(obj))
  }

  /**
   * Clear the prefab cache
   */
  clearCache(): void {
    this.cache.clear()
    logger.info(NAMESPACE, 'Prefab cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; prefabIds: string[] } {
    return {
      size: this.cache.size,
      prefabIds: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const prefabLoader = new PrefabLoader()

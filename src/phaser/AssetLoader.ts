/**
 * Asset loader for Phaser scene editor
 * Handles loading of pack files, atlases, and textures with efficient caching
 */

import Phaser from 'phaser'
import config from '@/config'
import type { Scene, GameObject } from '@/types'

/**
 * Cache for pack file existence checks to avoid redundant HEAD requests
 */
interface PackFileCache {
  [key: string]: string | null // texture key -> pack path or null if not found
}

export class AssetLoader {
  private scene: Phaser.Scene
  private packFileCache: PackFileCache = {}
  private preloadPackPath: string

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.preloadPackPath = `${config.assets.mediaSubdirectories.includes('preload') ? 'preload/' : ''}preload-pack.json`
    this.setupLoaderEvents()
  }

  private setupLoaderEvents(): void {
    this.scene.load.on('complete', () => {
      console.log('Asset loading complete')
    })

    this.scene.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`Failed to load asset: ${file.key}`, {
        url: file.url,
        src: file.src,
        type: file.type
      })
    })
  }

  /**
   * Load all assets required for a scene
   */
  async loadSceneAssets(sceneData: Scene): Promise<void> {
    console.log('Loading scene assets:', sceneData.id)

    const packFilesToLoad = new Set<string>()

    // 1. Always try to load the common preload pack first (contains shared UI elements)
    const preloadPath = `/assets/media/${this.preloadPackPath}`
    console.log('Attempting to load common preload pack')
    packFilesToLoad.add(`PACK:${preloadPath}`)

    // 2. Load explicit preload pack files from scene settings
    // Scene files already specify all their required pack files - trust them!
    const explicitPreloads = sceneData.settings?.preloadPackFiles || []
    explicitPreloads.forEach((packPath: string) => {
      const serverPath = this.normalizeAssetPath(packPath)
      console.log(`Loading scene pack: ${serverPath}`)
      packFilesToLoad.add(`PACK:${serverPath}`)
    })

    // 3. Load all discovered packs
    if (packFilesToLoad.size > 0) {
      return this.loadPackFiles(Array.from(packFilesToLoad))
    }
  }

  /**
   * Load textures required by prefabs
   */
  async loadPrefabTextures(prefabData: GameObject): Promise<void> {
    const textureKeys = new Set<string>()
    this.collectPrefabTextures(prefabData, textureKeys)

    if (textureKeys.size === 0) return

    console.log(`Found ${textureKeys.size} texture keys from prefabs:`, Array.from(textureKeys))

    // Find pack files for prefab textures in parallel
    const packFilesToLoad = new Set<string>()
    await Promise.all(
      Array.from(textureKeys).map(async key => {
        if (this.scene.textures.exists(key)) {
          return
        }

        const packFile = await this.findPackFile(key)
        if (packFile) {
          packFilesToLoad.add(packFile)
        }
      })
    )

    if (packFilesToLoad.size > 0) {
      console.log(`Loading ${packFilesToLoad.size} pack files for prefabs`)
      return this.loadPackFiles(Array.from(packFilesToLoad))
    }
  }

  /**
   * Recursively collect texture keys from prefabs
   */
  private collectPrefabTextures(prefab: GameObject, textureKeys: Set<string>): void {
    if (prefab.texture?.key) {
      textureKeys.add(prefab.texture.key)
    }

    if (prefab.type === 'Container' && prefab.list) {
      prefab.list.forEach(child => this.collectPrefabTextures(child, textureKeys))
    }
  }

  /**
   * Check if a pack file or atlas exists for a given texture key.
   * Uses server API for efficient resolution with caching.
   */
  private async findPackFile(key: string): Promise<string | null> {
    // Check cache first
    if (key in this.packFileCache) {
      return this.packFileCache[key]
    }

    try {
      // Use server API to resolve asset location
      const response = await fetch(
        `${config.server.url}/api/assets/resolve/${encodeURIComponent(key)}`
      )

      if (!response.ok) {
        console.warn(`Failed to resolve asset for key '${key}'`)
        this.packFileCache[key] = null
        return null
      }

      const location = (await response.json()) as {
        found: boolean
        type: 'pack' | 'atlas'
        path: string
        directory?: string
      }

      if (!location.found) {
        console.log(`No pack file or atlas found for texture key: ${key}`)
        this.packFileCache[key] = null
        return null
      }

      // Format result based on type
      let result: string
      if (location.type === 'atlas') {
        result = `ATLAS:${location.directory}`
        console.log(`Found atlas for '${key}': ${location.path}`)
      } else {
        result = `PACK:${location.path}`
        console.log(`Found pack for '${key}': ${location.path}`)
      }

      // Cache and return
      this.packFileCache[key] = result
      return result
    } catch (error) {
      console.error(`Error resolving asset for key '${key}':`, error)
      this.packFileCache[key] = null
      return null
    }
  }

  /**
   * Check if a texture is already loaded
   */
  isTextureLoaded(key: string): boolean {
    return this.scene.textures.exists(key)
  }

  /**
   * Load pack files and atlases
   */
  private async loadPackFiles(packPaths: string[]): Promise<void> {
    if (packPaths.length === 0) return

    return new Promise(resolve => {
      let loadStarted = false

      const onComplete = () => {
        console.log('Pack loading complete')
        this.scene.load.off('loaderror', onLoadError)
        resolve()
      }

      const onLoadError = (file: Phaser.Loader.File) => {
        console.error(`Failed to load from pack: ${file.key}`, file)
      }

      this.scene.load.once('complete', onComplete)
      this.scene.load.on('loaderror', onLoadError)

      packPaths.forEach((packPath, index) => {
        const isAtlas = packPath.startsWith('ATLAS:')
        const cleanPath = packPath.replace(/^(ATLAS:|PACK:)/, '')

        if (isAtlas) {
          // Extract key from path
          const key = cleanPath.split('/').pop() || `atlas-${index}`
          console.log(`Loading atlas: ${key} from ${cleanPath}/${key}.json`)
          this.scene.load.multiatlas(key, `${cleanPath}/${key}.json`, cleanPath)
        } else {
          // Use full URL for pack files to ensure proper base path resolution
          const packKey = `pack-${index}-${Date.now()}`
          console.log(`Loading pack: ${cleanPath} with key ${packKey}`)
          this.scene.load.pack(packKey, `${config.server.url}${cleanPath}`)
        }
        loadStarted = true
      })

      if (loadStarted) {
        this.scene.load.start()
      } else {
        resolve()
      }
    })
  }

  /**
   * Normalize asset paths to server paths
   */
  private normalizeAssetPath(path: string): string {
    let normalized = path.replace(/^client\//, '/').replace(/^yukon\//, '/')

    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized
    }

    return normalized
  }
}

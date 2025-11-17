import Phaser from 'phaser'
import type { Scene } from '@/types'
import { GameObjectFactory } from './GameObjectFactory'
import { CameraController } from './CameraController'
import { AssetLoader } from './AssetLoader'
import { ObjectManager } from './ObjectManager'
import { SelectionManager } from './SelectionManager'
import config from '@/config'

export default class PhaserScene extends Phaser.Scene {
  private factory!: GameObjectFactory
  private cameraController!: CameraController
  private assetLoader!: AssetLoader
  private objectManager!: ObjectManager
  private selectionManager!: SelectionManager
  private currentScene: Scene | null = null
  private cameraBorder: Phaser.GameObjects.Graphics | null = null
  private onZoomChangeCallback?: (zoom: number) => void
  private fontsLoaded: Promise<void>

  constructor() {
    super({ key: 'EditorScene' })

    // Load fonts immediately
    this.fontsLoaded = this.loadFonts()
  }

  private async loadFonts(): Promise<void> {
    const fontsToLoad = [
      {
        family: 'CCComicrazy',
        url: 'http://localhost:8080/assets/fonts/CCComicrazy Regular.woff2'
      },
      { family: 'CCFaceFront', url: 'http://localhost:8080/assets/fonts/CCFaceFront.woff2' },
      {
        family: 'Burbank Small',
        url: 'http://localhost:8080/assets/fonts/Burbank Small Medium.woff2'
      },
      { family: 'Arial', url: 'http://localhost:8080/assets/fonts/Arial.woff2' }
    ]

    // Inject font-face rules
    const style = document.createElement('style')
    style.textContent = fontsToLoad
      .map(
        font => `
      @font-face {
        font-family: '${font.family}';
        src: url('${font.url}') format('woff2');
      }
    `
      )
      .join('\n')
    document.head.appendChild(style)

    // Wait for fonts to load using FontFaceSet API
    const fontFamilies = fontsToLoad.map(f => f.family)
    await Promise.all(fontFamilies.map(family => document.fonts.load(`12px "${family}"`))).catch(
      err => console.warn('Some fonts failed to load:', err)
    )

    console.log('All fonts loaded')
  }

  /**
   * Set callback for zoom changes
   */
  setOnZoomChange(callback: (zoom: number) => void): void {
    this.onZoomChangeCallback = callback
  }

  preload(): void {
    // Assets will be loaded dynamically via AssetLoader
  }

  create(): void {
    this.factory = new GameObjectFactory(this)
    this.cameraController = new CameraController(this, zoom => {
      this.onZoomChangeCallback?.(zoom)
    })
    this.assetLoader = new AssetLoader(this)
    this.objectManager = new ObjectManager(this, this.factory, this.assetLoader)
    this.selectionManager = new SelectionManager(this, this.objectManager)

    // Configure input to check all interactive objects, not just the topmost
    // This allows children inside containers to be clicked
    this.input.setTopOnly(false)

    console.log('Phaser scene create() called')
  }

  async loadSceneData(sceneData: Scene): Promise<void> {
    console.log('Loading scene data into Phaser:', sceneData)
    this.currentScene = sceneData

    // Wait for fonts to be ready before creating text objects
    await this.fontsLoaded

    // Load scene assets
    this.load.setBaseURL(config.server.url + '/')
    await this.assetLoader.loadSceneAssets(sceneData)

    // Load and create scene objects
    await this.objectManager.loadAndCreateObjects(sceneData)

    // Register all objects with selection manager
    this.objectManager.getAllObjects().forEach((gameObj, id) => {
      this.selectionManager.registerObject(id, gameObj)
    })

    // Draw camera border to show game viewport
    this.drawCameraBorder(sceneData.settings)
  }

  /**
   * Draw a border showing the camera/viewport bounds
   */
  private drawCameraBorder(settings: Scene['settings']): void {
    // Remove existing border if any
    if (this.cameraBorder) {
      this.cameraBorder.destroy()
    }

    const width = settings.borderWidth || 1520
    const height = settings.borderHeight || 960

    this.cameraBorder = this.add.graphics()
    this.cameraBorder.lineStyle(4, 0xff0000, 1)
    this.cameraBorder.strokeRect(0, 0, width, height)

    // Keep border on top of everything except selection boxes
    this.cameraBorder.setDepth(9999)

    // Make it non-interactive so it doesn't block clicks
    this.cameraBorder.setInteractive = () => this.cameraBorder as Phaser.GameObjects.Graphics
  }

  /**
   * Public API for selecting objects (called from Vue components)
   */
  selectObject(id: string): void {
    this.selectionManager.selectObject(id)
  }

  /**
   * Get currently selected object ID
   */
  getSelectedId(): string | null {
    return this.selectionManager.getSelectedId()
  }

  /**
   * Deselect current object
   */
  deselectObject(): void {
    this.selectionManager.deselect()
  }

  /**
   * Update object property (called from Vue components)
   */
  updateObjectProperty(id: string, property: string, value: unknown): void {
    const phaserGameObject = this.objectManager.getObject(id)
    if (!phaserGameObject) {
      console.warn(`Object ${id} not found for property update`)
      return
    }
    const gameObject = phaserGameObject.shape

    // Update the Phaser game object
    switch (property) {
      case 'x':
      case 'y':
        if (typeof value === 'number') {
          gameObject[property] = value
        }
        break
      case 'scaleX':
        if (typeof value === 'number' && 'setScale' in gameObject) {
          gameObject.setScale(value, gameObject.scaleY)
        }
        break
      case 'scaleY':
        if (typeof value === 'number' && 'setScale' in gameObject) {
          gameObject.setScale(gameObject.scaleX, value)
        }
        break
      case 'angle':
        if (typeof value === 'number' && 'setAngle' in gameObject) {
          gameObject.setAngle(value)
        }
        break
      case 'alpha':
        if (typeof value === 'number' && 'setAlpha' in gameObject) {
          gameObject.setAlpha(value)
        }
        break
      case 'visible':
        if (typeof value === 'boolean' && 'setVisible' in gameObject) {
          gameObject.setVisible(value)
        }
        break
      default:
        console.warn(`Property ${property} is not supported for updates`)
    }

    // Update selection box position if this is the selected object
    if (this.selectionManager.getSelectedId() === id) {
      this.selectionManager.selectObject(id)
    }
  }

  update(): void {
    // Game loop
  }
}

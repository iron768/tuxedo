/**
 * Selection manager for Phaser scene editor
 * Handles object selection, highlighting, and interaction tracking
 */

import Phaser from 'phaser'
import type { PhaserGameObject } from './GameObjectFactory'
import { ObjectManager } from './ObjectManager'

export class SelectionManager {
  private scene: Phaser.Scene
  private objectManager: ObjectManager
  private selectionGraphics: Phaser.GameObjects.Graphics
  private selectedId: string | null = null
  private pointerDownTime: number = 0
  private pointerMoved: boolean = false

  constructor(scene: Phaser.Scene, objectManager: ObjectManager) {
    this.scene = scene
    this.objectManager = objectManager

    // Create selection graphics overlay
    this.selectionGraphics = scene.add.graphics()
    this.selectionGraphics.setDepth(9999) // Just below labels

    this.setupInputTracking()
  }

  /**
   * Set up input tracking for click/drag detection
   */
  private setupInputTracking(): void {
    // Track pointer down time and movement to distinguish clicks from drags
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.pointerDownTime = this.scene.time.now
        this.pointerMoved = false
      }
    })

    this.scene.input.on('pointermove', () => {
      if (this.scene.input.activePointer.leftButtonDown()) {
        this.pointerMoved = true
      }
    })
  }

  /**
   * Register selection handlers for a game object
   */
  registerObject(id: string, gameObj: PhaserGameObject): void {
    // Handle click - only select if not dragging and was a quick click
    gameObj.shape.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.pointerDownTime = this.scene.time.now
      }
    })

    gameObj.shape.on(
      'pointerup',
      (
        pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        // Only select if left click, wasn't dragging, and was quick (< 200ms)
        const clickDuration = this.scene.time.now - this.pointerDownTime
        if (pointer.leftButtonReleased() && !this.pointerMoved && clickDuration < 200) {
          // Stop event propagation so parent containers don't also get selected
          event.stopPropagation()
          this.selectObject(id)
        }
      }
    )
  }

  /**
   * Select an object by ID
   */
  selectObject(id: string): void {
    // Deselect previous
    if (this.selectedId && this.objectManager.hasObject(this.selectedId)) {
      const prev = this.objectManager.getObject(this.selectedId)
      if (prev) {
        this.clearObjectHighlight(prev)
      }
    }

    // Clear selection graphics
    this.selectionGraphics.clear()

    // Select new
    this.selectedId = id
    if (this.objectManager.hasObject(id)) {
      const obj = this.objectManager.getObject(id)
      if (obj) {
        this.drawSelectionBox(obj)
      }
    }
  }

  /**
   * Clear highlight from an object
   */
  private clearObjectHighlight(obj: PhaserGameObject): void {
    // Remove tint from previous selection
    if (
      obj.shape instanceof Phaser.GameObjects.Image ||
      obj.shape instanceof Phaser.GameObjects.Sprite
    ) {
      obj.shape.clearTint()
    } else if (obj.shape instanceof Phaser.GameObjects.Rectangle) {
      obj.shape.setStrokeStyle(0)
    }
  }

  /**
   * Draw selection box with corner handles
   */
  private drawSelectionBox(obj: PhaserGameObject): void {
    const bounds = obj.shape.getBounds()

    // Draw selection box
    this.selectionGraphics.lineStyle(2, 0x00ff00, 1)
    this.selectionGraphics.strokeRect(
      bounds.x - 2,
      bounds.y - 2,
      bounds.width + 4,
      bounds.height + 4
    )

    // Add corner handles
    const handleSize = 6
    this.selectionGraphics.fillStyle(0x00ff00, 1)
    const corners = [
      { x: bounds.x, y: bounds.y }, // Top-left
      { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
      { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height } // Bottom-right
    ]
    corners.forEach(corner => {
      this.selectionGraphics.fillRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      )
    })
  }

  /**
   * Get currently selected object ID
   */
  getSelectedId(): string | null {
    return this.selectedId
  }

  /**
   * Deselect current object
   */
  deselect(): void {
    if (this.selectedId) {
      const obj = this.objectManager.getObject(this.selectedId)
      if (obj) {
        this.clearObjectHighlight(obj)
      }
      this.selectedId = null
      this.selectionGraphics.clear()
    }
  }

  /**
   * Clear selection graphics
   */
  clear(): void {
    this.selectionGraphics.clear()
  }

  /**
   * Destroy selection manager
   */
  destroy(): void {
    this.selectionGraphics.destroy()
  }
}

/**
 * Camera controller for Phaser scene editor
 * Handles camera movement, zoom, and input
 */

import Phaser from 'phaser'
import config from '@/config'
import { logger } from '@/utils/logger'

const LOG_NS = 'phaser:camera'

export class CameraController {
  private camera: Phaser.Cameras.Scene2D.Camera
  private scene: Phaser.Scene
  private isDragging: boolean = false
  private dragStartX: number = 0
  private dragStartY: number = 0
  private cameraStartX: number = 0
  private cameraStartY: number = 0
  private onZoomChange?: (zoom: number) => void

  constructor(scene: Phaser.Scene, onZoomChange?: (zoom: number) => void) {
    this.scene = scene
    this.camera = scene.cameras.main
    this.onZoomChange = onZoomChange
    this.setupCamera()
    this.setupControls()
  }

  private setupCamera(): void {
    this.camera.setBackgroundColor('#1a1a1a')
    this.camera.setZoom(config.editor.camera.defaultZoom)
    logger.debug(LOG_NS, 'Camera initialized', { zoom: this.camera.zoom })
  }

  private setupControls(): void {
    this.setupMouseControls()
    this.setupKeyboardControls()
    logger.info(LOG_NS, 'Camera controls enabled')
  }

  private setupMouseControls(): void {
    // Mouse wheel zoom
    this.scene.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number
      ) => {
        const zoomAmount =
          deltaY > 0 ? -config.editor.camera.zoomSpeed : config.editor.camera.zoomSpeed
        const newZoom = Phaser.Math.Clamp(
          this.camera.zoom + zoomAmount,
          config.editor.camera.minZoom,
          config.editor.camera.maxZoom
        )
        this.camera.setZoom(newZoom)
        this.onZoomChange?.(newZoom)
        logger.debug(LOG_NS, 'Zoom changed', { zoom: newZoom })
      }
    )

    // Middle/right mouse button drag to pan
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown() || pointer.rightButtonDown()) {
        this.isDragging = true
        this.dragStartX = pointer.x
        this.dragStartY = pointer.y
        this.cameraStartX = this.camera.scrollX
        this.cameraStartY = this.camera.scrollY
        logger.debug(LOG_NS, 'Pan started')
      }
    })

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = (this.dragStartX - pointer.x) / this.camera.zoom
        const deltaY = (this.dragStartY - pointer.y) / this.camera.zoom
        this.camera.scrollX = this.cameraStartX + deltaX
        this.camera.scrollY = this.cameraStartY + deltaY
      }
    })

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonReleased() || pointer.rightButtonReleased()) {
        this.isDragging = false
        logger.debug(LOG_NS, 'Pan ended', { x: this.camera.scrollX, y: this.camera.scrollY })
      }
    })
  }

  private setupKeyboardControls(): void {
    const cursors = this.scene.input.keyboard!.createCursorKeys()
    const zoomIn = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS)
    const zoomOut = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS)

    this.scene.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      const panSpeed = config.editor.camera.panSpeed / this.camera.zoom

      if (cursors.left?.isDown) {
        this.camera.scrollX -= panSpeed
      } else if (cursors.right?.isDown) {
        this.camera.scrollX += panSpeed
      }

      if (cursors.up?.isDown) {
        this.camera.scrollY -= panSpeed
      } else if (cursors.down?.isDown) {
        this.camera.scrollY += panSpeed
      }

      // Zoom with +/- keys (Shift+= for +)
      if (zoomIn.isDown || (event.key === '=' && event.shiftKey)) {
        const newZoom = Phaser.Math.Clamp(
          this.camera.zoom + 0.05,
          config.editor.camera.minZoom,
          config.editor.camera.maxZoom
        )
        this.camera.setZoom(newZoom)
        this.onZoomChange?.(newZoom)
      } else if (zoomOut.isDown || event.key === '-') {
        const newZoom = Phaser.Math.Clamp(
          this.camera.zoom - 0.05,
          config.editor.camera.minZoom,
          config.editor.camera.maxZoom
        )
        this.camera.setZoom(newZoom)
        this.onZoomChange?.(newZoom)
      }
    })
  }

  /**
   * Reset camera to default position and zoom
   */
  reset(): void {
    this.camera.setZoom(config.editor.camera.defaultZoom)
    this.camera.scrollX = 0
    this.camera.scrollY = 0
    logger.info(LOG_NS, 'Camera reset')
  }

  /**
   * Center camera on specific coordinates
   */
  centerOn(x: number, y: number): void {
    this.camera.centerOn(x, y)
    logger.debug(LOG_NS, 'Camera centered', { x, y })
  }

  /**
   * Get current camera state
   */
  getState() {
    return {
      x: this.camera.scrollX,
      y: this.camera.scrollY,
      zoom: this.camera.zoom
    }
  }
}

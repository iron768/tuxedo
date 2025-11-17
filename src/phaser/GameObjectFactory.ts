import type { GameObject } from '@/types'
import { prefabLoader } from './PrefabLoader'

export interface PhaserGameObject {
  shape:
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Sprite
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Container
    | Phaser.GameObjects.Text
  label: Phaser.GameObjects.Text
  children?: Map<string, PhaserGameObject> // Store children for containers
}

export class GameObjectFactory {
  constructor(private scene: Phaser.Scene) {}

  /**
   * Create a Phaser GameObject from a GameObject definition
   * Handles prefabs by loading and instantiating them
   */
  async createFromItem(item: GameObject): Promise<PhaserGameObject | null> {
    // Handle prefab instances
    if (item.prefabId) {
      const instantiated = await prefabLoader.instantiatePrefab(item)
      if (!instantiated) {
        console.warn(`Failed to instantiate prefab ${item.prefabId}, using placeholder`)
        return this.createPhaserObject({
          ...item,
          type: 'Rectangle',
          width: 100,
          height: 100
        })
      }
      // Recursively create from the instantiated prefab
      return this.createPhaserObject(instantiated)
    }

    return this.createPhaserObject(item)
  }

  /**
   * Create Phaser objects from a GameObject (non-prefab)
   * This method is async to handle nested prefabs in containers
   */
  private async createPhaserObject(item: GameObject): Promise<PhaserGameObject | null> {
    if (!item.type) {
      console.warn(`GameObject ${item.id} has no type`)
      return null
    }

    let shape:
      | Phaser.GameObjects.Image
      | Phaser.GameObjects.Sprite
      | Phaser.GameObjects.Rectangle
      | Phaser.GameObjects.Container
      | Phaser.GameObjects.Text
      | null = null

    switch (item.type) {
      case 'Image':
        if (item.texture?.key && item.texture?.frame) {
          // Try to create a real image
          try {
            const x = item.x ?? 0
            const y = item.y ?? 0
            const originX = item.originX !== undefined ? item.originX : 0.5
            const originY = item.originY !== undefined ? item.originY : 0.5

            // Check if texture exists before trying to use it
            if (!this.scene.textures.exists(item.texture.key)) {
              console.warn(
                `Texture "${item.texture.key}" not loaded, using placeholder for ${item.label}`
              )
              shape = this.createPlaceholder(item, 0x3498db)
              break
            }

            const image = this.scene.add.image(x, y, item.texture.key, item.texture.frame)
            image.setOrigin(originX, originY)

            // Debug first few objects
            if (item.label === 'bg' || item.label === 'giftshop' || item.label === 'fg_left') {
              console.log(
                `${item.label}: RAW item.originX=${item.originX} item.originY=${item.originY}`
              )
              console.log(`${item.label}: CALCULATED originX=${originX} originY=${originY}`)
              console.log(
                `${item.label}: pos(${x},${y}) origin(${originX},${originY}) size(${image.width}x${image.height})`
              )
            }

            if (item.scaleX !== undefined) image.setScale(item.scaleX, item.scaleY ?? item.scaleX)
            if (item.angle) image.setAngle(item.angle)
            if (item.visible === false) image.setVisible(false)
            shape = image
          } catch (e) {
            console.warn(
              `Failed to create image ${item.texture.key}:${item.texture.frame} for ${item.label}`,
              e
            )
            shape = this.createPlaceholder(item, 0x3498db)
          }
        } else {
          shape = this.createPlaceholder(item, 0x3498db)
        }
        break

      case 'Sprite':
        if (item.texture?.key && item.texture?.frame) {
          try {
            const x = item.x ?? 0
            const y = item.y ?? 0
            const originX = item.originX !== undefined ? item.originX : 0.5
            const originY = item.originY !== undefined ? item.originY : 0.5

            // Check if texture exists
            if (!this.scene.textures.exists(item.texture.key)) {
              console.warn(
                `Texture "${item.texture.key}" not loaded, using placeholder for ${item.label}`
              )
              shape = this.createPlaceholder(item, 0xe74c3c)
              break
            }

            const sprite = this.scene.add.sprite(x, y, item.texture.key, item.texture.frame)
            sprite.setOrigin(originX, originY)
            if (item.scaleX !== undefined) sprite.setScale(item.scaleX, item.scaleY ?? item.scaleX)
            if (item.angle) sprite.setAngle(item.angle)
            if (item.visible === false) sprite.setVisible(false)
            shape = sprite
          } catch (e) {
            console.warn(
              `Failed to create sprite ${item.texture.key}:${item.texture.frame} for ${item.label}`,
              e
            )
            shape = this.createPlaceholder(item, 0xe74c3c)
          }
        } else {
          shape = this.createPlaceholder(item, 0xe74c3c)
        }
        break

      case 'Rectangle':
        {
          const rect = this.scene.add.rectangle(
            item.x,
            item.y,
            item.width || 100,
            item.height || 100,
            0x2ecc71,
            0.5
          )
          if (item.angle) rect.setAngle(item.angle)
          if (item.visible === false) rect.setVisible(false)
          shape = rect
        }
        break

      case 'Text':
        {
          const x = item.x ?? 0
          const y = item.y ?? 0
          interface TextItem {
            text?: string
            fontFamily?: string
            fontSize?: string
            fontStyle?: string
            color?: string
            stroke?: string
            strokeThickness?: number
            align?: string
            paddingLeft?: number
            paddingTop?: number
            paddingRight?: number
            paddingBottom?: number
          }
          const itemData = item as unknown as TextItem
          const text = itemData.text || 'Text'

          // Build style object from item properties
          const style: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: itemData.fontFamily || 'Arial',
            fontSize: itemData.fontSize || '16px',
            color: itemData.color || '#ffffff',
            align: itemData.align || 'left'
          }

          // Optional style properties
          if (itemData.fontStyle) style.fontStyle = itemData.fontStyle
          if (itemData.stroke) style.stroke = itemData.stroke
          if (itemData.strokeThickness) style.strokeThickness = itemData.strokeThickness
          if (
            itemData.paddingLeft ||
            itemData.paddingTop ||
            itemData.paddingRight ||
            itemData.paddingBottom
          ) {
            style.padding = {
              left: itemData.paddingLeft || 0,
              top: itemData.paddingTop || 0,
              right: itemData.paddingRight || 0,
              bottom: itemData.paddingBottom || 0
            }
          }

          const textObj = this.scene.add.text(x, y, text, style)

          // Set origin if specified
          const originX = item.originX !== undefined ? item.originX : 0
          const originY = item.originY !== undefined ? item.originY : 0
          textObj.setOrigin(originX, originY)

          if (item.angle) textObj.setAngle(item.angle)
          if (item.visible === false) textObj.setVisible(false)
          shape = textObj
        }
        break

      case 'Container':
        {
          const x = item.x ?? 0
          const y = item.y ?? 0
          const container = this.scene.add.container(x, y)

          // Create child objects if they exist
          // Now supports nested prefabs
          const childrenMap = new Map<string, PhaserGameObject>()

          if (item.list && Array.isArray(item.list)) {
            for (const child of item.list) {
              // Handle nested prefabs by recursively calling createFromItem
              const childObj = await this.createFromItem(child)
              if (childObj) {
                // Ensure child is interactive and can be clicked
                if (!childObj.shape.input) {
                  childObj.shape.setInteractive()
                }
                childObj.shape.setData('itemId', child.id)
                childObj.shape.setData('itemData', child)

                container.add(childObj.shape)
                childObj.label.destroy()
                // Store child reference with its ID
                childrenMap.set(child.id, childObj)
              }
            }
          }

          // Make container interactive by setting bounds based on children
          // BUT don't consume input - let children handle their own clicks
          if (container.list.length > 0) {
            const bounds = container.getBounds()
            container.setInteractive(
              new Phaser.Geom.Rectangle(bounds.x - x, bounds.y - y, bounds.width, bounds.height),
              Phaser.Geom.Rectangle.Contains
            )
          }

          if (item.angle) container.setAngle(item.angle)
          if (item.visible === false) container.setVisible(false)
          shape = container

          // Return early with children map for containers
          if (childrenMap.size > 0) {
            // Create label for the container
            const label = this.scene.add.text(
              item.x,
              item.y - 60,
              item.label || item.type || 'Unknown',
              {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
              }
            )
            label.setOrigin(0.5)

            return { shape, label, children: childrenMap }
          }
        }
        break

      default:
        shape = this.createPlaceholder(item, 0xffffff)
    }

    if (!shape) return null

    // Make interactive if not already (Containers set their own hit area)
    if (!shape.input) {
      shape.setInteractive()
    }
    shape.setData('itemId', item.id)
    shape.setData('itemData', item)

    // Add label text
    const label = this.scene.add.text(item.x, item.y - 60, item.label || item.type || 'Unknown', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    })
    label.setOrigin(0.5)

    return { shape, label }
  }

  private createPlaceholder(item: GameObject, color: number): Phaser.GameObjects.Rectangle {
    const rect = this.scene.add.rectangle(item.x, item.y, 100, 100, color, 0.5)
    rect.setOrigin(item.originX ?? 0.5, item.originY ?? 0.5)
    if (item.angle) rect.setAngle(item.angle)
    if (item.visible === false) rect.setVisible(false)
    return rect
  }
}

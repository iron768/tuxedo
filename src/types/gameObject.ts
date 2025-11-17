/**
 * GameObject and related type definitions
 */

export interface GameObject {
  type?: string
  id: string
  label: string
  x: number
  y: number
  originX?: number
  originY?: number
  scaleX?: number
  scaleY?: number
  texture?: Texture
  components?: string[]
  visible?: boolean
  angle?: number
  width?: number
  height?: number
  scope?: string
  list?: GameObject[] // For Container children
  prefabId?: string // Reference to prefab definition
  unlock?: string[] // Properties that can override prefab defaults
  [key: string]: unknown // For component properties like "Button.spriteName"
}

export interface Texture {
  key: string
  frame?: string
}

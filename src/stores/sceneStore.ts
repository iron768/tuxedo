import { defineStore } from 'pinia'
import { sceneApi } from '@/api'
import type { Scene, GameObject } from '@/types'

interface SceneState {
  scenes: string[]
  currentScene: Scene | null
  selectedObject: GameObject | null
  loading: boolean
  error: string | null
  cameraZoom: number
}

export const useSceneStore = defineStore('scene', {
  state: (): SceneState => ({
    scenes: [],
    currentScene: null,
    selectedObject: null,
    loading: false,
    error: null,
    cameraZoom: 1
  }),

  actions: {
    async fetchScenes() {
      this.loading = true
      try {
        const response = await sceneApi.getScenes()
        console.log('Fetched scenes:', response.data)
        this.scenes = response.data
        this.error = null
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch scenes'
        console.error('Failed to fetch scenes:', error)
      } finally {
        this.loading = false
      }
    },

    async loadScene(scenePath: string): Promise<Scene> {
      this.loading = true
      try {
        // Reset selection when switching scenes
        this.selectedObject = null
        this.cameraZoom = 1

        const response = await sceneApi.getScene(scenePath)
        this.currentScene = response.data
        this.error = null
        return response.data
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to load scene'
        console.error('Failed to load scene:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async saveScene(scenePath: string): Promise<void> {
      this.loading = true
      try {
        if (!this.currentScene) {
          throw new Error('No scene loaded')
        }
        await sceneApi.updateScene(scenePath, this.currentScene)
        this.error = null
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to save scene'
        console.error('Failed to save scene:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    selectObject(obj: GameObject | null): void {
      this.selectedObject = obj
    },

    updateSelectedObject(property: string, value: unknown): void {
      if (this.selectedObject) {
        this.selectedObject[property] = value

        // Also update the object in the current scene's display list
        if (this.currentScene?.displayList) {
          this.updateObjectInList(
            this.currentScene.displayList,
            this.selectedObject.id,
            property,
            value
          )
        }
      }
    },

    // Helper to recursively update objects in nested lists (for containers)
    updateObjectInList(
      list: GameObject[],
      targetId: string,
      property: string,
      value: unknown
    ): boolean {
      for (const obj of list) {
        if (obj.id === targetId) {
          obj[property] = value
          return true
        }
        // Check nested list for containers
        if (obj.list && obj.list.length > 0) {
          if (this.updateObjectInList(obj.list, targetId, property, value)) {
            return true
          }
        }
      }
      return false
    },

    setCameraZoom(zoom: number): void {
      this.cameraZoom = zoom
    }
  }
})

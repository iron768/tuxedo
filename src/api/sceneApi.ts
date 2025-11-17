import axios, { AxiosResponse } from 'axios'
import type { Scene } from '@/types'

export const sceneApi = {
  // Get all scenes
  getScenes(): Promise<AxiosResponse<string[]>> {
    return axios.get<string[]>('/api/scenes')
  },

  // Get a specific scene
  getScene(scenePath: string): Promise<AxiosResponse<Scene>> {
    return axios.get<Scene>(`/api/scenes/${scenePath}`)
  },

  // Update a scene
  updateScene(scenePath: string, sceneData: Scene): Promise<AxiosResponse<{ status: string }>> {
    return axios.put<{ status: string }>(`/api/scenes/${scenePath}`, sceneData)
  },

  // Create a new scene
  createScene(sceneData: Scene): Promise<AxiosResponse<{ status: string; path: string }>> {
    return axios.post<{ status: string; path: string }>('/api/scenes', sceneData)
  }
}

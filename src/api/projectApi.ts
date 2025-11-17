import axios, { AxiosResponse } from 'axios'
import type { ProjectInfo, AssetInfo } from '@/types'

export const projectApi = {
  getProjectInfo(): Promise<AxiosResponse<ProjectInfo>> {
    return axios.get<ProjectInfo>('/api/project')
  },

  getAssets(): Promise<AxiosResponse<AssetInfo[]>> {
    return axios.get<AssetInfo[]>('/api/assets')
  }
}

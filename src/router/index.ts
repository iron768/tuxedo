import { createRouter, createWebHistory } from 'vue-router'
import SceneList from '@/views/SceneList.vue'
import SceneEditor from '@/views/SceneEditor.vue'

const routes = [
  {
    path: '/',
    name: 'SceneList',
    component: SceneList
  },
  {
    path: '/editor/:scenePath*',
    name: 'SceneEditor',
    component: SceneEditor
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

<template>
  <div class="scene-list">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1>Tuxedo Yukon Editor</h1>
        <p class="subtitle">
          {{ filteredScenes.length }} scene{{ filteredScenes.length !== 1 ? 's' : '' }} available
        </p>
      </div>
      <button
        class="refresh-btn"
        @click="refreshScenes"
      >
        <Icon :size="16">
          <Refresh />
        </Icon>
        <span>Refresh</span>
      </button>
    </header>

    <!-- Combined Search and View Controls -->
    <div class="toolbar">
      <div class="search-bar">
        <Icon
          :size="16"
          class="search-icon"
        >
          <Search />
        </Icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search scenes and prefabs..."
          class="search-input"
        >
        <button
          v-if="searchQuery"
          class="clear-btn"
          @click="searchQuery = ''"
        >
          <Icon :size="16">
            <Close />
          </Icon>
        </button>
      </div>

      <div class="view-controls">
        <div class="view-toggle">
          <button
            :class="{ active: viewMode === 'grouped' }"
            @click="viewMode = 'grouped'"
          >
            <Icon :size="16">
              <FolderOutline />
            </Icon>
            <span>Grouped</span>
          </button>
          <button
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <Icon :size="16">
              <GridOutline />
            </Icon>
            <span>Grid</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="state-message"
      >
        <div class="loading-spinner" />
        <p>Loading scenes...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="state-message error"
      >
        <Icon :size="48">
          <WarningOutline />
        </Icon>
        <p>{{ error }}</p>
        <button
          class="retry-btn"
          @click="refreshScenes"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="scenes.length === 0"
        class="state-message empty"
      >
        <Icon :size="48">
          <DocumentOutline />
        </Icon>
        <p>No scenes found</p>
        <small>Make sure your project path is configured correctly</small>
      </div>

      <!-- No Search Results -->
      <div
        v-else-if="filteredScenes.length === 0"
        class="state-message empty"
      >
        <Icon :size="48">
          <Search />
        </Icon>
        <p>No results found</p>
        <small>Try adjusting your search query</small>
      </div>

      <!-- Grouped View -->
      <div
        v-else-if="viewMode === 'grouped'"
        class="scenes-container"
      >
        <div class="grouped-scenes">
          <div
            v-for="group in groupedByFolder"
            :key="group.folder"
            class="scene-group"
          >
            <div
              class="group-header"
              @click="toggleGroup(group.folder)"
            >
              <Icon
                :size="16"
                class="chevron"
                :class="{ collapsed: collapsedGroups.has(group.folder) }"
              >
                <ChevronDown />
              </Icon>
              <Icon :size="18">
                <FolderOpenOutline />
              </Icon>
              <span class="group-name">{{ group.folder || 'Root' }}</span>
              <span class="group-count">{{ group.scenes.length }}</span>
            </div>
            <div
              v-show="!collapsedGroups.has(group.folder)"
              class="group-items"
            >
              <div
                v-for="scene in group.scenes"
                :key="scene.path"
                class="scene-item"
                @click="openScene(scene.path)"
              >
                <Icon :size="16">
                  <DocumentTextOutline />
                </Icon>
                <div class="scene-item-content">
                  <span class="scene-item-name">{{ scene.name }}</span>
                  <span
                    v-if="scene.folder !== group.folder"
                    class="scene-item-subpath"
                  >{{
                    getRelativePath(scene.folder, group.folder)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div
        v-else
        class="scenes-container"
      >
        <div class="scenes-grid">
          <div
            v-for="scene in filteredScenes"
            :key="scene.path"
            class="scene-card"
            @click="openScene(scene.path)"
          >
            <div class="scene-icon">
              <Icon :size="32">
                <DocumentTextOutline />
              </Icon>
            </div>
            <div class="scene-info">
              <div class="scene-name">
                {{ scene.name }}
              </div>
              <div class="scene-path">
                {{ scene.folder }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue & Router
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Icons
import { Icon } from '@vicons/utils'
import {
  DocumentTextOutline,
  DocumentOutline,
  Refresh,
  WarningOutline,
  Search,
  Close,
  FolderOutline,
  FolderOpenOutline,
  GridOutline,
  ChevronDown
} from '@vicons/ionicons5'

// Store & Utils
import { useSceneStore } from '@/stores/sceneStore'
import { parseScenePath } from '@/utils/helpers'
import type { ParsedScenePath } from '@/utils/helpers'

const router = useRouter()
const sceneStore = useSceneStore()

const { scenes, loading, error } = storeToRefs(sceneStore)

// UI State
const searchQuery = ref('')
const viewMode = ref<'grouped' | 'grid'>('grouped')
const collapsedGroups = ref<Set<string>>(new Set())

// Computed: Parse all scenes
const parsedScenes = computed(() => {
  return scenes.value.map(scenePath => parseScenePath(scenePath))
})

// Computed: Filter scenes by search query
const filteredScenes = computed(() => {
  if (!searchQuery.value) {
    return parsedScenes.value
  }

  const query = searchQuery.value.toLowerCase()
  return parsedScenes.value.filter(
    scene =>
      scene.name.toLowerCase().includes(query) ||
      scene.folder.toLowerCase().includes(query) ||
      scene.path.toLowerCase().includes(query)
  )
})

// Computed: Group scenes by top-level folder
const groupedByFolder = computed(() => {
  const groups = new Map<string, ParsedScenePath[]>()

  filteredScenes.value.forEach(scene => {
    // Get the top-level folder (e.g., "games/card/card/explosion" -> "games")
    const pathParts = scene.folder.split('/')
    const topFolder = pathParts[0] || ''

    if (!groups.has(topFolder)) {
      groups.set(topFolder, [])
    }
    groups.get(topFolder)!.push(scene)
  })

  // Convert to array and sort by folder name
  return Array.from(groups.entries())
    .map(([folder, scenes]) => ({
      folder,
      scenes: scenes.sort((a, b) => {
        // Sort by full path to maintain hierarchy
        return a.folder.localeCompare(b.folder) || a.name.localeCompare(b.name)
      })
    }))
    .sort((a, b) => {
      // Root folder first
      if (a.folder === '') return -1
      if (b.folder === '') return 1
      return a.folder.localeCompare(b.folder)
    })
})

// Functions
function toggleGroup(folder: string): void {
  if (collapsedGroups.value.has(folder)) {
    collapsedGroups.value.delete(folder)
  } else {
    collapsedGroups.value.add(folder)
  }
}

function getRelativePath(fullPath: string, basePath: string): string {
  if (!basePath) return fullPath
  if (fullPath === basePath) return ''

  // Remove base path and leading slash
  const relative = fullPath.startsWith(basePath + '/')
    ? fullPath.slice(basePath.length + 1)
    : fullPath

  return relative
}

async function refreshScenes(): Promise<void> {
  await sceneStore.fetchScenes()
}

function openScene(scenePath: string): void {
  router.push(`/editor/${scenePath}`)
}

onMounted(() => {
  refreshScenes()
})
</script>

<style scoped>
/* ============================================================================
   Container & Layout
   ============================================================================ */

.scene-list {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e1e;
  color: #cccccc;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ============================================================================
   Header
   ============================================================================ */

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}

.header-content h1 {
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #ffffff;
}

.subtitle {
  font-size: 13px;
  color: #858585;
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #0e639c;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.refresh-btn:hover {
  background: #1177bb;
}

.refresh-btn:active {
  background: #0d5a8f;
}

/* ============================================================================
   Toolbar (Combined Search and View Controls)
   ============================================================================ */

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
  gap: 16px; /* Add spacing between the search bar and buttons */
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1; /* Allow the search bar to take up more space */
}

.search-icon {
  color: #858585;
}

.search-input {
  flex: 1; /* Ensure the input expands within the search bar */
  padding: 8px 12px;
  background: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #cccccc;
  font-size: 13px;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: #007acc;
}

.search-input::placeholder {
  color: #858585;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: none;
  color: #858585;
  cursor: pointer;
  transition: color 0.15s ease;
}

.clear-btn:hover {
  color: #cccccc;
}

.view-controls {
  display: flex;
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: 8px;
  background: #3c3c3c;
  padding: 4px;
  border-radius: 4px;
}

.view-toggle button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: #cccccc;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.view-toggle button.active {
  background: #007acc;
  color: #ffffff;
}

.view-toggle button:hover {
  background: #005f99;
}

/* ============================================================================
   State Messages
   ============================================================================ */

.state-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  gap: 16px;
  color: #858585;
}

.state-message p {
  font-size: 16px;
  margin: 0;
  color: #cccccc;
}

.state-message small {
  font-size: 13px;
  color: #858585;
}

.state-message.error {
  color: #f48771;
}

.state-message.error p {
  color: #f48771;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #3e3e42;
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  padding: 8px 20px;
  background: #0e639c;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
  margin-top: 8px;
}

.retry-btn:hover {
  background: #1177bb;
}

/* ============================================================================
   Grouped View
   ============================================================================ */

.grouped-scenes {
  padding: 16px 32px 32px;
}

.scene-group {
  margin-bottom: 24px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #2d2d30;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  user-select: none;
}

.group-header:hover {
  background: #37373d;
}

.chevron {
  color: #858585;
  transition: transform 0.2s ease;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.group-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
}

.group-count {
  font-size: 12px;
  color: #858585;
  background: #3c3c3c;
  padding: 2px 8px;
  border-radius: 10px;
}

.group-items {
  margin-top: 8px;
  margin-left: 32px;
}

.scene-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scene-item:hover {
  background: #2d2d30;
  border-color: #007acc;
  transform: translateX(4px);
}

.scene-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.scene-item-name {
  font-size: 13px;
  color: #cccccc;
}

.scene-item-subpath {
  font-size: 11px;
  color: #858585;
  font-style: italic;
}

/* ============================================================================
   Grid View
   ============================================================================ */

.scenes-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 32px;
  max-width: 100%;
}

.scene-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.scene-card:hover {
  background: #2d2d30;
  border-color: #007acc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.scene-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: #2d2d30;
  border-radius: 8px;
  margin-bottom: 16px;
  color: #007acc;
  transition: all 0.2s ease;
}

.scene-card:hover .scene-icon {
  background: #37373d;
  color: #1177bb;
}

.scene-info {
  width: 100%;
  text-align: center;
  min-width: 0;
}

.scene-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #ffffff;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.scene-path {
  font-size: 12px;
  color: #858585;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>

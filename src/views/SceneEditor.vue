<template>
  <div class="editor-container">
    <!-- Toolbar -->
    <EditorToolbar
      :scene-name="sceneName"
      @back="goBack"
      @save="saveScene"
    />

    <!-- Main Editor Layout -->
    <div class="editor-layout">
      <!-- Left Sidebar: Hierarchy & Assets -->
      <aside class="sidebar left">
        <EditorPanel
          title="Scene Hierarchy"
          icon="folder"
        >
          <ObjectTree
            :objects="displayList"
            :selected-id="selectedObject?.id"
            @select="selectObject"
          />
        </EditorPanel>

        <EditorPanel
          title="Assets"
          icon="image"
        >
          <div class="panel-placeholder">
            Asset browser coming soon...
          </div>
        </EditorPanel>
      </aside>

      <!-- Center: Canvas Area -->
      <main class="canvas-area">
        <div
          v-if="!phaserGame"
          class="loading-canvas"
        >
          <div class="loading-spinner" />
          <p>Loading scene...</p>
        </div>
        <div
          ref="phaserContainer"
          class="phaser-container"
        />
      </main>

      <!-- Right Sidebar: Properties & Settings -->
      <aside class="sidebar right">
        <!-- Object Properties -->
        <EditorPanel
          title="Properties"
          icon="settings"
        >
          <div
            v-if="selectedObject"
            class="properties"
          >
            <!-- Transform Section -->
            <div class="property-section">
              <h4 class="section-title">
                Transform
              </h4>

              <div class="property-row">
                <label>Label</label>
                <input
                  v-model="selectedObject.label"
                  type="text"
                  class="property-input"
                  @input="updateObjectProperty('label', selectedObject.label)"
                >
              </div>

              <div class="property-row">
                <label>X</label>
                <input
                  v-model.number="selectedObject.x"
                  type="number"
                  step="1"
                  class="property-input"
                  @input="updateObjectProperty('x', selectedObject.x)"
                >
              </div>

              <div class="property-row">
                <label>Y</label>
                <input
                  v-model.number="selectedObject.y"
                  type="number"
                  step="1"
                  class="property-input"
                  @input="updateObjectProperty('y', selectedObject.y)"
                >
              </div>

              <div
                v-if="selectedObject.scaleX !== undefined"
                class="property-row"
              >
                <label>Scale X</label>
                <input
                  v-model.number="selectedObject.scaleX"
                  type="number"
                  step="0.1"
                  class="property-input"
                  @input="updateObjectProperty('scaleX', selectedObject.scaleX)"
                >
              </div>

              <div
                v-if="selectedObject.scaleY !== undefined"
                class="property-row"
              >
                <label>Scale Y</label>
                <input
                  v-model.number="selectedObject.scaleY"
                  type="number"
                  step="0.1"
                  class="property-input"
                  @input="updateObjectProperty('scaleY', selectedObject.scaleY)"
                >
              </div>
            </div>

            <!-- Appearance Section -->
            <div
              v-if="selectedObject.texture"
              class="property-section"
            >
              <h4 class="section-title">
                Appearance
              </h4>

              <div class="property-row">
                <label>Texture</label>
                <input
                  v-model="selectedObject.texture.key"
                  type="text"
                  class="property-input"
                  readonly
                >
              </div>

              <div
                v-if="selectedObject.texture.frame"
                class="property-row"
              >
                <label>Frame</label>
                <input
                  v-model="selectedObject.texture.frame"
                  type="text"
                  class="property-input"
                  readonly
                >
              </div>
            </div>
          </div>

          <!-- No Selection State -->
          <div
            v-else
            class="no-selection"
          >
            <p>No object selected</p>
            <small>Click an object in the scene or hierarchy to view its properties</small>
          </div>
        </EditorPanel>

        <!-- Scene Settings -->
        <EditorPanel
          title="Scene Settings"
          icon="document"
        >
          <div class="properties">
            <div
              v-if="sceneStore.currentScene"
              class="property-section"
            >
              <div class="property-row">
                <label>Scene Key</label>
                <input
                  v-model="sceneStore.currentScene.settings.sceneKey"
                  type="text"
                  class="property-input"
                  readonly
                >
              </div>

              <div class="property-row">
                <label>Width</label>
                <input
                  v-model.number="sceneStore.currentScene.settings.borderWidth"
                  type="number"
                  class="property-input"
                >
              </div>

              <div class="property-row">
                <label>Height</label>
                <input
                  v-model.number="sceneStore.currentScene.settings.borderHeight"
                  type="number"
                  class="property-input"
                >
              </div>
            </div>
          </div>
        </EditorPanel>
      </aside>
    </div>

    <!-- Status Bar -->
    <footer class="status-bar">
      <div class="status-section">
        <span class="status-item">Objects: {{ totalObjectCount }}</span>
        <span class="status-item">Selected: {{ selectedObject?.label || 'None' }}</span>
      </div>
      <div class="status-section">
        <span class="status-item">Zoom: {{ zoomPercentage }}%</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Vue & Router
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Components
import EditorPanel from '@/components/editor/EditorPanel.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import ObjectTree from '@/components/editor/ObjectTree.vue'

// Phaser
import Phaser from 'phaser'
import PhaserScene from '@/phaser/PhaserScene'

// Store & Types
import { useSceneStore } from '@/stores/sceneStore'
import type { GameObject } from '@/types'

// Utils
import { formatError } from '@/utils/helpers'

// ============================================================================
// Route & Store
// ============================================================================

const route = useRoute()
const router = useRouter()
const sceneStore = useSceneStore()

// ============================================================================
// Refs & State
// ============================================================================

const phaserContainer = ref<HTMLDivElement | null>(null)
let phaserGame: Phaser.Game | null = null
let phaserScene: PhaserScene | null = null

// ============================================================================
// Computed Properties
// ============================================================================

const scenePath = computed(() => {
  const params = route.params.scenePath
  return Array.isArray(params) ? params.join('/') : params
})

const sceneName = computed(() => scenePath.value.split('/').pop() || '')

const displayList = computed(() => {
  const list = sceneStore.currentScene?.displayList || []
  // Reverse the list so items at the end (foreground) appear at the top
  return [...list].reverse()
})

const selectedObject = computed(() => sceneStore.selectedObject)

const zoomPercentage = computed(() => Math.round(sceneStore.cameraZoom * 100))

const totalObjectCount = computed(() => {
  function countObjects(objects: GameObject[]): number {
    return objects.reduce((count: number, obj: GameObject) => {
      const childrenCount = obj.list ? countObjects(obj.list) : 0;
      return count + 1 + childrenCount;
    }, 0);
  }

  return countObjects(displayList.value);
});

// ============================================================================
// Scene Management
// ============================================================================

async function loadScene(): Promise<void> {
  try {
    await sceneStore.loadScene(scenePath.value)
    if (phaserScene && sceneStore.currentScene) {
      phaserScene.loadSceneData(sceneStore.currentScene)
    }
  } catch (error: unknown) {
    console.error('Failed to load scene:', error)
  }
}

async function saveScene(): Promise<void> {
  try {
    await sceneStore.saveScene(scenePath.value)
    alert('Scene saved successfully!')
  } catch (error: unknown) {
    alert('Failed to save scene: ' + formatError(error))
  }
}

// ============================================================================
// Navigation & Selection
// ============================================================================

function goBack(): void {
  router.push('/')
}

function selectObject(obj: GameObject): void {
  sceneStore.selectObject(obj)
  if (phaserScene) {
    phaserScene.selectObject(obj.id)
  }
}

// ============================================================================
// Property Updates
// ============================================================================

function updateObjectProperty(property: string, value: unknown): void {
  if (!selectedObject.value) return

  // Update store
  sceneStore.updateSelectedObject(property, value)

  // Update Phaser scene
  if (phaserScene) {
    phaserScene.updateObjectProperty(selectedObject.value.id, property, value)
  }
}

// ============================================================================
// Phaser Initialization
// ============================================================================

function initializePhaser(): void {
  if (!phaserContainer.value || !sceneStore.currentScene) {
    console.error('Failed to initialize Phaser: missing container or scene')
    return
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: sceneStore.currentScene.settings.borderWidth || 1520,
    height: sceneStore.currentScene.settings.borderHeight || 960,
    parent: phaserContainer.value,
    backgroundColor: '#1a1a1a',
    scene: PhaserScene,
    loader: {
      baseURL: '/',
      crossOrigin: 'anonymous'
    },
    callbacks: {
      postBoot: (game: Phaser.Game) => {
        phaserScene = game.scene.scenes[0] as PhaserScene

        // Set up zoom change callback
        phaserScene.setOnZoomChange((zoom: number) => {
          sceneStore.setCameraZoom(zoom)
        })

        // Load scene data after Phaser initialization
        setTimeout(() => {
          if (phaserScene?.loadSceneData && sceneStore.currentScene) {
            phaserScene.loadSceneData(sceneStore.currentScene)
          }
        }, 100)
      }
    }
  }

  phaserGame = new Phaser.Game(config)
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

onMounted(async () => {
  await loadScene()

  // Wait for DOM to be fully rendered
  await new Promise(resolve => setTimeout(resolve, 100))

  initializePhaser()
})

onUnmounted(() => {
  if (phaserGame) {
    phaserGame.destroy(true)
  }
})
</script>

<style scoped>
/* ============================================================================
   Container & Layout
   ============================================================================ */

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e1e;
  color: #cccccc;
}

.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ============================================================================
   Sidebars
   ============================================================================ */

.sidebar {
  width: 300px;
  background: #252526;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar.left {
  border-right: 1px solid #3e3e42;
}

.sidebar.right {
  border-left: 1px solid #3e3e42;
}

/* ============================================================================
   Canvas Area
   ============================================================================ */

.canvas-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  background: #1e1e1e;
  position: relative;
  min-width: 0;
  min-height: 0;
}

.loading-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #858585;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #3e3e42;
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.phaser-container {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.phaser-container canvas {
  display: block !important;
}

/* ============================================================================
   Properties Panel
   ============================================================================ */

.properties {
  padding: 12px;
}

.property-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #858585;
  text-transform: uppercase;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #3e3e42;
}

.property-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.property-row label {
  font-size: 12px;
  color: #cccccc;
  font-weight: 500;
}

.property-input {
  width: 100%;
  padding: 6px 8px;
  background: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #cccccc;
  font-size: 13px;
  border-radius: 3px;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.property-input:focus {
  outline: none;
  border-color: #007acc;
  background: #2d2d30;
}

.property-input[readonly] {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ============================================================================
   Placeholder States
   ============================================================================ */

.panel-placeholder {
  padding: 20px;
  text-align: center;
  color: #858585;
  font-size: 13px;
}

.no-selection {
  padding: 20px;
  text-align: center;
  color: #858585;
}

.no-selection p {
  margin: 0 0 8px 0;
  font-size: 13px;
}

.no-selection small {
  font-size: 11px;
  opacity: 0.8;
}

/* ============================================================================
   Status Bar
   ============================================================================ */

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: #007acc;
  border-top: 1px solid #005a9e;
  font-size: 12px;
  color: #ffffff;
  height: 24px;
}

.status-section {
  display: flex;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
}
</style>

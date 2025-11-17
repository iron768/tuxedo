<template>
  <div
    class="editor-panel"
    :class="{ collapsed }"
  >
    <div
      class="panel-header"
      @click="toggleCollapse"
    >
      <div class="panel-title">
        <Icon
          v-if="iconComponent"
          :size="14"
          class="panel-icon"
        >
          <component :is="iconComponent" />
        </Icon>
        <span>{{ title }}</span>
      </div>
      <button
        class="collapse-btn"
        :class="{ collapsed }"
        type="button"
      >
        <Icon :size="10">
          <ChevronDown v-if="!collapsed" />
          <ChevronForward v-else />
        </Icon>
      </button>
    </div>
    <div
      v-show="!collapsed"
      class="panel-content"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@vicons/utils'
import {
  ChevronDown,
  ChevronForward,
  FolderOpen,
  Image,
  Settings,
  Document
} from '@vicons/ionicons5'
import type { Component } from 'vue'

const props = defineProps<{
  title: string
  icon?: string
  defaultCollapsed?: boolean
}>()

const collapsed = ref(props.defaultCollapsed || false)

const iconMap: Record<string, Component> = {
  folder: FolderOpen,
  image: Image,
  settings: Settings,
  document: Document
}

const iconComponent = computed(() => {
  return props.icon ? iconMap[props.icon] : null
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
}
</script>

<style scoped>
.editor-panel {
  background: #252526;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.panel-header:hover {
  background: #2a2d2e;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #cccccc;
}

.panel-icon {
  font-size: 14px;
  opacity: 0.8;
}

.collapse-btn {
  background: none;
  border: none;
  color: #858585;
  font-size: 10px;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.collapse-btn:hover {
  color: #cccccc;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
</style>

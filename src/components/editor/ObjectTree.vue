<template>
  <div class="object-tree">
    <div
      v-for="obj in objects"
      :key="obj.id"
      class="tree-item"
      :class="{ selected: isSelected(obj.id) }"
      @click.stop="$emit('select', obj)"
    >
      <div class="tree-item-content">
        <Icon
          :size="14"
          class="tree-icon"
        >
          <component :is="getIcon(obj.type)" />
        </Icon>
        <span class="tree-label">{{ obj.label || 'Unnamed' }}</span>
        <span class="tree-type">{{ obj.type }}</span>
      </div>

      <!-- Nested children for containers -->
      <div
        v-if="obj.list && obj.list.length > 0"
        class="tree-children"
      >
        <ObjectTree
          :objects="obj.list"
          :selected-id="selectedId"
          @select="$emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@vicons/utils'
import {
  Image,
  CubeOutline,
  SquareOutline,
  EllipseOutline,
  ShapesOutline,
  FilmOutline,
  TextOutline
} from '@vicons/ionicons5'
import type { GameObject } from '@/types'
import type { Component } from 'vue'

const props = defineProps<{
  objects: GameObject[]
  selectedId?: string | null
}>()

defineEmits<{
  select: [obj: GameObject]
}>()

function isSelected(id: string): boolean {
  return props.selectedId === id
}

const iconMap: Record<string, Component> = {
  Image,
  Text: TextOutline, // Updated icon for text objects
  Container: CubeOutline,
  Sprite: FilmOutline,
  Rectangle: SquareOutline,
  Ellipse: EllipseOutline,
  Polygon: ShapesOutline
}

function getIcon(type?: string): Component {
  return iconMap[type || ''] || CubeOutline
}
</script>

<style scoped>
.object-tree {
  padding: 4px 0;
}

.tree-item {
  cursor: pointer;
  user-select: none;
}

.tree-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #2d2d30;
  transition: background 0.15s;
}

.tree-item-content:hover {
  background: #2a2d2e;
}

.tree-item.selected > .tree-item-content {
  background: #094771;
}

.tree-icon {
  font-size: 14px;
  opacity: 0.8;
  min-width: 18px;
}

.tree-label {
  flex: 1;
  font-size: 13px;
  color: #cccccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-type {
  font-size: 11px;
  color: #858585;
  font-family: 'Consolas', monospace;
}

.tree-children {
  padding-left: 20px;
  border-left: 1px solid #3e3e42;
  margin-left: 20px;
}
</style>

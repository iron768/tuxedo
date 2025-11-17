<template>
  <aside class="sidebar left">
    <h3>Scene Objects</h3>
    <div class="object-list">
      <div
        v-for="obj in objects"
        :key="obj.id"
        class="object-item"
        :class="{ selected: isSelected(obj.id) }"
        @click="$emit('select', obj)"
      >
        <span class="object-type">{{ obj.type }}</span>
        <span class="object-label">{{ obj.label }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { GameObject } from '@/types'

defineProps<{
  objects: GameObject[]
  selectedId: string | null
}>()

defineEmits<{
  select: [obj: GameObject]
}>()

function isSelected(id: string): boolean {
  return id === defineProps<{ selectedId: string | null }>().selectedId
}
</script>

<style scoped>
.sidebar.left {
  width: 250px;
  background: #2a2a2a;
  border-right: 1px solid #444;
  overflow-y: auto;
}

.object-list {
  padding: 8px;
}

.object-item {
  padding: 8px;
  margin: 4px 0;
  background: #333;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  transition: background 0.2s;
}

.object-item:hover {
  background: #3a3a3a;
}

.object-item.selected {
  background: #4a4a4a;
  border-left: 3px solid #007acc;
}

.object-type {
  font-size: 0.9em;
  color: #888;
}

.object-label {
  font-weight: 500;
}
</style>

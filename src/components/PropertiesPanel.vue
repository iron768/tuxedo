<template>
  <aside class="sidebar right">
    <h3>Properties</h3>
    <div
      v-if="object"
      class="properties"
    >
      <div class="property-group">
        <label>Type</label>
        <input
          :value="object.type"
          type="text"
          readonly
        >
      </div>
      <div class="property-group">
        <label>Label</label>
        <input
          :value="object.label"
          type="text"
          @input="updateProperty('label', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="property-group">
        <label>X</label>
        <input
          :value="object.x"
          type="number"
          step="0.1"
          @input="updateProperty('x', parseFloat(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div class="property-group">
        <label>Y</label>
        <input
          :value="object.y"
          type="number"
          step="0.1"
          @input="updateProperty('y', parseFloat(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div
        v-if="object.originX !== undefined"
        class="property-group"
      >
        <label>Origin X</label>
        <input
          :value="object.originX"
          type="number"
          step="0.1"
          min="0"
          max="1"
          @input="updateProperty('originX', parseFloat(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div
        v-if="object.originY !== undefined"
        class="property-group"
      >
        <label>Origin Y</label>
        <input
          :value="object.originY"
          type="number"
          step="0.1"
          min="0"
          max="1"
          @input="updateProperty('originY', parseFloat(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div
        v-if="object.scaleX !== undefined"
        class="property-group"
      >
        <label>Scale X</label>
        <input
          :value="object.scaleX"
          type="number"
          step="0.1"
          @input="updateProperty('scaleX', parseFloat(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div
        v-if="object.scaleY !== undefined"
        class="property-group"
      >
        <label>Scale Y</label>
        <input
          :value="object.scaleY"
          type="number"
          step="0.1"
          @input="updateProperty('scaleY', parseFloat(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div
        v-if="object.angle !== undefined"
        class="property-group"
      >
        <label>Angle</label>
        <input
          :value="object.angle"
          type="number"
          step="1"
          @input="updateProperty('angle', parseFloat(($event.target as HTMLInputElement).value))"
        >
      </div>
      <div
        v-if="object.texture"
        class="property-group"
      >
        <label>Texture</label>
        <input
          :value="object.texture.key"
          type="text"
          readonly
        >
      </div>
      <div
        v-if="object.texture?.frame"
        class="property-group"
      >
        <label>Frame</label>
        <input
          :value="object.texture.frame"
          type="text"
          readonly
        >
      </div>
    </div>
    <div
      v-else
      class="no-selection"
    >
      No object selected
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { GameObject } from '@/types'

const props = defineProps<{
  object: GameObject | null
}>()

const emit = defineEmits<{
  update: [property: string, value: unknown]
}>()

function updateProperty(property: string, value: unknown): void {
  if (props.object) {
    emit('update', property, value)
  }
}
</script>

<style scoped>
.sidebar.right {
  width: 300px;
  background: #2a2a2a;
  border-left: 1px solid #444;
  overflow-y: auto;
}

.properties {
  padding: 16px;
}

.property-group {
  margin-bottom: 16px;
}

.property-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.9em;
  color: #aaa;
}

.property-group input {
  width: 100%;
  padding: 8px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 0.95em;
}

.property-group input:focus {
  outline: none;
  border-color: #007acc;
}

.property-group input[readonly] {
  color: #888;
  cursor: not-allowed;
}

.no-selection {
  padding: 16px;
  text-align: center;
  color: #888;
}
</style>

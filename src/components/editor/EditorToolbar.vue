<template>
  <div class="toolbar-container">
    <div class="toolbar-section left">
      <button
        class="toolbar-btn"
        type="button"
        title="Back to scenes"
        @click="$emit('back')"
      >
        <Icon :size="16">
          <ArrowBack />
        </Icon>
        Back
      </button>
      <div class="toolbar-divider" />
      <button
        class="toolbar-btn"
        type="button"
        title="Save (Ctrl+S)"
        @click="$emit('save')"
      >
        <Icon :size="16">
          <Save />
        </Icon>
        Save
      </button>
      <button
        class="toolbar-btn"
        type="button"
        title="Undo (Ctrl+Z)"
      >
        <Icon :size="16">
          <ArrowUndo />
        </Icon>
      </button>
      <button
        class="toolbar-btn"
        type="button"
        title="Redo (Ctrl+Y)"
      >
        <Icon :size="16">
          <ArrowRedo />
        </Icon>
      </button>
    </div>

    <div class="toolbar-section center">
      <h2 class="scene-title">
        {{ sceneName }}
      </h2>
    </div>

    <div class="toolbar-section right">
      <button
        class="toolbar-btn"
        type="button"
        title="Settings"
      >
        <Icon :size="16">
          <Settings />
        </Icon>
      </button>
      <button
        class="toolbar-btn"
        type="button"
        title="Help"
      >
        <Icon :size="16">
          <HelpCircle />
        </Icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@vicons/utils'
import { ArrowBack, Save, ArrowUndo, ArrowRedo, Settings, HelpCircle } from '@vicons/ionicons5'
defineProps<{
  sceneName: string
}>()

defineEmits<{
  back: []
  save: []
}>()
</script>

<style scoped>
.toolbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  height: 48px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-section.center {
  flex: 1;
  justify-content: center;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  color: #cccccc;
  cursor: pointer;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #3e3e42;
  border-color: #555555;
}

.toolbar-btn:active {
  background: #094771;
}

.toolbar-btn .icon {
  font-size: 14px;
  opacity: 0.9;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #3e3e42;
  margin: 0 8px;
}

.scene-title {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
  margin: 0;
}
</style>

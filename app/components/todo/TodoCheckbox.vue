<template>
  <div class="todo-checkbox-wrapper">
    <input
      :id="checkboxId"
      v-model="isChecked"
      type="checkbox"
      class="todo-checkbox-input"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @change="handleChange"
    />
    <label
      :for="checkboxId"
      class="todo-checkbox-label"
      :class="[
        `todo-checkbox-${size}`,
        { 'todo-checkbox-checked': isChecked },
        { 'todo-checkbox-disabled': disabled }
      ]"
    >
      <div class="todo-checkbox-box">
        <svg
          v-if="isChecked"
          class="todo-checkbox-icon"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TodoCheckboxProps } from '../../../shared/types'

interface Props extends TodoCheckboxProps {
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
  ariaLabel: 'Toggle completion'
})

const emit = defineEmits<{
  'update:checked': [value: boolean]
}>()

// Generate unique ID for accessibility
const checkboxId = ref(`todo-checkbox-${Math.random().toString(36).substr(2, 9)}`)

const isChecked = computed({
  get: () => props.checked,
  set: (value: boolean) => emit('update:checked', value)
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:checked', target.checked)
}
</script>

<style scoped>
.todo-checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.todo-checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.todo-checkbox-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: all 150ms ease-in-out;
}

.todo-checkbox-label:hover:not(.todo-checkbox-disabled) {
  transform: scale(1.05);
}

.todo-checkbox-label:focus-within {
  outline: 2px solid var(--todo-primary-color, #2563eb);
  outline-offset: 2px;
  border-radius: 4px;
}

.todo-checkbox-box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--todo-border, #e2e8f0);
  border-radius: var(--todo-border-radius, 4px);
  background-color: var(--todo-bg-primary, #ffffff);
  transition: all 150ms ease-in-out;
  position: relative;
  overflow: hidden;
}

/* Size variants */
.todo-checkbox-sm .todo-checkbox-box {
  width: 16px;
  height: 16px;
}

.todo-checkbox-md .todo-checkbox-box {
  width: 18px;
  height: 18px;
}

.todo-checkbox-lg .todo-checkbox-box {
  width: 20px;
  height: 20px;
}

/* Checked state */
.todo-checkbox-checked .todo-checkbox-box {
  background-color: var(--todo-success, #10b981);
  border-color: var(--todo-success, #10b981);
}

/* Icon styling */
.todo-checkbox-icon {
  width: 12px;
  height: 12px;
  color: white;
  animation: checkmark-appear 200ms ease-in-out;
}

.todo-checkbox-sm .todo-checkbox-icon {
  width: 10px;
  height: 10px;
}

.todo-checkbox-lg .todo-checkbox-icon {
  width: 14px;
  height: 14px;
}

/* Disabled state */
.todo-checkbox-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.todo-checkbox-disabled:hover {
  transform: none;
}

/* Hover effects */
.todo-checkbox-label:hover:not(.todo-checkbox-disabled):not(.todo-checkbox-checked) .todo-checkbox-box {
  border-color: var(--todo-primary-color, #2563eb);
  background-color: var(--todo-bg-hover, #f1f5f9);
}

/* Animations */
@keyframes checkmark-appear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* CSS Custom Properties */
:root {
  --todo-primary-color: #2563eb;
  --todo-success: #10b981;
  --todo-bg-primary: #ffffff;
  --todo-bg-hover: #f1f5f9;
  --todo-border: #e2e8f0;
  --todo-border-radius: 4px;
}
</style>

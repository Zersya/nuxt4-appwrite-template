<template>
  <div class="todo-item" :class="{ 'todo-item-completed': todo.completed }">
    <!-- Main todo item -->
    <div 
      class="todo-item-content"
      :style="{ paddingLeft: `${level * 24}px` }"
    >
      <!-- Expand/Collapse Button -->
      <button
        v-if="hasChildren"
        class="todo-expand-button"
        :class="{ 'todo-expand-button-expanded': todo.expanded }"
        @click="toggleExpanded"
        :aria-label="todo.expanded ? 'Collapse subtasks' : 'Expand subtasks'"
      >
        <svg
          class="todo-expand-icon"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      
      <!-- Spacer for items without children -->
      <div v-else class="todo-expand-spacer"></div>

      <!-- Checkbox -->
      <TodoCheckbox
        :checked="todo.completed"
        @update:checked="toggleCompleted"
        class="todo-item-checkbox"
      />

      <!-- Priority Indicator -->
      <div
        v-if="todo.priority"
        class="todo-priority-indicator"
        :class="`todo-priority-${todo.priority}`"
        :title="`Priority: ${todo.priority}`"
      ></div>

      <!-- Todo Text -->
      <div class="todo-text-container">
        <span
          class="todo-text"
          :class="{ 'todo-text-completed': todo.completed }"
        >
          {{ todo.text }}
        </span>
        
        <!-- Due Date -->
        <span
          v-if="todo.dueDate"
          class="todo-due-date"
          :class="{ 'todo-due-date-overdue': isOverdue }"
        >
          {{ formatDueDate(todo.dueDate) }}
        </span>
      </div>

      <!-- Children Count -->
      <div
        v-if="hasChildren"
        class="todo-children-count"
        :title="`${completedChildrenCount}/${totalChildrenCount} completed`"
      >
        {{ completedChildrenCount }}/{{ totalChildrenCount }}
      </div>

      <!-- Delete Button -->
      <button
        class="todo-delete-button"
        @click="deleteTodo"
        :aria-label="'Delete todo'"
        title="Delete todo"
      >
        <svg
          class="todo-delete-icon"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 2V1C6 0.447715 6.44772 0 7 0H9C9.55228 0 10 0.447715 10 1V2H13C13.5523 2 14 2.44772 14 3C14 3.55228 13.5523 4 13 4H12V13C12 14.1046 11.1046 15 10 15H6C4.89543 15 4 14.1046 4 13V4H3C2.44772 4 2 3.55228 2 3C2 2.44772 2.44772 2 3 2H6ZM6 4V13H10V4H6ZM7 2V1H9V2H7Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>

    <!-- Children (Recursive) -->
    <div
      v-if="hasChildren && todo.expanded"
      class="todo-children"
    >
      <TodoList
        :todos="todo.children!"
        :level="level + 1"
        @toggle-completed="$emit('toggle-completed', $event)"
        @toggle-expanded="$emit('toggle-expanded', $event)"
        @delete-todo="$emit('delete-todo', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TodoItemProps } from '../../../shared/types'
import TodoCheckbox from './TodoCheckbox.vue'
import TodoList from './TodoList.vue'

interface Props extends TodoItemProps {
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

const emit = defineEmits<{
  'toggle-completed': [id: string]
  'toggle-expanded': [id: string]
  'delete-todo': [id: string]
}>()

// Computed properties
const hasChildren = computed(() => 
  props.todo.children && props.todo.children.length > 0
)

const totalChildrenCount = computed(() => 
  props.todo.children?.length || 0
)

const completedChildrenCount = computed(() => 
  props.todo.children?.filter(child => child.completed).length || 0
)

const isOverdue = computed(() => {
  if (!props.todo.dueDate) return false
  return new Date(props.todo.dueDate) < new Date()
})

// Methods
const toggleCompleted = () => {
  emit('toggle-completed', props.todo.id)
}

const toggleExpanded = () => {
  emit('toggle-expanded', props.todo.id)
}

const deleteTodo = () => {
  emit('delete-todo', props.todo.id)
}

const formatDueDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}


</script>

<style scoped>
.todo-item {
  transition: all 150ms ease-in-out;
}

.todo-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--todo-border-radius, 6px);
  transition: all 150ms ease-in-out;
  min-height: 44px; /* Touch-friendly */
}

.todo-item-content:hover {
  background-color: var(--todo-bg-hover, #f1f5f9);
}

.todo-item-completed .todo-item-content {
  opacity: 0.6;
}

/* Expand/Collapse Button */
.todo-expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  color: var(--todo-text-secondary, #475569);
  transition: all 150ms ease-in-out;
}

.todo-expand-button:hover {
  background-color: var(--todo-bg-hover, #f1f5f9);
  color: var(--todo-text-primary, #0f172a);
}

.todo-expand-button:focus {
  outline: 2px solid var(--todo-primary-color, #2563eb);
  outline-offset: 2px;
}

.todo-expand-icon {
  width: 12px;
  height: 12px;
  transition: transform 150ms ease-in-out;
}

.todo-expand-button-expanded .todo-expand-icon {
  transform: rotate(90deg);
}

.todo-expand-spacer {
  width: 20px;
  height: 20px;
}

/* Priority Indicators */
.todo-priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.todo-priority-high {
  background-color: #ef4444; /* red-500 */
}

.todo-priority-medium {
  background-color: #f59e0b; /* amber-500 */
}

.todo-priority-low {
  background-color: #10b981; /* emerald-500 */
}

/* Text Container */
.todo-text-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* Allow text to wrap */
}

.todo-text {
  font-size: 14px;
  line-height: 1.4;
  color: var(--todo-text-primary, #0f172a);
  word-wrap: break-word;
  transition: all 150ms ease-in-out;
}

.todo-text-completed {
  text-decoration: line-through;
  color: var(--todo-text-secondary, #334155);
}

/* Due Date */
.todo-due-date {
  font-size: 12px;
  color: var(--todo-text-secondary, #334155);
  font-weight: 500;
}

.todo-due-date-overdue {
  color: #ef4444; /* red-500 */
}

/* Children Count */
.todo-children-count {
  font-size: 12px;
  color: var(--todo-text-secondary, #334155);
  background-color: var(--todo-bg-hover, #f1f5f9);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  flex-shrink: 0;
}

/* Delete Button */
.todo-delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--todo-text-secondary, #64748b);
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  flex-shrink: 0;
  opacity: 0;
}

.todo-item-content:hover .todo-delete-button {
  opacity: 1;
}

.todo-delete-button:hover {
  background-color: var(--todo-danger-bg, #fef2f2);
  color: var(--todo-danger, #dc2626);
  transform: scale(1.1);
}

.todo-delete-icon {
  width: 14px;
  height: 14px;
}

/* Children Container */
.todo-children {
  overflow: hidden;
  animation: expand 200ms ease-in-out;
}

@keyframes expand {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .todo-item-content {
    padding: 10px 12px;
    gap: 6px;
  }
  
  .todo-text {
    font-size: 13px;
  }
  
  .todo-due-date {
    font-size: 11px;
  }
}
</style>

<template>
  <div class="todo-list" :class="{ 'todo-list-nested': level > 0 }">
    <!-- Empty State -->
    <div v-if="todos.length === 0" class="todo-list-empty">
      <div class="todo-empty-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <p class="todo-empty-text">
        {{ level === 0 ? 'No todos yet' : 'No subtasks' }}
      </p>
      <p class="todo-empty-subtext">
        {{ level === 0 ? 'Add your first todo to get started' : 'This task has no subtasks' }}
      </p>
    </div>

    <!-- Todo Items -->
    <div v-else class="todo-list-items">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        :level="level"
        @toggle-completed="handleToggleCompleted"
        @toggle-expanded="handleToggleExpanded"
        @delete-todo="handleDeleteTodo"
        class="todo-list-item"
      />
    </div>

    <!-- Loading State (for future use) -->
    <div v-if="loading" class="todo-list-loading">
      <div class="todo-loading-spinner"></div>
      <p class="todo-loading-text">Loading todos...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TodoListProps } from '../../../shared/types'
import TodoItem from './TodoItem.vue'

interface Props extends TodoListProps {
  level?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  loading: false
})

const emit = defineEmits<{
  'toggle-completed': [id: string]
  'toggle-expanded': [id: string]
  'delete-todo': [id: string]
}>()

// Computed properties
const sortedTodos = computed(() => {
  // Sort todos: incomplete first, then by priority, then by creation date
  return [...props.todos].sort((a, b) => {
    // Completed items go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    
    // Sort by priority (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority || 'low']
    const bPriority = priorityOrder[b.priority || 'low']
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // Sort by creation date (newest first)
    const aDate = new Date(a.createdAt || '').getTime()
    const bDate = new Date(b.createdAt || '').getTime()
    return bDate - aDate
  })
})

// Event handlers
const handleToggleCompleted = (id: string) => {
  emit('toggle-completed', id)
}

const handleToggleExpanded = (id: string) => {
  emit('toggle-expanded', id)
}

const handleDeleteTodo = (id: string) => {
  emit('delete-todo', id)
}
</script>

<style scoped>
.todo-list {
  width: 100%;
}

.todo-list-nested {
  margin-left: 0;
}

.todo-list-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-list-item {
  border-radius: var(--todo-border-radius, 6px);
  transition: all 150ms ease-in-out;
}

/* Empty State */
.todo-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.todo-empty-icon {
  width: 48px;
  height: 48px;
  color: var(--todo-text-secondary, #334155);
  margin-bottom: 16px;
  opacity: 0.6;
}

.todo-empty-icon svg {
  width: 100%;
  height: 100%;
}

.todo-empty-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--todo-text-primary, #0f172a);
  margin: 0 0 8px 0;
}

.todo-empty-subtext {
  font-size: 14px;
  color: var(--todo-text-secondary, #334155);
  margin: 0;
}

/* Loading State */
.todo-list-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
}

.todo-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--todo-border, #e2e8f0);
  border-top: 3px solid var(--todo-primary-color, #2563eb);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.todo-loading-text {
  font-size: 14px;
  color: var(--todo-text-secondary, #334155);
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 640px) {
  .todo-list-empty {
    padding: 32px 16px;
  }
  
  .todo-empty-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 12px;
  }
  
  .todo-empty-text {
    font-size: 15px;
  }
  
  .todo-empty-subtext {
    font-size: 13px;
  }
}

/* Nested list styling */
.todo-list-nested .todo-list-empty {
  padding: 24px 16px;
}

.todo-list-nested .todo-empty-icon {
  width: 32px;
  height: 32px;
}

.todo-list-nested .todo-empty-text {
  font-size: 14px;
}

.todo-list-nested .todo-empty-subtext {
  font-size: 12px;
}

/* Animation for list items */
.todo-list-item {
  animation: fadeInUp 200ms ease-in-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hover effects for better UX */
.todo-list-items:hover .todo-list-item:not(:hover) {
  opacity: 0.8;
}

.todo-list-items .todo-list-item:hover {
  opacity: 1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

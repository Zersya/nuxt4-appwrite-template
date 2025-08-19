<template>
  <div class="todo-app">
    <!-- Header -->
    <header class="todo-header">
      <div class="todo-header-content">
        <h1 class="todo-title">
          <svg class="todo-title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          My Tasks
        </h1>
        
        <div class="todo-stats">
          <span class="todo-stat">
            {{ completedCount }}/{{ totalCount }} completed
          </span>
          <div class="todo-progress-bar">
            <div 
              class="todo-progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </header>

    <!-- User Info -->
    <div class="todo-user-info">
      <div class="todo-user-details">
        <span class="todo-user-greeting">Hello, {{ user?.name || 'User' }}!</span>
        <span class="todo-user-email">{{ user?.email }}</span>
      </div>
      <button @click="logout" class="todo-logout-button" :disabled="loading.logout">
        <span v-if="loading.logout">Logging out...</span>
        <span v-else>Logout</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="todo-filters">
      <button
        v-for="filterOption in filterOptions"
        :key="filterOption.value"
        class="todo-filter-button"
        :class="{ 'todo-filter-active': filter === filterOption.value }"
        @click="setFilter(filterOption.value)"
      >
        {{ filterOption.label }}
        <span class="todo-filter-count">{{ getFilterCount(filterOption.value) }}</span>
      </button>
    </div>

    <!-- Add Todo Form -->
    <div class="todo-add-form">
      <form @submit.prevent="handleAddTodo" class="todo-form">
        <div class="todo-form-main">
          <input
            v-model="newTodoText"
            type="text"
            placeholder="Add a new todo..."
            class="todo-input"
            :disabled="loading.submit"
          />
          <button
            type="button"
            @click="toggleAttachmentUpload"
            class="todo-attachment-toggle"
            :class="{ 'todo-attachment-toggle-active': showAttachmentUpload }"
            :disabled="loading.submit"
            title="Add attachments"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 21.9983 8.005 21.9983C6.41278 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63417 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38787 15.78 1.38787C16.8414 1.38787 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7821 4.32861 19.7821 5.39C19.7821 6.45139 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03494 17.7851 8.52433 17.9961 7.99 17.9961C7.45567 17.9961 6.94506 17.7851 6.57 17.41C6.19494 17.0349 5.98387 16.5243 5.98387 15.99C5.98387 15.4557 6.19494 14.9451 6.57 14.57L15.07 6.07"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            type="submit"
            class="todo-add-button"
            :disabled="!newTodoText.trim() || loading.submit"
          >
            <span v-if="loading.submit">Adding...</span>
            <span v-else>Add</span>
          </button>
        </div>

        <!-- File Upload Section -->
        <div v-if="showAttachmentUpload" class="todo-attachment-upload">
          <FileUpload
            ref="fileUploadRef"
            v-model="selectedFiles"
            :multiple="true"
            :disabled="loading.submit"
            @upload-progress="handleUploadProgress"
            @upload-complete="handleUploadComplete"
            @upload-error="handleUploadError"
          />
        </div>
      </form>
    </div>
    <!-- Main Content -->
    <main class="todo-main">
      <div class="todo-container">
        <TodoList
          :todos="filteredTodos"
          :loading="loading.fetch"
          @toggle-completed="handleToggleCompleted"
          @toggle-expanded="handleToggleExpanded"
          @delete-todo="handleDeleteTodo"
        />
      </div>
    </main>

    <!-- Footer -->
    <footer class="todo-footer">
      <p class="todo-footer-text">
        Built with Vue 3 & TypeScript
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { Todo, TodoFilter } from '../../../shared/types'
import TodoList from './TodoList.vue'
import FileUpload from '../ui/FileUpload.vue'
import { useTodosStore } from '~/stores/todos'
import { useAuthStore } from '~/stores/auth'

const store = useTodosStore()
// Use storeToRefs for reactive state properties
const { todos, filter, loading: storeLoading } = storeToRefs(store)
// Destructure actions directly from the store
const { fetchTodos, setLoading, setFilter, toggleCompleted, toggleExpanded, createTodo, deleteTodo, uploadAttachment } = store

// Auth store for user session and logout
const authStore = useAuthStore()
const { user, loading: authLoading } = storeToRefs(authStore)
const { logout } = authStore

// Loading states
const loading = computed(() => ({
  ...storeLoading.value,
  logout: authLoading.value.logout
}))

// Form state
const newTodoText = ref('')
const showAttachmentUpload = ref(false)
const selectedFiles = ref<File[]>([])
const fileUploadRef = ref()

// Filter options
const filterOptions = [
  { value: 'all' as TodoFilter, label: 'All' },
  { value: 'active' as TodoFilter, label: 'Active' },
  { value: 'completed' as TodoFilter, label: 'Completed' }
]

// Computed properties
const filteredTodos = computed(() => {
  switch (filter.value) {
    case 'active':
      return todos.value.filter(todo => !todo.completed)
    case 'completed':
      return todos.value.filter(todo => todo.completed)
    default:
      return todos.value
  }
})

const totalCount = computed(() => {
  const countTodos = (todoList: Todo[]): number => {
    return todoList.reduce((count, todo) => {
      return count + 1 + (todo.children ? countTodos(todo.children) : 0)
    }, 0)
  }
  return countTodos(todos.value)
})

const completedCount = computed(() => {
  const countCompleted = (todoList: Todo[]): number => {
    return todoList.reduce((count, todo) => {
      const current = todo.completed ? 1 : 0
      const children = todo.children ? countCompleted(todo.children) : 0
      return count + current + children
    }, 0)
  }
  return countCompleted(todos.value)
})

const progressPercentage = computed(() => {
  return totalCount.value === 0 ? 0 : Math.round((completedCount.value / totalCount.value) * 100)
})

const getFilterCount = (filterValue: TodoFilter): number => {
  switch (filterValue) {
    case 'active':
      return totalCount.value - completedCount.value
    case 'completed':
      return completedCount.value
    default:
      return totalCount.value
  }
}

const handleToggleCompleted = async (id: string) => {
  try {
    await toggleCompleted(id)
  } catch (error) {
    console.error('Failed to toggle todo completion:', error)
    // You could add user-friendly error handling here
  }
}

const handleToggleExpanded = (id: string) => {
  toggleExpanded(id)
}

const handleAddTodo = async () => {
  if (!newTodoText.value.trim()) return

  try {
    const newTodo = await createTodo({
      text: newTodoText.value.trim(),
      completed: false,
      children: [],
      expanded: false,
      priority: 'low'
    })

    // Upload attachments if any
    if (selectedFiles.value.length > 0 && newTodo) {
      for (const file of selectedFiles.value) {
        try {
          await uploadAttachment(newTodo.$id, file)
        } catch (error) {
          console.error('Failed to upload attachment:', error)
        }
      }
    }

    // Reset form
    newTodoText.value = ''
    selectedFiles.value = []
    showAttachmentUpload.value = false
    fileUploadRef.value?.clearFiles()
  } catch (error) {
    console.error('Failed to create todo:', error)
    // You could add user-friendly error handling here
  }
}

const handleDeleteTodo = async (id: string) => {
  try {
    await deleteTodo(id)
  } catch (error) {
    console.error('Failed to delete todo:', error)
    // You could add user-friendly error handling here
  }
}

// Attachment methods
const toggleAttachmentUpload = () => {
  showAttachmentUpload.value = !showAttachmentUpload.value
  if (!showAttachmentUpload.value) {
    selectedFiles.value = []
    fileUploadRef.value?.clearFiles()
  }
}

const handleUploadProgress = (index: number, progress: number) => {
  // Handle upload progress if needed
  console.log(`File ${index} upload progress: ${progress}%`)
}

const handleUploadComplete = (index: number, file: File) => {
  // Handle upload completion if needed
  console.log(`File ${index} upload completed:`, file.name)
}

const handleUploadError = (index: number, error: string) => {
  // Handle upload error
  console.error(`File ${index} upload error:`, error)
}



onMounted(() => {
  setLoading('fetch', true)
  setTimeout(() => {
    fetchTodos()
    setLoading('fetch', false)
  }, 500)
})
</script>

<style scoped>
.todo-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.todo-header {
  margin-bottom: 24px;
}

.todo-header-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.todo-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--todo-text-primary, #0f172a);
}

.todo-title-icon {
  width: 32px;
  height: 32px;
  color: var(--todo-primary-color, #2563eb);
}

.todo-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.todo-stat {
  font-size: 14px;
  font-weight: 500;
  color: var(--todo-text-secondary, #334155);
}

.todo-progress-bar {
  flex: 1;
  height: 8px;
  background-color: var(--todo-border, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
}

.todo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--todo-primary-color, #2563eb), var(--todo-success, #10b981));
  border-radius: 4px;
  transition: width 300ms ease-in-out;
}

.todo-user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.todo-user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-user-greeting {
  font-weight: 600;
  color: var(--todo-text-primary, #0f172a);
  font-size: 16px;
}

.todo-user-email {
  font-size: 14px;
  color: var(--todo-text-secondary, #334155);
}

.todo-logout-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 150ms ease-in-out;
}

.todo-logout-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.todo-logout-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.todo-add-form {
  margin-bottom: 24px;
}

.todo-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.todo-form-main {
  display: flex;
  gap: 12px;
  align-items: center;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  transition: all 150ms ease-in-out;
}

.todo-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
}

.todo-add-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  min-width: 80px;
}

.todo-add-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.todo-add-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.todo-attachment-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.todo-attachment-toggle:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background-color: #eff6ff;
}

.todo-attachment-toggle-active {
  border-color: #3b82f6;
  color: #3b82f6;
  background-color: #eff6ff;
}

.todo-attachment-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.todo-attachment-toggle svg {
  width: 20px;
  height: 20px;
}

.todo-attachment-upload {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.todo-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.todo-filter-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--todo-text-secondary, #334155);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.todo-filter-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.todo-filter-active {
  background: var(--todo-primary-color, #2563eb);
  color: white;
}

.todo-filter-count {
  background: rgba(0, 0, 0, 0.1);
  color: var(--todo-text-secondary, #334155);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.todo-filter-active .todo-filter-count {
  background: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.9);
}

.todo-main {
  margin-bottom: 24px;
}

.todo-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.todo-footer {
  text-align: center;
}

.todo-footer-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .todo-app {
    padding: 16px;
  }
  
  .todo-header-content,
  .todo-container {
    padding: 20px;
  }
  
  .todo-title {
    font-size: 24px;
  }
  
  .todo-stats {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .todo-filters {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .todo-app {
    padding: 12px;
  }
  
  .todo-header-content,
  .todo-container {
    padding: 16px;
  }

  .todo-user-info {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
  }

  .todo-user-details {
    text-align: center;
  }
  
  .todo-title {
    font-size: 20px;
  }
  
  .todo-title-icon {
    width: 24px;
    height: 24px;
  }
}
</style>

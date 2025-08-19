// TypeScript interfaces for the Todo application

export interface Todo {
  id: string
  text: string
  completed: boolean
  children?: Todo[]
  expanded?: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface TodoItemProps {
  todo: Todo
  level?: number
}

export interface TodoListProps {
  todos: Todo[]
  level?: number
}

export interface TodoCheckboxProps {
  checked: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export interface TodoAppState {
  todos: Todo[]
  filter: 'all' | 'active' | 'completed'
  searchQuery: string
}

// Event types for component communication
export interface TodoEvents {
  'toggle-completed': (id: string) => void
  'toggle-expanded': (id: string) => void
  'update-text': (id: string, text: string) => void
  'delete-todo': (id: string) => void
  'add-child': (parentId: string, todo: Omit<Todo, 'id'>) => void
}

// Utility types
export type TodoPriority = Todo['priority']
export type TodoFilter = TodoAppState['filter']

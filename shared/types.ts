// TypeScript interfaces for the Todo application

// File attachment interface
export interface TodoAttachment {
  fileId: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedAt: string
  url?: string // For download URL
}

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
  createdBy?: string
  attachments?: TodoAttachment[]
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
  'upload-attachment': (todoId: string, file: File) => void
  'delete-attachment': (todoId: string, fileId: string) => void
  'download-attachment': (todoId: string, fileId: string) => void
}

// File upload related interfaces
export interface FileUploadProgress {
  fileId: string
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export interface AttachmentDisplayProps {
  attachments: TodoAttachment[]
  todoId: string
  readonly?: boolean
}

export interface FileUploadProps {
  todoId?: string
  maxFileSize?: number
  allowedTypes?: string[]
  multiple?: boolean
  disabled?: boolean
}

// Utility types
export type TodoPriority = Todo['priority']
export type TodoFilter = TodoAppState['filter']
export type AttachmentMimeType = TodoAttachment['mimeType']

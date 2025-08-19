<template>
  <div class="file-upload">
    <!-- Upload Area -->
    <div
      class="file-upload-area"
      :class="{
        'file-upload-area-dragover': isDragOver,
        'file-upload-area-disabled': disabled,
        'file-upload-area-error': hasError
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
    >
      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="acceptedTypes"
        :disabled="disabled"
        @change="handleFileSelect"
        class="file-upload-input"
      />

      <!-- Upload Icon and Text -->
      <div class="file-upload-content">
        <div class="file-upload-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        
        <div class="file-upload-text">
          <p class="file-upload-primary-text">
            <span v-if="!disabled">Drop files here or click to browse</span>
            <span v-else>File upload disabled</span>
          </p>
          <p class="file-upload-secondary-text" v-if="!disabled">
            {{ acceptedTypesText }}
            <span v-if="maxFileSize"> • Max {{ formatFileSize(maxFileSize) }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="file-upload-error">
      {{ error }}
    </div>

    <!-- File List -->
    <div v-if="selectedFiles.length > 0" class="file-upload-list">
      <h4 class="file-upload-list-title">Selected Files</h4>
      <div
        v-for="(file, index) in selectedFiles"
        :key="index"
        class="file-upload-item"
      >
        <div class="file-upload-item-info">
          <div class="file-upload-item-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="file-upload-item-details">
            <span class="file-upload-item-name">{{ file.name }}</span>
            <span class="file-upload-item-size">{{ formatFileSize(file.size) }}</span>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div v-if="uploadProgress[index] !== undefined" class="file-upload-progress">
          <div class="file-upload-progress-bar">
            <div 
              class="file-upload-progress-fill"
              :style="{ width: `${uploadProgress[index]}%` }"
            ></div>
          </div>
          <span class="file-upload-progress-text">{{ uploadProgress[index] }}%</span>
        </div>
        
        <!-- Remove Button -->
        <button
          v-if="!disabled && uploadProgress[index] === undefined"
          @click="removeFile(index)"
          class="file-upload-remove"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FileUploadProps } from '~~/shared/types'

interface Props extends FileUploadProps {
  modelValue?: File[]
}

const props = withDefaults(defineProps<Props>(), {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: () => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  multiple: false,
  disabled: false,
  modelValue: () => []
})

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  'upload-progress': [index: number, progress: number]
  'upload-complete': [index: number, file: File]
  'upload-error': [index: number, error: string]
}>()

// Reactive state
const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([...props.modelValue])
const uploadProgress = ref<Record<number, number>>({})
const isDragOver = ref(false)
const error = ref('')

// Computed properties
const acceptedTypes = computed(() => {
  return props.allowedTypes.join(',')
})

const acceptedTypesText = computed(() => {
  const extensions = props.allowedTypes.map(type => {
    switch (type) {
      case 'image/jpeg': return 'JPG'
      case 'image/png': return 'PNG'
      case 'image/gif': return 'GIF'
      case 'application/pdf': return 'PDF'
      case 'text/plain': return 'TXT'
      default: return type.split('/')[1]?.toUpperCase() || type
    }
  })
  return `Supported: ${extensions.join(', ')}`
})

const hasError = computed(() => !!error.value)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newFiles) => {
  selectedFiles.value = [...newFiles]
}, { deep: true })

// Watch for changes to selectedFiles and emit
watch(selectedFiles, (newFiles) => {
  emit('update:modelValue', newFiles)
}, { deep: true })

// Methods
const validateFile = (file: File): string | null => {
  // Check file size
  if (file.size > props.maxFileSize) {
    return `File size exceeds maximum limit of ${formatFileSize(props.maxFileSize)}`
  }

  // Check file type
  if (!props.allowedTypes.includes(file.type)) {
    return `File type not supported. ${acceptedTypesText.value}`
  }

  return null
}

const addFiles = (files: FileList | File[]) => {
  const fileArray = Array.from(files)
  const validFiles: File[] = []
  
  for (const file of fileArray) {
    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      return
    }
    validFiles.push(file)
  }

  if (!props.multiple) {
    selectedFiles.value = validFiles.slice(0, 1)
  } else {
    selectedFiles.value.push(...validFiles)
  }
  
  error.value = ''
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
  delete uploadProgress.value[index]
}

const triggerFileInput = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(target.files)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (props.disabled) return
  
  if (event.dataTransfer?.files) {
    addFiles(event.dataTransfer.files)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  if (!props.disabled) {
    isDragOver.value = true
  }
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // Only set to false if we're leaving the component entirely
  if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Expose methods for parent components
defineExpose({
  clearFiles: () => {
    selectedFiles.value = []
    uploadProgress.value = {}
    error.value = ''
  },
  setProgress: (index: number, progress: number) => {
    uploadProgress.value[index] = progress
    emit('upload-progress', index, progress)
  },
  setComplete: (index: number) => {
    uploadProgress.value[index] = 100
    emit('upload-complete', index, selectedFiles.value[index])
  },
  setError: (index: number, errorMessage: string) => {
    delete uploadProgress.value[index]
    emit('upload-error', index, errorMessage)
  }
})
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.file-upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #f8fafc;
}

.file-upload-area:hover:not(.file-upload-area-disabled) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.file-upload-area-dragover {
  border-color: #3b82f6;
  background-color: #eff6ff;
  transform: scale(1.02);
}

.file-upload-area-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f1f5f9;
}

.file-upload-area-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.file-upload-input {
  display: none;
}

.file-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.file-upload-icon {
  width: 3rem;
  height: 3rem;
  color: #64748b;
}

.file-upload-icon svg {
  width: 100%;
  height: 100%;
}

.file-upload-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-upload-primary-text {
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
}

.file-upload-secondary-text {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.file-upload-error {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

.file-upload-list {
  margin-top: 1rem;
}

.file-upload-list-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.file-upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #ffffff;
  margin-bottom: 0.5rem;
}

.file-upload-item:last-child {
  margin-bottom: 0;
}

.file-upload-item-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.file-upload-item-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
  flex-shrink: 0;
}

.file-upload-item-icon svg {
  width: 100%;
  height: 100%;
}

.file-upload-item-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.file-upload-item-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-upload-item-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.file-upload-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.file-upload-progress-bar {
  width: 4rem;
  height: 0.25rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.file-upload-progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.file-upload-progress-text {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 2.5rem;
  text-align: right;
}

.file-upload-remove {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.file-upload-remove:hover {
  color: #dc2626;
  background-color: #fef2f2;
}

.file-upload-remove svg {
  width: 1rem;
  height: 1rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .file-upload-area {
    padding: 1.5rem;
  }

  .file-upload-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .file-upload-progress {
    margin-left: 0;
    width: 100%;
  }

  .file-upload-progress-bar {
    flex: 1;
  }
}
</style>

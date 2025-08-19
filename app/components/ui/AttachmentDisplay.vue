<template>
  <div v-if="attachments.length > 0" class="attachment-display">
    <div class="attachment-header">
      <h4 class="attachment-title">
        <svg class="attachment-title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 21.9983 8.005 21.9983C6.41278 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63417 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38787 15.78 1.38787C16.8414 1.38787 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7821 4.32861 19.7821 5.39C19.7821 6.45139 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03494 17.7851 8.52433 17.9961 7.99 17.9961C7.45567 17.9961 6.94506 17.7851 6.57 17.41C6.19494 17.0349 5.98387 16.5243 5.98387 15.99C5.98387 15.4557 6.19494 14.9451 6.57 14.57L15.07 6.07"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Attachments ({{ attachments.length }})
      </h4>
    </div>

    <div class="attachment-list">
      <div
        v-for="attachment in attachments"
        :key="attachment.fileId"
        class="attachment-item"
      >
        <!-- File Icon -->
        <div class="attachment-icon">
          <svg v-if="isImage(attachment.mimeType)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
            <polyline points="21,15 16,10 5,21" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg v-else-if="isPDF(attachment.mimeType)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>

        <!-- File Info -->
        <div class="attachment-info">
          <div class="attachment-name" :title="attachment.originalName">
            {{ attachment.originalName }}
          </div>
          <div class="attachment-meta">
            <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
            <span class="attachment-date">{{ formatDate(attachment.uploadedAt) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="attachment-actions">
          <!-- Preview Button (for images and PDFs) -->
          <button
            v-if="canPreview(attachment.mimeType)"
            @click="previewAttachment(attachment)"
            class="attachment-action attachment-preview"
            :title="`Preview ${attachment.originalName}`"
            :disabled="loading.preview === attachment.fileId"
          >
            <svg v-if="loading.preview !== attachment.fileId" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <div v-else class="attachment-spinner"></div>
          </button>

          <!-- Download Button -->
          <button
            @click="downloadAttachment(attachment)"
            class="attachment-action attachment-download"
            :title="`Download ${attachment.originalName}`"
            :disabled="loading.download === attachment.fileId"
          >
            <svg v-if="loading.download !== attachment.fileId" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div v-else class="attachment-spinner"></div>
          </button>

          <!-- Delete Button -->
          <button
            v-if="!readonly"
            @click="deleteAttachment(attachment)"
            class="attachment-action attachment-delete"
            :title="`Delete ${attachment.originalName}`"
            :disabled="loading.delete === attachment.fileId"
          >
            <svg v-if="loading.delete !== attachment.fileId" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"/>
            </svg>
            <div v-else class="attachment-spinner"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewModal.show" class="attachment-modal" @click="closePreview">
      <div class="attachment-modal-content" @click.stop>
        <div class="attachment-modal-header">
          <h3 class="attachment-modal-title">{{ previewModal.attachment?.originalName }}</h3>
          <button @click="closePreview" class="attachment-modal-close">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="attachment-modal-body">
          <img
            v-if="previewModal.attachment && isImage(previewModal.attachment.mimeType)"
            :src="previewModal.url"
            :alt="previewModal.attachment.originalName"
            class="attachment-preview-image"
          />
          <iframe
            v-else-if="previewModal.attachment && isPDF(previewModal.attachment.mimeType)"
            :src="previewModal.url"
            class="attachment-preview-pdf"
            frameborder="0"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { AttachmentDisplayProps, TodoAttachment } from '~~/shared/types'

interface Props extends AttachmentDisplayProps {}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<{
  'delete-attachment': [fileId: string]
  'download-attachment': [fileId: string]
  'preview-attachment': [fileId: string]
}>()

// Reactive state
const loading = reactive({
  download: null as string | null,
  delete: null as string | null,
  preview: null as string | null
})

const previewModal = ref({
  show: false,
  attachment: null as TodoAttachment | null,
  url: undefined as string | undefined
})

// Methods
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

const isPDF = (mimeType: string): boolean => {
  return mimeType === 'application/pdf'
}

const canPreview = (mimeType: string): boolean => {
  return isImage(mimeType) || isPDF(mimeType)
}



const downloadAttachment = async (attachment: TodoAttachment) => {
  loading.download = attachment.fileId

  try {
    // Create download URL
    const downloadUrl = `/api/todos/${props.todoId}/attachments/${attachment.fileId}?download=true`

    // Fetch the file as blob to trigger proper download
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    const blob = await response.blob()

    // Create temporary link and trigger download
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the blob URL
    window.URL.revokeObjectURL(url)

    emit('download-attachment', attachment.fileId)
  } catch (error) {
    console.error('Download failed:', error)
  } finally {
    loading.download = null
  }
}

const previewAttachment = async (attachment: TodoAttachment) => {
  loading.preview = attachment.fileId

  try {
    // Get attachment metadata first
    const response = await $fetch(`/api/todos/${props.todoId}/attachments/${attachment.fileId}`) as any

    let previewUrl = null

    if (response && response.status === 'success' && response.data && response.data.previewUrl) {
      previewUrl = response.data.previewUrl
    } else {
      // Generate preview URL based on file type
      if (isImage(attachment.mimeType)) {
        previewUrl = `/api/todos/${props.todoId}/attachments/${attachment.fileId}/preview?type=image`
      } else if (isPDF(attachment.mimeType)) {
        previewUrl = `/api/todos/${props.todoId}/attachments/${attachment.fileId}/preview?type=pdf`
      } else {
        // Fallback to download URL for other file types
        previewUrl = `/api/todos/${props.todoId}/attachments/${attachment.fileId}?download=true`
      }
    }

    previewModal.value = {
      show: true,
      attachment,
      url: previewUrl
    }

    emit('preview-attachment', attachment.fileId)
  } catch (error) {
    console.error('Preview failed:', error)
    // Fallback to direct preview URL
    let fallbackUrl = `/api/todos/${props.todoId}/attachments/${attachment.fileId}?download=true`

    if (isImage(attachment.mimeType)) {
      fallbackUrl = `/api/todos/${props.todoId}/attachments/${attachment.fileId}/preview?type=image`
    } else if (isPDF(attachment.mimeType)) {
      fallbackUrl = `/api/todos/${props.todoId}/attachments/${attachment.fileId}/preview?type=pdf`
    }

    previewModal.value = {
      show: true,
      attachment,
      url: fallbackUrl
    }
  } finally {
    loading.preview = null
  }
}

const deleteAttachment = async (attachment: TodoAttachment) => {
  if (!confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) {
    return
  }
  
  loading.delete = attachment.fileId
  
  try {
    await $fetch(`/api/todos/${props.todoId}/attachments/${attachment.fileId}`, {
      method: 'DELETE'
    })
    
    emit('delete-attachment', attachment.fileId)
  } catch (error) {
    console.error('Delete failed:', error)
  } finally {
    loading.delete = null
  }
}

const closePreview = () => {
  previewModal.value = {
    show: false,
    attachment: null,
    url: undefined
  }
}
</script>

<style scoped>
.attachment-display {
  margin-top: 0.75rem;
}

.attachment-header {
  margin-bottom: 0.5rem;
}

.attachment-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.attachment-title-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.attachment-item:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.attachment-icon {
  width: 2rem;
  height: 2rem;
  color: #64748b;
  flex-shrink: 0;
}

.attachment-icon svg {
  width: 100%;
  height: 100%;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.125rem;
}

.attachment-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
}

.attachment-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.attachment-action {
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.attachment-action:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.attachment-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attachment-action svg {
  width: 1rem;
  height: 1rem;
}

.attachment-preview:hover:not(:disabled) {
  color: #3b82f6;
  background-color: #eff6ff;
}

.attachment-download:hover:not(:disabled) {
  color: #059669;
  background-color: #ecfdf5;
}

.attachment-delete:hover:not(:disabled) {
  color: #dc2626;
  background-color: #fef2f2;
}

.attachment-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal Styles */
.attachment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.attachment-modal-content {
  background-color: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.attachment-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.attachment-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 3rem);
}

.attachment-modal-close {
  width: 2rem;
  height: 2rem;
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

.attachment-modal-close:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.attachment-modal-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.attachment-modal-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: auto;
}

.attachment-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.attachment-preview-pdf {
  width: 80vw;
  height: 80vh;
  border-radius: 4px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .attachment-item {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .attachment-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .attachment-action {
    width: 1.75rem;
    height: 1.75rem;
  }

  .attachment-meta {
    flex-direction: column;
    gap: 0.125rem;
  }

  .attachment-modal {
    padding: 0.5rem;
  }

  .attachment-preview-pdf {
    width: 95vw;
    height: 85vh;
  }
}
</style>

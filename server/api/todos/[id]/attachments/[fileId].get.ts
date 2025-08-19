import { appwriteSession } from "../../../../utils/appwrite";
import { TODOS_DATABASE_ID, TODO_FILES_ID } from "../../../../utils/const";
import type { TodoAttachment } from "~~/shared/types";

export default defineEventHandler(async (event) => {
  try {
    // Validate user authentication
    const session = await getUserSession(event);
    if (!session || !session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required",
      });
    }

    const { database, storage } = appwriteSession(event);
    const todoId = getRouterParam(event, 'id');
    const fileId = getRouterParam(event, 'fileId');

    if (!todoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Todo ID is required",
      });
    }

    if (!fileId) {
      throw createError({
        statusCode: 400,
        statusMessage: "File ID is required",
      });
    }

    // Verify user owns the todo
    let todo;
    try {
      todo = await database.getDocument(
        TODOS_DATABASE_ID,
        'todos',
        todoId
      );

      if (todo.createdBy !== (session.user as any).id) {
        throw createError({
          statusCode: 403,
          statusMessage: "You can only access attachments from your own todos",
        });
      }
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw error;
      }
      if (error.code === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: "Todo not found",
        });
      }
      throw error;
    }

    // Parse attachments and find the requested file
    let attachments: TodoAttachment[] = [];
    try {
      attachments = todo.attachments ? JSON.parse(todo.attachments) : [];
    } catch (error) {
      attachments = [];
    }

    const attachment = attachments.find(att => att.fileId === fileId);
    if (!attachment) {
      throw createError({
        statusCode: 404,
        statusMessage: "Attachment not found",
      });
    }

    // Check if this is a download request or just metadata
    const query = getQuery(event);
    const download = query.download === 'true';

    if (download) {
      // Get file download stream from Appwrite Storage
      try {
        const fileDownload = await storage.getFileDownload(
          TODO_FILES_ID,
          fileId
        );

        // Set appropriate headers for file download
        setHeader(event, 'Content-Type', attachment.mimeType);
        setHeader(event, 'Content-Disposition', `attachment; filename="${attachment.originalName}"`);
        setHeader(event, 'Content-Length', attachment.size);
        setHeader(event, 'Cache-Control', 'no-cache');

        // Return the file data
        return fileDownload;
      } catch (error: any) {
        console.error('Storage download error:', error);

        if (error.code === 404) {
          throw createError({
            statusCode: 404,
            statusMessage: "File not found in storage",
          });
        }

        throw createError({
          statusCode: 500,
          statusMessage: "Failed to download file from storage",
        });
      }
    } else {
      // Return file metadata and download URL
      try {
        // Generate preview URL for images and PDFs
        let previewUrl = null;
        const isImage = attachment.mimeType.startsWith('image/');
        const isPDF = attachment.mimeType === 'application/pdf';

        if (isImage) {
          try {
            // For images, create a preview URL that points to our own endpoint
            previewUrl = `/api/todos/${todoId}/attachments/${fileId}/preview?type=image`;
          } catch (error) {
            console.warn('Preview URL generation failed:', error);
          }
        } else if (isPDF) {
          try {
            // For PDFs, create a preview URL that points to our own endpoint
            previewUrl = `/api/todos/${todoId}/attachments/${fileId}/preview?type=pdf`;
          } catch (error) {
            console.warn('PDF preview URL generation failed:', error);
          }
        }

        return {
          status: 'success',
          data: {
            ...attachment,
            downloadUrl: `/api/todos/${todoId}/attachments/${fileId}?download=true`,
            previewUrl: previewUrl || null,
            isImage,
            canPreview: isImage || isPDF
          }
        };
      } catch (error: any) {
        console.error('Error getting file metadata:', error);
        
        // Return basic metadata even if preview fails
        const isImageFallback = attachment.mimeType.startsWith('image/')
        const isPDFFallback = attachment.mimeType === 'application/pdf'

        return {
          status: 'success',
          data: {
            ...attachment,
            downloadUrl: `/api/todos/${todoId}/attachments/${fileId}?download=true`,
            previewUrl: null,
            isImage: isImageFallback,
            canPreview: isImageFallback || isPDFFallback
          }
        };
      }
    }

  } catch (error: any) {
    console.error('Error handling file request:', error);

    // Handle specific Appwrite configuration errors
    if (error.statusCode === 500 && error.statusMessage?.includes('Appwrite')) {
      throw error;
    }

    // Handle validation errors
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
      throw error;
    }

    // Handle Appwrite API errors
    if (error.code && error.message) {
      throw createError({
        statusCode: 400,
        statusMessage: `Appwrite API Error: ${error.message}`,
      });
    }

    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process file request. Please try again.",
    });
  }
});

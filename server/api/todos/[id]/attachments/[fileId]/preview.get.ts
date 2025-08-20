import { appwriteSession } from "../../../../../utils/appwrite";
import { TODOS_DATABASE_ID, TODO_FILES_ID } from "../../../../../utils/const";
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
    const query = getQuery(event);
    const previewType = query.type as string;

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

    try {
      let fileData;
      let contentType = attachment.mimeType;

      if (previewType === 'image' && attachment.mimeType.startsWith('image/')) {
        // Generate image preview with basic parameters
        fileData = await storage.getFilePreview(
          TODO_FILES_ID,
          fileId,
          400, // width
          300  // height
        );
      } else if (previewType === 'pdf' && attachment.mimeType === 'application/pdf') {
        // For PDFs, return the file directly for browser to handle
        fileData = await storage.getFileDownload(TODO_FILES_ID, fileId);
        contentType = 'application/pdf';
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: "Preview not supported for this file type",
        });
      }

      // Set appropriate headers
      setHeader(event, 'Content-Type', contentType);
      setHeader(event, 'Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // fileData is an ArrayBuffer
      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(fileData);
      
      // Return the file data
      return uint8Array;
    } catch (error: any) {
      console.error('Preview generation error:', error);
      
      if (error.code === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: "File not found in storage",
        });
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to generate preview",
      });
    }

  } catch (error: any) {
    console.error('Error handling preview request:', error);

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
      statusMessage: "Failed to process preview request. Please try again.",
    });
  }
});

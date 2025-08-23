import { appwriteSessionBridge } from "../../../../utils/appwrite";
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

    const { database, storage } = await appwriteSessionBridge(event);
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

      if (todo.createdBy !== session.user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: "You can only delete attachments from your own todos",
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

    const attachmentIndex = attachments.findIndex(att => att.fileId === fileId);
    if (attachmentIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: "Attachment not found",
      });
    }

    const attachment = attachments[attachmentIndex];

    // Delete file from Appwrite Storage
    try {
      await storage.deleteFile(TODO_FILES_ID, fileId);
    } catch (error: any) {
      console.error('Storage deletion error:', error);
      
      // If file doesn't exist in storage, continue with database cleanup
      if (error.code !== 404) {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to delete file from storage",
        });
      }
    }

    // Remove attachment from the array
    attachments.splice(attachmentIndex, 1);

    // Update todo with new attachments array
    try {
      const updatedTodo = await database.updateDocument(
        TODOS_DATABASE_ID,
        'todos',
        todoId,
        {
          attachments: JSON.stringify(attachments),
          updatedAt: new Date().toISOString(),
        }
      );

      return {
        status: 'success',
        data: {
          deletedAttachment: attachment,
          todo: updatedTodo,
          remainingAttachments: attachments
        }
      };
    } catch (error: any) {
      console.error('Database update error:', error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to update todo after file deletion",
      });
    }

  } catch (error: any) {
    console.error('Error deleting attachment:', error);

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
      statusMessage: "Failed to delete attachment. Please try again.",
    });
  }
});

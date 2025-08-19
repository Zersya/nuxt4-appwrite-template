import { appwriteSession } from "../../../utils/appwrite";
import { TODOS_DATABASE_ID, TODO_FILES_ID } from "../../../utils/const";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import type { TodoAttachment } from "~~/shared/types";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'];

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

    if (!todoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Todo ID is required",
      });
    }

    // Verify user owns the todo
    try {
      const existingTodo = await database.getDocument(
        TODOS_DATABASE_ID,
        'todos',
        todoId
      );

      if (existingTodo.createdBy !== session.user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: "You can only add attachments to your own todos",
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

    // Parse multipart form data
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file provided",
      });
    }

    const fileData = formData.find(item => item.name === 'file');
    
    if (!fileData || !fileData.data || !fileData.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file data",
      });
    }

    // Validate file size
    if (fileData.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }

    // Validate file type by extension
    const fileExtension = fileData.filename.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw createError({
        statusCode: 400,
        statusMessage: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      });
    }

    // Validate MIME type if available
    if (fileData.type && !ALLOWED_MIME_TYPES.includes(fileData.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: `MIME type not allowed. File type: ${fileData.type}`,
      });
    }

    // Generate unique file ID and create file input
    const fileId = ID.unique();
    const fileName = `${todoId}_${fileId}_${fileData.filename}`;

    // Upload file to Appwrite Storage
    let uploadedFile;
    try {
      // Create InputFile from buffer
      const fileBuffer = Buffer.from(fileData.data);
      const inputFile = InputFile.fromBuffer(fileBuffer, fileName);

      uploadedFile = await storage.createFile(
        TODO_FILES_ID,
        fileId,
        inputFile,
        [`read("user:${session.user.id}")`] // Only the owner can read
      );
    } catch (error: any) {
      console.error('Storage upload error:', error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to upload file to storage",
      });
    }

    // Create attachment metadata
    const attachment: TodoAttachment = {
      fileId: uploadedFile.$id,
      filename: fileName,
      originalName: fileData.filename,
      size: fileData.data.length,
      mimeType: fileData.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };

    // Get current todo to update attachments
    const currentTodo = await database.getDocument(
      TODOS_DATABASE_ID,
      'todos',
      todoId
    );

    // Parse existing attachments or initialize empty array
    let existingAttachments: TodoAttachment[] = [];
    try {
      existingAttachments = currentTodo.attachments ? 
        JSON.parse(currentTodo.attachments) : [];
    } catch (error) {
      existingAttachments = [];
    }

    // Add new attachment
    existingAttachments.push(attachment);

    // Update todo with new attachments
    const updatedTodo = await database.updateDocument(
      TODOS_DATABASE_ID,
      'todos',
      todoId,
      {
        attachments: JSON.stringify(existingAttachments),
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      status: 'success',
      data: {
        attachment,
        todo: updatedTodo
      }
    };

  } catch (error: any) {
    console.error('Error uploading attachment:', error);

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
      statusMessage: "Failed to upload attachment. Please try again.",
    });
  }
});

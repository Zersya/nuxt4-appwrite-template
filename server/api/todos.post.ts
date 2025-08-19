import { appwrite } from "../utils/appwrite";
import { TODOS_DATABASE_ID } from "../utils/const";
import { ID } from "node-appwrite";

export default defineEventHandler(async (event) => {
  try {
    const { database } = appwrite(event);
    const body = await readBody(event);

    // Validate required fields
    if (!body.text) {
      throw createError({
        statusCode: 400,
        statusMessage: "Todo text is required",
      });
    }

    // Prepare todo data with defaults
    const todoData = {
      text: body.text,
      completed: body.completed || false,
      children: body.children || [],
      expanded: body.expanded || false,
      priority: body.priority || 'low',
      dueDate: body.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const todo = await database.createDocument(
      TODOS_DATABASE_ID, 
      'todos', 
      ID.unique(), 
      todoData
    );

    return {
      status: 'success',
      data: todo
    };
  } catch (error: any) {
    console.error('Error creating todo:', error);

    // Handle specific Appwrite configuration errors
    if (error.statusCode === 500 && error.statusMessage?.includes('Appwrite')) {
      throw error; // Re-throw configuration errors as-is
    }

    // Handle validation errors
    if (error.statusCode === 400) {
      throw error; // Re-throw validation errors as-is
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
      statusMessage: "Failed to create todo. Please check your Appwrite configuration and try again.",
    });
  }
});

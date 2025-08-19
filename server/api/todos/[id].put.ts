import { appwrite } from "../../utils/appwrite";
import { TODOS_DATABASE_ID } from "../../utils/const";

export default defineEventHandler(async (event) => {
  try {
    const { database } = appwrite(event);
    const todoId = getRouterParam(event, 'id');
    const body = await readBody(event);

    if (!todoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Todo ID is required",
      });
    }

    // Prepare update data, only include provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (body.text !== undefined) updateData.text = body.text;
    if (body.completed !== undefined) updateData.completed = body.completed;
    if (body.children !== undefined) updateData.children = body.children;
    if (body.expanded !== undefined) updateData.expanded = body.expanded;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;

    const todo = await database.updateDocument(
      TODOS_DATABASE_ID,
      'todos',
      todoId,
      updateData
    );

    return {
      status: 'success',
      data: todo
    };
  } catch (error: any) {
    console.error('Error updating todo:', error);

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
      statusMessage: "Failed to update todo. Please check your Appwrite configuration and try again.",
    });
  }
});

import { appwriteSession } from "../../utils/appwrite";
import { TODOS_DATABASE_ID } from "../../utils/const";

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

    const { database } = appwriteSession(event);
    const todoId = getRouterParam(event, 'id');

    if (!todoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Todo ID is required",
      });
    }

    // First, get the todo to check ownership and if it has children
    const todo = await database.getDocument(TODOS_DATABASE_ID, 'todos', todoId);

    // Verify user owns the todo
    if (todo.createdBy !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can only delete your own todos",
      });
    }
    
    // If todo has children, we need to handle them
    // For now, we'll delete the parent and let children become orphaned
    // In a more complex implementation, you might want to:
    // 1. Delete all children recursively
    // 2. Move children to parent's parent
    // 3. Prevent deletion if children exist
    
    await database.deleteDocument(TODOS_DATABASE_ID, 'todos', todoId);

    return {
      status: 'success',
      data: { id: todoId, deleted: true }
    };
  } catch (error: any) {
    console.error('Error deleting todo:', error);

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
      // Handle document not found
      if (error.code === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: "Todo not found",
        });
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: `Appwrite API Error: ${error.message}`,
      });
    }

    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete todo. Please check your Appwrite configuration and try again.",
    });
  }
});

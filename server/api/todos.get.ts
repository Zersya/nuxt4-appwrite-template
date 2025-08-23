import { Query } from "node-appwrite";
import { appwriteSessionBridge } from "../utils/appwrite";
import { TODOS_DATABASE_ID } from "../utils/const";

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

    const { database } = await appwriteSessionBridge(event);

    // Filter todos by authenticated user
    const todos = await database.listDocuments(
      TODOS_DATABASE_ID,
      'todos',
      [Query.equal('createdBy', session.user.id)]
    );

    return {
      status: 'success',
      data: todos.documents
    };
  } catch (error: any) {
    console.error('Error fetching todos:', error);

    // Handle specific Appwrite configuration errors
    if (error.statusCode === 500 && error.statusMessage?.includes('Appwrite')) {
      throw error; // Re-throw configuration errors as-is
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
      statusMessage: "Failed to fetch todos. Please check your Appwrite configuration and try again.",
    });
  }
});
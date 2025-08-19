import { appwrite } from "../../utils/appwrite";

export default defineEventHandler(async (event) => {
  try {
    const { account } = appwrite(event);
    
    // Get current session to delete it from Appwrite
    const session = await getUserSession(event);
    
    if (session?.secure?.sessionId) {
      try {
        // Delete the session from Appwrite
        await account.deleteSession(session.secure.sessionId);
      } catch (error: any) {
        // Log the error but don't fail the logout process
        console.warn('Failed to delete Appwrite session:', error);
      }
    }

    // Clear the user session
    await clearUserSession(event);

    return {
      status: 'success',
      message: 'Logged out successfully'
    };
  } catch (error: any) {
    console.error('Error during logout:', error);

    // Even if there's an error, we should clear the local session
    try {
      await clearUserSession(event);
    } catch (clearError) {
      console.error('Failed to clear user session:', clearError);
    }

    // Handle specific Appwrite configuration errors
    if (error.statusCode === 500 && error.statusMessage?.includes('Appwrite')) {
      throw error; // Re-throw configuration errors as-is
    }

    // For logout, we generally want to succeed even if there are errors
    // The important thing is that the local session is cleared
    return {
      status: 'success',
      message: 'Logged out successfully'
    };
  }
});

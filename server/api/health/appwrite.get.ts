import { testAppwriteConnection } from "../../utils/appwrite";

export default defineEventHandler(async (event) => {
  try {
    const result = await testAppwriteConnection(event);
    
    if (result.success) {
      return {
        status: 'success',
        message: result.message,
        timestamp: new Date().toISOString()
      };
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: result.message,
        data: { error: result.error }
      });
    }
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "Appwrite health check failed",
      data: { error: error.code || 'HEALTH_CHECK_FAILED' }
    });
  }
});

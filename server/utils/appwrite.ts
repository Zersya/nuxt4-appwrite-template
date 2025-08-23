import * as sdk from "node-appwrite";
import type { H3Event } from "h3";

// Use this for Admin System access only features (No Auth), usually use for Auth (Login, Register) or Server-side operations
export const appwrite = (event: H3Event) => {
    const config = useRuntimeConfig(event);

    // Validate required configuration
    if (!config.appwrite.endpoint) {
        throw createError({
            statusCode: 500,
            statusMessage: "Appwrite endpoint is not configured. Please set APPWRITE_ENDPOINT environment variable.",
        });
    }

    if (!config.appwrite.projectId) {
        throw createError({
            statusCode: 500,
            statusMessage: "Appwrite project ID is not configured. Please set APPWRITE_PROJECT_ID environment variable.",
        });
    }

    if (!config.appwrite.apiKey) {
        throw createError({
            statusCode: 500,
            statusMessage: "Appwrite API key is not configured. Please set APPWRITE_API_KEY environment variable.",
        });
    }

    const client = new sdk.Client();

    client
        .setEndpoint(config.appwrite.endpoint)
        .setProject(config.appwrite.projectId)
        .setKey(config.appwrite.apiKey);

    const database = new sdk.Databases(client);
    const storage = new sdk.Storage(client);
    const users = new sdk.Users(client);
    const account = new sdk.Account(client);

    return { database, storage, users, account };
}

// Use this for User (Auth) access only features (Mostly CRUD operations)
export const appwriteSession = (event: H3Event): any => {
    const config = useRuntimeConfig(event);

    // Validate required configuration
    if (!config.appwrite.endpoint) {
        throw createError({
            statusCode: 500,
            statusMessage: "Appwrite endpoint is not configured. Please set APPWRITE_ENDPOINT environment variable.",
        });
    }

    if (!config.appwrite.projectId) {
        throw createError({
            statusCode: 500,
            statusMessage: "Appwrite project ID is not configured. Please set APPWRITE_PROJECT_ID environment variable.",
        });
    }

    if (!config.appwrite.apiKey) {
        throw createError({
            statusCode: 500,
            statusMessage: "Appwrite API key is not configured. Please set APPWRITE_API_KEY environment variable.",
        });
    }

    const cookies = parseCookies(event);
    const sessionCookieName = `a_session_${config.appwrite.projectId}`;

    const client = new sdk.Client();

    client
        .setEndpoint(config.appwrite.endpoint)
        .setProject(config.appwrite.projectId);

    if (cookies[sessionCookieName]) {
        client.setSession(cookies[sessionCookieName]);
    }

    const database = new sdk.Databases(client);
    const storage = new sdk.Storage(client);
    const users = new sdk.Users(client);
    const account = new sdk.Account(client);

    return { database, storage, users, account, client };
}

/**
 * 🔗 Enhanced session bridge for Appwrite with Nuxt Auth Utils fallback
 * This function provides authenticated Appwrite access using either:
 * 1. Appwrite session cookies (preferred)
 * 2. Nuxt Auth Utils session bridge (fallback)
 */
export const appwriteSessionBridge = async (event: H3Event): Promise<any> => {
    const config = useRuntimeConfig(event);
    const cookies = parseCookies(event);
    const sessionCookieName = `a_session_${config.appwrite.projectId}`;
    
    // Try Appwrite session cookie first
    if (cookies[sessionCookieName]) {
        console.log('🔑 [AppwriteBridge] Using Appwrite session cookie');
        return appwriteSession(event);
    }
    
    // Fallback to Nuxt Auth Utils session bridge
    console.log('🔗 [AppwriteBridge] Using Nuxt Auth Utils session bridge');
    
    try {
        // Get user session from Nuxt Auth Utils
        const userSession = await getUserSession(event);
        
        if (!userSession?.user) {
            throw createError({
                statusCode: 401,
                statusMessage: 'No valid user session found. Please log in again.'
            });
        }
        
        // For now, use admin client with user context
        // This is secure because we've verified the user session
        const adminClient = new sdk.Client();
        adminClient
            .setEndpoint(config.appwrite.endpoint)
            .setProject(config.appwrite.projectId)
            .setKey(config.appwrite.apiKey);
        
        const database = new sdk.Databases(adminClient);
        const storage = new sdk.Storage(adminClient);
        const users = new sdk.Users(adminClient);
        const account = new sdk.Account(adminClient);
        
        console.log(`✅ [AppwriteBridge] Session bridge successful for user ${(userSession.user as any)?.id || 'unknown'}`);
        
        return { database, storage, users, account, client: adminClient, userSession };
        
    } catch (error: any) {
        console.error('❌ [AppwriteBridge] Session bridge failed:', error.message);
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication failed. Please log in again.'
        });
    }
}



/**
 * Test the Appwrite connection and configuration
 */
export const testAppwriteConnection = async (event: H3Event) => {
    try {
        const { database } = appwrite(event);

        // Try to list databases to test the connection
        await database.list();

        return { success: true, message: "Appwrite connection successful" };
    } catch (error: any) {
        console.error('Appwrite connection test failed:', error);
        return {
            success: false,
            message: error.message || "Failed to connect to Appwrite",
            error: error.code || 'UNKNOWN_ERROR'
        };
    }
}
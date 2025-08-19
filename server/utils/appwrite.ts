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
export const appwriteSession = (event: H3Event) => {
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
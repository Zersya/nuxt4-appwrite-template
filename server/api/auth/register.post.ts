import { appwrite } from "../../utils/appwrite";
import { ID } from "node-appwrite";

export default defineEventHandler(async (event) => {
  try {
    const { account } = appwrite(event);
    const body = await readBody(event);

    // Validate required fields
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email is required",
      });
    }

    if (!body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Password is required",
      });
    }

    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name is required",
      });
    }

    // Validate password strength (basic validation)
    if (body.password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: "Password must be at least 8 characters long",
      });
    }

    // Create user account with Appwrite
    const user = await account.create(
      ID.unique(),
      body.email,
      body.password,
      body.name
    );

    // Create session for the new user
    const session = await account.createEmailPasswordSession(body.email, body.password);

    // Set user session using Nuxt Auth Utils
    await setUserSession(event, {
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
      loggedInAt: new Date().toISOString(),
      secure: {
        sessionId: session.$id,
      }
    });

    return {
      status: 'success',
      data: {
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
        }
      }
    };
  } catch (error: any) {
    console.error('Error during registration:', error);

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
      // Handle specific registration errors
      if (error.code === 409) {
        throw createError({
          statusCode: 409,
          statusMessage: "A user with this email already exists",
        });
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: `Registration Error: ${error.message}`,
      });
    }

    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Registration failed. Please try again.",
    });
  }
});

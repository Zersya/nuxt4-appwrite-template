import { appwrite, appwriteSession } from "../../utils/appwrite";

export default defineEventHandler(async (event) => {
  try {
    const { account } = appwrite(event);
    const { client, account: sessionAccount } = appwriteSession(event);
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

    // Create session with Appwrite
    const session = await account.createEmailPasswordSession(body.email, body.password);

    const config = useRuntimeConfig(event);

    event.node.res.setHeader('Set-Cookie', `a_session_${config.appwrite.projectId}=${session.secret}; HttpOnly; Secure; SameSite=Strict; Expires=${new Date(session.expire).toUTCString()}; Path=/`);

    client.setSession(session.secret);
    const user = await sessionAccount.get();

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
    console.error('Error during login:', error);

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
      // Handle specific authentication errors
      if (error.code === 401) {
        console.error(error)
        throw createError({
          statusCode: 401,
          statusMessage: "Invalid email or password",
        });
      }

      throw createError({
        statusCode: 400,
        statusMessage: `Authentication Error: ${error.message}`,
      });
    }

    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Login failed. Please check your credentials and try again.",
    });
  }
});

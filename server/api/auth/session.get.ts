export default defineEventHandler(async (event) => {
  try {
    // Get current session
    const session = await getUserSession(event);

    if (!session || !session.user) {
      return {
        status: 'success',
        data: {
          user: null,
          loggedIn: false
        }
      };
    }

    return {
      status: 'success',
      data: {
        user: session.user,
        loggedIn: true,
        loggedInAt: session.loggedInAt
      }
    };
  } catch (error: any) {
    console.error('Error getting session:', error);

    return {
      status: 'success',
      data: {
        user: null,
        loggedIn: false
      }
    };
  }
});

export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  // If user is not logged in and trying to access protected route
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})

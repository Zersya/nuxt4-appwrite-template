export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  // If user is logged in and trying to access guest-only pages
  if (loggedIn.value) {
    return navigateTo('/')
  }
})

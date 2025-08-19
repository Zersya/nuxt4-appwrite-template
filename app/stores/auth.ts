import { ref, reactive, computed } from "vue"
import { defineStore } from "pinia"

// Types for form data
interface LoginForm {
  email: string
  password: string
}

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export const useAuthStore = defineStore('auth', () => {
  // Form state
  const loginForm = ref<LoginForm>({
    email: '',
    password: ''
  })

  const registerForm = ref<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Error state
  const error = ref('')

  // Loading states
  const loading = reactive({
    login: false,
    register: false,
    logout: false
  })

  // User session integration
  const { user, loggedIn, fetch: fetchSession, clear: clearSession } = useUserSession()

  // Computed properties
  const isLoginFormValid = computed(() => {
    return loginForm.value.email.trim() && loginForm.value.password.trim()
  })

  const isRegisterFormValid = computed(() => {
    return registerForm.value.name.trim() && 
           registerForm.value.email.trim() && 
           registerForm.value.password.length >= 8 && 
           registerForm.value.password === registerForm.value.confirmPassword
  })

  // Actions
  const clearError = () => {
    error.value = ''
  }

  const resetLoginForm = () => {
    loginForm.value = {
      email: '',
      password: ''
    }
  }

  const resetRegisterForm = () => {
    registerForm.value = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  }

  const resetForms = () => {
    resetLoginForm()
    resetRegisterForm()
    clearError()
  }

  const login = async () => {
    if (loading.login || !isLoginFormValid.value) return

    loading.login = true
    clearError()

    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: loginForm.value.email.trim(),
          password: loginForm.value.password
        }
      })

      if (response.status === 'success') {
        // Fetch the updated user session
        await fetchSession()
        
        // Reset form
        resetLoginForm()
        
        // Navigate to home page
        await navigateTo('/')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      error.value = err.data?.statusMessage || err.message || 'Login failed. Please try again.'
    } finally {
      loading.login = false
    }
  }

  const register = async () => {
    if (loading.register || !isRegisterFormValid.value) return

    // Validate passwords match
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
      error.value = 'Passwords do not match'
      return
    }

    loading.register = true
    clearError()

    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          name: registerForm.value.name.trim(),
          email: registerForm.value.email.trim(),
          password: registerForm.value.password
        }
      })

      if (response.status === 'success') {
        // Fetch the updated user session
        await fetchSession()
        
        // Reset form
        resetRegisterForm()
        
        // Navigate to home page
        await navigateTo('/')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      error.value = err.data?.statusMessage || err.message || 'Registration failed. Please try again.'
    } finally {
      loading.register = false
    }
  }

  const logout = async () => {
    if (loading.logout) return

    loading.logout = true

    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      // Clear the user session
      await clearSession()
      
      // Reset forms
      resetForms()
      
      // Navigate to login page
      await navigateTo('/login')
    } catch (err: any) {
      console.error('Logout error:', err)
      // Even if there's an error, try to clear the session and redirect
      await clearSession()
      resetForms()
      await navigateTo('/login')
    } finally {
      loading.logout = false
    }
  }

  return {
    // State
    loginForm,
    registerForm,
    error,
    loading,
    user,
    loggedIn,
    
    // Computed
    isLoginFormValid,
    isRegisterFormValid,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    resetLoginForm,
    resetRegisterForm,
    resetForms
  }
})

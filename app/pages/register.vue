<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Header -->
        <div class="auth-header">
          <h1 class="auth-title">
            <svg class="auth-title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Create Account
          </h1>
          <p class="auth-subtitle">Sign up to start managing your tasks</p>
        </div>

        <!-- Register Form -->
        <form @submit.prevent="register" class="auth-form">
          <!-- Name Field -->
          <div class="auth-field">
            <label for="name" class="auth-label">Full Name</label>
            <input
              id="name"
              v-model="registerForm.name"
              type="text"
              placeholder="Enter your full name"
              class="auth-input"
              :disabled="loading.register"
              required
            />
          </div>

          <!-- Email Field -->
          <div class="auth-field">
            <label for="email" class="auth-label">Email</label>
            <input
              id="email"
              v-model="registerForm.email"
              type="email"
              placeholder="Enter your email"
              class="auth-input"
              :disabled="loading.register"
              required
            />
          </div>

          <!-- Password Field -->
          <div class="auth-field">
            <label for="password" class="auth-label">Password</label>
            <input
              id="password"
              v-model="registerForm.password"
              type="password"
              placeholder="Enter your password (min 8 characters)"
              class="auth-input"
              :disabled="loading.register"
              required
              minlength="8"
            />
          </div>

          <!-- Confirm Password Field -->
          <div class="auth-field">
            <label for="confirmPassword" class="auth-label">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="Confirm your password"
              class="auth-input"
              :disabled="loading.register"
              required
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="auth-error">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="auth-button"
            :disabled="loading.register || !isRegisterFormValid"
          >
            <span v-if="loading.register">Creating account...</span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="auth-footer">
          <p class="auth-footer-text">
            Already have an account?
            <NuxtLink to="/login" class="auth-link">Sign in</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

// Page meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Auth store
const authStore = useAuthStore()
const { registerForm, error, loading, loggedIn, isRegisterFormValid } = storeToRefs(authStore)
const { register } = authStore

// Redirect if already logged in
watch(loggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    navigateTo('/')
  }
}, { immediate: true })
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--todo-text-primary, #0f172a);
  margin: 0 0 8px 0;
}

.auth-title-icon {
  width: 32px;
  height: 32px;
  color: #667eea;
}

.auth-subtitle {
  color: var(--todo-text-secondary, #334155);
  font-size: 16px;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-label {
  font-weight: 600;
  color: var(--todo-text-primary, #0f172a);
  font-size: 14px;
}

.auth-input {
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  transition: all 150ms ease-in-out;
}

.auth-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
}

.auth-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-error {
  padding: 12px 16px;
  background: var(--todo-error-light, #fee2e2);
  color: var(--todo-error, #ef4444);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.auth-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  min-height: 48px;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
}

.auth-footer-text {
  color: var(--todo-text-secondary, #334155);
  font-size: 14px;
  margin: 0;
}

.auth-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 480px) {
  .auth-page {
    padding: 16px;
  }
  
  .auth-card {
    padding: 24px;
  }
  
  .auth-title {
    font-size: 24px;
  }
}
</style>

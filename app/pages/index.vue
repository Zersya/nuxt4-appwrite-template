<template>
  <div>
    <TodoApp />
  </div>
</template>

<script setup>
import TodoApp from '~/components/todo/TodoApp.vue'

// Page meta
definePageMeta({
  layout: false,
  middleware: 'auth'
})
</script>

<style>
@import '~/assets/css/main.css';
</style>

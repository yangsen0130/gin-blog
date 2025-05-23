<template>
  <div id="app-container">
    <router-view />
  </div>
</template>

<script setup>
// 这里可以放置应用级别的逻辑，例如初始化操作
// import { onMounted } from 'vue';
// import { useAuthStore } from './store/auth';

// onMounted(() => {
//   const authStore = useAuthStore();
//   // authStore.checkAuth(); // 如果有 checkAuth 逻辑
// });
</script>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
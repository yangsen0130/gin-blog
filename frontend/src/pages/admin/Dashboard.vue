<template>
  <div class="dashboard-container card">
    <h2>仪表盘</h2>
    <p v-if="authStore.user">欢迎回来, {{ authStore.user.username }}!</p>
    <p>在这里您可以管理您的博客文章。</p>
    <div class="quick-actions">
      <router-link :to="{ name: 'AdminManagePosts' }" class="btn btn-primary">管理文章</router-link>
      <router-link :to="{ name: 'AdminCreatePost' }" class="btn btn-secondary">新建文章</router-link>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../store/auth';
const authStore = useAuthStore();
</script>

<style scoped>
.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
}

.dashboard-container {
  /* 使用全局 .card 样式 */
}

.dashboard-container h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}
.quick-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px; /* 按钮之间的间距 */
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  font-size: 1rem;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}
</style>
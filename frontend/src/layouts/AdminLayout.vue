<template>
  <div class="admin-layout">
    <Sidebar />
    <div class="main-content">
      <header class="admin-header">
        <h3>管理员后台</h3>
        <button @click="logout" class="btn btn-secondary">登出</button>
      </header>
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../components/admin/Sidebar.vue';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #f4f7f6;
}

.admin-header {
  background-color: #ffffff;
  padding: 15px 30px;
  box-shadow: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.admin-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.content-area {
  padding: 30px;
  flex-grow: 1;
  overflow-y: auto; /* 如果内容过多，允许滚动 */
}
</style>
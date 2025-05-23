<template>
  <div class="login-container">
    <div class="login-form">
      <h2>管理员登录</h2>
      <div v.if="registrationMessage" class="success-message">
        {{ registrationMessage }}
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名:</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="form-group">
          <label for="password">密码:</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div v.if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
        <button type="submit" class="btn btn-primary" :disabled="authStore.loading">
          {{ authStore.loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="register-link">
        还没有账户? <router-link :to="{ name: 'UserRegister' }">立即注册</router-link>
        <!-- 注意：后端目前只有一个注册接口，这里假设注册后也是通过此登录入口进入管理 -->
        <!-- 如果有单独的用户注册页面，可以链接到那里 -->
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../store/auth';
import { useRoute } from 'vue-router';

const username = ref('');
const password = ref('');
const authStore = useAuthStore();
const route = useRoute();
const registrationMessage = ref('');

onMounted(() => {
  if (route.query.registered === 'true') {
    registrationMessage.value = '注册成功！现在您可以登录了。';
  }
  // 如果用户已登录，尝试直接跳转到 dashboard
  // 这部分逻辑也可以放在路由守卫中更集中处理
  // if (authStore.isAuthenticated) {
  //   router.push({ name: 'AdminDashboard' });
  // }
});

const handleLogin = async () => {
  await authStore.login({ username: username.value, password: password.value });
  // 登录成功后的跳转已在 authStore action 中处理
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-form h2 {
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: calc(100% - 20px); /* 调整宽度以适应 padding */
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn-primary {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary:disabled {
  background-color: #aaa;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.error-message {
  color: red;
  margin-bottom: 15px;
  font-size: 0.9em;
}
.success-message {
  color: green;
  background-color: #e6ffed;
  border: 1px solid #b7ebc3;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9em;
}
.register-link {
  margin-top: 20px;
  font-size: 0.9em;
}
</style>
<template>
  <div class="register-container">
    <div class="register-form">
      <h2>用户注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">用户名:</label>
          <input type="text" id="username" v-model="username" required minlength="3" />
        </div>
        <div class="form-group">
          <label for="password">密码:</label>
          <input type="password" id="password" v-model="password" required minlength="6" />
        </div>
        <div class="form-group">
          <label for="confirmPassword">确认密码:</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" required />
        </div>
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
        <div v-if="passwordError" class="error-message">
          {{ passwordError }}
        </div>
        <button type="submit" class="btn btn-primary" :disabled="authStore.loading">
          {{ authStore.loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="login-link">
        已有账户? <router-link :to="{ name: 'AdminLogin' }">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../store/auth';

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const authStore = useAuthStore();

const handleRegister = async () => {
  passwordError.value = '';

  // 验证密码是否匹配
  if (password.value !== confirmPassword.value) {
    passwordError.value = '两次输入的密码不一致';
    return;
  }

  await authStore.register({
    username: username.value,
    password: password.value
  });
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.register-form h2 {
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
  width: calc(100% - 20px);
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

.login-link {
  margin-top: 20px;
  font-size: 0.9em;
}
</style>
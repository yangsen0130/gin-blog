<template>
  <div class="login-container">
    <div class="login-form">
      <h2>管理员登录</h2>
      <!-- <div v.if="registrationMessage" class="success-message"> // 此消息不再需要
        {{ registrationMessage }}
      </div> -->
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
      <!-- <p class="register-link"> // 删除注册链接
        还没有账户? <router-link :to="{ name: 'UserRegister' }">立即注册</router-link>
      </p> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../store/auth';
// import { useRoute } from 'vue-router'; // 不再需要 useRoute

const username = ref('');
const password = ref('');
const authStore = useAuthStore();
// const route = useRoute(); // 不再需要
// const registrationMessage = ref(''); // 不再需要

onMounted(() => {
  // if (route.query.registered === 'true') { // 注册相关的逻辑不再需要
  //   registrationMessage.value = '注册成功！现在您可以登录了。';
  // }
});

const handleLogin = async () => {
  await authStore.login({ username: username.value, password: password.value });
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
/* .success-message { // 不再需要
  color: green;
  background-color: #e6ffed;
  border: 1px solid #b7ebc3;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9em;
} */
/* .register-link { // 不再需要
  margin-top: 20px;
  font-size: 0.9em;
} */
</style>
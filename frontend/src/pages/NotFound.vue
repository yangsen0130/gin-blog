<template>
  <div class="not-found-container">
    <h1>404 - 页面未找到</h1>
    <p>抱歉，您访问的页面不存在。</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 50px;
  flex-grow: 1;
}
.not-found-container h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}
.not-found-container p {
  font-size: 1.2rem;
  margin-bottom: 30px;
}
</style>
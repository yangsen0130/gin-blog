<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h4>博客管理</h4>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <li>
          <router-link :to="{ name: 'AdminDashboard' }" active-class="active-link">
            <i class="icon-dashboard"></i> <!-- 之后可以添加图标 -->
            仪表盘
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'AdminManagePosts' }" active-class="active-link">
            <i class="icon-posts"></i>
            文章管理
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'AdminCreatePost' }" active-class="active-link">
            <i class="icon-add-post"></i>
            新建文章
          </router-link>
        </li>
      </ul>
    </nav>
    <div class="sidebar-footer">
      <p v.if="authStore.user">欢迎, {{ authStore.user.username }}</p>
    </div>
  </aside>
</template>

<script setup>
import { useAuthStore } from '../../store/auth';
const authStore = useAuthStore();
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #2c3e50; /* 深色背景 */
  color: #ecf0f1; /* 浅色文字 */
  display: flex;
  flex-direction: column;
  height: 100vh; /* 确保侧边栏占满整个视口高度 */
  position: sticky; /* 如果页面可滚动，保持侧边栏位置 */
  top: 0;
}

.sidebar-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #34495e;
}

.sidebar-header h4 {
  margin: 0;
  font-size: 1.5rem;
  color: #ffffff;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.sidebar-nav li a {
  display: block;
  padding: 15px 20px;
  color: #bdc3c7; /* 链接颜色 */
  text-decoration: none;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 1rem;
}

.sidebar-nav li a:hover,
.sidebar-nav li a.active-link { /* 当前激活链接的样式 */
  background-color: #3498db; /* 悬停/激活背景色 */
  color: #ffffff; /* 悬停/激活文字颜色 */
  border-left: 3px solid #2980b9;
}

/* 可以在这里为图标预留空间或添加实际图标库的样式 */
.sidebar-nav li a i {
  margin-right: 10px;
}

.sidebar-footer {
  margin-top: auto; /* 将页脚推到底部 */
  padding: 20px;
  text-align: center;
  font-size: 0.9em;
  border-top: 1px solid #34495e;
  color: #bdc3c7;
}
</style>
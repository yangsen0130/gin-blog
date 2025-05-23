<template>
  <div class="edit-post-container card">
    <h2>编辑文章</h2>
    <div v.if="initialLoading" class="loading-indicator">加载文章数据中...</div>
    <div v.if="loadError" class="error-message">{{ loadError }}</div>

    <form v.if="!initialLoading && !loadError" @submit.prevent="handleUpdatePost">
      <div class="form-group">
        <label for="title">标题:</label>
        <input type="text" id="title" v-model="post.title" required />
      </div>
      <div class="form-group">
        <label for="content">内容:</label>
        <textarea id="content" v-model="post.content" rows="10" required></textarea>
      </div>
      <div v.if="updateError" class="error-message">{{ updateError }}</div>
      <button type="submit" class="btn btn-primary" :disabled="updateLoading">
        {{ updateLoading ? '更新中...' : '更新文章' }}
      </button>
      <router-link :to="{ name: 'AdminManagePosts' }" class="btn btn-secondary" style="margin-left: 10px;">
        取消
      </router-link>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchPostById, updatePost as apiUpdatePost } from '../../api';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  id: { // 从路由参数中获取
    type: String,
    required: true,
  },
});

const post = ref({
  id: null,
  title: '',
  content: '',
});
const initialLoading = ref(true);
const loadError = ref(null);
const updateLoading = ref(false);
const updateError = ref(null);

const router = useRouter();
const route = useRoute(); // useRoute 也可以获取参数

const loadPostData = async () => {
  initialLoading.value = true;
  loadError.value = null;
  try {
    const postId = parseInt(props.id || route.params.id); // 确保是数字
    if (isNaN(postId)) {
      throw new Error("无效的文章ID");
    }
    const response = await fetchPostById(postId);
    post.value = { ...response.data }; // 填充表单
  } catch (err) {
    loadError.value = '加载文章数据失败: ' + (err.response?.data?.error || err.message);
  } finally {
    initialLoading.value = false;
  }
};

const handleUpdatePost = async () => {
  updateLoading.value = true;
  updateError.value = null;
  try {
    const { ID, title, content } = post.value; // 从 post ref 中获取更新的数据
    // 确保只发送 title 和 content
    await apiUpdatePost(ID, { title, content });
    router.push({ name: 'AdminManagePosts' });
  } catch (err) {
    updateError.value = '更新文章失败: ' + (err.response?.data?.error || err.message);
  } finally {
    updateLoading.value = false;
  }
};

onMounted(loadPostData);
</script>

<style scoped>
/* 使用全局 .card 和 .form-group 样式 */
.edit-post-container h2 {
  margin-top: 0;
  margin-bottom: 25px;
}
.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>
import axios from 'axios';
import { useAuthStore } from '../store/auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器，用于在每个请求中附加 JWT token
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        const token = authStore.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 (可选，用于统一处理错误等)
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token 失效或未授权
            const authStore = useAuthStore();
            authStore.logout(); // 清除本地 token 和用户信息
            // 可以重定向到登录页，但这通常在路由守卫中处理更合适
            // window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);


// 认证相关 API
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
export const loginUser = (credentials) => apiClient.post('/auth/login', credentials);

// 文章相关 API
export const fetchPosts = () => apiClient.get('/posts');
export const fetchPostById = (id) => apiClient.get(`/posts/${id}`);
export const createPost = (postData) => apiClient.post('/posts', postData);
export const updatePost = (id, postData) => apiClient.put(`/posts/${id}`, postData);
export const deletePost = (id) => apiClient.delete(`/posts/${id}`);

export default apiClient;
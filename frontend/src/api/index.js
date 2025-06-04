import axios from 'axios';
import { useAuthStore } from '../store/auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore();
            // Only logout if it's not a guest session being established or if token is truly invalid
            // This might need more nuanced handling depending on the error source
            if (authStore.isAuthenticated) { // Avoid logging out if it's a guest just failing an op
                 // authStore.logout(); // Potentially too aggressive
            }
        }
        return Promise.reject(error);
    }
);

export const loginUser = (credentials) => apiClient.post('/auth/login', credentials);

export const fetchPosts = () => apiClient.get('/posts');
export const fetchPostsByTag = (tagName) => apiClient.get(`/posts/tag/${tagName}`);
export const fetchPostById = (id) => apiClient.get(`/posts/${id}`);
export const createPost = (postData) => apiClient.post('/posts', postData);
export const updatePost = (id, postData) => apiClient.put(`/posts/${id}`, postData);
export const deletePost = (id) => apiClient.delete(`/posts/${id}`);

export const likePost = (id) => apiClient.post(`/posts/${id}/like`);
export const unlikePost = (id) => apiClient.post(`/posts/${id}/unlike`);

export const fetchCategories = () => apiClient.get('/categories');
export const createCategory = (categoryData) => apiClient.post('/categories', categoryData);

export const fetchBlogStats = () => apiClient.get('/stats');

// GitHub OAuth - This is a redirect, not an API call in the traditional sense
export const GITHUB_LOGIN_URL = `${import.meta.env.VITE_API_BASE_URL}/auth/github/login`;

// Comments API
export const fetchCommentsByPostId = (postId) => apiClient.get(`/posts/${postId}/comments`);
export const createComment = (postId, commentData) => apiClient.post(`/posts/${postId}/comments`, commentData);


export default apiClient;
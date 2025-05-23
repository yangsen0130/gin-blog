import { defineStore } from 'pinia';
import { loginUser as apiLogin, registerUser as apiRegister } from '../api';
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,
        error: null,
        loading: false,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token && !!state.user,
        currentUser: (state) => state.user,
    },
    actions: {
        async login(credentials) {
            this.loading = true;
            this.error = null;
            try {
                const response = await apiLogin(credentials);
                const { token, user_id, username } = response.data;
                this.token = token;
                this.user = { id: user_id, username }; // 后端返回 user_id 和 username
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(this.user));
                // 登录成功后，axios 实例的请求拦截器会自动带上 token
                router.push('/admin/dashboard'); // 跳转到管理员后台
            } catch (err) {
                this.error = err.response?.data?.error || '登录失败';
                this.token = null;
                this.user = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                this.loading = false;
            }
        },
        async register(userData) {
            this.loading = true;
            this.error = null;
            try {
                await apiRegister(userData);
                // 注册成功后，可以提示用户去登录，或者自动登录
                // 这里我们简单地跳转到登录页并提示
                router.push({ name: 'AdminLogin', query: { registered: 'true' } });
            } catch (err) {
                this.error = err.response?.data?.error || '注册失败';
            } finally {
                this.loading = false;
            }
        },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/admin/login'); // 登出后跳转到登录页
        },
        // 应用加载时检查本地存储的 token (可选，如果 token 有效期很短，可能不需要)
        // checkAuth() {
        //   const token = localStorage.getItem('token');
        //   const user = localStorage.getItem('user');
        //   if (token && user) {
        //     this.token = token;
        //     this.user = JSON.parse(user);
        //     // 你可能还需要验证 token 是否仍然有效
        //   } else {
        //     this.logout(); // 如果没有，则确保状态是登出的
        //   }
        // }
    },
});
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

import HomePage from '../pages/user/HomePage.vue';
import PostDetail from '../components/user/PostDetail.vue';
import NotFound from '../pages/NotFound.vue';

import AdminLogin from '../pages/admin/AdminLogin.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import Dashboard from '../pages/admin/Dashboard.vue';
import ManagePosts from '../pages/admin/ManagePosts.vue';
import CreatePost from '../pages/admin/CreatePost.vue';
import EditPost from '../pages/admin/EditPost.vue';

// import UserRegister from '../pages/user/UserRegister.vue'; // 删除此导入

const routes = [
    {
        path: '/',
        name: 'HomePage',
        component: HomePage,
    },
    {
        path: '/post/:id',
        name: 'PostDetail',
        component: PostDetail,
        props: true,
    },
    // { // 删除 UserRegister 路由定义
    //     path: '/register',
    //     name: 'UserRegister',
    //     component: UserRegister,
    //     meta: { requiresGuest: true },
    // },
    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: AdminLogin,
        meta: { requiresGuest: true },
    },
    {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/admin/dashboard',
            },
            {
                path: 'dashboard',
                name: 'AdminDashboard',
                component: Dashboard,
            },
            {
                path: 'posts',
                name: 'AdminManagePosts',
                component: ManagePosts,
            },
            {
                path: 'posts/create',
                name: 'AdminCreatePost',
                component: CreatePost,
            },
            {
                path: 'posts/edit/:id',
                name: 'AdminEditPost',
                component: EditPost,
                props: true,
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated && localStorage.getItem('token') && localStorage.getItem('user')) {
        authStore.token = localStorage.getItem('token');
        authStore.user = JSON.parse(localStorage.getItem('user'));
    }

    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'AdminLogin', query: { redirect: to.fullPath } });
    } else if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'AdminDashboard' });
    } else {
        next();
    }
});

export default router;
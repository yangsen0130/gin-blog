import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

import HomePage from '../pages/user/HomePage.vue';
import PostDetail from '../components/user/PostDetail.vue'; // Assuming this is the correct path for PostDetail component
import NotFound from '../pages/NotFound.vue';
import AuthCallback from '../pages/AuthCallback.vue'; // New import

import AdminLogin from '../pages/admin/AdminLogin.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import Dashboard from '../pages/admin/Dashboard.vue';
import ManagePosts from '../pages/admin/ManagePosts.vue';
import CreatePost from '../pages/admin/CreatePost.vue';
import EditPost from '../pages/admin/EditPost.vue';


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
        meta: { requiresGuestAuthToAction: true } // Example meta field
    },
    {
        path: '/auth/callback', // For GitHub OAuth callback
        name: 'AuthCallback',
        component: AuthCallback,
    },
    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: AdminLogin,
        meta: { requiresGuest: true }, // This means if user is authenticated (any type), redirect from login
    },
    {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true, requiresAdmin: true }, // Requires auth and specifically admin
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
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // Attempt to rehydrate store if token/user exists in localStorage but not in Pinia state
    // This can happen on a page refresh.
    if (!authStore.isAuthenticated && localStorage.getItem('token') && localStorage.getItem('user')) {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            if (token && user) {
                // This is a simplified rehydration.
                // For guest users, setGuestSession might be more appropriate if it handles all necessary fields.
                authStore.token = token;
                authStore.user = user;
            }
        } catch (e) {
            // If JSON parsing fails, clear corrupted data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            authStore.token = null;
            authStore.user = null;
        }
    }


    const isAuthenticated = authStore.isAuthenticated;
    const isAdmin = authStore.isAdmin;

    if (to.meta.requiresAuth) {
        if (!isAuthenticated) {
            next({ name: 'AdminLogin', query: { redirect: to.fullPath } });
            return;
        }
        if (to.meta.requiresAdmin && !isAdmin) {
            // If requires admin but user is not admin (e.g., guest), redirect or show error
            // For now, redirecting to home, but a "Forbidden" page might be better.
            next({ name: 'HomePage' });
            return;
        }
    }
    
    // If route is for guests (like admin login) and user is already authenticated as admin
    if (to.meta.requiresGuest && isAuthenticated && isAdmin) {
         next({ name: 'AdminDashboard' });
         return;
    }
    // If route is for guests (like admin login) and user is authenticated as guest, let them pass or redirect
    // This part of logic for 'requiresGuest' might need refinement based on desired UX for guests on admin login page
    if (to.meta.requiresGuest && isAuthenticated && authStore.isGuest) {
        // A guest is on a page like AdminLogin, maybe redirect them home
        next({ name: 'HomePage' });
        return;
    }

    next();
});

export default router;
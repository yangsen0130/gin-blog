<template>
    <div class="auth-callback-page">
      <div v-if="loading" class="loading-message">
        Authenticating with GitHub... Please wait.
      </div>
      <div v-if="error" class="error-message">
        <p>Authentication failed:</p>
        <p>{{ error }}</p>
        <router-link to="/">Go to Homepage</router-link>
      </div>
      <div v-if="!loading && !error" class="success-message">
        Authentication successful! Redirecting...
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '../store/auth';
  
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  
  const loading = ref(true);
  const error = ref(null);
  
  onMounted(() => {
    const hash = route.hash.substring(1); // Remove #
    const params = new URLSearchParams(hash);
  
    const token = params.get('token');
    const guestIdStr = params.get('guest_id');
    const username = params.get('username');
    const avatarUrl = params.get('avatar_url');
    const type = params.get('type');
    const authError = params.get('error');
    const errorDetails = params.get('details');
  
    if (authError) {
      error.value = `${authError}${errorDetails ? ': ' + errorDetails : ''}`;
      authStore.setGuestSession({ error: error.value });
      loading.value = false;
      return;
    }
  
    if (token && guestIdStr && username && type === 'guest') {
      const guestId = parseInt(guestIdStr, 10);
      authStore.setGuestSession({
        token,
        guest_id: guestId,
        username,
        avatar_url: avatarUrl,
      });
      loading.value = false;
      
      const intendedPath = localStorage.getItem('oauth_redirect_path') || '/';
      localStorage.removeItem('oauth_redirect_path');
      router.push(intendedPath);
  
    } else {
      error.value = 'Authentication callback is missing required parameters.';
      authStore.setGuestSession({ error: error.value });
      loading.value = false;
    }
  });
  </script>
  
  <style scoped>
  .auth-callback-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 20px;
    text-align: center;
  }
  .loading-message, .success-message {
    font-size: 1.2rem;
    color: #333;
  }
  .error-message {
    font-size: 1.1rem;
    color: #d9534f; /* Bootstrap danger color */
    background-color: #f2dede;
    border: 1px solid #ebccd1;
    padding: 15px;
    border-radius: 4px;
    max-width: 600px;
  }
  .error-message p {
    margin: 5px 0;
  }
  .error-message a {
    color: #a94442;
    text-decoration: underline;
  }
  </style>
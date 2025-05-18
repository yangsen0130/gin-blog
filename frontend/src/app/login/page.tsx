'use client';

import AuthForm from '@/components/AuthForm';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>, username?: string, password?: string) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Username and password are required.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('Login successful:', data);
      alert('Login successful!');
      router.push('/');
      router.refresh();
    } catch (error: unknown) { // 修改处
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error; // Re-throw to be caught by AuthForm
      } else {
        throw new Error('An unexpected error occurred during login.');
      }
    }
  };

  return (
    <div className="mt-10">
      <AuthForm formType="login" onSubmit={handleLogin} />
    </div>
  );
}
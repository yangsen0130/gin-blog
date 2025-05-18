'use client';

import AuthForm from '@/components/AuthForm';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>, username?: string, password?: string) => {
    e.preventDefault();
    if (!username || !password) {
      // This case should ideally be handled by AuthForm's internal state or validation
      // but as a fallback:
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
      alert('Login successful!'); // User feedback
      router.push('/'); // Redirect to homepage or dashboard
      router.refresh(); // Refresh server components, good for updating Navbar state if it depends on auth
    } catch (error: any) {
      console.error('Login error:', error);
      // The AuthForm component will display the error message if its onSubmit throws an error
      throw error; // Re-throw to be caught by AuthForm
    }
  };

  return (
    <div className="mt-10">
      <AuthForm formType="login" onSubmit={handleLogin} />
    </div>
  );
} 
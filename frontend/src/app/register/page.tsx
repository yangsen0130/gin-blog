'use client';

import AuthForm from '@/components/AuthForm';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';

export default function RegisterPage() {
  const router = useRouter();

  // 更新 handleRegister 函数签名，移除 email 参数
  const handleRegister = async (e: FormEvent<HTMLFormElement>, username?: string, password?: string) => {
    e.preventDefault();
    if (!username || !password) { // 只校验 username 和 password
      alert('Username and password are required.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // 只发送 username 和 password
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log('Registration successful:', data);
      alert('Registration successful! Please login.');
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error));
      }
    }
  };

  return (
    <div className="mt-10">
      <AuthForm formType="register" onSubmit={handleRegister} />
    </div>
  );
}
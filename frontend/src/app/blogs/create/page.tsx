'use client';

import BlogForm from '@/components/BlogForm';
import { BlogFormValues } from '@/types/blog';
import { useRouter } from 'next/navigation';

export default function CreateBlogPage() {
  const router = useRouter();

  const handleCreatePost = async (values: BlogFormValues) => {
    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      console.log('Post created:', data);
      alert('Blog post created successfully!');
      router.push(`/blogs/${data.id}`);
      router.refresh();
    } catch (error: unknown) { // 修改处
      console.error('Failed to create post:', error);
      if (error instanceof Error) {
        throw error; // Re-throw to be caught by BlogForm
      } else {
        throw new Error('An unexpected error occurred while creating the post.');
      }
    }
  };

  return (
    <div className="py-8">
      <BlogForm onSubmit={handleCreatePost} />
    </div>
  );
}
'use client';

import BlogForm from '@/components/BlogForm';
import { BlogFormValues, BlogPost } from '@/types/blog';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [initialData, setInitialData] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blogId) return;

    const fetchBlogData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/blogs/${blogId}`);
        if (response.status === 404) {
            throw new Error('Blog post not found. It may have been deleted.');
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch blog post data.' }));
          throw new Error(errorData.message);
        }
        const data: BlogPost = await response.json();
        setInitialData(data);
      } catch (err: unknown) { // 修改处
        console.error('Failed to load blog for editing:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred while fetching the post.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogData();
  }, [blogId]);

  const handleEditPost = async (values: BlogFormValues) => {
    if (!blogId) return;

    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update post');
      }

      console.log('Post updated:', data);
      alert('Blog post updated successfully!');
      router.push(`/blogs/${blogId}`);
      router.refresh();
    } catch (error: unknown) { // 修改处
      console.error('Failed to update post:', error);
      if (error instanceof Error) {
        throw error; // Re-throw to be caught by BlogForm or display its message
      } else {
        throw new Error('An unexpected error occurred while updating the post.');
      }
    }
  };

  if (isLoading) {
    return <p className="text-center py-10">Loading post data...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">Error: {error}</p>;
  }

  if (!initialData) {
    return <p className="text-center py-10">Blog post not found or could not be loaded.</p>;
  }

  return (
    <div className="py-8">
      <BlogForm onSubmit={handleEditPost} initialData={initialData} isEditMode={true} />
    </div>
  );
}
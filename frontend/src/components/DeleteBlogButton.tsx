'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteBlogButtonProps {
  blogId: string;
}

export default function DeleteBlogButton({ blogId }: DeleteBlogButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }

      alert('Post deleted successfully!');
      router.push('/blogs'); // Redirect to blogs list
      router.refresh(); // Refresh data on the blogs page
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Could not delete the post.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {isLoading ? 'Deleting...' : 'Delete Post'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </>
  );
} 
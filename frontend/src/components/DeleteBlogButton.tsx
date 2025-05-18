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
      
      // Check if response is ok AND if there's content to parse
      // For DELETE, 204 No Content is common and has no body
      if (response.status === 204) {
        alert('Post deleted successfully!');
        router.push('/blogs');
        router.refresh();
        return; // Early return for 204
      }

      const data = await response.json(); // Try to parse JSON only if not 204

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }

      alert('Post deleted successfully!'); // For other success statuses like 200 with body
      router.push('/blogs');
      router.refresh();
    } catch (err: unknown) { // 修改处
      console.error('Delete error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not delete the post.');
      }
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
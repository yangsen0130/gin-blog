'use client';

import { useState, FormEvent, useEffect } from 'react';
import { BlogFormValues, BlogPost } from '@/types/blog';
import { useRouter } from 'next/navigation';

interface BlogFormProps {
  onSubmit: (values: BlogFormValues) => Promise<void>;
  initialData?: BlogPost;
  isEditMode?: boolean;
}

export default function BlogForm({ onSubmit, initialData, isEditMode = false }: BlogFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      setIsLoading(false);
      return;
    }

    try {
      await onSubmit({ title, content });
      // On successful submission, redirect or give feedback
      // This will be handled by the page calling this form.
    } catch (err: any) {
      setError(err.message || `An error occurred while ${isEditMode ? 'updating' : 'creating'} the post.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center">
        {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
      </h2>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div className="flex justify-end space-x-3">
        <button
            type="button"
            onClick={() => router.back()} // Go back to the previous page
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : (isEditMode ? 'Update Post' : 'Create Post')}
        </button>
      </div>
    </form>
  );
} 
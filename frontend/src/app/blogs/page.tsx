import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { cookies } from 'next/headers'; // To potentially check auth for showing create button

async function getBlogs(): Promise<BlogPost[]> {
  // In a real app, fetch from your API. Ensure your API URL is correct.
  // Using absolute URL for server-side fetching if your API is external or on a different port.
  // For internal API routes in Next.js, a relative path is fine, but ensure it works during build time.
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/blogs`, {
    cache: 'no-store', // To ensure fresh data on each request for now
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch blogs');
  }
  return res.json();
}

export default async function BlogsPage() {
  const blogs = await getBlogs();
  const authToken = cookies().get('auth_token')?.value; // Check if user is logged in (example)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Blog Posts</h1>
        {authToken && ( // Only show Create button if user is logged in (example)
          <Link href="/blogs/create">
            <span className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
              Create New Post
            </span>
          </Link>
        )}
      </div>

      {blogs.length === 0 ? (
        <p>No blog posts yet. {authToken ? 'Be the first to create one!' : 'Login to create a post.'} </p>
      ) : (
        <div className="space-y-6">
          {blogs.map((post) => (
            <div key={post.id} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">
                <Link href={`/blogs/${post.id}`} className="hover:text-indigo-600">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-700 mb-3">
                {post.content.substring(0, 150)}{post.content.length > 150 && '...'}
              </p>
              <div className="text-sm text-gray-500 mb-3">
                <p>By: {post.authorName || 'Unknown Author'}</p>
                <p>Published: {new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
              <Link href={`/blogs/${post.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                Read more &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Optional: Add revalidation if your data changes frequently
// export const revalidate = 60; // Revalidate every 60 seconds 
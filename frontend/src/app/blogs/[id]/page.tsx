import { BlogPost } from '@/types/blog';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
// We will create this client component shortly for delete functionality
import DeleteBlogButton from '@/components/DeleteBlogButton'; 

interface BlogPageParams {
  params: {
    id: string;
  };
}

async function getBlog(id: string): Promise<BlogPost | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/blogs/${id}`, {
    cache: 'no-store', // Fetch fresh data
  });
  if (res.status === 404) {
    return null; // Handled by notFound() later
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch blog post with id: ${id}`);
  }
  return res.json();
}

export default async function BlogPage({ params }: BlogPageParams) {
  const blog = await getBlog(params.id);

  if (!blog) {
    notFound(); // Triggers the not-found.tsx or default Next.js 404 page
  }

  // Simulate checking if the current user is the author
  // In a real app, you would get the current user ID from session/token
  // and compare it with blog.authorId
  const authToken = cookies().get('auth_token')?.value;
  // This is a placeholder. Real auth would involve decoding the token to get user ID
  const isAuthor = authToken && blog.authorId === 'simulated-user-id'; 

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">{blog.title}</h1>
      <div className="text-sm text-gray-500 mb-6">
        <p>By: {blog.authorName || 'Unknown Author'}</p>
        <p>Published: {new Date(blog.createdAt).toLocaleDateString()}</p>
        {blog.updatedAt !== blog.createdAt && (
          <p>Last updated: {new Date(blog.updatedAt).toLocaleDateString()}</p>
        )}
      </div>
      <div className="prose prose-lg max-w-none mb-8" dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }} />

      {isAuthor && (
        <div className="flex space-x-4 mt-8 border-t pt-6">
          <Link href={`/blogs/${blog.id}/edit`}>
            <span className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">
              Edit Post
            </span>
          </Link>
          <DeleteBlogButton blogId={blog.id} />
        </div>
      )}

      <div className="mt-10">
        <Link href="/blogs" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to all posts
        </Link>
      </div>
    </article>
  );
}

// Optional: If you have many blog posts and want to pre-render them at build time
// export async function generateStaticParams() {
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/blogs`);
//   const blogs: BlogPost[] = await res.json();
// 
//   return blogs.map((blog) => ({
//     id: blog.id,
//   }));
// }

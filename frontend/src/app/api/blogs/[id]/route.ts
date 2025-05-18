import { NextRequest, NextResponse } from 'next/server';
import { BlogPost } from '@/types/blog';

interface RouteParams {
  id: string;
}

// GET /api/blogs/[id] - Get a single blog post
export async function GET(_request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { id } = params;
    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
    if (!goBackendBaseUrl) {
      // ... (handle missing env var)
    }
    // Corrected default path
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogUrl = `${goBackendBaseUrl}${blogsPath}/${id}`;

    const apiResponse = await fetch(backendBlogUrl, { cache: 'no-store' });

    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = await apiResponse.json();
      } catch (e) {
        // Handle non-JSON error response
        if (apiResponse.status === 404) {
            return NextResponse.json({ message: `Blog post with ID ${id} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Failed to fetch blog ${id}. Backend: ${apiResponse.status} ${apiResponse.statusText}` }, { status: apiResponse.status });
      }
       if (apiResponse.status === 404) { // Backend might send 404 with JSON body
        return NextResponse.json({ message: errorData.message || `Blog post with ID ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json({ message: errorData.message || `Failed to fetch blog ${id} from backend` }, { status: apiResponse.status });
    }

    const blogData: BlogPost = await apiResponse.json();
    return NextResponse.json(blogData, { status: 200 });

  } catch (error) {
    // ... (error handling)
    console.error(`Error fetching blog ${params.id}:`, error);
    let errorMessage = `Failed to fetch blog ${params.id}`;
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        errorMessage = 'Could not connect to blog service.';
        return NextResponse.json({ message: errorMessage }, { status: 503 });
    }
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// PUT /api/blogs/[id] - Update a blog post
export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      // ... (handle bad request)
    }

    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
     if (!goBackendBaseUrl) { /* ... */ }
    // Corrected default path
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogUrl = `${goBackendBaseUrl}${blogsPath}/${id}`;

    const apiResponse = await fetch(backendBlogUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', /* 'Authorization': ... */ },
      body: JSON.stringify({ title, content }),
    });

    if (!apiResponse.ok) {
      let errorData;
      try { errorData = await apiResponse.json(); } catch (e) { /* ... */ }
      if (apiResponse.status === 404) {
        return NextResponse.json({ message: errorData.message || `Blog post with ID ${id} not found for update.` }, { status: 404 });
      }
      return NextResponse.json({ message: errorData.message || `Failed to update blog ${id} at backend` }, { status: apiResponse.status });
    }

    const responseBody = await apiResponse.json();
    return NextResponse.json(responseBody, { status: 200 });

  } catch (error) {
    // ... (error handling)
    console.error(`Error updating blog ${params.id}:`, error);
    let errorMessage = `Failed to update blog ${params.id}`;
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        errorMessage = 'Could not connect to blog service.';
        return NextResponse.json({ message: errorMessage }, { status: 503 });
    }
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// DELETE /api/blogs/[id] - Delete a blog post
export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { id } = params;
    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
    if (!goBackendBaseUrl) { /* ... */ }
    // Corrected default path
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogUrl = `${goBackendBaseUrl}${blogsPath}/${id}`;

    const apiResponse = await fetch(backendBlogUrl, {
      method: 'DELETE',
      headers: { /* 'Authorization': ... */ },
    });

    if (!apiResponse.ok) {
      let errorData;
      try { errorData = await apiResponse.json(); } catch (e) { /* ... */ }
      if (apiResponse.status === 404) {
         return NextResponse.json({ message: errorData.message || `Blog post with ID ${id} not found for deletion.` }, { status: 404 });
      }
      return NextResponse.json({ message: errorData.message || `Failed to delete blog ${id} from backend` }, { status: apiResponse.status });
    }
    
    if (apiResponse.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    
    const responseBody = await apiResponse.json();
    return NextResponse.json(responseBody, { status: apiResponse.status });

  } catch (error) {
    // ... (error handling)
    console.error(`Error deleting blog ${params.id}:`, error);
    let errorMessage = `Failed to delete blog ${params.id}`;
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        errorMessage = 'Could not connect to blog service.';
        return NextResponse.json({ message: errorMessage }, { status: 503 });
    }
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
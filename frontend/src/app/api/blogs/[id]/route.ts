import { NextRequest, NextResponse } from 'next/server';
import { BlogPost } from '@/types/blog';

// 移除 RouteParams 接口，或者如果其他地方也用不到，可以彻底删除
// interface RouteParams {
//   id: string;
// }

// GET /api/blogs/[id] - Get a single blog post
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } } // 修改处
) {
  try {
    const { id } = params;
    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
    if (!goBackendBaseUrl) {
      console.error('GO_BACKEND_BASE_URL environment variable is not set.');
      return NextResponse.json({ message: 'Application configuration error: Backend URL not set.' }, { status: 500 });
    }
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogUrl = `${goBackendBaseUrl}${blogsPath}/${id}`;

    const apiResponse = await fetch(backendBlogUrl, { cache: 'no-store' });

    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = await apiResponse.json();
      } catch (_e) {
        if (apiResponse.status === 404) {
            return NextResponse.json({ message: `Blog post with ID ${id} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Failed to fetch blog ${id}. Backend: ${apiResponse.status} ${apiResponse.statusText}` }, { status: apiResponse.status });
      }
       if (apiResponse.status === 404) {
        return NextResponse.json({ message: errorData.message || `Blog post with ID ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json({ message: errorData.message || `Failed to fetch blog ${id} from backend` }, { status: apiResponse.status });
    }

    const blogData: BlogPost = await apiResponse.json();
    return NextResponse.json(blogData, { status: 200 });

  } catch (error) {
    const { id } = params; // 确保在 catch 块中也能访问到 id
    console.error(`Error fetching blog ${id}:`, error);
    let errorMessage = `Failed to fetch blog ${id}`;
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
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } } // 修改处
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
     if (!goBackendBaseUrl) {
        console.error('GO_BACKEND_BASE_URL environment variable is not set.');
        return NextResponse.json({ message: 'Application configuration error: Backend URL not set.' }, { status: 500 });
     }
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogUrl = `${goBackendBaseUrl}${blogsPath}/${id}`;

    const apiResponse = await fetch(backendBlogUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', /* 'Authorization': ... */ },
      body: JSON.stringify({ title, content }),
    });

    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = await apiResponse.json();
      } catch (_e) {
        if (apiResponse.status === 404) {
            return NextResponse.json({ message: `Blog post with ID ${id} not found for update.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Failed to update blog ${id}. Backend responded with: ${apiResponse.status} ${apiResponse.statusText}` }, { status: apiResponse.status });
      }
      if (apiResponse.status === 404) {
        return NextResponse.json({ message: errorData.message || `Blog post with ID ${id} not found for update.` }, { status: 404 });
      }
      return NextResponse.json({ message: errorData.message || `Failed to update blog ${id} at backend` }, { status: apiResponse.status });
    }

    const responseBody = await apiResponse.json();
    return NextResponse.json(responseBody, { status: 200 });

  } catch (error) {
    const { id } = params; // 确保在 catch 块中也能访问到 id
    console.error(`Error updating blog ${id}:`, error);
    let errorMessage = `Failed to update blog ${id}`;
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
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } } // 修改处
) {
  try {
    const { id } = params;
    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
    if (!goBackendBaseUrl) {
        console.error('GO_BACKEND_BASE_URL environment variable is not set.');
        return NextResponse.json({ message: 'Application configuration error: Backend URL not set.' }, { status: 500 });
    }
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogUrl = `${goBackendBaseUrl}${blogsPath}/${id}`;

    const apiResponse = await fetch(backendBlogUrl, {
      method: 'DELETE',
      headers: { /* 'Authorization': ... */ },
    });

    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = await apiResponse.json();
      } catch (_e) {
        if (apiResponse.status === 404) {
           return NextResponse.json({ message: `Blog post with ID ${id} not found for deletion.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Failed to delete blog ${id}. Backend responded with: ${apiResponse.status} ${apiResponse.statusText}` }, { status: apiResponse.status });
      }
      if (apiResponse.status === 404) {
         return NextResponse.json({ message: errorData.message || `Blog post with ID ${id} not found for deletion.` }, { status: 404 });
      }
      return NextResponse.json({ message: errorData.message || `Failed to delete blog ${id} from backend` }, { status: apiResponse.status });
    }
    
    if (apiResponse.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    
    const responseBody = await apiResponse.json().catch(() => null);
    if (responseBody) {
        return NextResponse.json(responseBody, { status: apiResponse.status });
    }
    return new NextResponse(null, { status: apiResponse.status });

  } catch (error) {
    const { id } = params; // 确保在 catch 块中也能访问到 id
    console.error(`Error deleting blog ${id}:`, error);
    let errorMessage = `Failed to delete blog ${id}`;
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
import { NextRequest, NextResponse } from 'next/server';
import { BlogPost } from '@/types/blog';

// GET /api/blogs - List all blog posts
export async function GET() {
  try {
    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
    if (!goBackendBaseUrl) {
      console.error('GO_BACKEND_BASE_URL environment variable is not set.');
      return NextResponse.json({ message: 'Application configuration error: Backend URL not set.' }, { status: 500 });
    }
    // Corrected default path
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogsUrl = `${goBackendBaseUrl}${blogsPath}`;

    const apiResponse = await fetch(backendBlogsUrl, { cache: 'no-store' });

    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = await apiResponse.json();
      } catch (e) {
        console.error('Could not parse error response from backend as JSON:', e);
        return NextResponse.json(
          { message: `Failed to fetch blogs. Backend responded with: ${apiResponse.status} ${apiResponse.statusText}` },
          { status: apiResponse.status }
        );
      }
      console.error('Backend error fetching blogs:', errorData);
      return NextResponse.json({ message: errorData.message || 'Failed to fetch blogs from backend' }, { status: apiResponse.status });
    }

    const blogsData: BlogPost[] = await apiResponse.json();
    return NextResponse.json(blogsData, { status: 200 });

  } catch (error) {
    console.error('Error fetching blogs:', error);
    let errorMessage = 'Failed to fetch blogs';
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

// POST /api/blogs - Create a new blog post
export async function POST(request: NextRequest) {
  try {
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
    // Corrected default path
    const blogsPath = process.env.GO_BACKEND_BLOGS_PATH || '/api/posts';
    const backendBlogsUrl = `${goBackendBaseUrl}${blogsPath}`;

    // TODO: Get authenticated user ID (e.g., from validated token)
    // const authToken = request.cookies.get('auth_token')?.value; // Example
    // if (!authToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const authorId = 'temp-user-id'; // Replace with actual user ID from auth

    const apiResponse = await fetch(backendBlogsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${authToken}` // Send auth token to backend
      },
      body: JSON.stringify({ title, content, authorId }),
    });


    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = await apiResponse.json();
      } catch (e) {
         console.error('Could not parse error response from backend as JSON:', e);
        return NextResponse.json(
          { message: `Failed to create blog. Backend responded with: ${apiResponse.status} ${apiResponse.statusText}` },
          { status: apiResponse.status }
        );
      }
      console.error('Backend error creating blog:', errorData);
      return NextResponse.json({ message: errorData.message || 'Failed to create blog post at backend' }, { status: apiResponse.status });
    }

    const responseBody = await apiResponse.json();
    return NextResponse.json(responseBody, { status: 201 });

  } catch (error) {
    console.error('Error creating blog:', error);
    let errorMessage = 'Failed to create blog post';
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
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json(); // 移除 email

    if (!username || !password) { // 只校验 username 和 password
      return NextResponse.json({ message: 'Missing username or password' }, { status: 400 });
    }

    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
    if (!goBackendBaseUrl) {
      console.error('GO_BACKEND_BASE_URL environment variable is not set.');
      return NextResponse.json({ message: 'Application configuration error: Backend URL not set.' }, { status: 500 });
    }
    const registerPath = process.env.GO_BACKEND_REGISTER_PATH || '/api/auth/register';
    const backendRegisterUrl = `${goBackendBaseUrl}${registerPath}`;

    const backendResponse = await fetch(backendRegisterUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }), // 只发送 username 和 password
    });

    if (!backendResponse.ok) {
      let errorData;
      let errorMessage = 'Registration failed. Please try again later.';
      try {
        errorData = await backendResponse.json();
        if (errorData) {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } catch (e) {
        console.error('Could not parse error response from backend as JSON:', e);
        errorMessage = `Registration failed. Backend responded with: ${backendResponse.status} ${backendResponse.statusText}`;
      }
      return NextResponse.json(
        { message: errorMessage },
        { status: backendResponse.status }
      );
    }

    const responseBody = await backendResponse.json();
    return NextResponse.json(responseBody, { status: backendResponse.status || 201 });

  } catch (error) {
    console.error('Register API error:', error);
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return NextResponse.json({ message: 'Could not connect to registration service.' }, { status: 503 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during registration.' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Missing username or password' }, { status: 400 });
    }

    const goBackendBaseUrl = process.env.GO_BACKEND_BASE_URL;
    if (!goBackendBaseUrl) {
      console.error('GO_BACKEND_BASE_URL environment variable is not set.');
      return NextResponse.json({ message: 'Application configuration error: Backend URL not set.' }, { status: 500 });
    }
    // Corrected default path
    const loginPath = process.env.GO_BACKEND_LOGIN_PATH || '/api/auth/login';
    const backendLoginUrl = `${goBackendBaseUrl}${loginPath}`;

    const backendResponse = await fetch(backendLoginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    // Check if the response is OK before trying to parse the body
    if (!backendResponse.ok) {
      let errorData;
      try {
        // Attempt to parse error response if backend sends JSON errors
        errorData = await backendResponse.json();
      } catch (e) {
        // If parsing fails, it means the error response wasn't JSON (e.g., plain text 404 from incorrect path)
        console.error('Could not parse error response from backend as JSON:', e);
        // Return a generic error message based on status, or the raw statusText
        return NextResponse.json(
          { message: `Login failed. Backend responded with: ${backendResponse.status} ${backendResponse.statusText}` },
          { status: backendResponse.status }
        );
      }
      // Use message from backend if available and parsed, otherwise a generic one
      return NextResponse.json(
        { message: errorData.message || 'Login failed. Please check your credentials or try again later.' },
        { status: backendResponse.status }
      );
    }

    // If response is OK, then parse the JSON body
    const responseBody = await backendResponse.json();

    const token = responseBody.token;
    const user = responseBody.user;

    if (!token) {
      console.error('Token not found in backend response:', responseBody);
      return NextResponse.json({ message: 'Login successful, but token was not provided by backend.' }, { status: 500 });
    }

    const response = NextResponse.json({
      message: 'Login successful',
      user: user, // Send user data back to the client
    }, { status: 200 });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax', // Recommended for security
    });

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    // Check if it's a fetch error (e.g. backend not reachable)
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        return NextResponse.json({ message: 'Could not connect to authentication service.' }, { status: 503 }); // Service Unavailable
    }
    return NextResponse.json({ message: 'An unexpected error occurred during login.' }, { status: 500 });
  }
}
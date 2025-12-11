import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const expectedToken = process.env.DASHBOARD_ADMIN_TOKEN;

  if (token === expectedToken) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('dashboard_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
    });
    return response;
  }

  return NextResponse.json(
    { error: 'Invalid token' },
    { status: 401 }
  );
}

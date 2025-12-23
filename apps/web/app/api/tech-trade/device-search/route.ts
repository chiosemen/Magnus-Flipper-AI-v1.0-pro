import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: "disabled",
      reason: "tech-trade-core temporarily quarantined",
    },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      status: "disabled",
      reason: "tech-trade-core temporarily quarantined",
    },
    { status: 503 }
  );
}

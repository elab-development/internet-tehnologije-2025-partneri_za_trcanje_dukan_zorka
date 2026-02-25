import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

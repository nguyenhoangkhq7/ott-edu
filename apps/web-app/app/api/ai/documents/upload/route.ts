import { NextRequest, NextResponse } from 'next/server';

/**
 * AI_SERVICE_INTERNAL_URL:
 *  - Docker: set to http://ai-service:8080 via docker-compose environment
 *  - Local dev: falls back to http://localhost:8082 (AI_PORT default from .env)
 */
const AI_INTERNAL = process.env.AI_SERVICE_INTERNAL_URL ?? 'http://localhost:8082';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Forward the Authorization header if present
    const authHeader = req.headers.get('authorization') ?? '';

    const upstreamRes = await fetch(`${AI_INTERNAL}/api/ai/documents/upload`, {
      method: 'POST',
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: formData,
    });

    const body = await upstreamRes.text();

    return new NextResponse(body, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': upstreamRes.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err: unknown) {
    console.error('[AI Upload Proxy]', err);
    return NextResponse.json(
      { message: 'AI service không khả dụng. Vui lòng thử lại.' },
      { status: 502 }
    );
  }
}

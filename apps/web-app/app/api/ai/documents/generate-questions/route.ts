import { NextRequest } from 'next/server';

/**
 * AI_SERVICE_INTERNAL_URL:
 *  - Docker: set to http://ai-service:8080 via docker-compose environment
 *  - Local dev: falls back to http://localhost:8082 (AI_PORT default from .env)
 */
const AI_INTERNAL = process.env.AI_SERVICE_INTERNAL_URL ?? 'http://localhost:8082';

/**
 * POST /api/ai/documents/generate-questions
 *
 * Streams Server-Sent Events (SSE) from the AI service back to the browser.
 * Next.js rewrites cannot stream SSE — they buffer the full response.
 * This route handler pipes the ReadableStream directly so the client receives
 * events in real-time without buffering.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization') ?? '';

    const upstreamRes = await fetch(
      `${AI_INTERNAL}/api/ai/documents/generate-questions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(authHeader ? { authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      }
    );

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return new Response(errText, { status: upstreamRes.status });
    }

    // Pipe the upstream body directly — no buffering, true streaming
    const { readable, writable } = new TransformStream();
    upstreamRes.body!.pipeTo(writable);

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no', // Disable nginx buffering if behind nginx
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('[AI Generate Proxy]', err);
    // Emit an SSE error event so the client-side handler catches it gracefully
    const errorPayload = `event: error\ndata: ${JSON.stringify({
      message: 'AI service không khả dụng. Vui lòng thử lại sau.',
    })}\n\n`;
    return new Response(errorPayload, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  }
}

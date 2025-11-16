import { NextRequest, NextResponse } from 'next/server';
import { getResearchRun } from '@/lib/research-store';
import { cacheGet } from '@/lib/redis';

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  const { runId } = params;

  // Check cache first
  const cached = await cacheGet(`research:${runId}:payload`);
  if (cached) {
    return NextResponse.json(cached);
  }

  const run = await getResearchRun(runId);

  if (!run || !run.payload) {
    return NextResponse.json({ error: 'Payload not available' }, { status: 404 });
  }

  return NextResponse.json(run.payload);
}

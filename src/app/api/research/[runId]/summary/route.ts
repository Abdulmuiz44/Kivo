import { NextRequest, NextResponse } from 'next/server';
import { researchRuns } from '@/lib/research-store';
import { cacheGet } from '@/lib/redis';

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  const { runId } = params;

  // Check cache first
  const cached = await cacheGet(`research:${runId}:summary`);
  if (cached) {
    return NextResponse.json(cached);
  }

  const run = researchRuns.get(runId);

  if (!run || !run.summary) {
    return NextResponse.json({ error: 'Summary not available' }, { status: 404 });
  }

  return NextResponse.json(run.summary);
}

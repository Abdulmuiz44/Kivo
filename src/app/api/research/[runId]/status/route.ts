import { NextRequest, NextResponse } from 'next/server';
import { researchRuns } from '@/lib/research-store';
import { cacheGet } from '@/lib/redis';

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  const { runId } = params;

  // Check cache first
  const cached = await cacheGet(`research:${runId}:status`);
  if (cached) {
    return NextResponse.json(cached);
  }

  const run = researchRuns.get(runId);

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const status = {
    runId,
    status: run.status,
    progress: run.progress,
    message: run.message,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
  };

  return NextResponse.json(status);
}

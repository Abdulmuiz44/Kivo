import { NextRequest, NextResponse } from 'next/server';
import { researchRuns } from '@/lib/research-store';
import Papa from 'papaparse';

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  const { runId } = params;
  const run = researchRuns.get(runId);

  if (!run || !run.payload) {
    return NextResponse.json({ error: 'Payload not available' }, { status: 404 });
  }

  try {
    const payload = run.payload;
    const data = payload.items.map((item: any) => ({
      id: item.id,
      text: item.text,
      source: item.source,
      author: item.author,
      sentiment: item.sentiment,
      createdAt: item.createdAt,
      keywords: item.keywords.join('; '),
    }));

    const csv = Papa.unparse(data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="research-${runId}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 });
  }
}

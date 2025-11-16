import { NextRequest, NextResponse } from 'next/server';
import { researchRuns } from '@/lib/research-store';
import jsPDF from 'jspdf';

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  const { runId } = params;
  const run = researchRuns.get(runId);

  if (!run || !run.payload) {
    return NextResponse.json({ error: 'Payload not available' }, { status: 404 });
  }

  try {
    const doc = new jsPDF();
    const payload = run.payload;

    doc.setFontSize(20);
    doc.text(`Research Report: ${payload.topic}`, 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date(payload.createdAt).toLocaleString()}`, 20, 30);
    doc.text(`Total Items: ${payload.items.length}`, 20, 40);
    doc.text(`Clusters: ${payload.clusters.length}`, 20, 50);

    doc.setFontSize(16);
    doc.text('Top Pain Points:', 20, 70);
    doc.setFontSize(10);
    let yPos = 80;
    payload.summary.topPainPoints.forEach((point: string, idx: number) => {
      const lines = doc.splitTextToSize(`${idx + 1}. ${point}`, 170);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 5 + 5;
    });

    const pdfData = doc.output('arraybuffer');

    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="research-${runId}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

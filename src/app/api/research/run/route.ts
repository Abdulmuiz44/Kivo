import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from '@/lib/uuid';
import { ResearchRequestSchema } from '@/types/research';
import type { ResearchRequest, ResearchItem, ResearchPayload } from '@/types/research';
import {
  cleanText,
  tokenize,
  extractKeywords,
  computeSentiment,
  deduplicateItems,
  clusterItems,
  generateSummary,
} from '@/lib/research-pipeline';
import { cacheSet } from '@/lib/redis';
import { rateLimit } from '@/lib/middleware';
import { researchRuns } from '@/lib/research-store';

export async function POST(request: NextRequest) {
  // Rate limiting
  if (!rateLimit(request, 10, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const validatedRequest = ResearchRequestSchema.parse(body);

    const runId = uuidv4();
    const now = new Date().toISOString();

    researchRuns.set(runId, {
      request: validatedRequest,
      status: 'queued',
      progress: 0,
      createdAt: now,
    });

    // Start background processing
    processResearch(runId, validatedRequest);

    return NextResponse.json(
      {
        runId,
        status: 'queued',
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

async function processResearch(runId: string, request: ResearchRequest) {
  const run = researchRuns.get(runId);
  if (!run) return;

  try {
    run.status = 'running';
    run.startedAt = new Date().toISOString();
    run.progress = 10;

    // Simulate data collection (in production, call Reddit/X APIs)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run.progress = 30;

    // Generate mock data
    const mockData: ResearchItem[] = generateMockData(request);
    run.progress = 50;

    // Process items
    const processedItems = mockData.map((item) => ({
      ...item,
      cleanText: cleanText(item.text),
      sentiment: computeSentiment(item.text),
      keywords: extractKeywords(tokenize(item.text)),
    }));

    run.progress = 70;

    // Deduplicate
    const uniqueItems = deduplicateItems(processedItems);

    // Cluster
    const clusters = clusterItems(uniqueItems, 5);

    run.progress = 90;

    // Generate summary
    const summary = generateSummary(uniqueItems, clusters);

    const payload: ResearchPayload = {
      runId,
      topic: request.topic,
      sources: request.sources,
      queryTerms: request.queryTerms,
      dateRange: request.dateRange,
      createdAt: run.createdAt,
      items: uniqueItems,
      clusters,
      summary,
    };

    run.status = 'completed';
    run.progress = 100;
    run.finishedAt = new Date().toISOString();
    run.summary = {
      totalItems: uniqueItems.length,
      painPoints: summary.topPainPoints,
      recommendations: summary.recommendedActions,
      topKeywords: [], // Keywords are already in payload
    };
    run.payload = payload;

    // Cache results
    await cacheSet(`research:${runId}`, run, 3600);
  } catch (error: unknown) {
    run.status = 'failed';
    run.message = error instanceof Error ? error.message : 'Processing failed';
  }
}

function generateMockData(request: ResearchRequest): ResearchItem[] {
  const items: ResearchItem[] = [];
  const mockTexts = [
    'Having serious issues with the payment system. It keeps failing randomly.',
    'The new feature is absolutely amazing! Love how easy it is to use.',
    'Customer support took forever to respond. Very disappointed.',
    'Great product overall, but the UI could use some improvements.',
    'Found a critical bug that affects data exports. Please fix ASAP.',
    'This has transformed how we work. Highly recommended!',
    'Pricing seems a bit high compared to competitors.',
    'The mobile app crashes frequently on Android devices.',
    'Best tool I have used for this purpose. Worth every penny.',
    'Documentation is lacking. Spent hours figuring things out.',
  ];

  for (let i = 0; i < 20; i++) {
    const text = mockTexts[i % mockTexts.length];
    const sourceIndex = i % request.sources.length;
    items.push({
      id: uuidv4(),
      text,
      cleanText: cleanText(text),
      source: request.sources[sourceIndex],
      author: `user${i + 1}`,
      url: `https://example.com/post/${i + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: 0,
      engagement: Math.floor(Math.random() * 1000),
      keywords: [],
    });
  }

  return items;
}

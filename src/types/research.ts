import { z } from 'zod';

export const ResearchRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  sources: z.array(z.enum(['reddit', 'x'])),
  queryTerms: z.array(z.string()).min(1, 'At least one query term is required'),
  dateRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  filters: z
    .object({
      sentiment: z.enum(['positive', 'negative', 'neutral', 'all']).optional(),
      minEngagement: z.number().optional(),
    })
    .optional(),
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export interface ResearchItem {
  id: string;
  text: string;
  cleanText: string;
  source: string;
  author: string;
  url?: string;
  createdAt: string;
  sentiment: number;
  engagement?: number;
  keywords: string[];
}

export interface ResearchCluster {
  id: string;
  label: string;
  items: ResearchItem[];
  avgSentiment: number;
  size: number;
}

export interface ResearchSummary {
  topPainPoints: string[];
  recommendedActions: string[];
  productHypotheses: string[];
  topSources: string[];
  sentimentOverview: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface ResearchPayload {
  runId: string;
  topic: string;
  sources: string[];
  queryTerms: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  createdAt: string;
  items: ResearchItem[];
  clusters: ResearchCluster[];
  summary: ResearchSummary;
}

export interface ResearchRunStatus {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

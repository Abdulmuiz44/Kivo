import type { ResearchRequest, ResearchPayload } from '@/types/research';

// In-memory store for research runs (replace with database in production)
export const researchRuns = new Map<
  string,
  {
    request: ResearchRequest;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
    message?: string;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
    summary?: {
      totalItems: number;
      painPoints: string[];
      recommendations: string[];
      topKeywords: { keyword: string; frequency: number }[];
    };
    payload?: ResearchPayload;
  }
>();

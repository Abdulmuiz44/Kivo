import type { ResearchRequest, ResearchItem, ResearchPayload } from '@/types/research';

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
    summary?: any;
    payload?: ResearchPayload;
  }
>();

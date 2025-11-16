import { ResearchRunsService } from './mongodb-service';
import type { ResearchRequest, ResearchPayload } from '@/types/research';

// This file now provides a facade over MongoDB operations
// Keeping the same interface for minimal disruption to existing code

export interface ResearchRun {
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

// Legacy in-memory map for backward compatibility (will be deprecated)
export const researchRuns = new Map<string, ResearchRun>();

// MongoDB-backed functions
export async function getResearchRun(runId: string): Promise<ResearchRun | null> {
  // First check in-memory cache
  if (researchRuns.has(runId)) {
    return researchRuns.get(runId)!;
  }

  // Then check MongoDB
  const doc = await ResearchRunsService.findByRunId(runId);
  if (!doc) return null;

  // Convert MongoDB document to ResearchRun format
  const run: ResearchRun = {
    request: doc.request,
    status: doc.status,
    progress: doc.progress,
    message: doc.message,
    createdAt: doc.createdAt.toISOString(),
    startedAt: doc.startedAt?.toISOString(),
    finishedAt: doc.finishedAt?.toISOString(),
    summary: doc.summary,
    payload: doc.payload,
  };

  // Cache in memory
  researchRuns.set(runId, run);
  return run;
}

export async function setResearchRun(runId: string, data: ResearchRun): Promise<void> {
  // Update in-memory cache
  researchRuns.set(runId, data);

  // Update in MongoDB
  const existing = await ResearchRunsService.findByRunId(runId);
  if (!existing) {
    // Create new
    await ResearchRunsService.create(runId, data.request);
  }

  // Update status and progress
  await ResearchRunsService.updateStatus(runId, data.status, data.progress, data.message);

  // If completed, save results
  if (data.status === 'completed' && data.summary && data.payload) {
    await ResearchRunsService.saveResults(runId, data.summary, data.payload);
  }
}

export async function deleteResearchRun(runId: string): Promise<boolean> {
  // Remove from in-memory cache
  researchRuns.delete(runId);

  // Remove from MongoDB
  return await ResearchRunsService.deleteByRunId(runId);
}

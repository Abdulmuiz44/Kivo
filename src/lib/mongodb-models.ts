import { ObjectId } from 'mongodb';
import type {
  ResearchRequest,
  ResearchItem,
  ResearchPayload,
  ResearchSummary,
} from '@/types/research';

// MongoDB Document Interfaces
export interface UserDocument {
  _id?: ObjectId;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchRunDocument {
  _id?: ObjectId;
  runId: string; // UUID for public reference
  userId?: ObjectId; // Reference to user (optional for now)
  request: ResearchRequest;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  summary?: {
    totalItems: number;
    painPoints: string[];
    recommendations: string[];
    topKeywords: { keyword: string; frequency: number }[];
  };
  payload?: ResearchPayload;
}

export interface ProjectDocument {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  researchRuns: string[]; // Array of runIds
  createdAt: Date;
  updatedAt: Date;
}

// Collection names
export const Collections = {
  USERS: 'users',
  RESEARCH_RUNS: 'research_runs',
  PROJECTS: 'projects',
} as const;

// Index definitions
export const indexes = {
  users: [{ key: { email: 1 }, unique: true }, { key: { createdAt: -1 } }],
  research_runs: [
    { key: { runId: 1 }, unique: true },
    { key: { userId: 1, createdAt: -1 } },
    { key: { status: 1, createdAt: -1 } },
    { key: { createdAt: -1 } },
    // TTL index to auto-delete old runs after 30 days
    { key: { createdAt: 1 }, expireAfterSeconds: 2592000 },
  ],
  projects: [{ key: { userId: 1, createdAt: -1 } }, { key: { createdAt: -1 } }],
};

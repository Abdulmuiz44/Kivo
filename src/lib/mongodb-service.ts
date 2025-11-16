import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import {
  Collections,
  type ResearchRunDocument,
  type UserDocument,
  type ProjectDocument,
} from './mongodb-models';
import type { ResearchRequest, ResearchPayload } from '@/types/research';

// Research Runs Service
export class ResearchRunsService {
  private static async getCollection(): Promise<Collection<ResearchRunDocument>> {
    const db = await getDatabase();
    return db.collection<ResearchRunDocument>(Collections.RESEARCH_RUNS);
  }

  static async create(
    runId: string,
    request: ResearchRequest,
    userId?: string
  ): Promise<ResearchRunDocument> {
    const collection = await this.getCollection();
    const doc: ResearchRunDocument = {
      runId,
      userId: userId ? new ObjectId(userId) : undefined,
      request,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  static async findByRunId(runId: string): Promise<ResearchRunDocument | null> {
    const collection = await this.getCollection();
    return collection.findOne({ runId });
  }

  static async updateStatus(
    runId: string,
    status: ResearchRunDocument['status'],
    progress: number,
    message?: string
  ): Promise<void> {
    const collection = await this.getCollection();
    const update: Partial<ResearchRunDocument> = {
      status,
      progress,
      message,
    };

    if (status === 'running' && !message) {
      update.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      update.finishedAt = new Date();
    }

    await collection.updateOne({ runId }, { $set: update });
  }

  static async saveResults(
    runId: string,
    summary: ResearchRunDocument['summary'],
    payload: ResearchPayload
  ): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { runId },
      {
        $set: {
          status: 'completed',
          progress: 100,
          finishedAt: new Date(),
          summary,
          payload,
        },
      }
    );
  }

  static async findByUserId(userId: string, limit: number = 20): Promise<ResearchRunDocument[]> {
    const collection = await this.getCollection();
    return collection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async findRecent(limit: number = 10): Promise<ResearchRunDocument[]> {
    const collection = await this.getCollection();
    return collection.find().sort({ createdAt: -1 }).limit(limit).toArray();
  }

  static async deleteByRunId(runId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ runId });
    return result.deletedCount > 0;
  }
}

// Users Service
export class UsersService {
  private static async getCollection(): Promise<Collection<UserDocument>> {
    const db = await getDatabase();
    return db.collection<UserDocument>(Collections.USERS);
  }

  static async create(email: string, name?: string): Promise<UserDocument> {
    const collection = await this.getCollection();
    const doc: UserDocument = {
      email,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  static async findByEmail(email: string): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return collection.findOne({ email });
  }

  static async findById(id: string): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  static async update(id: string, updates: Partial<UserDocument>): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
  }
}

// Projects Service
export class ProjectsService {
  private static async getCollection(): Promise<Collection<ProjectDocument>> {
    const db = await getDatabase();
    return db.collection<ProjectDocument>(Collections.PROJECTS);
  }

  static async create(
    userId: string,
    name: string,
    description?: string
  ): Promise<ProjectDocument> {
    const collection = await this.getCollection();
    const doc: ProjectDocument = {
      userId: new ObjectId(userId),
      name,
      description,
      researchRuns: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  static async findByUserId(userId: string): Promise<ProjectDocument[]> {
    const collection = await this.getCollection();
    return collection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async findById(id: string): Promise<ProjectDocument | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  static async addResearchRun(projectId: string, runId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(projectId) },
      { $push: { researchRuns: runId }, $set: { updatedAt: new Date() } }
    );
  }

  static async removeResearchRun(projectId: string, runId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(projectId) },
      { $pull: { researchRuns: runId }, $set: { updatedAt: new Date() } }
    );
  }

  static async update(
    id: string,
    updates: Partial<Pick<ProjectDocument, 'name' | 'description'>>
  ): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

// Initialize indexes on startup
export async function initializeIndexes(): Promise<void> {
  const db = await getDatabase();

  // Users indexes
  await db.collection(Collections.USERS).createIndex({ email: 1 }, { unique: true });
  await db.collection(Collections.USERS).createIndex({ createdAt: -1 });

  // Research runs indexes
  await db.collection(Collections.RESEARCH_RUNS).createIndex({ runId: 1 }, { unique: true });
  await db.collection(Collections.RESEARCH_RUNS).createIndex({ userId: 1, createdAt: -1 });
  await db.collection(Collections.RESEARCH_RUNS).createIndex({ status: 1, createdAt: -1 });
  await db
    .collection(Collections.RESEARCH_RUNS)
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

  // Projects indexes
  await db.collection(Collections.PROJECTS).createIndex({ userId: 1, createdAt: -1 });
  await db.collection(Collections.PROJECTS).createIndex({ createdAt: -1 });

  console.log('✅ MongoDB indexes initialized');
}

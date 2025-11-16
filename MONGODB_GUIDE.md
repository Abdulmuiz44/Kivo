# MongoDB Integration Guide for Next.js with TypeScript

## 1. Connection Setup

### Install Dependencies

```bash
npm install mongodb
# or
pnpm add mongodb
```

### Connection Setup (`lib/mongodb.ts`)

```typescript
import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection
  // across module reloads caused by HMR (Hot Module Replacement)
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client for each connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
```

## 2. Connection String Format

### MongoDB Atlas (Cloud)

```bash
# .env.local
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Local MongoDB

```bash
# .env.local
MONGODB_URI=mongodb://localhost:27017/<database>
```

### Connection String Parameters (Best Practices)

```
mongodb+srv://user:pass@cluster.mongodb.net/mydb?
  retryWrites=true              # Automatically retry failed writes
  &w=majority                   # Write concern: majority of nodes acknowledge
  &maxPoolSize=10               # Max connections in pool (default: 100)
  &minPoolSize=2                # Min connections in pool
  &maxIdleTimeMS=60000          # Close idle connections after 60s
  &serverSelectionTimeoutMS=5000 # Timeout for server selection
  &socketTimeoutMS=45000        # Socket timeout
```

## 3. Schema Design Patterns with TypeScript

### Type Definitions (`types/mongodb.ts`)

```typescript
import { ObjectId } from 'mongodb';

// Base interface for all documents
export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User schema
export interface User extends BaseDocument {
  email: string;
  name: string;
  passwordHash: string;
  role: 'user' | 'admin';
  profile?: {
    avatar?: string;
    bio?: string;
  };
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
  };
}

// Project schema (embedded documents pattern)
export interface Project extends BaseDocument {
  userId: ObjectId; // Reference to User
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  tags: string[];
  metadata: {
    views: number;
    likes: number;
  };
  // Embedded tasks instead of separate collection
  tasks?: Task[];
}

export interface Task {
  _id: ObjectId;
  title: string;
  completed: boolean;
  dueDate?: Date;
}

// Research Run schema (for your app)
export interface ResearchRun extends BaseDocument {
  userId: ObjectId;
  projectId: ObjectId;
  query: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: {
    summary: string;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
    sources: Array<{
      title: string;
      url: string;
      relevance: number;
    }>;
  };
  error?: string;
}
```

### Database Helper (`lib/mongodb-helpers.ts`)

```typescript
import { Db, Collection } from 'mongodb';
import clientPromise from './mongodb';

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DATABASE || 'kivo');
}

export async function getCollection<T>(collectionName: string): Promise<Collection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

// Collection names enum for type safety
export enum Collections {
  Users = 'users',
  Projects = 'projects',
  ResearchRuns = 'research_runs',
  Sessions = 'sessions',
}
```

## 4. CRUD Operations with TypeScript

### Create Operations

```typescript
import { ObjectId } from 'mongodb';
import { getCollection, Collections } from '@/lib/mongodb-helpers';
import { User, Project } from '@/types/mongodb';

// Create a single document
export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
  const collection = await getCollection<User>(Collections.Users);

  const user: Omit<User, '_id'> = {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(user as User);
  return {
    ...user,
    _id: result.insertedId,
  };
}

// Create multiple documents
export async function createProjects(projects: Omit<Project, '_id' | 'createdAt' | 'updatedAt'>[]) {
  const collection = await getCollection<Project>(Collections.Projects);

  const projectsWithTimestamps = projects.map((p) => ({
    ...p,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const result = await collection.insertMany(projectsWithTimestamps as Project[]);
  return result.insertedIds;
}
```

### Read Operations

```typescript
// Find single document
export async function getUserById(userId: string) {
  const collection = await getCollection<User>(Collections.Users);
  return await collection.findOne({ _id: new ObjectId(userId) });
}

export async function getUserByEmail(email: string) {
  const collection = await getCollection<User>(Collections.Users);
  return await collection.findOne({ email: email.toLowerCase() });
}

// Find multiple documents with filters
export async function getProjectsByUser(userId: string, status?: string) {
  const collection = await getCollection<Project>(Collections.Projects);

  const filter: any = { userId: new ObjectId(userId) };
  if (status) {
    filter.status = status;
  }

  return await collection.find(filter).sort({ createdAt: -1 }).limit(50).toArray();
}

// Pagination
export async function getProjectsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 10
) {
  const collection = await getCollection<Project>(Collections.Projects);
  const skip = (page - 1) * pageSize;

  const [projects, total] = await Promise.all([
    collection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments({ userId: new ObjectId(userId) }),
  ]);

  return {
    projects,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Aggregation pipeline
export async function getUserProjectStats(userId: string) {
  const collection = await getCollection<Project>(Collections.Projects);

  return await collection
    .aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$metadata.views' },
          totalLikes: { $sum: '$metadata.likes' },
        },
      },
    ])
    .toArray();
}
```

### Update Operations

```typescript
// Update single document
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, '_id' | 'createdAt'>>
) {
  const collection = await getCollection<Project>(Collections.Projects);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(projectId) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' } // Return updated document
  );

  return result.value;
}

// Update multiple documents
export async function archiveOldProjects(daysOld: number) {
  const collection = await getCollection<Project>(Collections.Projects);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await collection.updateMany(
    {
      status: 'completed',
      updatedAt: { $lt: cutoffDate },
    },
    {
      $set: {
        status: 'archived',
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
}

// Increment values
export async function incrementProjectViews(projectId: string) {
  const collection = await getCollection<Project>(Collections.Projects);

  return await collection.findOneAndUpdate(
    { _id: new ObjectId(projectId) },
    {
      $inc: { 'metadata.views': 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );
}

// Add to array
export async function addTagToProject(projectId: string, tag: string) {
  const collection = await getCollection<Project>(Collections.Projects);

  return await collection.updateOne(
    { _id: new ObjectId(projectId) },
    {
      $addToSet: { tags: tag }, // Only adds if not already present
      $set: { updatedAt: new Date() },
    }
  );
}
```

### Delete Operations

```typescript
// Soft delete (recommended)
export async function softDeleteProject(projectId: string) {
  const collection = await getCollection<Project>(Collections.Projects);

  return await collection.updateOne(
    { _id: new ObjectId(projectId) },
    {
      $set: {
        status: 'archived',
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
}

// Hard delete
export async function deleteProject(projectId: string) {
  const collection = await getCollection<Project>(Collections.Projects);

  const result = await collection.deleteOne({ _id: new ObjectId(projectId) });
  return result.deletedCount > 0;
}

// Delete multiple
export async function deleteUserProjects(userId: string) {
  const collection = await getCollection<Project>(Collections.Projects);

  const result = await collection.deleteMany({ userId: new ObjectId(userId) });
  return result.deletedCount;
}
```

## 5. Indexing Strategies

### Create Indexes (`lib/mongodb-indexes.ts`)

```typescript
import { getCollection, Collections } from './mongodb-helpers';

export async function createIndexes() {
  // Users collection
  const users = await getCollection(Collections.Users);
  await users.createIndexes([
    { key: { email: 1 }, unique: true }, // Unique index on email
    { key: { createdAt: -1 } }, // Sort by creation date
    { key: { 'profile.bio': 'text' } }, // Full-text search on bio
  ]);

  // Projects collection
  const projects = await getCollection(Collections.Projects);
  await projects.createIndexes([
    { key: { userId: 1, status: 1 } }, // Compound index for user queries
    { key: { createdAt: -1 } }, // Sort by date
    { key: { tags: 1 } }, // Array index for tag queries
    { key: { 'metadata.views': -1 } }, // Sort by popularity
    { key: { title: 'text', description: 'text' } }, // Full-text search
  ]);

  // Research runs collection
  const researchRuns = await getCollection(Collections.ResearchRuns);
  await researchRuns.createIndexes([
    { key: { userId: 1, createdAt: -1 } }, // User's recent runs
    { key: { status: 1 } }, // Filter by status
    { key: { projectId: 1 } }, // Project's runs
    // TTL index: auto-delete after 90 days
    { key: { createdAt: 1 }, expireAfterSeconds: 7776000 },
  ]);

  console.log('Indexes created successfully');
}

// Call this during app initialization or as a migration
```

### Index Best Practices

```typescript
// 1. ESR Rule: Equality, Sort, Range
// Good: { userId: 1, status: 1, createdAt: -1 }
// For query: find({ userId: X, status: Y }).sort({ createdAt: -1 })

// 2. Compound index order matters
await collection.createIndex({ userId: 1, createdAt: -1 });
// Supports: { userId: X }, { userId: X, createdAt: Y }
// Does NOT support: { createdAt: Y }

// 3. Use projection to limit returned fields
const result = await collection.findOne(
  { _id: new ObjectId(id) },
  { projection: { passwordHash: 0 } } // Exclude sensitive data
);

// 4. Use explain() to analyze query performance
const explanation = await collection
  .find({ userId: new ObjectId(userId) })
  .explain('executionStats');
console.log('Documents examined:', explanation.executionStats.totalDocsExamined);
```

## 6. Error Handling & Connection Management

### Error Handler Wrapper

```typescript
import { MongoError } from 'mongodb';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof MongoError) {
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        throw new DatabaseError('Duplicate key error', error);
      }
      if (error.code === 121) {
        throw new DatabaseError('Document validation failed', error);
      }
    }

    console.error(`${errorMessage}:`, error);
    throw new DatabaseError(errorMessage, error as Error);
  }
}

// Usage
export async function createUserSafely(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
  return withErrorHandling(async () => await createUser(userData), 'Failed to create user');
}
```

### Connection Health Check

```typescript
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Health check API route
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/mongodb-helpers';

export async function GET() {
  const isHealthy = await checkDatabaseConnection();

  if (isHealthy) {
    return NextResponse.json({ status: 'healthy', database: 'connected' });
  }

  return NextResponse.json({ status: 'unhealthy', database: 'disconnected' }, { status: 503 });
}
```

### Transaction Support

```typescript
import { ClientSession } from 'mongodb';
import clientPromise from './mongodb';

export async function transferProjectOwnership(
  projectId: string,
  fromUserId: string,
  toUserId: string
) {
  const client = await clientPromise;
  const session: ClientSession = client.startSession();

  try {
    await session.withTransaction(async () => {
      const projects = await getCollection<Project>(Collections.Projects);
      const users = await getCollection<User>(Collections.Users);

      // Update project owner
      await projects.updateOne(
        { _id: new ObjectId(projectId), userId: new ObjectId(fromUserId) },
        { $set: { userId: new ObjectId(toUserId), updatedAt: new Date() } },
        { session }
      );

      // Update user stats (example)
      await users.updateOne(
        { _id: new ObjectId(fromUserId) },
        { $inc: { 'stats.projectCount': -1 } },
        { session }
      );

      await users.updateOne(
        { _id: new ObjectId(toUserId) },
        { $inc: { 'stats.projectCount': 1 } },
        { session }
      );
    });

    return { success: true };
  } catch (error) {
    console.error('Transaction failed:', error);
    throw new DatabaseError('Failed to transfer project ownership', error as Error);
  } finally {
    await session.endSession();
  }
}
```

## 7. Environment Variables

### `.env.local`

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=kivo

# Optional: Connection pool settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2

# For local development
# MONGODB_URI=mongodb://localhost:27017/
```

### Configuration Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  MONGODB_DATABASE: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
```

## 8. Next.js API Route Example

### API Route with MongoDB (`app/api/projects/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCollection, Collections } from '@/lib/mongodb-helpers';
import { Project } from '@/types/mongodb';
import { ObjectId } from 'mongodb';

// GET: List projects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const collection = await getCollection<Project>(Collections.Projects);

    const filter: any = { userId: new ObjectId(userId) };
    if (status) filter.status = status;

    const projects = await collection.find(filter).sort({ createdAt: -1 }).limit(50).toArray();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST: Create project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, tags } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
    }

    const collection = await getCollection<Project>(Collections.Projects);

    const project: Omit<Project, '_id'> = {
      userId: new ObjectId(userId),
      title,
      description: description || '',
      status: 'active',
      tags: tags || [],
      metadata: { views: 0, likes: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(project as Project);

    return NextResponse.json(
      {
        project: { ...project, _id: result.insertedId },
        message: 'Project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
```

## 9. Best Practices for Production

### 1. Connection Pooling

```typescript
// Already implemented in lib/mongodb.ts
// Default pool size: 100 connections
// Adjust based on your needs:
const options = {
  maxPoolSize: 10, // Max 10 concurrent connections
  minPoolSize: 2, // Keep 2 connections warm
  maxIdleTimeMS: 60000, // Close idle connections after 60s
};
```

### 2. Query Optimization

```typescript
// ✅ Good: Use projection to limit fields
const user = await collection.findOne(
  { _id: userId },
  { projection: { name: 1, email: 1, _id: 1 } }
);

// ❌ Bad: Fetching all fields when you only need a few
const user = await collection.findOne({ _id: userId });

// ✅ Good: Use indexes for filters
await collection.find({ userId: new ObjectId(id), status: 'active' });

// ❌ Bad: Querying without indexes
await collection.find({ 'profile.bio': { $regex: /search/ } });
```

### 3. Batch Operations

```typescript
// ✅ Good: Bulk write for multiple operations
const collection = await getCollection<Project>(Collections.Projects);
await collection.bulkWrite([
  { updateOne: { filter: { _id: id1 }, update: { $set: { status: 'completed' } } } },
  { updateOne: { filter: { _id: id2 }, update: { $inc: { 'metadata.views': 1 } } } },
  { deleteOne: { filter: { _id: id3 } } },
]);

// ❌ Bad: Multiple individual operations
await collection.updateOne({ _id: id1 }, { $set: { status: 'completed' } });
await collection.updateOne({ _id: id2 }, { $inc: { 'metadata.views': 1 } });
await collection.deleteOne({ _id: id3 });
```

### 4. Caching Strategy

```typescript
import { Redis } from '@/lib/redis'; // Your Redis client

export async function getProjectWithCache(projectId: string) {
  const cacheKey = `project:${projectId}`;

  // Try cache first
  const cached = await Redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from MongoDB
  const collection = await getCollection<Project>(Collections.Projects);
  const project = await collection.findOne({ _id: new ObjectId(projectId) });

  if (project) {
    // Cache for 5 minutes
    await Redis.setex(cacheKey, 300, JSON.stringify(project));
  }

  return project;
}
```

### 5. Data Validation

```typescript
import { z } from 'zod';

const ProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['active', 'completed', 'archived']),
  tags: z.array(z.string()).max(10),
});

export async function createProjectValidated(data: unknown) {
  const validated = ProjectSchema.parse(data);
  return await createProject(validated);
}
```

### 6. Monitoring & Logging

```typescript
import { performance } from 'perf_hooks';

export async function queryWithLogging<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    if (duration > 1000) {
      console.warn(`Slow query detected: ${operation} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    console.error(`Query failed: ${operation}`, error);
    throw error;
  }
}

// Usage
const projects = await queryWithLogging('getProjectsByUser', () =>
  collection.find({ userId }).toArray()
);
```

## 10. Key Differences from SQL/Supabase

### Schema Design

| Aspect             | MongoDB                          | Supabase (PostgreSQL)    |
| ------------------ | -------------------------------- | ------------------------ |
| **Schema**         | Flexible, schema-less            | Rigid, predefined schema |
| **Relationships**  | Embedded documents or references | Foreign keys with JOINs  |
| **Data Model**     | Document-oriented (JSON)         | Relational (tables/rows) |
| **Schema Changes** | No migration needed              | Requires migrations      |

### Data Modeling Patterns

#### MongoDB (Embedded)

```typescript
// One document contains everything
const userWithPosts = {
  _id: ObjectId('...'),
  name: 'John',
  email: 'john@example.com',
  posts: [
    { title: 'Post 1', content: '...' },
    { title: 'Post 2', content: '...' },
  ],
};
```

#### Supabase (Normalized)

```typescript
// Separate tables with foreign keys
const user = {
  id: 'uuid',
  name: 'John',
  email: 'john@example.com',
};

const posts = [
  { id: 'uuid', user_id: 'user-uuid', title: 'Post 1' },
  { id: 'uuid', user_id: 'user-uuid', title: 'Post 2' },
];
```

### Querying Comparison

#### MongoDB

```typescript
// Aggregation pipeline
const results = await collection
  .aggregate([
    { $match: { status: 'active' } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $group: { _id: '$user.email', total: { $sum: 1 } } },
  ])
  .toArray();
```

#### Supabase

```typescript
// SQL with joins
const { data } = await supabase.from('projects').select('*, users(*)').eq('status', 'active');
```

### When to Use MongoDB vs Supabase

**Choose MongoDB when:**

- Flexible/evolving schema requirements
- Hierarchical or nested data structures
- High write throughput needed
- Horizontal scaling is priority
- Document-centric data (JSON)

**Choose Supabase when:**

- Complex relationships and JOINs
- ACID transactions are critical
- Strong consistency required
- Existing SQL knowledge/tools
- Real-time subscriptions needed

### Migration Considerations

```typescript
// Converting from Supabase to MongoDB

// Supabase (normalized)
// users table: { id, name, email }
// projects table: { id, user_id, title }
// tasks table: { id, project_id, title }

// MongoDB (denormalized)
interface Project {
  _id: ObjectId;
  userId: ObjectId; // Reference if user data changes frequently
  title: string;
  tasks: Task[]; // Embed if tasks are always accessed with project
  user: {
    name: string; // Denormalize frequently accessed fields
    email: string;
  };
}
```

## Summary Checklist

✅ **Setup**

- Install `mongodb` package
- Configure `lib/mongodb.ts` with connection pooling
- Set `MONGODB_URI` in `.env.local`

✅ **Schema**

- Define TypeScript interfaces
- Use `ObjectId` for references
- Consider embed vs reference patterns

✅ **CRUD**

- Use typed collections
- Add timestamps (createdAt, updatedAt)
- Handle ObjectId conversion

✅ **Performance**

- Create appropriate indexes
- Use projection to limit fields
- Implement query result caching
- Monitor slow queries

✅ **Production**

- Enable connection pooling
- Implement error handling
- Use transactions for multi-doc operations
- Set up health checks
- Add query logging

✅ **Security**

- Never expose connection strings
- Use environment variables
- Validate input data
- Exclude sensitive fields in projections
- Use MongoDB Atlas IP whitelist

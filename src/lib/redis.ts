import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('Redis URL not configured. Caching disabled.');
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL);
      redis.on('error', (err) => {
        console.error('Redis error:', err);
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl = 3600): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

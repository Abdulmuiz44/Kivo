import Sentiment from 'sentiment';
import type { ResearchItem, ResearchCluster, ResearchSummary } from '@/types/research';

const sentiment = new Sentiment();

export function cleanText(text: string): string {
  let normalized = text || '';
  normalized = normalized.toLowerCase();
  normalized = normalized.replace(/https?:\/\/\S+/g, ' ');
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'the',
  'to',
  'we',
  'what',
  'when',
  'where',
  'who',
  'why',
  'with',
  'you',
  'your',
]);

export function tokenize(text: string): string[] {
  return cleanText(text)
    .split(' ')
    .filter((token) => token && !STOPWORDS.has(token));
}

export function extractKeywords(tokens: string[], maxKeywords = 5): string[] {
  const counts: Record<string, number> = {};
  tokens.forEach((token) => {
    counts[token] = (counts[token] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([token]) => token);
}

export function computeSentiment(text: string): number {
  if (!text) return 0;
  const result = sentiment.analyze(text);
  return result.score / Math.max(1, text.split(' ').length);
}

export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

export function deduplicateItems(items: ResearchItem[], threshold = 0.9): ResearchItem[] {
  const unique: ResearchItem[] = [];

  for (const candidate of items) {
    const candidateTokens = tokenize(candidate.cleanText);
    const isDuplicate = unique.some((existing) => {
      const existingTokens = tokenize(existing.cleanText);
      return jaccardSimilarity(candidateTokens, existingTokens) >= threshold;
    });

    if (!isDuplicate) {
      unique.push(candidate);
    }
  }

  return unique;
}

export function clusterItems(items: ResearchItem[], numClusters = 5): ResearchCluster[] {
  if (items.length === 0) return [];

  // Simple clustering based on keyword similarity
  const clusters: ResearchCluster[] = [];
  const assigned = new Set<string>();

  items.forEach((item) => {
    if (assigned.has(item.id)) return;

    const cluster: ResearchCluster = {
      id: `cluster-${clusters.length + 1}`,
      label: item.keywords[0] || 'General',
      items: [item],
      avgSentiment: item.sentiment,
      size: 1,
    };

    assigned.add(item.id);

    // Find similar items
    items.forEach((other) => {
      if (assigned.has(other.id)) return;
      const similarity = jaccardSimilarity(item.keywords, other.keywords);
      if (similarity > 0.3 && cluster.items.length < 20) {
        cluster.items.push(other);
        assigned.add(other.id);
      }
    });

    cluster.size = cluster.items.length;
    cluster.avgSentiment = cluster.items.reduce((sum, i) => sum + i.sentiment, 0) / cluster.size;

    clusters.push(cluster);
  });

  return clusters.slice(0, numClusters);
}

export function generateSummary(
  items: ResearchItem[],
  clusters: ResearchCluster[]
): ResearchSummary {
  const negativeBias = items
    .filter((i) => i.sentiment < -0.1)
    .sort((a, b) => a.sentiment - b.sentiment);

  const topPainPoints = negativeBias.slice(0, 5).map((item) => item.text.substring(0, 150) + '...');

  const recommendedActions = clusters.slice(0, 3).map((cluster) => {
    return `Address ${cluster.label} issues affecting ${cluster.size} mentions with avg sentiment ${cluster.avgSentiment.toFixed(2)}`;
  });

  const productHypotheses = clusters.slice(0, 3).map((cluster) => {
    return `Opportunity: Improve ${cluster.label} based on ${cluster.size} user mentions`;
  });

  const sourceCounts: Record<string, number> = {};
  items.forEach((item) => {
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  });

  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => `${source}: ${count}`);

  const positive = items.filter((i) => i.sentiment > 0.1).length;
  const negative = items.filter((i) => i.sentiment < -0.1).length;
  const neutral = items.length - positive - negative;

  return {
    topPainPoints,
    recommendedActions,
    productHypotheses,
    topSources,
    sentimentOverview: {
      positive,
      negative,
      neutral,
    },
  };
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SentimentChart from '@/components/SentimentChart';
import type { ResearchRunStatus, ResearchPayload } from '@/types/research';
import axios from 'axios';
import { ArrowLeft, Download, Share2 } from 'lucide-react';

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const [status, setStatus] = useState<ResearchRunStatus | null>(null);
  const [payload, setPayload] = useState<ResearchPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`/api/research/${runId}/status`);
        setStatus(response.data);

        if (response.data.status === 'completed') {
          const payloadResponse = await axios.get(`/api/research/${runId}/payload`);
          setPayload(payloadResponse.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch research data');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [runId]);

  const handleExportPDF = () => {
    window.open(`/api/research/${runId}/export/pdf`, '_blank');
  };

  const handleExportCSV = () => {
    window.open(`/api/research/${runId}/export/csv`, '_blank');
  };

  const handleShare = async (platform: 'slack' | 'discord') => {
    const webhookUrl = prompt(`Enter your ${platform} webhook URL:`);
    if (!webhookUrl) return;

    try {
      await axios.post('/api/integrations/webhook', {
        webhookUrl,
        data: payload,
        platform,
      });
      alert('Shared successfully!');
    } catch (err) {
      alert('Failed to share');
    }
  };

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => router.push('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button onClick={() => router.push('/')} variant="ghost" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-4xl font-bold">Research Report</h1>
            {status && <p className="text-muted-foreground">Status: {status.status}</p>}
          </div>

          {payload && (
            <div className="flex gap-2">
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button onClick={() => handleShare('slack')} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Slack
              </Button>
              <Button onClick={() => handleShare('discord')} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Discord
              </Button>
            </div>
          )}
        </div>

        {status && status.status !== 'completed' && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
                {status.message && (
                  <p className="text-sm text-muted-foreground">{status.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {payload && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{payload.items.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clusters Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{payload.clusters.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avg Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {(
                      payload.items.reduce((sum, item) => sum + item.sentiment, 0) /
                      payload.items.length
                    ).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>Visual breakdown of sentiment distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentChart data={payload} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pain Points</CardTitle>
                <CardDescription>Most critical issues identified</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {payload.summary.topPainPoints.map((point, idx) => (
                    <li key={idx} className="p-3 bg-muted rounded-md">
                      <span className="font-semibold">#{idx + 1}</span> {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {payload.summary.recommendedActions.map((action, idx) => (
                    <li key={idx} className="p-3 bg-muted rounded-md">
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clusters</CardTitle>
                <CardDescription>Grouped topics and discussions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payload.clusters.map((cluster) => (
                    <div key={cluster.id} className="p-4 border rounded-md">
                      <h4 className="font-semibold mb-2">
                        {cluster.label} ({cluster.size} items)
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Avg Sentiment: {cluster.avgSentiment.toFixed(2)}
                      </p>
                      <div className="space-y-2">
                        {cluster.items.slice(0, 3).map((item) => (
                          <p key={item.id} className="text-sm p-2 bg-muted rounded">
                            {item.text.substring(0, 100)}...
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

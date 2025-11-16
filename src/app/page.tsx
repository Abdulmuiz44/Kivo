'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ResearchForm from '@/components/ResearchForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResearchRequest } from '@/types/research';
import axios from 'axios';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResearchSubmit = async (request: ResearchRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/research/run', request);
      const { runId } = response.data;
      router.push(`/research/${runId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start research');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Kivo Research Assistant</h1>
          <p className="text-muted-foreground">
            Discover insights from Reddit and X to inform your product decisions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <ResearchForm onSubmit={handleResearchSubmit} />

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>Powered by advanced AI and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Real-time sentiment analysis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Automatic topic clustering</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Pain point identification</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Export to PDF, CSV, or integrations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>WebSocket real-time updates</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Redis caching for performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your recent research projects will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </main>
  );
}

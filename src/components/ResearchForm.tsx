'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResearchRequest } from '@/types/research';

interface ResearchFormProps {
  onSubmit: (request: ResearchRequest) => void;
}

export default function ResearchForm({ onSubmit }: ResearchFormProps) {
  const [topic, setTopic] = useState('');
  const [queryTerms, setQueryTerms] = useState('');
  const [sources, setSources] = useState<Array<'reddit' | 'x'>>(['reddit']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request: ResearchRequest = {
      topic,
      sources,
      queryTerms: queryTerms.split(',').map((t) => t.trim()),
    };
    onSubmit(request);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Research Project</CardTitle>
        <CardDescription>
          Define your research parameters to analyze social media insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <Input
              placeholder="e.g., freelancer invoicing issues"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Query Terms (comma-separated)</label>
            <Input
              placeholder="e.g., invoice problem, payment delay"
              value={queryTerms}
              onChange={(e) => setQueryTerms(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sources</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sources.includes('reddit')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSources([...sources, 'reddit']);
                    } else {
                      setSources(sources.filter((s) => s !== 'reddit'));
                    }
                  }}
                  className="mr-2"
                />
                Reddit
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sources.includes('x')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSources([...sources, 'x']);
                    } else {
                      setSources(sources.filter((s) => s !== 'x'));
                    }
                  }}
                  className="mr-2"
                />
                X (Twitter)
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Start Research
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

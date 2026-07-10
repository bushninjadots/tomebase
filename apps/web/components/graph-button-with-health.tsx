'use client';

import { useState, useEffect } from 'react';
import { GraphButton } from '@/components/graph';

interface HealthData {
  healthScore: number;
  freshness: 'fresh' | 'aging' | 'stale' | 'critical';
  engagement: 'high' | 'medium' | 'low' | 'none';
  quality: 'rich' | 'adequate' | 'thin' | 'empty';
}

interface GraphButtonWithHealthProps {
  projectId: string;
  pages: { id: string; title: string; slug: string; content: string }[];
}

export function GraphButtonWithHealth({ projectId, pages }: GraphButtonWithHealthProps) {
  const [healthData, setHealthData] = useState<Map<string, HealthData> | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.pages) {
          const map = new Map<string, HealthData>();
          for (const page of data.pages) {
            map.set(page.id, {
              healthScore: page.healthScore,
              freshness: page.freshness,
              engagement: page.engagement,
              quality: page.quality
            });
          }
          setHealthData(map);
        }
      })
      .catch(console.error);
  }, [projectId]);

  return (
    <GraphButton 
      projectId={projectId} 
      pages={pages} 
      healthData={healthData || undefined}
    />
  );
}
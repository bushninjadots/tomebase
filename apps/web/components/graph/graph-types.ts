export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  targetX?: number;
  targetY?: number;
  health?: {
    healthScore: number;
    freshness: 'fresh' | 'aging' | 'stale' | 'critical';
    engagement: 'high' | 'medium' | 'low' | 'none';
    quality: 'rich' | 'adequate' | 'thin' | 'empty';
  };
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphViewProps {
  projectId: string;
  pages: { id: string; title: string; slug: string; content: string }[];
  healthData?: Map<string, {
    healthScore: number;
    freshness: 'fresh' | 'aging' | 'stale' | 'critical';
    engagement: 'high' | 'medium' | 'low' | 'none';
    quality: 'rich' | 'adequate' | 'thin' | 'empty';
  }>;
}

export interface GraphModalProps extends GraphViewProps {
  onClose: () => void;
  currentPageId?: string;
}

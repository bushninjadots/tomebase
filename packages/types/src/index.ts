export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  projectId: string;
  parentId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  projectId: string;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  projectId: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface Team {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

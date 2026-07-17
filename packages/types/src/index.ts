export type SubscriptionTier = 'free' | 'pro';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  userId: string;
  published: boolean;
  customDomain: string | null;
  domainStatus: string | null;
  domainVerifiedAt: Date | null;
  domainLastCheckedAt: Date | null;
  domainSslStatus: string | null;
  logoUrl: string | null;
  teamId: string | null;
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
  published: boolean;
  viewCount: number;
  lastViewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageSnapshot {
  id: string;
  pageId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  projectId: string;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  key: string;
  projectId: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  tier: string;
  personal: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  role: string;
  userId: string;
  teamId: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  teamId: string;
  token: string;
  accepted: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  pageId: string;
  userId: string;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  url: string;
  secret: string | null;
  events: string;
  projectId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledPublish {
  id: string;
  pageId: string;
  publishAt: Date;
  unpublishAt: Date | null;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  pageId: string;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewEvent {
  id: string;
  pageId: string;
  visitorId: string | null;
  referrer: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface HealthReport {
  id: string;
  projectId: string;
  score: number;
  totalPages: number;
  issues: unknown;
  summary: unknown;
  createdAt: Date;
}

export * from './diagnostics';

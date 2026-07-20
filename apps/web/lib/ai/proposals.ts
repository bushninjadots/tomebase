import { prisma } from '@fluid/database';

export type ChangeType = 'replace' | 'insert' | 'delete';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected';
export type ProposalSource = 'ai' | 'health' | 'manual';

export interface AIChangeProposalData {
  id: string;
  pageId: string;
  userId: string;
  changeType: ChangeType;
  originalContent: string;
  proposedContent: string;
  explanation: string;
  confidence: number;
  status: ProposalStatus;
  source: ProposalSource;
  sourceRuleId: string | null;
  createdAt: Date;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
}

export interface CreateProposalInput {
  pageId: string;
  userId: string;
  changeType: ChangeType;
  originalContent: string;
  proposedContent: string;
  explanation: string;
  confidence?: number;
  source?: ProposalSource;
  sourceRuleId?: string;
}

export interface ProposalValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_CONTENT_SIZE = 100_000;
const MIN_CONTENT_SIZE = 0;
const VALID_CHANGE_TYPES: ChangeType[] = ['replace', 'insert', 'delete'];
const VALID_STATUSES: ProposalStatus[] = ['pending', 'accepted', 'rejected'];
const VALID_SOURCES: ProposalSource[] = ['ai', 'health', 'manual'];

export function validateProposalInput(input: Partial<CreateProposalInput>): ProposalValidationResult {
  if (!input.pageId || typeof input.pageId !== 'string') {
    return { valid: false, error: 'pageId is required' };
  }
  if (!input.userId || typeof input.userId !== 'string') {
    return { valid: false, error: 'userId is required' };
  }
  if (!input.changeType || !VALID_CHANGE_TYPES.includes(input.changeType)) {
    return { valid: false, error: `changeType must be one of: ${VALID_CHANGE_TYPES.join(', ')}` };
  }
  if (input.originalContent === undefined || typeof input.originalContent !== 'string') {
    return { valid: false, error: 'originalContent is required' };
  }
  if (input.proposedContent === undefined || typeof input.proposedContent !== 'string') {
    return { valid: false, error: 'proposedContent is required' };
  }
  if (!input.explanation || typeof input.explanation !== 'string') {
    return { valid: false, error: 'explanation is required' };
  }
  if (input.originalContent.length > MAX_CONTENT_SIZE) {
    return { valid: false, error: `originalContent exceeds max size of ${MAX_CONTENT_SIZE}` };
  }
  if (input.proposedContent.length > MAX_CONTENT_SIZE) {
    return { valid: false, error: `proposedContent exceeds max size of ${MAX_CONTENT_SIZE}` };
  }
  if (input.confidence !== undefined && (typeof input.confidence !== 'number' || input.confidence < 0 || input.confidence > 1)) {
    return { valid: false, error: 'confidence must be between 0 and 1' };
  }
  if (input.source && !VALID_SOURCES.includes(input.source)) {
    return { valid: false, error: `source must be one of: ${VALID_SOURCES.join(', ')}` };
  }
  return { valid: true };
}

export function validateStoredProposal(proposal: Record<string, unknown>): ProposalValidationResult {
  if (!proposal.id || typeof proposal.id !== 'string') {
    return { valid: false, error: 'Invalid proposal: missing id' };
  }
  if (!proposal.changeType || !VALID_CHANGE_TYPES.includes(proposal.changeType as ChangeType)) {
    return { valid: false, error: 'Invalid proposal: bad changeType' };
  }
  if (!VALID_STATUSES.includes(proposal.status as ProposalStatus)) {
    return { valid: false, error: 'Invalid proposal: bad status' };
  }
  if (typeof proposal.originalContent !== 'string' || typeof proposal.proposedContent !== 'string') {
    return { valid: false, error: 'Invalid proposal: content must be strings' };
  }
  if (proposal.originalContent.length > MAX_CONTENT_SIZE || proposal.proposedContent.length > MAX_CONTENT_SIZE) {
    return { valid: false, error: 'Invalid proposal: content too large' };
  }
  return { valid: true };
}

export const proposalService = {
  async create(input: CreateProposalInput): Promise<AIChangeProposalData> {
    const validation = validateProposalInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid proposal: ${validation.error}`);
    }

    const proposal = await prisma.aIChangeProposal.create({
      data: {
        pageId: input.pageId,
        userId: input.userId,
        changeType: input.changeType,
        originalContent: input.originalContent,
        proposedContent: input.proposedContent,
        explanation: input.explanation,
        confidence: input.confidence ?? 0.8,
        source: input.source ?? 'ai',
        sourceRuleId: input.sourceRuleId ?? null,
      },
    });

    return proposal as AIChangeProposalData;
  },

  async getById(id: string): Promise<AIChangeProposalData | null> {
    const proposal = await prisma.aIChangeProposal.findUnique({ where: { id } });
    return proposal as AIChangeProposalData | null;
  },

  async getByPageId(pageId: string, status?: ProposalStatus): Promise<AIChangeProposalData[]> {
    const where: Record<string, unknown> = { pageId };
    if (status) where.status = status;
    const proposals = await prisma.aIChangeProposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return proposals as AIChangeProposalData[];
  },

  async accept(id: string): Promise<AIChangeProposalData> {
    const proposal = await prisma.aIChangeProposal.findUnique({ where: { id } });
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.status !== 'pending') throw new Error(`Proposal is already ${proposal.status}`);

    const updated = await prisma.aIChangeProposal.update({
      where: { id },
      data: { status: 'accepted', acceptedAt: new Date() },
    });

    return updated as AIChangeProposalData;
  },

  async reject(id: string): Promise<AIChangeProposalData> {
    const proposal = await prisma.aIChangeProposal.findUnique({ where: { id } });
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.status !== 'pending') throw new Error(`Proposal is already ${proposal.status}`);

    const updated = await prisma.aIChangeProposal.update({
      where: { id },
      data: { status: 'rejected', rejectedAt: new Date() },
    });

    return updated as AIChangeProposalData;
  },

  async getStats(pageId: string) {
    const [pending, accepted, rejected] = await Promise.all([
      prisma.aIChangeProposal.count({ where: { pageId, status: 'pending' } }),
      prisma.aIChangeProposal.count({ where: { pageId, status: 'accepted' } }),
      prisma.aIChangeProposal.count({ where: { pageId, status: 'rejected' } }),
    ]);
    return { pending, accepted, rejected, total: pending + accepted + rejected };
  },
};

export type ProposalService = typeof proposalService;

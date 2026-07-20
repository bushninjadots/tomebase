import { describe, it, expect, vi } from 'vitest';

vi.mock('@fluid/database', () => ({
  prisma: {
    aIChangeProposal: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import {
  validateProposalInput,
  validateStoredProposal,
  type ChangeType,
  type ProposalStatus,
  type ProposalSource,
} from './proposals';

describe('validateProposalInput', () => {
  const validInput = {
    pageId: 'page-1',
    userId: 'user-1',
    changeType: 'replace' as ChangeType,
    originalContent: 'old text',
    proposedContent: 'new text',
    explanation: 'Improved wording',
  };

  it('accepts valid input', () => {
    expect(validateProposalInput(validInput)).toEqual({ valid: true });
  });

  it('rejects missing pageId', () => {
    expect(validateProposalInput({ ...validInput, pageId: '' })).toEqual({
      valid: false,
      error: 'pageId is required',
    });
  });

  it('rejects missing userId', () => {
    expect(validateProposalInput({ ...validInput, userId: undefined })).toEqual({
      valid: false,
      error: 'userId is required',
    });
  });

  it('rejects invalid changeType', () => {
    expect(validateProposalInput({ ...validInput, changeType: 'move' as ChangeType })).toEqual({
      valid: false,
      error: expect.stringContaining('changeType'),
    });
  });

  it('rejects missing explanation', () => {
    expect(validateProposalInput({ ...validInput, explanation: '' })).toEqual({
      valid: false,
      error: 'explanation is required',
    });
  });

  it('rejects content exceeding max size', () => {
    const huge = 'x'.repeat(100_001);
    expect(validateProposalInput({ ...validInput, proposedContent: huge })).toEqual({
      valid: false,
      error: expect.stringContaining('max size'),
    });
  });

  it('rejects confidence outside 0-1', () => {
    expect(validateProposalInput({ ...validInput, confidence: 1.5 })).toEqual({
      valid: false,
      error: 'confidence must be between 0 and 1',
    });
  });

  it('rejects invalid source', () => {
    expect(validateProposalInput({ ...validInput, source: 'unknown' as ProposalSource })).toEqual({
      valid: false,
      error: expect.stringContaining('source'),
    });
  });

  it('accepts insert with empty originalContent', () => {
    expect(validateProposalInput({ ...validInput, changeType: 'insert', originalContent: '' })).toEqual({ valid: true });
  });

  it('accepts all valid change types', () => {
    for (const ct of ['replace', 'insert', 'delete'] as ChangeType[]) {
      expect(validateProposalInput({ ...validInput, changeType: ct })).toEqual({ valid: true });
    }
  });
});

describe('validateStoredProposal', () => {
  const validProposal = {
    id: 'prop-1',
    changeType: 'replace',
    status: 'pending',
    originalContent: 'old',
    proposedContent: 'new',
  };

  it('accepts valid stored proposal', () => {
    expect(validateStoredProposal(validProposal)).toEqual({ valid: true });
  });

  it('rejects missing id', () => {
    expect(validateStoredProposal({ ...validProposal, id: '' })).toEqual({
      valid: false,
      error: expect.stringContaining('missing id'),
    });
  });

  it('rejects invalid changeType', () => {
    expect(validateStoredProposal({ ...validProposal, changeType: 'move' })).toEqual({
      valid: false,
      error: expect.stringContaining('bad changeType'),
    });
  });

  it('rejects invalid status', () => {
    expect(validateStoredProposal({ ...validProposal, status: 'applied' })).toEqual({
      valid: false,
      error: expect.stringContaining('bad status'),
    });
  });

  it('rejects non-string content', () => {
    expect(validateStoredProposal({ ...validProposal, originalContent: 123 })).toEqual({
      valid: false,
      error: expect.stringContaining('content must be strings'),
    });
  });

  it('rejects content exceeding max size', () => {
    const huge = 'x'.repeat(100_001);
    expect(validateStoredProposal({ ...validProposal, proposedContent: huge })).toEqual({
      valid: false,
      error: expect.stringContaining('content too large'),
    });
  });

  it('accepts all valid statuses', () => {
    for (const status of ['pending', 'accepted', 'rejected'] as ProposalStatus[]) {
      expect(validateStoredProposal({ ...validProposal, status })).toEqual({ valid: true });
    }
  });
});

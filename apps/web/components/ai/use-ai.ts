'use client';

import { useContext } from 'react';
import { AIProviderContext } from './ai-provider-context';

export function useAI() {
  const context = useContext(AIProviderContext);
  if (!context) throw new Error('useAI must be used within AIProviderProvider');
  return context;
}

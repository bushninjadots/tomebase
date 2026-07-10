'use client';

import { LivingDocumentation } from '@/components/living-documentation';

interface LivingDocsSectionProps {
  projectId: string;
}

export function LivingDocsSection({ projectId }: LivingDocsSectionProps) {
  return (
    <div className="mt-8">
      <LivingDocumentation projectId={projectId} />
    </div>
  );
}
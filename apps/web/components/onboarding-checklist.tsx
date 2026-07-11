'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, CheckCircle, Circle, ArrowRight, BookOpen, FileText, Globe, Users, PartyPopper } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

interface OnboardingChecklistProps {
  hasProject: boolean;
  hasContent: boolean;
  hasPublished: boolean;
  hasTeamMember: boolean;
  projectId?: string;
}

export function OnboardingChecklist({
  hasProject,
  hasContent,
  hasPublished,
  hasTeamMember,
  projectId,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  const steps: Step[] = [
    { id: 'project', label: 'Create your first project', done: hasProject, href: '/dashboard/new', cta: 'Create Project' },
    { id: 'content', label: 'Write your first page', done: hasContent, href: projectId ? `/docs/${projectId}` : '/dashboard/new', cta: 'Write a Page' },
    { id: 'publish', label: 'Publish your docs', done: hasPublished, href: projectId ? `/docs/${projectId}` : '/dashboard/new', cta: 'Go to Project' },
    { id: 'team', label: 'Invite a team member', done: hasTeamMember, href: projectId ? `/dashboard/${projectId}/settings` : '/dashboard/settings', cta: 'Invite' },
  ];

  const allDone = steps.every((s) => s.done);
  if (dismissed || allDone) return null;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="relative rounded-2xl border border-fluid-100 bg-gradient-to-br from-fluid-50/80 to-white p-6 mb-8">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-4 rounded-lg p-1 text-theme-muted hover:bg-white/50 hover:text-theme-subtle transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-1">
        <PartyPopper className="h-5 w-5 text-fluid-600" />
        <h2 className="text-base font-semibold text-theme-main">
          Welcome to TomeBase!
        </h2>
      </div>
      <p className="text-sm text-theme-muted mb-4">
        {doneCount === 0
          ? 'Let\'s get you set up. Complete these steps to start shipping docs.'
          : `Great progress! ${doneCount} of ${steps.length} steps done.`}
      </p>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 rounded-full bg-theme-hover overflow-hidden">
          <div
            className="h-full rounded-full bg-fluid-500 transition-all duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-theme-muted">{doneCount}/{steps.length}</span>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
              step.done
                ? 'border-green-100 bg-green-50/50'
                : 'border-theme-border bg-white hover:border-fluid-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {step.done ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-theme-muted" />
              )}
              <span className={`text-sm truncate ${step.done ? 'text-theme-muted line-through' : 'text-theme-main font-medium'}`}>
                {step.label}
              </span>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-theme-main px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-colors"
              >
                {step.cta}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

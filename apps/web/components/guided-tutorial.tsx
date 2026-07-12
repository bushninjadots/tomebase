'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, FileText, Globe, Users, Code2, Sparkles } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: string;
  href?: string;
}

const steps: TutorialStep[] = [
  {
    title: 'Welcome to TomeBase',
    description: 'Get your team\'s docs online in minutes. Write, link, and publish — no build steps, no separate hosting.',
    icon: Sparkles,
  },
  {
    title: 'Create a Project',
    description: 'Each project is a separate documentation site. Create one to get started with your own pages and settings.',
    icon: BookOpen,
    action: 'Create Project',
    href: '/dashboard/new',
  },
  {
    title: 'Import Your Code',
    description: 'Already have code? Import TypeScript, JavaScript, or OpenAPI specs to auto-generate docs in one click.',
    icon: Code2,
    action: 'Import',
    href: '/dashboard',
  },
  {
    title: 'Write & Link Pages',
    description: 'Use the Markdown editor with live preview. Connect pages with [[Wiki Links]] and see the knowledge graph.',
    icon: FileText,
  },
  {
    title: 'Invite Your Team',
    description: 'Add team members so everyone can contribute. Free plan includes up to 5 members.',
    icon: Users,
    action: 'Invite',
    href: '/dashboard/settings',
  },
  {
    title: 'Publish & Share',
    description: 'Toggle public publishing to share your docs with the world. Each project gets a unique public URL.',
    icon: Globe,
  },
];

export function GuidedTutorial({ projectId }: { projectId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tomebase_tutorial_seen');
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    setIsOpen(false);
    setCompleted(true);
    localStorage.setItem('tomebase_tutorial_seen', 'true');
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  function prev() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  if (!isOpen || completed) return null;

  const current = steps[step]!;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-theme-muted">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="rounded p-1 text-theme-muted hover:text-theme-subtle transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-theme-main">{current.title}</h3>
        <p className="mt-2 text-sm text-theme-muted">{current.description}</p>

        {current.href && (
          <a
            href={current.href}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
          >
            {current.action}
            <ChevronRight className="h-4 w-4" />
          </a>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-colors ${
                  i === step ? 'w-6 bg-fluid-600' : 'w-1.5 bg-theme-hover'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="rounded-lg border border-theme-border px-3 py-1.5 text-sm font-medium text-theme-subtle hover:bg-theme-hover transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={next}
              className="rounded-lg bg-theme-accent px-4 py-1.5 text-sm font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
            >
              {step === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

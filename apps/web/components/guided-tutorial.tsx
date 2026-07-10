'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, FileText, Globe, Sparkles } from 'lucide-react';

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
    description: 'This quick tour will help you get started with your documentation platform.',
    icon: Sparkles,
  },
  {
    title: 'Create a Project',
    description: 'Start by creating a project to organize your documentation. Each project gets its own set of pages and settings.',
    icon: BookOpen,
    action: 'Create Project',
    href: '/dashboard/new',
  },
  {
    title: 'Write Documentation',
    description: 'Use the Markdown editor with live preview, wiki links to connect pages, and auto-save so you never lose work.',
    icon: FileText,
  },
  {
    title: 'Publish & Share',
    description: 'Toggle public publishing to share your docs with the world. Each project gets a unique URL.',
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
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fluid-50 text-fluid-600 dark:bg-fluid-900/30 dark:text-fluid-400">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{current.title}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{current.description}</p>

        {current.href && (
          <a
            href={current.href}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-fluid-600 px-4 py-2 text-sm font-medium text-white hover:bg-fluid-700 transition-colors"
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
                  i === step ? 'w-6 bg-fluid-600' : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={next}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors dark:bg-fluid-600 dark:hover:bg-fluid-700"
            >
              {step === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, Rocket, ArrowRight, ArrowLeft, Check, Zap, Code, ClipboardList } from 'lucide-react';

interface OnboardingWizardProps {
  userName: string;
}

const templates = [
  { id: 'blank', name: 'Blank', description: 'Start from scratch', icon: FileText },
  { id: 'api', name: 'API Reference', description: 'REST API documentation', icon: Code },
  { id: 'product', name: 'Product Docs', description: 'User guides and tutorials', icon: BookOpen },
  { id: 'runbook', name: 'Runbook', description: 'Operational procedures', icon: ClipboardList },
];

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState(`${userName}'s Workspace`);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: 'Welcome', description: `Hi ${userName}! Let's get you set up.` },
    { title: 'Workspace', description: 'Name your workspace.' },
    { title: 'Template', description: 'Choose a starting point.' },
    { title: 'All Set', description: 'You\'re ready to go!' },
  ];

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName, template: selectedTemplate }),
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-theme-page flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i < step
                      ? 'bg-theme-accent text-white'
                      : i === step
                        ? 'bg-theme-accent/20 text-theme-accent border-2 border-theme-accent'
                        : 'bg-theme-hover text-theme-muted'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-12 sm:w-20 mx-2 transition-colors ${
                      i < step ? 'bg-theme-accent' : 'bg-theme-hover'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-theme-border bg-theme-card p-8 shadow-2xl shadow-black/40">
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-accent/10">
                <Rocket className="h-8 w-8 text-theme-accent" />
              </div>
              <h1 className="text-2xl font-bold text-theme-main">Welcome to TomeBase</h1>
              <p className="mt-3 text-sm text-theme-subtle max-w-sm mx-auto">
                The AI-powered documentation platform for engineering teams. Let&apos;s get your workspace set up in just a few steps.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-theme-main">Name your workspace</h2>
              <p className="mt-2 text-sm text-theme-subtle">
                This is your team&apos;s home. You can always change it later.
              </p>
              <div className="mt-6">
                <label htmlFor="workspace" className="mb-1.5 block text-sm font-medium text-theme-subtle">
                  Workspace name
                </label>
                <input
                  id="workspace"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-xl border border-theme-border bg-theme-page px-4 py-3 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent/20"
                  placeholder="My Team's Documentation"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-theme-main">Choose a template</h2>
              <p className="mt-2 text-sm text-theme-subtle">
                Pick a starting point, or start blank.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                      selectedTemplate === t.id
                        ? 'border-theme-accent bg-theme-accent/5'
                        : 'border-theme-border hover:border-theme-accent/30'
                    }`}
                  >
                    <t.icon className={`h-6 w-6 ${selectedTemplate === t.id ? 'text-theme-accent' : 'text-theme-muted'}`} />
                    <span className="text-sm font-medium text-theme-main">{t.name}</span>
                    <span className="text-xs text-theme-muted">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Zap className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-theme-main">You&apos;re all set!</h2>
              <p className="mt-3 text-sm text-theme-subtle max-w-sm mx-auto">
                Your workspace <span className="font-medium text-theme-main">{workspaceName}</span> is ready. Start creating beautiful documentation.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-theme-subtle transition-colors hover:bg-theme-hover"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !workspaceName.trim()}
                className="flex items-center gap-2 rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-theme-accent-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-theme-accent-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Setting up...' : 'Go to Dashboard'}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        {step < 3 && (
          <p className="mt-4 text-center text-xs text-theme-muted">
            <button
              onClick={handleComplete}
              className="hover:text-theme-subtle transition-colors"
            >
              Skip for now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  currentPeriodEnd: string | null;
}

export function CancelSubscriptionModal({ open, onClose, currentPeriodEnd }: CancelSubscriptionModalProps) {
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = 'cancel-sub-modal-title';
  const descId = 'cancel-sub-modal-desc';

  if (!open) return null;

  async function handleCancel() {
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to cancel subscription');
        setCancelling(false);
        return;
      }

      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setCancelling(false);
    }
  }

  function handleClose() {
    setDone(false);
    setCancelling(false);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelling ? undefined : handleClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md rounded-2xl border border-theme-border bg-theme-card p-6 shadow-2xl"
      >
        <button
          onClick={cancelling ? undefined : handleClose}
          aria-label="Close cancel subscription dialog"
          className="absolute right-4 top-4 text-theme-muted hover:text-theme-main transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {!done ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <h3 id={titleId} className="text-lg font-semibold text-theme-main">Cancel Subscription</h3>
            <div id={descId} className="mt-4 space-y-3 text-sm text-theme-subtle">
              <p>Are you sure you want to cancel your Pro subscription?</p>
              <div className="rounded-xl border border-theme-border bg-theme-page p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-theme-muted">-</span>
                  <span>Your subscription remains active until the end of the current billing period{currentPeriodEnd ? ` (${new Date(currentPeriodEnd).toLocaleDateString()})` : ''}.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-theme-muted">-</span>
                  <span>Your account will automatically downgrade to the Free plan afterwards.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-theme-muted">-</span>
                  <span>Projects will not be deleted.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-theme-muted">-</span>
                  <span>Premium features will become unavailable after the subscription expires.</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400" role="alert">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={cancelling}
                aria-label="Keep subscription and close"
                className="rounded-xl px-4 py-2 text-sm font-medium text-theme-muted hover:bg-theme-hover transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                aria-label="Cancel Pro subscription"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mx-auto">
              <AlertTriangle className="h-6 w-6 text-green-400" />
            </div>
            <h3 id={titleId} className="text-lg font-semibold text-theme-main">Subscription Cancelled</h3>
            <p id={descId} className="mt-2 text-sm text-theme-subtle">
              Your Pro subscription has been cancelled. It will remain active until the end of your current billing period, then your account will automatically downgrade to Free.
            </p>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="mt-6 rounded-xl bg-theme-accent px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

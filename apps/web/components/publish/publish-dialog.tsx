'use client';

import { useState, useCallback } from 'react';
import {
  X, Globe, AlertCircle, AlertTriangle, Eye,
  Loader2, CheckCircle, ExternalLink,
} from 'lucide-react';
import { PublishValidation, type ValidationResult } from './publish-validation';

interface PublishDialogProps {
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  projectId: string;
  isPublished: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onClose: () => void;
}

export function PublishDialog({
  pageId,
  pageTitle,
  pageSlug,
  projectId,
  isPublished,
  onPublish,
  onUnpublish,
  onClose,
}: PublishDialogProps) {
  const [publishing, setPublishing] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasErrors = validation && validation.errors > 0;
  const hasWarnings = validation && validation.warnings > 0;

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'PROJECT_NOT_PUBLISHED') {
          setError('Project must be published first. Go to Project Settings to publish the project.');
        } else if (data.code === 'MISSING_TITLE') {
          setError('Page must have a title before publishing.');
        } else {
          setError(data.error || 'Failed to publish');
        }
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        onPublish();
        onClose();
      }, 1200);
    } catch {
      setError('Network error — could not publish');
    } finally {
      setPublishing(false);
    }
  }, [pageId, onPublish, onClose]);

  const handleUnpublish = useCallback(async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/unpublish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to unpublish');
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        onUnpublish();
        onClose();
      }, 1200);
    } catch {
      setError('Network error — could not unpublish');
    } finally {
      setPublishing(false);
    }
  }, [pageId, onUnpublish, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-theme-border bg-theme-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isPublished ? 'bg-green-500/10' : 'bg-theme-accent/10'
            }`}>
              <Globe className={`h-4.5 w-4.5 ${isPublished ? 'text-green-500' : 'text-theme-accent'}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-theme-main">
                {isPublished ? 'Publishing Options' : 'Publish Page'}
              </h2>
              <p className="text-xs text-theme-muted mt-0.5 truncate max-w-[260px]">{pageTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:bg-theme-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-theme-main">
                {isPublished ? 'Unpublished successfully' : 'Published successfully'}
              </p>
              <p className="text-xs text-theme-muted mt-1">
                {isPublished
                  ? 'Page is no longer publicly accessible'
                  : 'Page is now live and publicly accessible'}
              </p>
            </div>
          ) : (
            <>
              {/* Status */}
              <div className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border ${
                isPublished
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-theme-hover border-theme-border'
              }`}>
                {isPublished ? (
                  <Globe className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Globe className="h-4 w-4 text-theme-muted shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-xs font-medium text-theme-main">
                    {isPublished ? 'Currently published' : 'Currently in draft'}
                  </p>
                  <p className="text-[11px] text-theme-muted">
                    {isPublished
                      ? `Visible at /p/${projectId}/${pageSlug}`
                      : 'Not publicly accessible'}
                  </p>
                </div>
                {isPublished && (
                  <a
                    href={`/p/${projectId}/${pageSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-theme-accent hover:underline flex items-center gap-0.5"
                  >
                    View <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>

              {/* Validation */}
              {!isPublished && (
                <div>
                  <p className="text-xs font-medium text-theme-main mb-2">Health Checks</p>
                  <PublishValidation
                    pageId={pageId}
                    onValidation={setValidation}
                  />
                </div>
              )}

              {/* Warnings banner */}
              {!isPublished && hasWarnings && !hasErrors && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Page has {validation!.warnings} warning{validation!.warnings === 1 ? '' : 's'}.
                    You can still publish, but consider fixing them first.
                  </p>
                </div>
              )}

              {/* Error banner */}
              {!isPublished && hasErrors && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Page has {validation!.errors} error{validation!.errors === 1 ? '' : 's'}.
                    Fix critical issues before publishing.
                  </p>
                </div>
              )}

              {/* Preview link */}
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-theme-hover border border-theme-border">
                <Eye className="h-3.5 w-3.5 text-theme-muted shrink-0" />
                <p className="text-xs text-theme-muted">
                  A version snapshot will be created before {isPublished ? 'unpublishing' : 'publishing'}.
                  You can restore from History at any time.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-theme-border">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-theme-subtle hover:bg-theme-hover transition-colors"
            >
              Cancel
            </button>
            {isPublished ? (
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {publishing && <Loader2 className="h-3 w-3 animate-spin" />}
                Unpublish
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={publishing || (hasErrors === true)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-theme-accent text-white hover:bg-theme-accent-hover disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {publishing && <Loader2 className="h-3 w-3 animate-spin" />}
                {hasErrors ? 'Fix errors first' : 'Publish'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import {
  Bot,
  Eye,
  EyeOff,
  Check,
  X,
  Trash2,
  Zap,
  Globe,
  Server,
} from 'lucide-react';
import { Button, Input, Badge, Card, CardContent, Spinner } from '@fluid/ui';
import { AI_PROVIDERS, type AIProviderType, type StoredAIProviderConfig, type AIProviderMeta } from '@/lib/ai-provider/types';
import { useAI } from '@/components/ai/use-ai';

const PROVIDER_EMOJI: Record<string, string> = {
  openai: '\u{1F7E2}',
  anthropic: '\u{1F3A8}',
  gemini: '\u{2728}',
  openrouter: '\u{1F517}',
  azure: '\u{2601}\u{FE0F}',
  ollama: '\u{1F4BB}',
  lmstudio: '\u{1F3AE}',
  custom: '\u{2699}\u{FE0F}',
};

interface SavedStatus {
  [provider: string]: {
    saved: boolean;
    connected: boolean | null;
    model?: string | null;
  };
}

function getStatusBadge(status: 'saved' | 'connected' | 'failed' | 'none') {
  if (status === 'connected') {
    return <Badge variant="success" size="sm">Connected</Badge>;
  }
  if (status === 'failed') {
    return <Badge variant="danger" size="sm">Failed</Badge>;
  }
  if (status === 'saved') {
    return <Badge variant="default" size="sm">Saved</Badge>;
  }
  return <Badge variant="default" size="sm">Not configured</Badge>;
}

export function AIProviderSettings() {
  const { configs, loading, saveProvider, deleteProvider, testConnection } = useAI();

  const [expandedType, setExpandedType] = useState<AIProviderType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const savedStatuses: SavedStatus = {};
  for (const c of configs) {
    savedStatuses[c.provider] = {
      saved: true,
      connected: c.enabled,
      model: c.model,
    };
  }

  const handleExpand = useCallback(
    (type: AIProviderType) => {
      if (expandedType === type) {
        setExpandedType(null);
        resetForm();
        return;
      }

      setExpandedType(type);
      resetForm();

      const saved = configs.find((c: StoredAIProviderConfig) => c.provider === type);
      if (saved) {
        setModel(saved.model ?? '');
        setBaseUrl(saved.baseUrl ?? '');
      }
    },
    [expandedType, configs],
  );

  function resetForm() {
    setApiKey('');
    setShowKey(false);
    setModel('');
    setBaseUrl('');
    setSaving(false);
    setDeleting(false);
    setTesting(false);
    setTestResult(null);
    setSaveError(null);
    setSuccessMsg(null);
  }

  async function handleSave(type: AIProviderType) {
    setSaving(true);
    setSaveError(null);
    setSuccessMsg(null);

    try {
      const meta = AI_PROVIDERS.find((p: AIProviderMeta) => p.type === type);
      const payload: {
        provider: string;
        apiKey?: string;
        model?: string;
        baseUrl?: string;
      } = { provider: type };

      if (apiKey) payload.apiKey = apiKey;
      if (model) payload.model = model;
      if (meta?.requiresBaseUrl || baseUrl) payload.baseUrl = baseUrl;

      await saveProvider(payload);
      setSuccessMsg('Provider saved successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type: AIProviderType) {
    setDeleting(true);
    try {
      await deleteProvider(type);
      resetForm();
      setExpandedType(null);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  async function handleTest(type: AIProviderType) {
    setTesting(true);
    setTestResult(null);

    const meta = AI_PROVIDERS.find((p: AIProviderMeta) => p.type === type);
    const saved = configs.find((c: StoredAIProviderConfig) => c.provider === type);

    const keyToTest = apiKey || '';
    if (meta?.requiresApiKey && !keyToTest && !saved) {
      setTestResult({
        success: false,
        message: 'Enter an API key to test',
      });
      setTesting(false);
      return;
    }

    const result = await testConnection({
      provider: type,
      apiKey: keyToTest || '__USE_SAVED__',
      baseUrl: baseUrl || undefined,
      model: model || undefined,
    });

    setTestResult(result);
    setTesting(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" className="text-theme-muted" />
          <span className="ml-2 text-sm text-theme-muted">Loading providers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {AI_PROVIDERS.map((meta) => {
        const isExpanded = expandedType === meta.type;
        const saved = configs.find((c) => c.provider === meta.type);
        const hasSaved = !!saved;
        const status = hasSaved
          ? saved?.enabled
            ? 'connected'
            : 'saved'
          : 'none';

        return (
          <Card key={meta.type}>
            <CardContent className="p-0">
              {/* Header */}
              <button
                onClick={() => handleExpand(meta.type)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-theme-hover/50 transition-colors rounded-[14px]"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-theme-surface border border-theme-border shrink-0">
                  <span className="text-lg">{PROVIDER_EMOJI[meta.type] ?? '\u{1F916}'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-theme-main">{meta.name}</h3>
                    {meta.isLocal && (
                      <Badge variant="default" size="sm">
                        <Server className="h-2.5 w-2.5 mr-0.5" />
                        Local
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-theme-muted mt-0.5">{meta.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meta.models.slice(0, 4).map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center rounded-md bg-theme-page border border-theme-border px-1.5 py-0.5 text-[10px] text-theme-subtle font-mono"
                      >
                        {m.name}
                      </span>
                    ))}
                    {meta.models.length > 4 && (
                      <span className="text-[10px] text-theme-muted self-center">
                        +{meta.models.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  {getStatusBadge(status)}
                  <div className={`h-2 w-2 rounded-full ${
                    status === 'connected'
                      ? 'bg-green-500'
                      : status === 'saved'
                        ? 'bg-theme-muted'
                        : 'bg-theme-border'
                  }`} />
                </div>
              </button>

              {/* Expanded form */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-theme-border pt-4 space-y-4">
                  {/* API Key */}
                  {meta.requiresApiKey && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-theme-subtle">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={
                            saved
                              ? `Key saved (${saved.apiKeyHint ?? '***'})`
                              : 'sk-...'
                          }
                          className="block w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 pr-10 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-theme-muted hover:text-theme-main transition-colors"
                        >
                          {showKey ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {saved && !apiKey && (
                        <p className="text-[11px] text-theme-muted">
                          Leave empty to keep the existing key
                        </p>
                      )}
                    </div>
                  )}

                  {/* Model selector */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-theme-subtle">
                      Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="block w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-main focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent appearance-none"
                    >
                      <option value="">
                        {saved?.model
                          ? `Current: ${saved.model}`
                          : 'Select a model'}
                      </option>
                      {meta.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({(m.contextWindow / 1000).toFixed(0)}K context)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Base URL */}
                  {meta.requiresBaseUrl && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-theme-subtle">
                        Base URL
                      </label>
                      <input
                        type="url"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder={
                          meta.type === 'ollama'
                            ? 'http://localhost:11434/v1'
                            : meta.type === 'lmstudio'
                              ? 'http://localhost:1234/v1'
                              : meta.type === 'azure'
                                ? 'https://your-resource.openai.azure.com'
                                : 'https://api.example.com/v1'
                        }
                        className="block w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono"
                      />
                    </div>
                  )}

                  {/* Test result */}
                  {testResult && (
                    <div
                      className={`rounded-lg border p-3 text-xs ${
                        testResult.success
                          ? 'border-green-500/20 bg-green-500/5 text-green-400'
                          : 'border-red-500/20 bg-red-500/5 text-red-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {testResult.success ? (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>{testResult.message}</span>
                      </div>
                      {testResult.model && (
                        <p className="mt-1 text-[11px] opacity-70">
                          Model: {testResult.model}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Errors / success */}
                  {saveError && (
                    <p className="text-xs text-red-400">{saveError}</p>
                  )}
                  {successMsg && (
                    <p className="text-xs text-green-400">{successMsg}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSave(meta.type)}
                      disabled={saving}
                    >
                      {saving ? (
                        <Spinner size="sm" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {saving ? 'Saving...' : saved ? 'Update' : 'Save'}
                    </Button>

                    {!meta.isLocal && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(meta.type)}
                        disabled={testing}
                      >
                        {testing ? (
                          <Spinner size="sm" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                        {testing ? 'Testing...' : 'Test Connection'}
                      </Button>
                    )}

                    {hasSaved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(meta.type)}
                        disabled={deleting}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-auto"
                      >
                        {deleting ? (
                          <Spinner size="sm" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-[11px] text-theme-muted text-center pt-2">
        API keys are encrypted at rest. Local providers (Ollama, LM Studio) never send data externally.
      </p>
    </div>
  );
}

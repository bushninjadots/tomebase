'use client';

import { useState, useEffect } from 'react';
import { 
  GitBranch, RefreshCw, AlertTriangle, CheckCircle, Clock,
  FileCode, ArrowRight, ExternalLink
} from 'lucide-react';

interface CodeChange {
  file: string;
  lastModified: string;
  type: 'added' | 'modified' | 'deleted';
}

interface StaleDoc {
  pageId: string;
  pageName: string;
  slug: string;
  lastUpdated: string;
  relatedFiles: CodeChange[];
  stalenessReason: string;
}

interface LivingDocsStatus {
  isConnected: boolean;
  lastChecked: string | null;
  staleDocs: StaleDoc[];
  recentChanges: CodeChange[];
}

interface LivingDocumentationProps {
  projectId: string;
}

export function LivingDocumentation({ projectId }: LivingDocumentationProps) {
  const [status, setStatus] = useState<LivingDocsStatus>({
    isConnected: false,
    lastChecked: null,
    staleDocs: [],
    recentChanges: []
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const savedStatus = localStorage.getItem(`living-docs-${projectId}`);
    if (savedStatus) {
      try {
        setStatus(JSON.parse(savedStatus));
      } catch {
        // Ignore parse errors
      }
    }
  }, [projectId]);

  const checkForStaleDocs = async () => {
    setIsChecking(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/living-docs`);
      if (response.ok) {
        const data = await response.json();
        const newStatus: LivingDocsStatus = {
          isConnected: true,
          lastChecked: new Date().toISOString(),
          staleDocs: data.staleDocs || [],
          recentChanges: data.recentChanges || []
        };
        setStatus(newStatus);
        localStorage.setItem(`living-docs-${projectId}`, JSON.stringify(newStatus));
      }
    } catch (error) {
      console.error('Failed to check for stale docs:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-fluid-600" />
          <span className="font-medium text-gray-900">Living Documentation</span>
        </div>
        <button
          onClick={checkForStaleDocs}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-fluid-600 hover:bg-fluid-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Check for Updates'}
        </button>
      </div>

      <div className="p-4">
        {!status.isConnected && status.lastChecked === null ? (
          <div className="text-center py-6">
            <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Connect your codebase</h3>
            <p className="text-xs text-gray-500 mb-4">
              Automatically detect when documentation becomes outdated after code changes.
            </p>
            <button
              onClick={checkForStaleDocs}
              className="px-4 py-2 bg-fluid-600 text-white rounded-lg hover:bg-fluid-700 transition-colors text-sm font-medium"
            >
              Get Started
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Connected to codebase
              </div>
              {status.lastChecked && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  Last checked {formatDate(status.lastChecked)}
                </div>
              )}
            </div>

            {status.staleDocs.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {status.staleDocs.length} potentially stale document{status.staleDocs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {status.staleDocs.slice(0, showDetails ? undefined : 3).map((doc) => (
                    <div
                      key={doc.pageId}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{doc.pageName}</span>
                          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                            {doc.stalenessReason}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Updated {formatDate(doc.lastUpdated)}</span>
                          <span>{doc.relatedFiles.length} related file{doc.relatedFiles.length !== 1 ? 's' : ''} changed</span>
                        </div>
                      </div>
                      <a
                        href={`/docs/${projectId}/${doc.slug}`}
                        className="flex items-center gap-1 text-sm text-fluid-600 hover:text-fluid-700 ml-4"
                      >
                        Review
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>

                {status.staleDocs.length > 3 && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full mt-2 text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                  >
                    {showDetails ? 'Show less' : `Show all ${status.staleDocs.length} stale docs`}
                  </button>
                )}
              </div>
            )}

            {status.recentChanges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Code Changes</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {status.recentChanges.slice(0, 10).map((change, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs py-1"
                    >
                      <FileCode className="h-3 w-3 text-gray-400" />
                      <span className="font-mono text-gray-600 truncate flex-1">{change.file}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        change.type === 'added' ? 'bg-green-100 text-green-700' :
                        change.type === 'modified' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {change.type}
                      </span>
                      <span className="text-gray-400">{formatDate(change.lastModified)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status.staleDocs.length === 0 && status.recentChanges.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All documentation is up to date!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
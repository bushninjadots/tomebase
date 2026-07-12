'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@fluid/ui';
import { Code2, ArrowRight, FileCode, Check, ExternalLink, GitBranch, RotateCcw, ArrowUpRight } from 'lucide-react';
import { useImportWizard } from './use-import-wizard';
import { ImportProgress } from './import-progress';
import { ImportSummary } from './import-summary';
import { GeneratedPagesPanel } from './generated-pages-panel';
import { DocumentationPreview } from './documentation-preview';
import { ZeroState } from './zero-state';
import { SmartSuggestions } from './smart-suggestions';
import { HealthSummary } from './health-summary';
import { useToast } from '@/components/toast';

const languages = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'ruby', label: 'Ruby' },
];

const EXPORT_FEATURES = [
  { label: 'Exported functions', icon: Check },
  { label: 'Exported classes', icon: Check },
  { label: 'Exported interfaces', icon: Check },
  { label: 'Exported types', icon: Check },
  { label: 'Exported enums', icon: Check },
  { label: 'React components & hooks', icon: Check },
  { label: 'JSDoc comments', icon: Check },
];

const sampleCode: Record<string, string> = {
  typescript: `/**
 * Calculates the total price including tax and discounts.
 * @param basePrice - The base price before adjustments
 * @param taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @param discount - Discount amount to subtract
 * @returns The final price after all adjustments
 * @example
 * calculateTotal(100, 0.08, 10) // returns 98
 */
export function calculateTotal(basePrice: number, taxRate: number, discount: number = 0): number {
  const tax = basePrice * taxRate;
  return basePrice + tax - discount;
}

/**
 * Represents a user in the system.
 */
export interface User {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** User role */
  role: 'admin' | 'user' | 'viewer';
  /** Account creation date */
  createdAt: Date;
}

/**
 * Creates a new user with the given details.
 * @param name - The user's display name
 * @param email - The user's email address
 * @param role - The user's role
 * @returns The newly created user object
 * @throws {Error} If the email is already taken
 */
export function createUser(name: string, email: string, role: 'admin' | 'user' = 'user'): User {
  return { id: crypto.randomUUID(), name, email, role, createdAt: new Date() };
}

/**
 * Authentication result status.
 */
export enum AuthResult {
  Success = 'SUCCESS',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  AccountLocked = 'ACCOUNT_LOCKED',
}

/**
 * Configuration options for the authentication service.
 */
export type AuthConfig = {
  secret: string;
  expiresIn: number;
  issuer: string;
};`,
  python: `"""Authentication module for the API."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    """Represents a user in the system."""
    id: str
    name: str
    email: str
    role: str
    created_at: datetime


def authenticate(email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password.

    Args:
        email: The user's email address
        password: The user's password

    Returns:
        The authenticated User, or None if authentication fails
    """
    user = find_user_by_email(email)
    if user and verify_password(password, user.id):
        return user
    return None


def create_user(name: str, email: str, role: str = "user") -> User:
    """Create a new user account.

    Args:
        name: The user's display name
        email: The user's email address
        role: The user's role (default: "user")

    Returns:
        The newly created User
    """
    import uuid
    return User(
        id=str(uuid.uuid4()),
        name=name,
        email=email,
        role=role,
        created_at=datetime.now(),
    )`,
  go: `package auth

import (
\t"time"
)

// User represents a user in the system.
type User struct {
\tID        string
\tName      string
\tEmail     string
\tRole      string
\tCreatedAt time.Time
}

// Authenticator handles user authentication.
type Authenticator interface {
\t// Authenticate validates credentials and returns a user.
\tAuthenticate(email, password string) (*User, error)
\t// Token generates a session token for a user.
\tToken(user *User) (string, error)
}

// NewAuthenticator creates a new Authenticator instance.
func NewAuthenticator(secret string) *authenticator {
\treturn &authenticator{secret: secret}
}

// Authenticate validates the user's credentials.
func (a *authenticator) Authenticate(email, password string) (*User, error) {
\tuser, err := a.findUser(email)
\tif err != nil {
\t\treturn nil, err
\t}
\tif !a.verifyPassword(password, user.ID) {
\t\treturn nil, ErrInvalidCredentials
\t}
\treturn user, nil
}`,
  rust: `//! Authentication module for the API.

use serde::{Deserialize, Serialize};

/// Represents a user in the system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique identifier
    pub id: String,
    /// Display name
    pub name: String,
    /// Email address
    pub email: String,
    /// User role
    pub role: String,
}

/// Authentication errors.
#[derive(Debug)]
pub enum AuthError {
    /// User not found
    NotFound,
    /// Invalid credentials
    InvalidCredentials,
    /// Token expired
    TokenExpired,
}

/// Authenticator for user login.
pub struct Authenticator {
    secret: String,
}

impl Authenticator {
    /// Create a new authenticator with the given secret.
    pub fn new(secret: &str) -> Self {
        Self {
            secret: secret.to_string(),
        }
    }

    /// Authenticate a user with email and password.
    pub fn authenticate(&self, email: &str, password: &str) -> Result<User, AuthError> {
        let user = self.find_user(email)?;
        if !self.verify_password(password, &user.id) {
            return Err(AuthError::InvalidCredentials);
        }
        Ok(user)
    }
}`,
  csharp: `/// <summary>
/// Authentication service for managing user sessions.
/// </summary>
public class AuthService
{
    private readonly string _secret;

    /// <summary>
    /// Creates a new AuthService instance.
    /// </summary>
    /// <param name="secret">The JWT signing secret</param>
    public AuthService(string secret)
    {
        _secret = secret;
    }

    /// <summary>
    /// Authenticates a user with email and password.
    /// </summary>
    public async Task<User?> AuthenticateAsync(string email, string password)
    {
        var user = await FindUserByEmail(email);
        if (user != null && VerifyPassword(password, user.Id))
            return user;
        return null;
    }
}

/// <summary>
/// Represents a user in the system.
/// </summary>
public class User
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
}

/// <summary>
/// Authentication result status.
/// </summary>
public enum AuthResult
{
    Success,
    InvalidCredentials,
    UserNotFound,
    AccountLocked
}`,
  cpp: `/**
 * @brief Authentication module for managing user sessions.
 */
class AuthService {
private:
    std::string secret_;

public:
    AuthService(const std::string& secret) : secret_(secret) {}

    std::pair<User, std::string> authenticate(
        const std::string& email,
        const std::string& password
    );
};

struct User {
    std::string id;
    std::string name;
    std::string email;
    std::string role;
};

enum class AuthResult {
    Success,
    InvalidCredentials,
    UserNotFound,
    AccountLocked
};`,
  kotlin: `/**
 * Authentication service for managing user sessions.
 */
class AuthService(private val secret: String) {
    suspend fun authenticate(email: String, password: String): User? {
        val user = findUserByEmail(email)
        return if (user != null && verifyPassword(password, user.id)) user else null
    }
}

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: Role = Role.MEMBER
)

enum class Role {
    ADMIN,
    MEMBER,
    VIEWER
}`,
  ruby: `# Authentication module for managing user sessions.
class AuthService
  def initialize(secret)
    @secret = secret
  end

  def authenticate(email, password)
    user = find_user_by_email(email)
    return user if user && verify_password(password, user.id)
    nil
  end
end

class User
  attr_accessor :id, :name, :email, :role

  def initialize(id:, name:, email:, role: :member)
    @id = id
    @name = name
    @email = email
    @role = role
  end
end

module AuthResult
  SUCCESS = :success
  INVALID_CREDENTIALS = :invalid_credentials
  USER_NOT_FOUND = :user_not_found
end`,
};

interface ImportWizardProps {
  projectId: string;
  projectName: string;
}

export function ImportWizard({ projectId, projectName }: ImportWizardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const wizard = useImportWizard({ projectId, onToast: addToast });
  const summaryRef = useRef<HTMLDivElement>(null);
  const [selectedPreviewSlug, setSelectedPreviewSlug] = useState<string | null>(null);

  const isSplitView = wizard.state === 'success' && wizard.result && wizard.result.pages.length > 0;

  useEffect(() => {
    if (wizard.state === 'success' && wizard.result && wizard.result.pages.length > 0) {
      setSelectedPreviewSlug(wizard.result.pages[0]?.slug ?? null);
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [wizard.state, wizard.result]);

  const handleSubmit = useCallback(() => {
    wizard.generate(wizard.code, wizard.language);
  }, [wizard]);

  const loadSample = useCallback(() => {
    const sample = sampleCode[wizard.language as keyof typeof sampleCode] ?? sampleCode.typescript;
    if (sample) wizard.setCode(sample);
  }, [wizard]);

  const handleGenerateMore = useCallback(() => {
    wizard.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizard]);

  const handleConflictReplace = useCallback(() => {
    wizard.generate(wizard.code, wizard.language, 'replace');
  }, [wizard]);

  const handleConflictSkip = useCallback(() => {
    wizard.generate(wizard.code, wizard.language, 'skip');
  }, [wizard]);

  return (
    <div className="space-y-8">
      {/* Quick Actions Bar — visible during success state */}
      {isSplitView && (
        <div className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-4 py-2.5 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm text-theme-main font-medium">
              {wizard.result!.pages.length} page{wizard.result!.pages.length === 1 ? '' : 's'} generated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/docs/${projectId}/${wizard.result!.pages[0]?.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-theme-main hover:bg-theme-hover transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open in Editor
            </Link>
            <Link
              href={`/docs/${projectId}/graph`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-theme-main hover:bg-theme-hover transition-colors"
            >
              <GitBranch className="h-3 w-3" />
              Open Graph
            </Link>
            <Link
              href={`/docs/${projectId}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-theme-main hover:bg-theme-hover transition-colors"
            >
              <ArrowUpRight className="h-3 w-3" />
              Generated Docs
            </Link>
            <button
              onClick={handleGenerateMore}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-theme-accent hover:bg-theme-hover transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-1 rounded-xl border border-theme-border bg-theme-card p-1">
        <div className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium bg-theme-hover text-theme-main shadow-sm border border-theme-border text-center">
          <Code2 className="inline h-4 w-4 mr-1.5" />
          From Code
        </div>
        <button
          onClick={() => router.push(`/dashboard/${projectId}/import?tab=openapi`)}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors text-theme-muted hover:text-theme-main"
        >
          <FileCode className="inline h-4 w-4 mr-1.5" />
          OpenAPI Spec
        </button>
      </div>

      {/* IDLE / VALIDATING state — editor + sidebar */}
      {(wizard.state === 'idle' || wizard.state === 'validating') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="code" className="text-sm font-medium text-theme-subtle">Source Code</label>
                <button type="button" onClick={loadSample} className="text-xs text-theme-accent hover:text-theme-accent/80 transition-colors">
                  Load sample
                </button>
              </div>
              <textarea
                id="code"
                value={wizard.code}
                onChange={(e) => wizard.setCode(e.target.value)}
                rows={20}
                className="code-editor"
                placeholder={`// Paste your code here...\n// Supported: TypeScript, JavaScript, Python, Go, Rust, C#, C++, Kotlin, Ruby\n`}
                spellCheck={false}
                disabled={wizard.state === 'validating'}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <label htmlFor="language" className="text-sm font-medium text-theme-subtle">Language</label>
                <select
                  id="language"
                  value={wizard.language}
                  onChange={(e) => wizard.setLanguage(e.target.value)}
                  disabled={wizard.state === 'validating'}
                  className="select-field px-4 py-2.5"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-theme-muted pt-6">
                Paste code with doc comments (JSDoc, docstrings, Go doc, Rust doc, XML doc, KDoc, YARD)
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={wizard.state === 'validating' || !wizard.code.trim()} size="lg">
              {wizard.state === 'validating' ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-gray-900/30 border-t-gray-900 animate-spin" />
                  Analyzing Source...
                </>
              ) : (
                <>
                  <Code2 className="h-4 w-4" />
                  Generate Documentation
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-theme-border bg-theme-card p-5">
              <h3 className="text-sm font-semibold text-theme-main mb-4">What gets generated</h3>
              <div className="space-y-2.5">
                {EXPORT_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5 text-sm">
                    <f.icon className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    <span className="text-theme-subtle">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-theme-border bg-theme-card p-5">
              <h3 className="text-sm font-semibold text-theme-main mb-3">Tips</h3>
              <div className="space-y-2.5">
                <p className="text-xs text-theme-muted leading-relaxed">
                  Each exported function becomes a documentation page with parameters, return types, and usage examples.
                </p>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Interfaces, types, and enums become reference pages with field descriptions.
                </p>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Cross-references between types are automatically linked with [[wiki links]].
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GENERATING state */}
      {wizard.state === 'generating' && <ImportProgress steps={wizard.steps} />}

      {/* ERROR state */}
      {wizard.state === 'error' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center animate-[fadeIn_0.3s_ease-out]">
            <p className="text-sm text-red-400 font-medium">{wizard.error}</p>
          </div>
          <Button onClick={handleGenerateMore} variant="outline">Try Again</Button>
        </div>
      )}

      {/* ZERO state */}
      {wizard.state === 'zero' && <ZeroState language={wizard.language} onLoadExample={loadSample} />}

      {/* CONFLICTS state — all pages already exist */}
      {wizard.state === 'conflicts' && wizard.result && (
        <div className="space-y-6 animate-[slideUp_0.4s_ease-out]">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
            <p className="text-sm font-medium text-amber-400">
              ⚠ {wizard.result.skipped.length} page{wizard.result.skipped.length > 1 ? 's' : ''} already existed.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button onClick={handleConflictReplace} variant="outline" size="sm">Replace All</Button>
              <Button onClick={handleConflictSkip} variant="outline" size="sm">Skip</Button>
            </div>
          </div>
          <Button onClick={handleGenerateMore} variant="ghost">← Back to Editor</Button>
        </div>
      )}

      {/* SUCCESS state */}
      {wizard.state === 'success' && wizard.result && (
        <div ref={summaryRef}>
          {isSplitView ? (
            <div className="space-y-6 animate-[slideUp_0.4s_ease-out]">
              {/* Success banner */}
              <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-400">
                    Successfully generated documentation
                  </p>
                  <p className="text-xs text-theme-muted mt-0.5">
                    {wizard.result.pages.length} documentation page{wizard.result.pages.length === 1 ? '' : 's'} created.
                    {wizard.result.skipped.length > 0 && ` ${wizard.result.skipped.length} skipped.`}
                  </p>
                </div>
              </div>

              {/* Split panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                  <GeneratedPagesPanel
                    pages={wizard.result.pages}
                    projectId={projectId}
                    onSelectSlug={setSelectedPreviewSlug}
                    selectedSlug={selectedPreviewSlug}
                  />
                </div>
                <div className="rounded-xl border border-theme-border bg-theme-card p-4">
                  <DocumentationPreview
                    projectId={projectId}
                    slug={selectedPreviewSlug}
                  />
                </div>
              </div>

              {/* Stats + suggestions + health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <SmartSuggestions
                    functions={wizard.result.stats.functions}
                    interfaces={wizard.result.stats.interfaces}
                    hasJSDoc={true}
                    language={wizard.language}
                  />
                </div>
                <HealthSummary projectId={projectId} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/docs/${projectId}/${wizard.result.pages[0]?.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-theme-accent text-gray-900 px-5 py-2.5 text-sm font-semibold hover:bg-theme-accent-hover transition-colors"
                >
                  Open Generated Pages
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/docs/${projectId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
                >
                  View Project
                </Link>
                <button
                  onClick={handleGenerateMore}
                  className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
                >
                  Generate More
                </button>
              </div>
            </div>
          ) : (
            <ImportSummary result={wizard.result} projectId={projectId} onGenerateMore={handleGenerateMore} />
          )}
        </div>
      )}
    </div>
  );
}

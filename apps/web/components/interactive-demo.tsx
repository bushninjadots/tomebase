'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Code2,
  FileText,
  ArrowRight,
  Check,
  Copy,
  ChevronRight,
  ExternalLink,
  Sparkles,
  BookOpen,
  Search,
  Shield,
  Zap,
} from 'lucide-react';

const SAMPLES: Record<string, string> = {
  typescript: `/**
 * Calculates the total price for an order.
 * @param items - Array of line items
 * @param taxRate - Tax rate as a decimal (e.g. 0.08 for 8%)
 * @param discount - Optional flat discount before tax
 * @returns Total price in cents
 */
export function calculateTotal(
  items: LineItem[],
  taxRate: number,
  discount?: number
): number {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return Math.round((subtotal - (discount ?? 0)) * (1 + taxRate));
}

/**
 * Represents a user account in the system.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: Date;
}

/**
 * Creates a new user account.
 * @param email - User's email address
 * @param name - Display name
 * @param role - Access level (defaults to 'member')
 * @returns Newly created User
 */
export async function createUser(
  email: string,
  name: string,
  role: User['role'] = 'member'
): Promise<User> {
  // implementation
}`,
  javascript: `/**
 * Calculates the total price for an order.
 * @param {LineItem[]} items - Array of line items
 * @param {number} taxRate - Tax rate as a decimal
 * @param {number} [discount] - Optional flat discount
 * @returns {number} Total price in cents
 */
export function calculateTotal(items, taxRate, discount) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return Math.round((subtotal - (discount ?? 0)) * (1 + taxRate));
}

/**
 * Creates a new user account.
 * @param {string} email - User's email address
 * @param {string} name - Display name
 * @returns {User} Newly created User
 */
export async function createUser(email, name) {
  // implementation
}`,
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

import "time"

// User represents a user in the system.
type User struct {
	ID        string
	Name      string
	Email     string
	Role      string
	CreatedAt time.Time
}

// Authenticator handles user authentication.
type Authenticator interface {
	// Authenticate validates credentials and returns a user.
	Authenticate(email, password string) (*User, error)
	// Token generates a session token for a user.
	Token(user *User) (string, error)
}

// NewAuthenticator creates a new Authenticator instance.
func NewAuthenticator(secret string) *authenticator {
	return &authenticator{secret: secret}
}

// Authenticate validates the user's credentials.
func (a *authenticator) Authenticate(email, password string) (*User, error) {
	user, err := a.findUser(email)
	if err != nil {
		return nil, err
	}
	if !a.verifyPassword(password, user.ID) {
		return nil, ErrInvalidCredentials
	}
	return user, nil
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
  openapi: `openapi: "3.0.0"
info:
  title: TomeBase API
  version: "1.0.0"
  description: Documentation platform API
paths:
  /users:
    get:
      summary: List all users
      operationId: listUsers
      tags: [Users]
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/User"
    post:
      summary: Create a user
      operationId: createUser
      tags: [Users]
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUser"
      responses:
        "201":
          description: User created
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
        role:
          type: string
          enum: [admin, member, viewer]`,
};

const languages = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'openapi', label: 'OpenAPI' },
];

const generationSteps = [
  'Parsing source code',
  'Reading comments',
  'Detecting functions',
  'Generating pages',
  'Building navigation',
  'Creating search index',
  'Calculating health score',
  'Preparing publish preview',
];

const previewPages = [
  { id: 'overview', title: 'Overview', icon: BookOpen },
  { id: 'getting-started', title: 'Getting Started', icon: Zap },
  { id: 'api', title: 'API Reference', icon: Code2 },
  { id: 'authentication', title: 'Authentication', icon: Shield },
  { id: 'examples', title: 'Examples', icon: FileText },
  { id: 'changelog', title: 'Changelog', icon: FileText },
];

type DemoState = 'idle' | 'generating' | 'done';

export function InteractiveDemo() {
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState(SAMPLES.typescript);
  const [state, setState] = useState<DemoState>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activePreviewPage, setActivePreviewPage] = useState('overview');
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
    setCode(SAMPLES[lang] || SAMPLES.typescript);
  }, []);

  const startGeneration = useCallback(() => {
    setState('generating');
    setCurrentStep(0);
    setCompletedSteps([]);
  }, []);

  useEffect(() => {
    if (state !== 'generating') return;

    if (currentStep < generationSteps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, currentStep]);
        setCurrentStep((prev) => prev + 1);
      }, 350 + Math.random() * 200);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setState('done'), 600);
      return () => clearTimeout(timer);
    }
  }, [state, currentStep]);

  const reset = useCallback(() => {
    setState('idle');
    setCurrentStep(0);
    setCompletedSteps([]);
    setActivePreviewPage('overview');
  }, []);

  return (
    <section id="try-tomebase" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="eyebrow mb-4">Interactive Demo</p>
          <h2 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl lg:text-5xl">
            Try TomeBase
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-theme-subtle">
            Paste some code and watch TomeBase instantly generate beautiful documentation.
          </p>
        </div>

        {/* Demo container */}
        <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden shadow-2xl">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-theme-border bg-theme-card px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="ml-3 text-xs font-medium text-theme-muted">TomeBase Playground</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <div className="flex rounded-lg border border-theme-border bg-theme-page p-0.5">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                      language === lang.value
                        ? 'bg-theme-accent text-white shadow-sm'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="grid min-h-[500px] lg:grid-cols-2">
            {/* Left: Code editor */}
            <div className="border-r border-theme-border">
              <div className="flex items-center justify-between border-b border-theme-border px-4 py-2">
                <span className="text-xs font-medium text-theme-muted">
                  {languages.find((l) => l.value === language)?.label} Source
                </span>
                <button
                  onClick={() => setCode(SAMPLES[language] || SAMPLES.typescript)}
                  className="text-[11px] font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
                >
                  Reset
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full min-h-[420px] resize-none bg-[#0d0d14] p-5 font-mono text-[12.5px] leading-[1.7] text-[#c9d1d9] outline-none"
                spellCheck={false}
              />
            </div>

            {/* Right: Preview or Generation */}
            <div className="flex flex-col">
              {state === 'idle' && (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-accent/10">
                    <Sparkles className="h-8 w-8 text-theme-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-theme-main mb-2">
                    Ready to generate
                  </h3>
                  <p className="text-sm text-theme-subtle max-w-sm mb-8">
                    Write or paste your code on the left, then click generate to see TomeBase create documentation automatically.
                  </p>
                  <button
                    onClick={startGeneration}
                    disabled={!code?.trim()}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-theme-accent px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all hover:bg-theme-accent-hover hover:shadow-[0_6px_28px_rgba(99,102,241,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Code2 className="h-4.5 w-4.5" />
                    Generate Documentation
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}

              {state === 'generating' && (
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-theme-main mb-1">Generating documentation...</div>
                    <div className="h-1.5 w-full rounded-full bg-theme-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-theme-accent transition-all duration-300"
                        style={{ width: `${(completedSteps.length / generationSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {generationSteps.map((step, i) => {
                      const isDone = completedSteps.includes(i);
                      const isCurrent = currentStep === i && state === 'generating';
                      return (
                        <div
                          key={step}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                            isDone
                              ? 'text-green-400'
                              : isCurrent
                              ? 'text-theme-accent bg-theme-accent/5'
                              : 'text-theme-muted opacity-40'
                          }`}
                        >
                          {isDone ? (
                            <Check className="h-4 w-4 shrink-0" />
                          ) : isCurrent ? (
                            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-theme-accent border-t-transparent animate-spin" />
                          ) : (
                            <div className="h-4 w-4 shrink-0 rounded-full border border-theme-border" />
                          )}
                          {step}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {state === 'done' && (
                <>
                  {/* Publish CTA banner */}
                  <div className="flex items-center justify-between border-b border-theme-border bg-green-500/5 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">Your documentation is ready.</span>
                    </div>
                    <button
                      onClick={() => setShowSignupModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-green-600"
                    >
                      Publish Documentation
                    </button>
                  </div>

                  {/* Documentation preview */}
                  <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <div className="w-52 shrink-0 border-r border-theme-border bg-theme-page/50 p-3 hidden lg:block">
                      <div className="mb-3 px-2">
                        <div className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-3 py-1.5">
                          <Search className="h-3 w-3 text-theme-muted" />
                          <span className="text-[11px] text-theme-muted">Search docs...</span>
                          <kbd className="ml-auto rounded border border-theme-border bg-theme-hover px-1 py-0.5 text-[9px] text-theme-muted">⌘K</kbd>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {previewPages.map((page) => {
                          const Icon = page.icon;
                          const isActive = activePreviewPage === page.id;
                          return (
                            <button
                              key={page.id}
                              onClick={() => setActivePreviewPage(page.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                                isActive
                                  ? 'bg-theme-accent/15 text-theme-accent'
                                  : 'text-theme-subtle hover:bg-theme-hover hover:text-theme-main'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              {page.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                      <PreviewContent page={activePreviewPage} language={language} onNavigate={setActivePreviewPage} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom tips */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Code2, title: 'All languages supported', desc: 'TypeScript, JavaScript, Python, Go, Rust, and OpenAPI specs.' },
            { icon: Zap, title: 'Instant generation', desc: 'Documentation generated in seconds, not hours.' },
            { icon: ExternalLink, title: 'Ready to publish', desc: 'SEO-optimized, responsive, and beautifully designed.' },
          ].map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 rounded-xl border border-theme-border bg-theme-card p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-theme-accent/10">
                <tip.icon className="h-4 w-4 text-theme-accent" />
              </div>
              <div>
                <div className="text-sm font-semibold text-theme-main">{tip.title}</div>
                <div className="text-xs text-theme-muted mt-0.5">{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signup modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSignupModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-theme-border bg-theme-card p-8 shadow-2xl">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute right-4 top-4 text-theme-muted hover:text-theme-main transition-colors"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-accent/10">
                <Sparkles className="h-7 w-7 text-theme-accent" />
              </div>
              <h3 className="text-xl font-bold text-theme-main mb-2">Publish your documentation</h3>
              <p className="text-sm text-theme-subtle mb-6">
                Create a free account to publish your documentation online. No credit card required.
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-theme-accent px-6 py-3 text-[15px] font-bold text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all hover:bg-theme-accent-hover"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-theme-muted">Free forever for solo devs</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PreviewContent({ page, language, onNavigate }: { page: string; language: string; onNavigate: (page: string) => void }) {
  const langLabel = languages.find((l) => l.value === language)?.label || 'TypeScript';

  if (page === 'overview') {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-theme-muted mb-3">
            <span>Docs</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-theme-subtle">Overview</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-theme-main mb-2">Overview</h1>
          <p className="text-sm text-theme-subtle">
            Auto-generated from {langLabel} source code · Health score: <span className="text-amber-400 font-semibold">81</span>
          </p>
        </div>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-theme-subtle leading-relaxed mb-4">
            This documentation was automatically generated from your {langLabel} source code.
            TomeBase analyzed your function signatures, types, and doc comments to create
            structured, searchable documentation pages.
          </p>
          <h3 className="text-sm font-semibold text-theme-main mb-2">What&apos;s included</h3>
          <ul className="space-y-1.5 mb-4">
            {['Function signatures with parameter types', 'JSDoc/docstring descriptions', 'Interface and type definitions', 'Code examples with syntax highlighting', 'Cross-linked references'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-theme-subtle">
                <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-[#0d0d14] p-4 font-mono text-[12px] leading-relaxed">
            <div className="text-[#8b949e]">{`/**`}</div>
            <div className="text-[#8b949e]">{` * Calculates the total price for an order.`}</div>
            <div className="text-[#8b949e]">{` * @param items - Array of line items`}</div>
            <div className="text-[#8b949e]">{` * @param taxRate - Tax rate as a decimal`}</div>
            <div className="text-[#8b949e]">{` */`}</div>
            <div>
              <span className="text-[#ff7b72]">export function </span>
              <span className="text-[#d2a8ff]">calculateTotal</span>
              <span className="text-[#c9d1d9]">(</span>
            </div>
            <div className="pl-4">
              <span className="text-[#c9d1d9]">items: </span>
              <span className="text-[#79c0ff]">LineItem</span>
              <span className="text-[#c9d1d9]">[],</span>
            </div>
            <div className="pl-4">
              <span className="text-[#c9d1d9]">taxRate: </span>
              <span className="text-[#79c0ff]">number</span>
              <span className="text-[#c9d1d9]">,</span>
            </div>
            <div className="pl-4">
              <span className="text-[#c9d1d9]">discount?: </span>
              <span className="text-[#79c0ff]">number</span>
            </div>
            <div><span className="text-[#c9d1d9]">): </span><span className="text-[#79c0ff]">number</span></div>
            <div><span className="text-[#c9d1d9]">{`{`}</span></div>
            <div className="pl-4 text-[#c9d1d9]">...</div>
            <div><span className="text-[#c9d1d9]">{`}`}</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'api') {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-theme-muted mb-3">
            <span>Docs</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-theme-subtle">API Reference</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-theme-main mb-2">API Reference</h1>
          <p className="text-sm text-theme-subtle">Complete API documentation generated from source code.</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-theme-border bg-theme-page/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-green-500/15 px-2 py-0.5 text-[11px] font-bold text-green-400">function</span>
              <code className="font-mono text-sm font-semibold text-theme-main">calculateTotal</code>
            </div>
            <p className="text-xs text-theme-subtle mb-3">Calculates the total price for an order.</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 text-xs">
                <code className="font-mono text-theme-accent">items</code>
                <span className="text-theme-muted">LineItem[]</span>
                <span className="text-theme-muted">— Array of line items</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <code className="font-mono text-theme-accent">taxRate</code>
                <span className="text-theme-muted">number</span>
                <span className="text-theme-muted">— Tax rate as decimal</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <code className="font-mono text-theme-accent">discount?</code>
                <span className="text-theme-muted">number</span>
                <span className="text-theme-muted">— Optional flat discount</span>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-[#0d0d14] p-3 font-mono text-[11px] text-[#c9d1d9]">
              <span className="text-[#ff7b72]">returns </span>
              <span className="text-[#79c0ff]">number</span>
              <span className="text-[#8b949e]"> — Total price in cents</span>
            </div>
          </div>

          <div className="rounded-xl border border-theme-border bg-theme-page/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[11px] font-bold text-blue-400">interface</span>
              <code className="font-mono text-sm font-semibold text-theme-main">User</code>
            </div>
            <p className="text-xs text-theme-subtle mb-3">Represents a user account in the system.</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 text-xs">
                <code className="font-mono text-theme-accent">id</code>
                <span className="text-theme-muted">string</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <code className="font-mono text-theme-accent">email</code>
                <span className="text-theme-muted">string</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <code className="font-mono text-theme-accent">name</code>
                <span className="text-theme-muted">string</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <code className="font-mono text-theme-accent">role</code>
                <span className="text-theme-muted">&apos;admin&apos; | &apos;member&apos; | &apos;viewer&apos;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-theme-muted mb-3">
          <span>Docs</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-theme-subtle">{previewPages.find((p) => p.id === page)?.title}</span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-theme-main mb-2">
          {previewPages.find((p) => p.id === page)?.title}
        </h1>
        <p className="text-sm text-theme-subtle">
          Auto-generated documentation page from {langLabel} source code.
        </p>
      </div>
      <div className="rounded-xl border border-theme-border bg-theme-page/50 p-6 text-center">
        <FileText className="h-8 w-8 text-theme-muted mx-auto mb-3" />
        <p className="text-sm text-theme-subtle">
          Full documentation page with rich content, code examples, and cross-references.
        </p>
        <button
          onClick={() => onNavigate('overview')}
          className="mt-4 text-sm font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
        >
          View Overview →
        </button>
      </div>
    </div>
  );
}

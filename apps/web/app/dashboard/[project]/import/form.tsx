'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fluid/ui';
import { Code2, ArrowRight, Check, AlertCircle } from 'lucide-react';

const languages = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const sampleCode: Record<string, string> = {
  typescript: `/**
 * Calculates the total price including tax and discounts.
 * @param {number} basePrice - The base price before adjustments
 * @param {number} taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @param {number} discount - Discount amount to subtract
 * @returns {number} The final price after all adjustments
 */
export function calculateTotal(basePrice: number, taxRate: number, discount: number = 0): number {
  const tax = basePrice * taxRate;
  return basePrice + tax - discount;
}

/**
 * Represents a user in the system.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
}

/**
 * Creates a new user with the given details.
 * @param {string} name - The user's display name
 * @param {string} email - The user's email address
 * @param {'admin' | 'user'} role - The user's role
 * @returns {User} The newly created user object
 */
export function createUser(name: string, email: string, role: 'admin' | 'user' = 'user'): User {
  return { id: crypto.randomUUID(), name, email, role, createdAt: new Date() };
}`,

  javascript: `/**
 * Calculates the total price including tax and discounts.
 * @param {number} basePrice - The base price before adjustments
 * @param {number} taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @param {number} discount - Discount amount to subtract
 * @returns {number} The final price after all adjustments
 */
export function calculateTotal(basePrice, taxRate, discount = 0) {
  const tax = basePrice * taxRate;
  return basePrice + tax - discount;
}

/**
 * Creates a new user with the given details.
 * @param {string} name - The user's display name
 * @param {string} email - The user's email address
 * @returns {object} The newly created user object
 */
export function createUser(name, email) {
  return { id: crypto.randomUUID(), name, email, createdAt: new Date() };
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
};

interface ImportFormProps {
  projectId: string;
}

export function ImportForm({ projectId }: ImportFormProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    pages: Array<{ id: string; title: string; slug: string }>;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/codegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to generate docs');
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    const sample = sampleCode[language as keyof typeof sampleCode] ?? sampleCode.typescript;
    setCode(sample as string);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="code" className="text-sm font-medium text-theme-subtle">
            Source Code
          </label>
          <button
            type="button"
            onClick={loadSample}
            className="text-xs text-theme-accent hover:text-theme-accent/80 transition-colors"
          >
            Load sample
          </button>
        </div>
        <textarea
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={18}
          className="block w-full rounded-xl border border-theme-border bg-theme-card px-4 py-3 font-mono text-sm leading-relaxed shadow-sm placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
          placeholder={`// Paste your code here...\n// Supported: TypeScript, JavaScript, Python, Go, Rust\n`}
          spellCheck={false}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-1.5">
          <label htmlFor="language" className="text-sm font-medium text-theme-subtle">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-xl border border-theme-border bg-theme-card px-4 py-2.5 text-sm text-theme-main outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-theme-muted pt-6">
          Paste code with doc comments (JSDoc, docstrings, Go doc, Rust doc)
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-green-400">
            <Check className="h-4 w-4" />
            {result.message}
          </div>
          {result.pages.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.pages.map((page) => (
                <li key={page.id}>
                  <a
                    href={`/docs/${projectId}/${page.slug}`}
                    className="text-sm text-green-400 hover:text-green-300 underline underline-offset-2"
                  >
                    {page.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {result.skipped > 0 && (
            <p className="mt-2 text-xs text-green-500">
              {result.skipped} page{result.skipped > 1 ? 's' : ''} skipped (already exist)
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading || !code.trim()} size="lg">
          {loading ? (
            'Generating...'
          ) : (
            <>
              <Code2 className="h-4 w-4" />
              Generate Documentation
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        {result && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/docs/${projectId}`)}
          >
            View Docs
          </Button>
        )}
      </div>
    </form>
  );
}

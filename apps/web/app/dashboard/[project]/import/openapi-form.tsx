'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fluid/ui';
import { FileJson, Upload, ArrowRight, Check, AlertCircle, Globe } from 'lucide-react';

const sampleSpec = `openapi: "3.0.3"
info:
  title: Pet Store API
  description: A sample API for managing pets and orders
  version: "1.0.0"
servers:
  - url: https://api.petstore.example.com/v1
paths:
  /pets:
    get:
      summary: List all pets
      operationId: listPets
      tags:
        - Pets
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
          description: Maximum number of pets to return
        - name: status
          in: query
          required: false
          schema:
            type: string
            enum: [available, pending, sold]
          description: Filter by status
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
    post:
      summary: Create a pet
      operationId: createPet
      tags:
        - Pets
      requestBody:
        required: true
        description: Pet object to add
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
  /pets/{petId}:
    get:
      summary: Get a pet by ID
      operationId: getPetById
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
          description: The ID of the pet
      responses:
        "200":
          description: A single pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
    delete:
      summary: Delete a pet
      operationId: deletePet
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "204":
          description: Deleted successfully
  /orders:
    get:
      summary: List all orders
      operationId: listOrders
      tags:
        - Orders
      responses:
        "200":
          description: A list of orders
    post:
      summary: Place an order
      operationId: placeOrder
      tags:
        - Orders
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                petId:
                  type: integer
                quantity:
                  type: integer
      responses:
        "201":
          description: Order created
components:
  schemas:
    Pet:
      type: object
      required:
        - name
      properties:
        id:
          type: integer
          example: 42
        name:
          type: string
          example: Buddy
        status:
          type: string
          enum: [available, pending, sold]
          example: available`;

interface OpenApiFormProps {
  projectId: string;
}

export function OpenApiForm({ projectId }: OpenApiFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'paste' | 'url'>('paste');
  const [spec, setSpec] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    pages: Array<{ id: string; title: string; slug: string }>;
    total: number;
    skipped: number;
    specTitle: string;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'paste' && !spec.trim()) return;
    if (mode === 'url' && !url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, string> = { projectId };
      if (mode === 'paste') {
        body.spec = spec;
      } else {
        body.url = url;
      }

      const res = await fetch('/api/import/openapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to import spec');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-1 rounded-xl border border-theme-border bg-theme-card p-1">
        <button
          type="button"
          onClick={() => setMode('paste')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'paste'
              ? 'bg-theme-surface text-theme-main shadow-sm border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <FileJson className="inline h-4 w-4 mr-1.5" />
          Paste Spec
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-theme-surface text-theme-main shadow-sm border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <Globe className="inline h-4 w-4 mr-1.5" />
          Fetch from URL
        </button>
      </div>

      {mode === 'paste' ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="spec" className="text-sm font-medium text-theme-subtle">
              OpenAPI Spec (JSON or YAML)
            </label>
            <button
              type="button"
              onClick={() => setSpec(sampleSpec)}
              className="text-xs text-fluid-600 hover:text-fluid-700 transition-colors"
            >
              Load sample
            </button>
          </div>
          <textarea
            id="spec"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            rows={18}
            className="code-editor"
            placeholder={`openapi: "3.0.0"\ninfo:\n  title: My API\n  version: "1.0.0"\npaths:\n  ...`}
            spellCheck={false}
          />
          <p className="text-xs text-theme-muted">
            Supports OpenAPI 3.0 and 3.1 specs in JSON or YAML format.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="url" className="text-sm font-medium text-theme-subtle">
            Spec URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://raw.githubusercontent.com/..."
            className="input-field"
          />
          <p className="text-xs text-theme-muted">
            URL must be publicly accessible and return a valid OpenAPI spec (JSON/YAML).
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-green-800">
            <Check className="h-4 w-4" />
            {result.message}
          </div>
          {result.pages.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.pages.map((page) => (
                <li key={page.id}>
                  <a
                    href={`/docs/${projectId}/${page.slug}`}
                    className="text-sm text-green-700 hover:text-green-800 underline underline-offset-2"
                  >
                    {page.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {result.skipped > 0 && (
            <p className="mt-2 text-xs text-green-600">
              {result.skipped} endpoint{result.skipped > 1 ? 's' : ''} skipped (already exist)
            </p>
          )}
          {result.errors && result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-amber-600 cursor-pointer">
                {result.errors.length} warning{result.errors.length > 1 ? 's' : ''}
              </summary>
              <ul className="mt-1 space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-xs text-amber-600">
                    {err}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading || (mode === 'paste' && !spec.trim()) || (mode === 'url' && !url.trim())} size="lg">
          {loading ? (
            'Importing...'
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import API Endpoints
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

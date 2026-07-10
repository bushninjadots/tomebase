# Importing Code

Auto-generate documentation from your source code or API specs. No manual formatting needed.

## TypeScript / JavaScript Import

Paste TypeScript or JavaScript source code with JSDoc comments. TomeBase parses functions, interfaces, types, enums, and classes into structured Markdown pages.

To import:

1. Open your project's sidebar
2. Click **Import from Code**
3. Paste your source code
4. Select which symbols to include
5. Click **Import**

Each symbol becomes its own page with:
- Signature and type information
- JSDoc descriptions
- Parameter tables
- Return type documentation

## OpenAPI Import

Import OpenAPI 3.x specs in JSON or YAML format. Each endpoint becomes a separate page with:

- Method and path
- Parameters (path, query, header)
- Request body schema
- Response codes and schemas
- Example requests (cURL)

To import:

1. Open your project's sidebar
2. Click **Import from Code**
3. Switch to the **OpenAPI** tab
4. Paste your spec or fetch from a URL
5. Click **Import**

## API Endpoint

For programmatic access, use the code generation endpoint:

```
POST /api/codegen
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{ "code": "function hello(): string { return 'world'; }" }
```

## Related

- [[api-automation|API & Automation]] — API keys, webhooks, CI/CD
- [[writing-docs|Writing Docs]] — Markdown editor and templates

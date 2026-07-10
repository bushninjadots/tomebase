# API & Automation

Integrate TomeBase into your workflows with API keys, webhooks, and programmatic access.

## API Keys

Generate scoped API keys for CI/CD pipelines and automation.

1. Go to **Project Settings**
2. Scroll to **API Keys**
3. Click **Create Key**
4. Copy the key immediately — it's only shown once

Keys are prefixed with `tb_` for easy identification. You can set an optional expiry date and revoke keys at any time.

## Webhooks

Configure webhooks to receive notifications when documentation changes.

Available events:
- `page.created` — a new page is created
- `page.updated` — page content is updated
- `page.published` — a page is published or unpublished

To add a webhook:

1. Go to **Project Settings**
2. Scroll to **Webhooks**
3. Click **Add Webhook**
4. Enter your URL and select events
5. A secret is generated for verifying payloads

## Export

Download all pages as Markdown files with frontmatter metadata:

```
GET /api/projects/[id]/export
```

## Code Generation API

For programmatic doc generation from source code:

```
POST /api/codegen
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{ "code": "export function hello(): string { return 'world'; }" }
```

## Related

- [[importing-code|Importing Code]] — OpenAPI and code import
- [[publishing|Publishing]] — public hosting and custom domains

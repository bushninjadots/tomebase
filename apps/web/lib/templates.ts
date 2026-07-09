export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const templates: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch',
    content: '',
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Quick start guide for users',
    content: `# Getting Started with {{title}}

## Installation

\`\`\`bash
npm install your-package
\`\`\`

## Quick Start

\`\`\`typescript
import { something } from 'your-package';

const result = something({
  option: 'value',
});
console.log(result);
\`\`\`

## Next Steps

- [[Configuration]] — customize to your needs
- [[API Reference]] — explore the full API
`,
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'Document endpoints and methods',
    content: `# {{title}}

## Overview

Brief description of this API endpoint or module.

## Endpoint

\`\`\`
GET /api/v1/resource
\`\`\`

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| \`id\` | \`string\` | Yes | Unique identifier |
| \`limit\` | \`number\` | No | Results per page (default: 20) |

## Request Example

\`\`\`bash
curl -X GET https://api.example.com/v1/resource \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

## Response

\`\`\`json
{
  "id": "abc-123",
  "name": "Example",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

## Error Codes

| Code | Description |
|------|-------------|
| \`400\` | Bad request — invalid parameters |
| \`401\` | Unauthorized — missing or invalid API key |
| \`404\` | Not found — resource does not exist |
`,
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting Guide',
    description: 'Common issues and solutions',
    content: `# {{title}}

## Common Issues

### Issue: Connection refused

**Cause**: The service is not running or the port is blocked.

**Solution**:
1. Check that the service is running: \`systemctl status your-service\`
2. Verify the port is open: \`netstat -tlnp | grep :8080\`
3. Restart the service: \`systemctl restart your-service\`

### Issue: Authentication failed

**Cause**: Invalid or expired credentials.

**Solution**:
1. Regenerate your API key in the dashboard
2. Update your environment variables
3. Verify the key has the correct permissions

## Getting Help

If you continue to experience issues, reach out to our support team with:
- Steps to reproduce
- Relevant error logs
- Your environment details
`,
  },
  {
    id: 'release-notes',
    name: 'Release Notes',
    description: 'Changelog for a new version',
    content: `# {{title}}

**Release date**: {{date}}

## Features

- New feature or major addition

## Improvements

- Performance optimization or UX enhancement

## Bug Fixes

- Bug fix or regression fix

## Breaking Changes

- Changes that require migration or updates

## Deprecations

- Features that are deprecated and will be removed in a future version
`,
  },
];

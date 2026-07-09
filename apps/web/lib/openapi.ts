import * as yaml from 'js-yaml';

interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
  };
  paths: Record<string, Record<string, OpenApiPathItem>>;
  components?: {
    schemas?: Record<string, unknown>;
  };
  tags?: { name: string; description?: string }[];
}

interface OpenApiPathItem {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    description?: string;
    content?: Record<string, { schema?: unknown; example?: unknown }>;
    required?: boolean;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: unknown; example?: unknown }>;
    }
  >;
  deprecated?: boolean;
  security?: Record<string, string[]>[];
}

interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: unknown;
  example?: unknown;
  deprecated?: boolean;
}

export interface EndpointDoc {
  method: string;
  path: string;
  summary: string;
  description: string;
  operationId: string;
  tags: string[];
  parameters: OpenApiParameter[];
  hasRequestBody: boolean;
  requestBodyDescription: string;
  requestBodyExample: string;
  responses: { status: string; description: string; example?: string }[];
  deprecated: boolean;
}

export interface OpenApiParseResult {
  specTitle: string;
  specVersion: string;
  specDescription: string;
  endpoints: EndpointDoc[];
  schemas: string[];
  errors: string[];
}

export function parseOpenApiSpec(specString: string): OpenApiParseResult {
  const errors: string[] = [];
  let spec: OpenApiSpec;

  try {
    const parsed = JSON.parse(specString);
    spec = parsed as OpenApiSpec;
  } catch {
    try {
      const parsed = yaml.load(specString) as OpenApiSpec;
      spec = parsed;
    } catch {
      errors.push('Invalid spec: could not parse as JSON or YAML');
      return {
        specTitle: 'Unknown',
        specVersion: '',
        specDescription: '',
        endpoints: [],
        schemas: [],
        errors,
      };
    }
  }

  if (!spec.openapi) {
    errors.push('Invalid OpenAPI spec: missing "openapi" version field');
  }
  if (!spec.paths || typeof spec.paths !== 'object') {
    errors.push('Invalid OpenAPI spec: missing "paths"');
  }

  const specTitle = spec.info?.title || 'Untitled API';
  const specVersion = spec.info?.version || '';
  const specDescription = spec.info?.description || '';

  const endpoints: EndpointDoc[] = [];

  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

  if (spec.paths && typeof spec.paths === 'object') {
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (!methods || typeof methods !== 'object') continue;
      for (const [method, item] of Object.entries(methods as Record<string, unknown>)) {
        if (!httpMethods.includes(method.toLowerCase())) continue;
        const pathItem = item as OpenApiPathItem;
        if (!pathItem) continue;

        const tags = pathItem.tags || ['default'];

        const parameters = pathItem.parameters || [];

        let requestBodyExample = '';
        if (pathItem.requestBody?.content) {
          for (const [, mediaType] of Object.entries(pathItem.requestBody.content)) {
            if (mediaType.example) {
              requestBodyExample = JSON.stringify(mediaType.example, null, 2);
              break;
            }
            const schema = mediaType.schema as Record<string, unknown> | undefined;
            if (schema?.example) {
              requestBodyExample = JSON.stringify(schema.example, null, 2);
              break;
            }
            if (schema?.properties) {
              const example = generateExampleFromSchema(schema);
              requestBodyExample = JSON.stringify(example, null, 2);
              break;
            }
          }
        }

        const responses: { status: string; description: string; example?: string }[] = [];
        if (pathItem.responses) {
          for (const [status, resp] of Object.entries(pathItem.responses)) {
            let example = '';
            if (resp.content) {
              for (const [, mediaType] of Object.entries(resp.content)) {
                if (mediaType.example) {
                  example = JSON.stringify(mediaType.example, null, 2);
                  break;
                }
                const schema = mediaType.schema as Record<string, unknown> | undefined;
                if (schema?.example) {
                  example = JSON.stringify(schema.example, null, 2);
                  break;
                }
                if (schema?.properties) {
                  const ex = generateExampleFromSchema(schema);
                  example = JSON.stringify(ex, null, 2);
                  break;
                }
              }
            }
            responses.push({
              status,
              description: resp.description || '',
              example: example || undefined,
            });
          }
        }

        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: pathItem.summary || '',
          description: pathItem.description || '',
          operationId: pathItem.operationId || '',
          tags,
          parameters,
          hasRequestBody: !!pathItem.requestBody,
          requestBodyDescription: pathItem.requestBody?.description || '',
          requestBodyExample,
          responses,
          deprecated: !!pathItem.deprecated,
        });
      }
    }
  }

  endpoints.sort((a, b) => a.path.localeCompare(b.path));

  const schemaNames: string[] = [];
  if (spec.components?.schemas) {
    for (const name of Object.keys(spec.components.schemas)) {
      schemaNames.push(name);
    }
  }

  return {
    specTitle,
    specVersion,
    specDescription,
    endpoints,
    schemas: schemaNames,
    errors,
  };
}

function generateExampleFromSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const example: Record<string, unknown> = {};
  const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!props) return example;
  for (const [key, prop] of Object.entries(props)) {
    example[key] = generateValueFromSchema(prop);
  }
  return example;
}

function generateValueFromSchema(schema: Record<string, unknown>): unknown {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return generateExampleFromSchema(schema);
    default:
      if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
        return schema.enum[0];
      }
      if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
        return generateValueFromSchema(schema.oneOf[0] as Record<string, unknown>);
      }
      return null;
  }
}

export function endpointsToMarkdown(
  endpoints: EndpointDoc[],
  specTitle: string,
): string {
  // Group endpoints by their first tag
  const grouped = new Map<string, EndpointDoc[]>();
  for (const ep of endpoints) {
    const tag = ep.tags[0] || 'default';
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag)!.push(ep);
  }

  const lines: string[] = [];
  lines.push(`# ${specTitle} API Reference`);
  lines.push('');

  let endpointIndex = 0;
  for (const [tag, tagEndpoints] of grouped) {
    lines.push(`## ${tag}`);
    lines.push('');

    for (const ep of tagEndpoints) {
      const id = `endpoint-${endpointIndex++}`;
      const methodColor = getMethodColor(ep.method);

      lines.push(`### ${ep.summary || ep.path}`);
      lines.push('');

      if (ep.deprecated) {
        lines.push('> ⚠️ **Deprecated** — This endpoint is deprecated and may be removed in a future version.');
        lines.push('');
      }

      if (ep.description) {
        lines.push(ep.description);
        lines.push('');
      }

      lines.push(`\`\`\`http`);
      lines.push(`${ep.method} ${ep.path}`);
      lines.push(`\`\`\``);
      lines.push('');

      if (ep.parameters.length > 0) {
        lines.push('**Parameters**');
        lines.push('');
        lines.push('| Name | In | Type | Required | Description |');
        lines.push('|------|----|------|----------|-------------|');
        for (const param of ep.parameters) {
          const schema = param.schema as { type?: string } | undefined;
          const paramType = schema?.type || 'string';
          lines.push(
            `| \`${param.name}\` | ${param.in} | ${paramType} | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |`,
          );
        }
        lines.push('');
      }

      if (ep.hasRequestBody) {
        lines.push('**Request Body**');
        if (ep.requestBodyDescription) {
          lines.push('');
          lines.push(ep.requestBodyDescription);
        }
        if (ep.requestBodyExample) {
          lines.push('');
          lines.push('```json');
          lines.push(ep.requestBodyExample);
          lines.push('```');
        }
        lines.push('');
      }

      if (ep.responses.length > 0) {
        lines.push('**Responses**');
        lines.push('');
        for (const resp of ep.responses) {
          const statusNum = parseInt(resp.status, 10);
          const isSuccess = statusNum >= 200 && statusNum < 300;
          lines.push(`- **${resp.status}** ${isSuccess ? '✅' : ''} — ${resp.description || 'No description'}`);
          if (resp.example) {
            lines.push('');
            lines.push('  ```json');
            for (const exLine of resp.example.split('\n')) {
              lines.push(`  ${exLine}`);
            }
            lines.push('  ```');
          }
        }
        lines.push('');
      }

      lines.push(`> **Operation ID:** \`${ep.operationId || '—'}\``);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#059669',
    POST: '#2563eb',
    PUT: '#d97706',
    PATCH: '#7c3aed',
    DELETE: '#dc2626',
    OPTIONS: '#0891b2',
    HEAD: '#4b5563',
    TRACE: '#6b7280',
  };
  return colors[method] || '#6b7280';
}

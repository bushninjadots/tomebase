import { describe, it, expect } from 'vitest';
import { parseOpenApiSpec, endpointsToMarkdown } from './openapi';

const basicSpec = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0', description: 'A test API' },
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        description: 'Returns all users',
        operationId: 'listUsers',
        tags: ['users'],
        parameters: [
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer' }, description: 'Max results' },
        ],
        responses: {
          '200': { description: 'Success', content: { 'application/json': { example: [{ id: 1, name: 'Alice' }] } } },
        },
      },
      post: {
        summary: 'Create user',
        operationId: 'createUser',
        tags: ['users'],
        requestBody: {
          description: 'User to create',
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } } } },
        },
        responses: {
          '201': { description: 'Created' },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        operationId: 'getUser',
        tags: ['users'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' },
        ],
        responses: {
          '200': { description: 'Success' },
          '404': { description: 'Not found' },
        },
      },
    },
  },
  components: {
    schemas: { User: { type: 'object', properties: { id: { type: 'string' } } } },
  },
});

describe('parseOpenApiSpec', () => {
  it('parses a valid JSON spec', () => {
    const result = parseOpenApiSpec(basicSpec);
    expect(result.specTitle).toBe('Test API');
    expect(result.specVersion).toBe('1.0.0');
    expect(result.specDescription).toBe('A test API');
    expect(result.endpoints).toHaveLength(3);
    expect(result.errors).toEqual([]);
  });

  it('parses a valid YAML spec', () => {
    const yaml = `
openapi: "3.0.0"
info:
  title: YAML API
  version: "2.0"
paths:
  /items:
    get:
      summary: List items
      operationId: listItems
      responses:
        "200":
          description: OK
`;
    const result = parseOpenApiSpec(yaml);
    expect(result.specTitle).toBe('YAML API');
    expect(result.specVersion).toBe('2.0');
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]!.method).toBe('GET');
    expect(result.endpoints[0]!.path).toBe('/items');
  });

  it('returns errors for invalid JSON and YAML', () => {
    const result = parseOpenApiSpec('{ invalid json {{{');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.endpoints).toHaveLength(0);
  });

  it('returns error for missing openapi version', () => {
    const spec = JSON.stringify({ info: { title: 'API' }, paths: {} });
    const result = parseOpenApiSpec(spec);
    expect(result.errors).toContainEqual('Invalid OpenAPI spec: missing "openapi" version field');
  });

  it('returns error for missing paths', () => {
    const spec = JSON.stringify({ openapi: '3.0.0', info: { title: 'API' } });
    const result = parseOpenApiSpec(spec);
    expect(result.errors).toContainEqual('Invalid OpenAPI spec: missing "paths"');
  });

  it('extracts endpoint parameters', () => {
    const result = parseOpenApiSpec(basicSpec);
    const getUser = result.endpoints.find((e) => e.operationId === 'getUser');
    expect(getUser?.parameters).toHaveLength(1);
    expect(getUser?.parameters[0]!.name).toBe('id');
    expect(getUser?.parameters[0]!.in).toBe('path');
    expect(getUser?.parameters[0]!.required).toBe(true);
  });

  it('detects request body', () => {
    const result = parseOpenApiSpec(basicSpec);
    const createUser = result.endpoints.find((e) => e.operationId === 'createUser');
    expect(createUser?.hasRequestBody).toBe(true);
    expect(createUser?.requestBodyDescription).toBe('User to create');
  });

  it('extracts response examples', () => {
    const result = parseOpenApiSpec(basicSpec);
    const listUsers = result.endpoints.find((e) => e.operationId === 'listUsers');
    expect(listUsers?.responses[0]!.status).toBe('200');
    expect(listUsers?.responses[0]!.example).toContain('Alice');
  });

  it('extracts schema names', () => {
    const result = parseOpenApiSpec(basicSpec);
    expect(result.schemas).toEqual(['User']);
  });

  it('handles deprecated endpoints', () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0' },
      paths: {
        '/old': { get: { summary: 'Old endpoint', deprecated: true, operationId: 'old' } },
      },
    });
    const result = parseOpenApiSpec(spec);
    expect(result.endpoints[0]!.deprecated).toBe(true);
  });

  it('sorts endpoints by path', () => {
    const result = parseOpenApiSpec(basicSpec);
    const paths = result.endpoints.map((e) => e.path);
    expect(paths).toEqual(['/users', '/users', '/users/{id}']);
  });

  it('defaults tags to ["default"] when none provided', () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0' },
      paths: {
        '/test': { get: { operationId: 'test' } },
      },
    });
    const result = parseOpenApiSpec(spec);
    expect(result.endpoints[0]!.tags).toEqual(['default']);
  });
});

describe('endpointsToMarkdown', () => {
  it('generates markdown from endpoints', () => {
    const result = parseOpenApiSpec(basicSpec);
    const md = endpointsToMarkdown(result.endpoints, result.specTitle);
    expect(md).toContain('# Test API API Reference');
    expect(md).toContain('## users');
    expect(md).toContain('List users');
    expect(md).toContain('GET /users');
    expect(md).toContain('POST /users');
    expect(md).toContain('Parameters');
    expect(md).toContain('Request Body');
    expect(md).toContain('Responses');
  });

  it('marks deprecated endpoints', () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0' },
      paths: {
        '/old': { get: { summary: 'Old', deprecated: true, operationId: 'old' } },
      },
    });
    const result = parseOpenApiSpec(spec);
    const md = endpointsToMarkdown(result.endpoints, 'Test');
    expect(md).toContain('Deprecated');
  });

  it('includes operation IDs', () => {
    const result = parseOpenApiSpec(basicSpec);
    const md = endpointsToMarkdown(result.endpoints, 'Test');
    expect(md).toContain('listUsers');
    expect(md).toContain('createUser');
  });
});

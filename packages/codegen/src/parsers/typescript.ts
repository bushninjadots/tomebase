import type { ParseResult, ParsedExport, ParsedFunction, ParsedInterface, ParsedType, ParsedClass, ParsedEnum, Param, Prop } from '../types';

function extractComment(lines: string[], idx: number): { comment: string; endIdx: number } {
  let comment = '';
  let i = idx;

  // Skip blank lines
  while (i < lines.length && lines[i]!.trim() === '') i++;

  // Check for JSDoc comment
    if (i < lines.length && lines[i]!.trimStart().startsWith('/**')) {
    const start = i;
    i++;
    while (i < lines.length && !lines[i]!.trimEnd().endsWith('*/')) {
      comment += lines[i]!.replace(/^\s*\*\s?/, '') + '\n';
      i++;
    }
    if (i < lines.length) {
      comment += lines[i]!.replace(/^\s*\*\/\s*/, '').replace(/^\s*\*\s?/, '');
    }
    i++;
    comment = comment.trim();
  }

  return { comment, endIdx: i };
}

function extractParams(tag: string): Param[] {
  const params: Param[] = [];
  const regex = /@param\s+{?(\w+)}?\s+(\w+)\s*-?\s*(.*)/g;
  let match;
  while ((match = regex.exec(tag)) !== null) {
    params.push({
      type: match[1]!,
      name: match[2]!,
      description: match[3]?.trim() ?? '',
      optional: match[2]!.endsWith('?'),
    });
  }
  return params;
}

function extractReturns(comment: string): { type: string; description: string } {
  const match = comment.match(/@returns?\s+{?(\w+)}?\s*(.*)/);
  if (match) {
    return { type: match[1] ?? 'void', description: match[2]?.trim() ?? '' };
  }
  return { type: 'void', description: '' };
}

function parseFunction(lines: string[], i: number): { func: ParsedFunction; endLine: number } | null {
  const line = lines[i]!;
  const fnMatch = line.match(
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)\s*(?::\s*([^{]+))?/,
  );
  if (!fnMatch) return null;

  const params: Param[] = fnMatch[2]!
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const parts = p.trim().split(/\s*:\s*/);
      const name = parts[0]?.replace('?', '') ?? '';
      return {
        name,
        type: parts[1] ?? 'any',
        description: '',
        optional: parts[0]?.includes('?') ?? false,
      };
    });

  const func: ParsedFunction = {
    kind: 'function',
    name: fnMatch[1]!,
    signature: line.trim(),
    description: '',
    params,
    returnType: fnMatch[3]?.trim() ?? 'void',
    returnDescription: '',
    lineNumber: i + 1,
  };

  return { func, endLine: i + 1 };
}

function parseInterface(lines: string[], i: number): { iface: ParsedInterface; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?interface\s+(\w+)/);
  if (!match) return null;

  const properties: Prop[] = [];
  let j = i + 1;
  while (j < lines.length && !lines[j]!.trim().startsWith('}')) {
    const propMatch = lines[j]!.match(
      /^\s*(readonly\s+)?(\w+\??)\s*(?::\s*([^;]+))?/,
    );
    if (propMatch) {
      properties.push({
        name: propMatch[2]!.replace('?', ''),
        type: propMatch[3]?.trim() ?? 'unknown',
        description: '',
        optional: propMatch[2]!.includes('?'),
      });
    }
    j++;
  }

  const iface: ParsedInterface = {
    kind: 'interface',
    name: match[1]!,
    description: '',
    properties,
    lineNumber: i + 1,
  };

  return { iface, endLine: j + 1 };
}

function parseType(lines: string[], i: number): { type: ParsedType; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?type\s+(\w+)\s*=\s*(.*)/);
  if (!match) return null;

  const type: ParsedType = {
    kind: 'type',
    name: match[1]!,
    description: '',
    definition: match[2]!.trim(),
    lineNumber: i + 1,
  };

  return { type, endLine: i + 1 };
}

function parseEnum(lines: string[], i: number): { enm: ParsedEnum; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?enum\s+(\w+)/);
  if (!match) return null;

  const members: string[] = [];
  let j = i + 1;
  while (j < lines.length && !lines[j]!.trim().startsWith('}')) {
    const memberMatch = lines[j]!.match(/^\s*(\w+)/);
    if (memberMatch) members.push(memberMatch[1]!);
    j++;
  }

  const enm: ParsedEnum = {
    kind: 'enum',
    name: match[1]!,
    description: '',
    members,
    lineNumber: i + 1,
  };

  return { enm, endLine: j + 1 };
}

function parseClass(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
  if (!match) return null;

  const cls: ParsedClass = {
    kind: 'class',
    name: match[1]!,
    description: '',
    methods: [],
    properties: [],
    lineNumber: i + 1,
  };

  let j = i + 1;
  let braceDepth = 1;
  while (j < lines.length && braceDepth > 0) {
    const cl = lines[j]!;
    braceDepth += (cl.match(/{/g) ?? []).length;
    braceDepth -= (cl.match(/}/g) ?? []).length;

    const fnMatch = cl.match(
      /(?:public|private|protected|static)?\s*(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?/,
    );
    if (fnMatch && !fnMatch[1]?.startsWith('constructor')) {
      const params: Param[] = fnMatch[2]!
        .split(',')
        .filter(Boolean)
        .map((p) => {
          const parts = p.trim().split(/\s*:\s*/);
          const name = parts[0]?.replace('?', '') ?? '';
          return {
            name,
            type: parts[1] ?? 'any',
            description: '',
            optional: parts[0]?.includes('?') ?? false,
          };
        });

      cls.methods.push({
        kind: 'function',
        name: fnMatch[1]!,
        signature: cl.trim(),
        description: '',
        params,
        returnType: fnMatch[3]?.trim() ?? 'void',
        returnDescription: '',
        lineNumber: j + 1,
      });
    }

    const propMatch = cl.match(/^\s*(?:public|private|protected|readonly|static)\s+(\w+\??)\s*(?::\s*([^=;]+))?/);
    if (propMatch && !cl.includes('(')) {
      cls.properties.push({
        name: propMatch[1]!.replace('?', ''),
        type: propMatch[2]?.trim() ?? 'unknown',
        description: '',
        optional: propMatch[1]!.includes('?'),
      });
    }

    j++;
  }

  return { cls, endLine: j };
}

export function parseTypeScript(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Skip empty lines and decorators
    if (line.trim() === '' || line.trimStart().startsWith('@') || line.trimStart().startsWith('//')) {
      i++;
      continue;
    }

    // Extract preceding comment
    const { comment, endIdx } = extractComment(lines, i);
    i = endIdx;

    if (i >= lines.length) break;

    // Try to parse various constructs
    const fn = parseFunction(lines, i);
    if (fn) {
      fn.func.description = comment;
      const rt = extractReturns(comment);
      fn.func.returnDescription = rt.description;
      if (rt.type !== 'void') fn.func.returnType = rt.type;
      const params = extractParams(comment);
      if (params.length > 0) fn.func.params = params;
      exports.push(fn.func);
      i = fn.endLine;
      continue;
    }

    const iface = parseInterface(lines, i);
    if (iface) {
      iface.iface.description = comment;
      exports.push(iface.iface);
      i = iface.endLine;
      continue;
    }

    const t = parseType(lines, i);
    if (t) {
      t.type.description = comment;
      exports.push(t.type);
      i = t.endLine;
      continue;
    }

    const enm = parseEnum(lines, i);
    if (enm) {
      enm.enm.description = comment;
      exports.push(enm.enm);
      i = enm.endLine;
      continue;
    }

    const cls = parseClass(lines, i);
    if (cls) {
      cls.cls.description = comment;
      exports.push(cls.cls);
      i = cls.endLine;
      continue;
    }

    i++;
  }

  return { exports, raw: code, language: 'typescript' };
}

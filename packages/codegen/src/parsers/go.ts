import type { ParseResult, ParsedExport, ParsedFunction, ParsedInterface, ParsedClass, Param, Prop } from '../types';

function extractComment(lines: string[], idx: number): { comment: string; endIdx: number } {
  let i = idx;
  while (i < lines.length && lines[i]!.trim() === '') i++;

  if (i < lines.length && lines[i]!.trim().startsWith('//')) {
    let comment = '';
    while (i < lines.length && lines[i]!.trim().startsWith('//')) {
      comment += lines[i]!.trim().replace(/^\/\/\s?/, '') + '\n';
      i++;
    }
    return { comment: comment.trim(), endIdx: i };
  }
  return { comment: '', endIdx: idx };
}

function parseFunction(lines: string[], i: number): { func: ParsedFunction; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(([^)]*)\)\s*(?:\(([^)]+)\)|(\S+))?/);
  if (!match) return null;

  const params: Param[] = match[2]!
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const parts = p.trim().split(/\s+/);
      if (parts.length >= 2) {
        return {
          name: parts[0]!,
          type: parts.slice(1).join(' '),
          description: '',
          optional: false,
        };
      }
      return { name: p.trim(), type: 'interface{}', description: '', optional: false };
    });

  const returnType = match[3]?.trim() ?? match[4]?.trim() ?? 'void';

  const func: ParsedFunction = {
    kind: 'function',
    name: match[1]!,
    signature: line.trim(),
    description: '',
    params,
    returnType,
    returnDescription: '',
    lineNumber: i + 1,
  };

  let j = i + 1;
  let braceDepth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.includes('{')) braceDepth += (cl.match(/{/g) ?? []).length;
    if (cl.includes('}')) braceDepth -= (cl.match(/}/g) ?? []).length;
    if (braceDepth <= 0 && cl.includes('}')) { j++; break; }
    j++;
  }

  return { func, endLine: j };
}

function parseInterface(lines: string[], i: number): { iface: ParsedInterface; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^type\s+(\w+)\s+interface\s*\{/);
  if (!match) return null;

  const properties: Prop[] = [];
  let j = i + 1;
  while (j < lines.length && !lines[j]!.trim().startsWith('}')) {
    const methodMatch = lines[j]!.trim().match(/^(\w+)\s*\(([^)]*)\)\s*(\S+)/);
    if (methodMatch) {
      properties.push({
        name: methodMatch[1]!,
        type: `func(${methodMatch[2]}) ${methodMatch[3]}`,
        description: '',
        optional: false,
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

function parseStruct(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^type\s+(\w+)\s+struct\s*\{/);
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
  while (j < lines.length && !lines[j]!.trim().startsWith('}')) {
    const propMatch = lines[j]!.trim().match(/^(\w+)\s+(\S+)/);
    if (propMatch) {
      cls.properties.push({
        name: propMatch[1]!,
        type: propMatch[2]!,
        description: '',
        optional: false,
      });
    }
    j++;
  }

  return { cls, endLine: j + 1 };
}

export function parseGo(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trim().startsWith('//')) {
      i++;
      continue;
    }

    const { comment, endIdx } = extractComment(lines, i);
    i = endIdx;

    if (i >= lines.length) break;

    const func = parseFunction(lines, i);
    if (func) {
      func.func.description = comment;
      exports.push(func.func);
      i = func.endLine;
      continue;
    }

    const iface = parseInterface(lines, i);
    if (iface) {
      iface.iface.description = comment;
      exports.push(iface.iface);
      i = iface.endLine;
      continue;
    }

    const cls = parseStruct(lines, i);
    if (cls) {
      cls.cls.description = comment;
      exports.push(cls.cls);
      i = cls.endLine;
      continue;
    }

    i++;
  }

  return { exports, raw: code, language: 'go' };
}

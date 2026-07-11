import type { ParseResult, ParsedExport, ParsedFunction, ParsedClass, ParsedInterface, Param, Prop } from '../types';

function extractDocComment(lines: string[], idx: number): { comment: string; endIdx: number } {
  let i = idx;
  while (i < lines.length && lines[i]!.trim() === '') i++;

  if (i < lines.length && lines[i]!.trim().startsWith('///')) {
    let comment = '';
    while (i < lines.length && lines[i]!.trim().startsWith('///')) {
      comment += lines[i]!.trim().replace(/^\/\/\/\s?/, '') + '\n';
      i++;
    }
    return { comment: comment.trim(), endIdx: i };
  }
  return { comment: '', endIdx: idx };
}

function parseFunction(lines: string[], i: number): { func: ParsedFunction; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*->\s*(\S+))?/);
  if (!match) return null;

  const params: Param[] = match[2]!
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const parts = p.trim().split(/\s*:\s*/);
      return {
        name: parts[0]!.replace('&', '').replace('mut ', ''),
        type: parts[1]?.trim() ?? '_',
        description: '',
        optional: false,
      };
    });

  const func: ParsedFunction = {
    kind: 'function',
    name: match[1]!,
    signature: line.trim(),
    description: '',
    params,
    returnType: match[3]?.trim() ?? '()',
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

function parseStruct(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:pub\s+)?struct\s+(\w+)(?:<[^>]+>)?\s*\{/);
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
    const propMatch = lines[j]!.trim().match(/^(?:pub\s+)?(\w+)\s*:\s*(\S+)/);
    if (propMatch) {
      cls.properties.push({
        name: propMatch[1]!,
        type: propMatch[2]!.replace(',', ''),
        description: '',
        optional: false,
      });
    }
    j++;
  }

  return { cls, endLine: j + 1 };
}

function parseTrait(lines: string[], i: number): { iface: ParsedInterface; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:pub\s+)?trait\s+(\w+)(?:<[^>]+>)?\s*\{/);
  if (!match) return null;

  const iface: ParsedInterface = {
    kind: 'interface',
    name: match[1]!,
    description: '',
    properties: [],
    lineNumber: i + 1,
  };

  let j = i + 1;
  while (j < lines.length && !lines[j]!.trim().startsWith('}')) {
    const methodMatch = lines[j]!.trim().match(/^(?:fn\s+)?(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?/);
    if (methodMatch && methodMatch[1]) {
      iface.properties.push({
        name: methodMatch[1]!,
        type: `fn(${methodMatch[2]})${methodMatch[3] ? ` -> ${methodMatch[3]}` : ''}`,
        description: '',
        optional: false,
      });
    }
    j++;
  }

  return { iface, endLine: j + 1 };
}

function parseEnum(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:pub\s+)?enum\s+(\w+)(?:<[^>]+>)?\s*\{/);
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
    const memberMatch = lines[j]!.trim().match(/^(\w+)/);
    if (memberMatch && memberMatch[1] !== 'fn') {
      cls.properties.push({
        name: memberMatch[1]!,
        type: 'variant',
        description: '',
        optional: false,
      });
    }
    j++;
  }

  return { cls, endLine: j + 1 };
}

export function parseRust(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trim().startsWith('//')) {
      i++;
      continue;
    }

    const { comment, endIdx } = extractDocComment(lines, i);
    i = endIdx;

    if (i >= lines.length) break;

    const func = parseFunction(lines, i);
    if (func) {
      func.func.description = comment;
      exports.push(func.func);
      i = func.endLine;
      continue;
    }

    const cls = parseStruct(lines, i);
    if (cls) {
      cls.cls.description = comment;
      exports.push(cls.cls);
      i = cls.endLine;
      continue;
    }

    const iface = parseTrait(lines, i);
    if (iface) {
      iface.iface.description = comment;
      exports.push(iface.iface);
      i = iface.endLine;
      continue;
    }

    const enm = parseEnum(lines, i);
    if (enm) {
      enm.cls.description = comment;
      exports.push(enm.cls);
      i = enm.endLine;
      continue;
    }

    i++;
  }

  return { exports, raw: code, language: 'rust' };
}

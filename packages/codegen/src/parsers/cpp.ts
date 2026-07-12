import type { ParseResult, ParsedExport, ParsedFunction, ParsedClass, ParsedInterface, Param, Prop } from '../types';

function extractComment(lines: string[], idx: number): { comment: string; endIdx: number } {
  let i = idx;
  while (i < lines.length && lines[i]!.trim() === '') i++;

  if (i < lines.length && lines[i]!.trim().startsWith('/**')) {
    let comment = '';
    const startLine = lines[i]!.trim();
    if (startLine.includes('*/')) {
      comment = startLine.replace(/^\/\*\*?\s?/, '').replace(/\*\/$/, '').trim();
      return { comment, endIdx: i + 1 };
    }
    comment += startLine.replace(/^\/\*\*?\s?/, '') + '\n';
    i++;
    while (i < lines.length && !lines[i]!.trim().startsWith('*/')) {
      comment += lines[i]!.trim().replace(/^\*\s?/, '') + '\n';
      i++;
    }
    if (i < lines.length) i++;
    return { comment: comment.trim(), endIdx: i };
  }

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
  const match = line.match(/^(?:[\w:*&<>\s]+\s+)?(\w+)\s*\(([^)]*)\)(?:\s*(?:const|override|final|noexcept|=\s*0|\{))?/);
  if (!match) return null;
  if (['if', 'for', 'while', 'switch', 'return', 'class', 'struct', 'enum', 'namespace', 'using', 'template'].includes(match[1]!)) return null;

  const params: Param[] = match[2]!
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const parts = p.trim().split(/\s+/);
      if (parts.length >= 2) {
        return {
          name: parts[parts.length - 1]!.replace(/[=].*/, '').replace(/[\*&]/g, ''),
          type: parts.slice(0, -1).join(' '),
          description: '',
          optional: parts[parts.length - 1]!.includes('='),
        };
      }
      return { name: p.trim(), type: 'auto', description: '', optional: false };
    });

  let j = i + 1;
  let braceDepth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.includes('{')) braceDepth += (cl.match(/{/g) ?? []).length;
    if (cl.includes('}')) braceDepth -= (cl.match(/}/g) ?? []).length;
    if (braceDepth <= 0 && cl.includes('}')) { j++; break; }
    if (braceDepth <= 0 && cl.includes(';')) { j++; break; }
    j++;
  }

  return {
    func: {
      kind: 'function',
      name: match[1]!,
      signature: line.trim().replace(/\s*\{.*$/, '').replace(/;\s*$/, ''),
      description: '',
      params,
      returnType: 'auto',
      returnDescription: '',
      lineNumber: i + 1,
    },
    endLine: j,
  };
}

function parseClass(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:class|struct)\s+(\w+)(?:\s*:\s*[^{]+)?\s*\{/);
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
    if (cl.includes('{')) braceDepth += (cl.match(/{/g) ?? []).length;
    if (cl.includes('}')) braceDepth -= (cl.match(/}/g) ?? []).length;

    const propMatch = cl.trim().match(/^(?:[\w<>\[\],\s*]+)\s+(\w+)\s*(?:;|=)/);
    if (propMatch && propMatch[1] && !['if', 'for', 'while', 'return'].includes(propMatch[1])) {
      cls.properties.push({
        name: propMatch[1]!,
        type: 'member',
        description: '',
        optional: false,
      });
    }

    const funcResult = parseFunction(lines, j);
    if (funcResult && braceDepth >= 1) {
      cls.methods.push(funcResult.func);
      j = funcResult.endLine;
      continue;
    }
    j++;
  }

  return { cls, endLine: j };
}

function parseEnum(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^enum\s+(?:class\s+)?(\w+)(?:\s*:\s*\w+)?\s*\{/);
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
    if (memberMatch && memberMatch[1] !== 'enum') {
      cls.properties.push({
        name: memberMatch[1]!,
        type: 'enumerator',
        description: '',
        optional: false,
      });
    }
    j++;
  }

  return { cls, endLine: j + 1 };
}

export function parseCpp(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trim().startsWith('//') || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    const { comment, endIdx } = extractComment(lines, i);
    i = endIdx;
    if (i >= lines.length) break;

    const cls = parseClass(lines, i);
    if (cls) {
      cls.cls.description = comment;
      exports.push(cls.cls);
      i = cls.endLine;
      continue;
    }

    const enm = parseEnum(lines, i);
    if (enm) {
      enm.cls.description = comment;
      exports.push(enm.cls);
      i = enm.endLine;
      continue;
    }

    const func = parseFunction(lines, i);
    if (func) {
      func.func.description = comment;
      exports.push(func.func);
      i = func.endLine;
      continue;
    }

    i++;
  }

  return { exports, raw: code, language: 'cpp' };
}

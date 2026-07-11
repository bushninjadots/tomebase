import type { ParseResult, ParsedExport, ParsedFunction, ParsedClass, Param, Prop } from '../types';

function extractDocstring(lines: string[], idx: number): { comment: string; endIdx: number } {
  let i = idx;
  while (i < lines.length && lines[i]!.trim() === '') i++;

  if (i < lines.length && (lines[i]!.trim().startsWith('"""') || lines[i]!.trim().startsWith("'''"))) {
    const quote = lines[i]!.trim().startsWith('"""') ? '"""' : "'''";
    const firstLine = lines[i]!.trim().slice(3);
    if (firstLine.endsWith(quote) && firstLine.length > 3) {
      return { comment: firstLine.slice(0, -3).trim(), endIdx: i + 1 };
    }
    i++;
    let comment = firstLine ? firstLine + '\n' : '';
    while (i < lines.length && !lines[i]!.trim().startsWith(quote)) {
      comment += lines[i]!.trim() + '\n';
      i++;
    }
    i++;
    return { comment: comment.trim(), endIdx: i };
  }
  return { comment: '', endIdx: idx };
}

function parseFunction(lines: string[], i: number): { func: ParsedFunction; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?/);
  if (!match) return null;

  const params: Param[] = match[3]!
    .split(',')
    .filter((p) => p.trim() && p.trim() !== 'self' && p.trim() !== 'cls')
    .map((p) => {
      const parts = p.trim().split(/\s*:\s*/);
      const defaultParts = parts[0]!.split(/\s*=\s*/);
      return {
        name: defaultParts[0]!.trim(),
        type: parts[1]?.trim() ?? 'Any',
        description: '',
        optional: defaultParts.length > 1,
      };
    });

  const func: ParsedFunction = {
    kind: 'function',
    name: match[2]!,
    signature: line.trim(),
    description: '',
    params,
    returnType: match[4]?.trim() ?? 'None',
    returnDescription: '',
    lineNumber: i + 1,
  };

  // Skip to end of function (next def or class or top-level)
  let j = i + 1;
  while (j < lines.length) {
    const next = lines[j]!;
    if (next.trim() !== '' && !next.startsWith(' ') && !next.startsWith('\t') && !next.startsWith('#')) break;
    j++;
  }

  return { func, endLine: j };
}

function parseClass(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^class\s+(\w+)(?:\(([^)]*)\))?:/);
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
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.trim() !== '' && !cl.startsWith(' ') && !cl.startsWith('\t')) break;

    const methodMatch = cl.match(/^\s+(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?/);
    if (methodMatch && methodMatch[1] !== '__init__') {
      const params: Param[] = methodMatch[2]!
        .split(',')
        .filter((p) => p.trim() && p.trim() !== 'self' && p.trim() !== 'cls')
        .map((p) => {
          const parts = p.trim().split(/\s*:\s*/);
          return {
            name: parts[0]!.trim(),
            type: parts[1]?.trim() ?? 'Any',
            description: '',
            optional: false,
          };
        });

      cls.methods.push({
        kind: 'function',
        name: methodMatch[1]!,
        signature: cl.trim(),
        description: '',
        params,
        returnType: methodMatch[3]?.trim() ?? 'None',
        returnDescription: '',
        lineNumber: j + 1,
      });
    }

    const propMatch = cl.match(/^\s+(\w+)\s*:\s*(\S+)/);
    if (propMatch && !cl.includes('def ') && !cl.includes('=')) {
      cls.properties.push({
        name: propMatch[1]!,
        type: propMatch[2]!,
        description: '',
        optional: false,
      });
    }

    j++;
  }

  return { cls, endLine: j };
}

export function parsePython(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    const { comment, endIdx } = extractDocstring(lines, i);
    i = endIdx;

    if (i >= lines.length) break;

    const func = parseFunction(lines, i);
    if (func) {
      func.func.description = comment;
      exports.push(func.func);
      i = func.endLine;
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

  return { exports, raw: code, language: 'python' };
}

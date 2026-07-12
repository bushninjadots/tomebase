import type { ParseResult, ParsedExport, ParsedFunction, ParsedClass, ParsedInterface, Param, Prop } from '../types';

function extractComment(lines: string[], idx: number): { comment: string; endIdx: number } {
  let i = idx;
  while (i < lines.length && lines[i]!.trim() === '') i++;

  if (i < lines.length && lines[i]!.trim().startsWith('#')) {
    let comment = '';
    while (i < lines.length && lines[i]!.trim().startsWith('#')) {
      comment += lines[i]!.trim().replace(/^#\s?/, '') + '\n';
      i++;
    }
    return { comment: comment.trim(), endIdx: i };
  }
  return { comment: '', endIdx: idx };
}

function parseMethod(lines: string[], i: number): { func: ParsedFunction; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:def\s+)(self\.)?(\w+[!?]?)\s*(?:\(([^)]*)\)|([^\n{]*))?/);
  if (!match) return null;
  if (['if', 'unless', 'while', 'until', 'case', 'begin', 'class', 'module', 'do'].includes(match[2]!)) return null;

  const paramStr = match[2] ? match[3] || match[4] || '' : '';
  const params: Param[] = paramStr
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const cleaned = p.trim().replace(/:\s*\w+/, '').trim();
      const nameMatch = cleaned.match(/(\w+)(?:\s*=.*)?/);
      return {
        name: nameMatch ? nameMatch[1]! : cleaned,
        type: 'dynamic',
        description: '',
        optional: cleaned.includes('='),
      };
    });

  let j = i + 1;
  let depth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.match(/^\s*(def|class|module|if|unless|while|until|case|begin|do)\b/)) depth++;
    if (cl.match(/^\s*end\b/)) {
      if (depth === 0) { j++; break; }
      depth--;
    }
    j++;
  }

  return {
    func: {
      kind: 'function',
      name: match[2]!,
      signature: line.trim(),
      description: '',
      params,
      returnType: 'dynamic',
      returnDescription: '',
      lineNumber: i + 1,
    },
    endLine: j,
  };
}

function parseClass(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^class\s+(\w+)(?:\s*<\s*(\S+))?\s*$/);
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
  let depth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.match(/^\s*(def|class|module|if|unless|while|until|case|begin|do)\b/)) depth++;
    if (cl.match(/^\s*end\b/)) {
      if (depth === 0) { j++; break; }
      depth--;
    }

    const attrMatch = cl.trim().match(/^attr_(accessor|reader|writer)\s+:(\w+)/);
    if (attrMatch) {
      cls.properties.push({
        name: attrMatch[2]!,
        type: attrMatch[1] === 'writer' ? 'write-only' : 'read-only',
        description: '',
        optional: false,
      });
    }

    const funcResult = parseMethod(lines, j);
    if (funcResult && depth === 0) {
      cls.methods.push(funcResult.func);
      j = funcResult.endLine;
      continue;
    }
    j++;
  }

  return { cls, endLine: j };
}

function parseModule(lines: string[], i: number): { iface: ParsedInterface; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^module\s+(\w+)\s*$/);
  if (!match) return null;

  const iface: ParsedInterface = {
    kind: 'interface',
    name: match[1]!,
    description: '',
    properties: [],
    lineNumber: i + 1,
  };

  let j = i + 1;
  let depth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.match(/^\s*(def|class|module|if|unless|while|until|case|begin|do)\b/)) depth++;
    if (cl.match(/^\s*end\b/)) {
      if (depth === 0) { j++; break; }
      depth--;
    }

    const funcMatch = cl.trim().match(/^def\s+(?:self\.)?(\w+[!?]?)\s*(?:\(([^)]*)\))?/);
    if (funcMatch && depth === 0) {
      iface.properties.push({
        name: funcMatch[1]!,
        type: `(${funcMatch[2] || ''})`,
        description: '',
        optional: false,
      });
    }
    j++;
  }

  return { iface, endLine: j };
}

export function parseRuby(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trim().startsWith('#') || line.trim().startsWith('require') || line.trim().startsWith('module')) {
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

    const mod = parseModule(lines, i);
    if (mod) {
      mod.iface.description = comment;
      exports.push(mod.iface);
      i = mod.endLine;
      continue;
    }

    const func = parseMethod(lines, i);
    if (func) {
      func.func.description = comment;
      exports.push(func.func);
      i = func.endLine;
      continue;
    }

    i++;
  }

  return { exports, raw: code, language: 'ruby' };
}

import type { ParseResult, ParsedExport, ParsedFunction, ParsedClass, ParsedInterface, ParsedEnum, Param, Prop } from '../types';

function extractDocComment(lines: string[], idx: number): { comment: string; endIdx: number } {
  let i = idx;
  while (i < lines.length && lines[i]!.trim() === '') i++;

  if (i < lines.length && lines[i]!.trim().startsWith('///')) {
    let comment = '';
    while (i < lines.length && lines[i]!.trim().startsWith('///')) {
      const line = lines[i]!.trim().replace(/^\/\/\/\s?/, '');
      const summaryMatch = line.match(/<summary>(.*?)<\/summary>/);
      const paramMatch = line.match(/<param name="(\w+)">(.*?)<\/param>/);
      const returnsMatch = line.match(/<returns>(.*?)<\/returns>/);
      if (summaryMatch) comment += summaryMatch[1] + '\n';
      else if (paramMatch) comment += `@param ${paramMatch[1]}: ${paramMatch[2]}\n`;
      else if (returnsMatch) comment += `@returns ${returnsMatch[1]}\n`;
      else if (!line.startsWith('<')) comment += line + '\n';
      i++;
    }
    return { comment: comment.trim(), endIdx: i };
  }
  return { comment: '', endIdx: idx };
}

function parseMethod(lines: string[], i: number): { func: ParsedFunction; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^[\s]*(?:public|private|protected|internal)?\s*(?:static\s+)?(?:async\s+)?(?:[\w<>\[\],\s]+\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/);
  if (!match) return null;
  if (['if', 'for', 'while', 'switch', 'return', 'using', 'var', 'class', 'struct', 'interface', 'enum', 'namespace'].includes(match[1]!)) return null;

  const params: Param[] = match[2]!
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const parts = p.trim().split(/\s+/);
      if (parts.length >= 2) {
        const lastTwo = parts.slice(-2);
        return {
          name: lastTwo[1]!.replace(/[=].*/, ''),
          type: lastTwo[0]!,
          description: '',
          optional: lastTwo[1]!.includes('='),
        };
      }
      return { name: p.trim(), type: 'var', description: '', optional: false };
    });

  let j = i + 1;
  let braceDepth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.includes('{')) braceDepth += (cl.match(/{/g) ?? []).length;
    if (cl.includes('}')) braceDepth -= (cl.match(/}/g) ?? []).length;
    if (braceDepth <= 0 && cl.includes('}')) { j++; break; }
    j++;
  }

  return {
    func: {
      kind: 'function',
      name: match[1]!,
      signature: line.trim(),
      description: '',
      params,
      returnType: match[3]?.trim() ?? 'void',
      returnDescription: '',
      lineNumber: i + 1,
    },
    endLine: j,
  };
}

function parseClass(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:public|internal|private|protected)?\s*(?:abstract\s+|sealed\s+|static\s+)?class\s+(\w+)(?:<[^>]+>)?(?:\s*:\s*[^{]+)?\s*\{/);
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

    const propMatch = cl.trim().match(/^(?:public|private|protected)\s+(?:[\w<>\[\],\s]+\s+)?(\w+)\s*[{;]/);
    if (propMatch && !propMatch[1]!.includes('(')) {
      cls.properties.push({
        name: propMatch[1]!,
        type: 'property',
        description: '',
        optional: false,
      });
    }

    const methodResult = parseMethod(lines, j);
    if (methodResult) {
      cls.methods.push(methodResult.func);
      j = methodResult.endLine;
      continue;
    }
    j++;
  }

  return { cls, endLine: j };
}

function parseInterface(lines: string[], i: number): { iface: ParsedInterface; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:public|internal)?\s*interface\s+(\w+)(?:<[^>]+>)?(?:\s*:\s*[^{]+)?\s*\{/);
  if (!match) return null;

  const iface: ParsedInterface = {
    kind: 'interface',
    name: match[1]!,
    description: '',
    properties: [],
    lineNumber: i + 1,
  };

  let j = i + 1;
  let braceDepth = 1;
  while (j < lines.length && braceDepth > 0) {
    const cl = lines[j]!;
    if (cl.includes('{')) braceDepth += (cl.match(/{/g) ?? []).length;
    if (cl.includes('}')) braceDepth -= (cl.match(/}/g) ?? []).length;

    const methodMatch = cl.trim().match(/^(?:[\w<>\[\],\s]+\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/);
    if (methodMatch && methodMatch[1] && !['if', 'for', 'while', 'return'].includes(methodMatch[1])) {
      iface.properties.push({
        name: methodMatch[1]!,
        type: `(${methodMatch[2]})${methodMatch[3] ? `: ${methodMatch[3]}` : ''}`,
        description: '',
        optional: false,
      });
    }
    j++;
  }

  return { iface, endLine: j };
}

function parseEnum(lines: string[], i: number): { enm: ParsedEnum; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:public|internal)?\s*enum\s+(\w+)/);
  if (!match) return null;

  const enm: ParsedEnum = {
    kind: 'enum',
    name: match[1]!,
    description: '',
    members: [],
    lineNumber: i + 1,
  };

  let j = i + 1;
  let braceDepth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.includes('{')) braceDepth += (cl.match(/{/g) ?? []).length;
    if (cl.includes('}')) braceDepth -= (cl.match(/}/g) ?? []).length;
    if (braceDepth > 0) {
      const memberMatch = cl.trim().match(/^(\w+)/);
      if (memberMatch && memberMatch[1] !== 'enum') {
        enm.members.push({ name: memberMatch[1]! });
      }
    }
    if (braceDepth <= 0 && cl.includes('}')) { j++; break; }
    j++;
  }

  return { enm, endLine: j };
}

export function parseCSharp(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trim().startsWith('//') || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    const { comment, endIdx } = extractDocComment(lines, i);
    i = endIdx;
    if (i >= lines.length) break;

    const cls = parseClass(lines, i);
    if (cls) {
      cls.cls.description = comment;
      exports.push(cls.cls);
      i = cls.endLine;
      continue;
    }

    const iface = parseInterface(lines, i);
    if (iface) {
      iface.iface.description = comment;
      exports.push(iface.iface);
      i = iface.endLine;
      continue;
    }

    const enm = parseEnum(lines, i);
    if (enm) {
      enm.enm.description = comment;
      exports.push(enm.enm);
      i = enm.endLine;
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

  return { exports, raw: code, language: 'csharp' };
}

import type { ParseResult, ParsedExport, ParsedFunction, ParsedClass, ParsedInterface, ParsedEnum, Param, Prop } from '../types';

function extractKDoc(lines: string[], idx: number): { comment: string; endIdx: number } {
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
      const l = lines[i]!.trim().replace(/^\*\s?/, '');
      const tagMatch = l.match(/^@(param|return|throws)\s+(\w+)?\s*(.*)/);
      if (tagMatch) comment += `@${tagMatch[1]}${tagMatch[2] ? ` ${tagMatch[2]}` : ''}: ${tagMatch[3]}\n`;
      else comment += l + '\n';
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
  const match = line.match(/^(?:fun|suspend\s+fun)\s+(\w+)(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/);
  if (!match) return null;

  const params: Param[] = match[2]!
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const parts = p.trim().split(/\s*:\s*/);
      if (parts.length >= 2) {
        return {
          name: parts[0]!.replace('val ', '').replace('var ', ''),
          type: parts.slice(1).join(':').replace(/\?.*/, ''),
          description: '',
          optional: p.includes('=') || p.includes('?'),
        };
      }
      return { name: p.trim(), type: 'Any', description: '', optional: false };
    });

  let j = i + 1;
  let braceDepth = 0;
  while (j < lines.length) {
    const cl = lines[j]!;
    if (cl.includes('{')) braceDepth += (cl.match(/{/g) ?? []).length;
    if (cl.includes('}')) braceDepth -= (cl.match(/}/g) ?? []).length;
    if (braceDepth <= 0 && (cl.includes('}') || cl.trim().endsWith('{'))) {
      if (cl.includes('}')) { j++; break; }
      j++;
      break;
    }
    j++;
  }

  return {
    func: {
      kind: 'function',
      name: match[1]!,
      signature: line.trim(),
      description: '',
      params,
      returnType: match[3]?.trim() ?? 'Unit',
      returnDescription: '',
      lineNumber: i + 1,
    },
    endLine: j,
  };
}

function parseClass(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^(?:data\s+)?class\s+(\w+)(?:<[^>]+>)?(?:\s*\([^)]*\))?(?:\s*:\s*[^{]+)?\s*\{/);
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

    const propMatch = cl.trim().match(/^(?:val|var)\s+(\w+)\s*:\s*(\S+)/);
    if (propMatch) {
      cls.properties.push({
        name: propMatch[1]!,
        type: propMatch[2]!.replace(',', ''),
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

function parseInterface(lines: string[], i: number): { iface: ParsedInterface; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/^interface\s+(\w+)(?:<[^>]+>)?\s*\{/);
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

    const funcMatch = cl.trim().match(/^(?:fun|suspend\s+fun)\s+(\w+)(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/);
    if (funcMatch) {
      iface.properties.push({
        name: funcMatch[1]!,
        type: `(${funcMatch[2]})${funcMatch[3] ? `: ${funcMatch[3]}` : ''}`,
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
  const match = line.match(/^enum\s+class\s+(\w+)/);
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

export function parseKotlin(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trim().startsWith('//') || line.trim().startsWith('package') || line.trim().startsWith('import')) {
      i++;
      continue;
    }

    const { comment, endIdx } = extractKDoc(lines, i);
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

    const func = parseFunction(lines, i);
    if (func) {
      func.func.description = comment;
      exports.push(func.func);
      i = func.endLine;
      continue;
    }

    i++;
  }

  return { exports, raw: code, language: 'kotlin' };
}

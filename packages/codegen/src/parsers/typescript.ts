import type {
  ParseResult, ParsedExport, ParsedFunction, ParsedInterface,
  ParsedType, ParsedClass, ParsedEnum, ParsedNamespace,
  Param, Prop, JSDocTags, EnumMember,
} from '../types';

function extractComment(lines: string[], idx: number): { comment: string; endIdx: number } {
  let i = idx;
  while (i < lines.length && lines[i]!.trim() === '') i++;

  if (i < lines.length && lines[i]!.trimStart().startsWith('/**')) {
    const startI = i;
    i++;
    const rawLines: string[] = [];
    while (i < lines.length && !lines[i]!.trimEnd().endsWith('*/')) {
      rawLines.push(lines[i]!.replace(/^\s*\*\s?/, ''));
      i++;
    }
    if (i < lines.length) {
      const closing = lines[i]!.replace(/^\s*\*\/\s*/, '').replace(/^\s*\*\s?/, '');
      if (closing) rawLines.push(closing);
    }
    i++;
    return { comment: rawLines.join('\n').trim(), endIdx: i };
  }
  return { comment: '', endIdx: idx };
}

function parseJSDocTags(comment: string): { description: string; tags: JSDocTags } {
  const tags: JSDocTags = {};
  const descParts: string[] = [];
  const lines = comment.split('\n');
  let tagBlock = '';

  for (const line of lines) {
    const tagMatch = line.match(/^@(example|throws?|deprecated|see|default|readonly|since|experimental)\s*(.*)/i);
    if (tagMatch) {
      const tag = tagMatch[1]!.toLowerCase();
      const value = tagMatch[2] ?? '';
      switch (tag) {
        case 'example':
          tags.example = tags.example ?? [];
          tags.example.push(value);
          break;
        case 'throw':
        case 'throws':
          tags.throws = tags.throws ?? [];
          tags.throws.push(value);
          break;
        case 'deprecated':
          tags.deprecated = value || true;
          break;
        case 'see':
          tags.see = tags.see ?? [];
          tags.see.push(value);
          break;
        case 'default':
          tags.default = value;
          break;
        case 'readonly':
          tags.readonly = true;
          break;
        case 'since':
          tags.since = value;
          break;
        case 'experimental':
          tags.experimental = true;
          break;
      }
    } else if (line.match(/^@(param|returns?|template)\b/i)) {
      tagBlock += line + '\n';
    } else {
      descParts.push(line);
    }
  }

  let description = descParts.join('\n').trim();
  if (!description) {
    const firstSentence = comment.split('\n').find((l) => l.trim() && !l.trim().startsWith('@'));
    description = firstSentence?.trim() ?? '';
  }

  return { description, tags };
}

function extractJSDocParams(comment: string): Param[] {
  const params: Param[] = [];
  const lines = comment.split('\n');
  let currentParam: Param | null = null;

  for (const line of lines) {
    const paramMatch = line.match(/^@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
    if (paramMatch) {
      if (currentParam) params.push(currentParam);
      currentParam = {
        type: paramMatch[1]!,
        name: paramMatch[2]!,
        description: paramMatch[3]?.trim() ?? '',
        optional: paramMatch[2]!.endsWith('?'),
      };
    } else if (currentParam && line.trim() && !line.trim().startsWith('@')) {
      currentParam.description += (currentParam.description ? ' ' : '') + line.trim();
    }
  }
  if (currentParam) params.push(currentParam);
  return params;
}

function extractReturns(comment: string): { type: string; description: string } {
  const match = comment.match(/@returns?\s+\{([^}]+)\}\s*(.*)/s);
  if (match) return { type: match[1]!, description: match[2]?.trim() ?? '' };
  const simple = comment.match(/@returns?\s+(.*)/);
  if (simple) return { type: 'void', description: simple[1]?.trim() ?? '' };
  return { type: 'void', description: '' };
}

function extractGenericParams(line: string): string[] | undefined {
  const match = line.match(/<([^>]+)>/);
  if (!match) return undefined;
  return match[1]!.split(',').map((s) => s.trim());
}

function isReactComponent(name: string, body: string): boolean {
  if (name.charAt(0) !== name.charAt(0).toUpperCase()) return false;
  if (/<\w+[\s/>]/.test(body) || /<\//.test(body)) return true;
  if (/createElement|JSX\.Element|React\.ReactNode/.test(body)) return true;
  return false;
}

function isHook(name: string): boolean {
  return /^use[A-Z]/.test(name);
}

function extractEnumMembers(lines: string[], startIdx: number): EnumMember[] {
  const members: EnumMember[] = [];
  let i = startIdx;
  while (i < lines.length) {
    const line = lines[i]!.trim();
    if (line.startsWith('}')) break;
    const match = line.match(/^(\w+)\s*(?:=\s*(.+?))?\s*,?\s*$/);
    if (match) {
      members.push({
        name: match[1]!,
        value: match[2]?.trim(),
      });
    }
    i++;
  }
  return members;
}

function parseDecorators(lines: string[], idx: number): { decorators: string[]; endIdx: number } {
  const decorators: string[] = [];
  let i = idx;
  while (i < lines.length && lines[i]!.trimStart().startsWith('@')) {
    const match = lines[i]!.trim().match(/^@(\w+(?:\.\w+)*(?:\([^)]*\))?)/);
    if (match) decorators.push(match[1]!);
    i++;
  }
  return { decorators, endIdx: i };
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
      const namePart = parts[0] ?? '';
      const typePart = parts.slice(1).join(':').trim();
      const defaultMatch = namePart.match(/^(\w+)\??\s*=\s*(.+)/);
      const name = defaultMatch ? defaultMatch[1]! : namePart.replace('?', '');
      const defaultValue = defaultMatch ? defaultMatch[2]!.trim() : undefined;
      return {
        name,
        type: typePart || 'any',
        description: '',
        optional: namePart.includes('?') || !!defaultValue,
        default: defaultValue,
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
    genericParams: extractGenericParams(line),
  };

  return { func, endLine: i + 1 };
}

function parseArrowFunction(lines: string[], i: number): { func: ParsedFunction; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(
    /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*(?:\([^)]*\)|\w+)\s*(?::\s*\S+)?\s*=>/,
  );
  if (!match) return null;

  const bodyStart = lines.slice(i).findIndex((l) => l.includes('=>'));
  const body = lines.slice(i, i + Math.max(bodyStart + 1, 5)).join('\n');
  const name = match[1]!;

  const params: Param[] = [];
  const paramSection = line.match(/=\s*\(([^)]*)\)/);
  if (paramSection) {
    const raw = paramSection[1]!;
    if (raw.trim()) {
      for (const p of raw.split(',')) {
        const parts = p.trim().split(/\s*:\s*/);
        params.push({
          name: parts[0]!.replace('?', ''),
          type: parts[1] ?? 'any',
          description: '',
          optional: parts[0]!.includes('?'),
        });
      }
    }
  }

  const func: ParsedFunction = {
    kind: 'function',
    name,
    signature: line.trim().replace(/\s*$/, ''),
    description: '',
    params,
    returnType: 'void',
    returnDescription: '',
    lineNumber: i + 1,
    isHook: isHook(name),
    isComponent: isReactComponent(name, body),
  };

  return { func, endLine: i + 1 };
}

function parseInterface(lines: string[], i: number): { iface: ParsedInterface; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?interface\s+(\w+)(?:\s*<[^>]+>)?(?:\s+extends\s+([^{]+))?/);
  if (!match) return null;

  const properties: Prop[] = [];
  let j = i + 1;
  while (j < lines.length && !lines[j]!.trim().startsWith('}')) {
    const cl = lines[j]!.trim();
    if (cl === '' || cl.startsWith('//') || cl.startsWith('/**')) { j++; continue; }
    const propMatch = cl.match(/^(readonly\s+)?(\w+\??)\s*(?::\s*([^;]+))?/);
    if (propMatch && !cl.includes('(')) {
      properties.push({
        name: propMatch[2]!.replace('?', ''),
        type: propMatch[3]?.trim() ?? 'unknown',
        description: '',
        optional: propMatch[2]!.includes('?'),
        readonly: !!propMatch[1],
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
    genericParams: extractGenericParams(line),
    extends: match[2]?.split(',').map((s) => s.trim()),
  };

  return { iface, endLine: j + 1 };
}

function parseType(lines: string[], i: number): { type: ParsedType; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?type\s+(\w+)(?:\s*<[^>]+>)?\s*=\s*(.*)/);
  if (!match) return null;

  const type: ParsedType = {
    kind: 'type',
    name: match[1]!,
    description: '',
    definition: match[2]!.trim(),
    lineNumber: i + 1,
    genericParams: extractGenericParams(line),
  };

  return { type, endLine: i + 1 };
}

function parseEnum(lines: string[], i: number): { enm: ParsedEnum; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?(?:const\s+)?enum\s+(\w+)/);
  if (!match) return null;

  const members = extractEnumMembers(lines, i + 1);

  const enm: ParsedEnum = {
    kind: 'enum',
    name: match[1]!,
    description: '',
    members,
    lineNumber: i + 1,
  };

  let j = i + 1;
  while (j < lines.length && !lines[j]!.trim().startsWith('}')) j++;
  return { enm, endLine: j + 1 };
}

function parseClass(lines: string[], i: number): { cls: ParsedClass; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s*<[^>]+>)?(?:\s+extends\s+(\S+))?(?:\s+implements\s+([^{]+))?/);
  if (!match) return null;

  const cls: ParsedClass = {
    kind: 'class',
    name: match[1]!,
    description: '',
    methods: [],
    properties: [],
    lineNumber: i + 1,
    genericParams: extractGenericParams(line),
    extends: match[2] ? [match[2]] : undefined,
    implements: match[3]?.split(',').map((s) => s.trim()),
  };

  let j = i + 1;
  let braceDepth = 1;
  let currentComment = '';

  while (j < lines.length && braceDepth > 0) {
    const cl = lines[j]!;
    braceDepth += (cl.match(/{/g) ?? []).length;
    braceDepth -= (cl.match(/}/g) ?? []).length;

    if (cl.trimStart().startsWith('/**')) {
      const { comment, endIdx } = extractComment(lines, j);
      currentComment = comment;
      j = endIdx;
      continue;
    }

    if (cl.trim().startsWith('constructor')) {
      const ctorMatch = cl.match(/constructor\s*\(([^)]*)\)/);
      if (ctorMatch) {
        cls.constructorParams = ctorMatch[1]!.split(',').filter(Boolean).map((p) => {
          const parts = p.trim().split(/\s*:\s*/);
          return {
            name: parts[0]!.replace('?', ''),
            type: parts[1] ?? 'any',
            description: '',
            optional: parts[0]!.includes('?'),
          };
        });
      }
      currentComment = '';
      j++;
      continue;
    }

    const methodMatch = cl.match(
      /(?:public|private|protected|static|abstract|async|override|\*)\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)\s*(?::\s*([^{]+))?/,
    );
    if (methodMatch && !methodMatch[1]!.startsWith('constructor')) {
      const methodParams: Param[] = methodMatch[2]!
        .split(',')
        .filter(Boolean)
        .map((p) => {
          const parts = p.trim().split(/\s*:\s*/);
          return {
            name: parts[0]!.replace('?', ''),
            type: parts[1] ?? 'any',
            description: '',
            optional: parts[0]!.includes('?'),
          };
        });

      const method: ParsedFunction = {
        kind: 'function',
        name: methodMatch[1]!,
        signature: cl.trim(),
        description: currentComment,
        params: methodParams,
        returnType: methodMatch[3]?.trim() ?? 'void',
        returnDescription: '',
        lineNumber: j + 1,
      };

      if (currentComment) {
        const jsdocParams = extractJSDocParams(currentComment);
        if (jsdocParams.length > 0) method.params = jsdocParams;
        const rt = extractReturns(currentComment);
        if (rt.type !== 'void') method.returnType = rt.type;
        if (rt.description) method.returnDescription = rt.description;
      }

      cls.methods.push(method);
      currentComment = '';
    }

    const propMatch = cl.match(
      /^\s*(?:public|private|protected|readonly|static|override|abstract|\s)+(\w+\??)\s*(?::\s*([^=;]+))?\s*(?:=\s*([^;]+))?/,
    );
    if (propMatch && !cl.includes('(') && !cl.includes('def ') && propMatch[1] !== 'constructor') {
      cls.properties.push({
        name: propMatch[1]!.replace('?', ''),
        type: propMatch[2]?.trim() ?? 'unknown',
        description: currentComment,
        optional: propMatch[1]!.includes('?'),
        readonly: cl.includes('readonly'),
        default: propMatch[3]?.trim(),
      });
      currentComment = '';
    }

    if (!cl.includes('(') && !cl.includes(':')) {
      currentComment = '';
    }

    j++;
  }

  return { cls, endLine: j };
}

function parseNamespace(lines: string[], i: number): { ns: ParsedNamespace; endLine: number } | null {
  const line = lines[i]!;
  const match = line.match(/(?:export\s+)?namespace\s+(\w+)/);
  if (!match) return null;

  const ns: ParsedNamespace = {
    kind: 'namespace',
    name: match[1]!,
    description: '',
    exports: [],
    lineNumber: i + 1,
  };

  let j = i + 1;
  let braceDepth = 1;
  while (j < lines.length && braceDepth > 0) {
    const cl = lines[j]!;
    braceDepth += (cl.match(/{/g) ?? []).length;
    braceDepth -= (cl.match(/}/g) ?? []).length;
    j++;
  }

  return { ns, endLine: j };
}

export function parseTypeScript(code: string): ParseResult {
  const lines = code.split('\n');
  const exports: ParsedExport[] = [];
  const warnings: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '' || line.trimStart().startsWith('//')) {
      i++;
      continue;
    }

    const { decorators, endIdx: decoratorEndIdx } = parseDecorators(lines, i);
    if (decorators.length > 0) {
      i = decoratorEndIdx;
    }

    const { comment, endIdx } = extractComment(lines, i);
    i = endIdx;
    if (i >= lines.length) break;

    const { description, tags } = parseJSDocTags(comment);
    const jsdocParams = extractJSDocParams(comment);
    const rt = extractReturns(comment);

    const fn = parseFunction(lines, i);
    if (fn) {
      fn.func.description = description;
      fn.func.tags = tags;
      if (rt.type !== 'void') fn.func.returnType = rt.type;
      if (rt.description) fn.func.returnDescription = rt.description;
      if (jsdocParams.length > 0) fn.func.params = jsdocParams;
      fn.func.isHook = isHook(fn.func.name);
      fn.func.isComponent = isReactComponent(fn.func.name, lines.slice(i, i + 20).join('\n'));
      exports.push(fn.func);
      i = fn.endLine;
      continue;
    }

    const arrowFn = parseArrowFunction(lines, i);
    if (arrowFn) {
      arrowFn.func.description = description;
      arrowFn.func.tags = tags;
      if (rt.type !== 'void') arrowFn.func.returnType = rt.type;
      if (rt.description) arrowFn.func.returnDescription = rt.description;
      if (jsdocParams.length > 0) arrowFn.func.params = jsdocParams;
      exports.push(arrowFn.func);
      i = arrowFn.endLine;
      continue;
    }

    const iface = parseInterface(lines, i);
    if (iface) {
      iface.iface.description = description;
      iface.iface.tags = tags;
      exports.push(iface.iface);
      i = iface.endLine;
      continue;
    }

    const t = parseType(lines, i);
    if (t) {
      t.type.description = description;
      t.type.tags = tags;
      exports.push(t.type);
      i = t.endLine;
      continue;
    }

    const enm = parseEnum(lines, i);
    if (enm) {
      enm.enm.description = description;
      enm.enm.tags = tags;
      exports.push(enm.enm);
      i = enm.endLine;
      continue;
    }

    const cls = parseClass(lines, i);
    if (cls) {
      cls.cls.description = description;
      cls.cls.tags = tags;
      if (decorators.length > 0) cls.cls.decorators = decorators;
      if (jsdocParams.length > 0 && cls.cls.constructorParams) {
        cls.cls.constructorParams = jsdocParams;
      }
      exports.push(cls.cls);
      i = cls.endLine;
      continue;
    }

    const ns = parseNamespace(lines, i);
    if (ns) {
      ns.ns.description = description;
      ns.ns.tags = tags;
      exports.push(ns.ns);
      i = ns.endLine;
      continue;
    }

    i++;
  }

  return { exports, raw: code, language: 'typescript', warnings };
}

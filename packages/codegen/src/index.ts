import type { SupportedLanguage } from './languages';
import { parseTypeScript } from './parsers/typescript';
import { parsePython } from './parsers/python';
import { parseGo } from './parsers/go';
import { parseRust } from './parsers/rust';
import { parseCSharp } from './parsers/csharp';
import { parseCpp } from './parsers/cpp';
import { parseKotlin } from './parsers/kotlin';
import { parseRuby } from './parsers/ruby';
import type {
  ParseResult, ParsedExport, ParsedFunction, ParsedInterface,
  ParsedType, ParsedClass, ParsedEnum, ParsedNamespace,
  Param, Prop, JSDocTags, EnumMember,
} from './types';

export type {
  ParseResult, ParsedExport, ParsedFunction, ParsedInterface,
  ParsedType, ParsedClass, ParsedEnum, ParsedNamespace,
  Param, Prop, JSDocTags, EnumMember, SupportedLanguage,
};
export { supportedLanguages } from './languages';
export type { LanguageConfig } from './languages';

function formatParamTable(params: Param[]): string {
  if (params.length === 0) return '';
  const rows = params.map((p) =>
    `| \`${p.name}\` | \`${p.type}\`${p.optional ? ' (optional)' : ''} | ${p.description || '—'}${p.default ? ` Default: \`${p.default}\`` : ''} |`
  );
  return `| Parameter | Type | Description |\n|---|---|---|\n${rows.join('\n')}`;
}

function formatPropTable(props: Prop[]): string {
  if (props.length === 0) return '';
  const rows = props.map((p) =>
    `| \`${p.name}\`${p.readonly ? ' `readonly`' : ''} | \`${p.type}\`${p.optional ? ' (optional)' : ''} | ${p.description || '—'}${p.default ? ` Default: \`${p.default}\`` : ''} |`
  );
  return `| Property | Type | Description |\n|---|---|---|\n${rows.join('\n')}`;
}

function renderDeprecated(tags?: { deprecated?: string | boolean }): string {
  if (!tags?.deprecated) return '';
  const msg = typeof tags.deprecated === 'string' ? tags.deprecated : 'This is deprecated.';
  return `\n\n> **⚠️ Deprecated:** ${msg}\n`;
}

function renderTags(tags?: { see?: string[]; since?: string; experimental?: boolean }): string {
  const parts: string[] = [];
  if (tags?.since) parts.push(`*Since v${tags.since}*`);
  if (tags?.experimental) parts.push('*Experimental*');
  if (tags?.see && tags.see.length > 0) {
    parts.push(`See also: ${tags.see.map((s) => `\`${s}\``).join(', ')}`);
  }
  return parts.length > 0 ? '\n\n' + parts.join(' · ') : '';
}

function renderExamples(tags?: { example?: string[] }): string {
  if (!tags?.example || tags.example.length === 0) return '';
  return '\n\n## Example\n\n' + tags.example.map((ex) => '```ts\n' + ex + '\n```').join('\n\n');
}

function renderThrows(tags?: { throws?: string[] }): string {
  if (!tags?.throws || tags.throws.length === 0) return '';
  return '\n\n## Throws\n\n' + tags.throws.map((t) => `- ${t}`).join('\n');
}

function renderRelatedSee(tags?: { see?: string[] }): string {
  if (!tags?.see || tags.see.length === 0) return '';
  return '\n\n## Related\n\n' + tags.see.map((s) => `- [[${s}]]`).join('\n');
}

export function exportsToMarkdown(result: ParseResult): string {
  const parts: string[] = [];

  for (const exp of result.exports) {
    switch (exp.kind) {
      case 'function': {
        const fn = exp as ParsedFunction;
        const sections: string[] = [];

        sections.push(`# ${fn.name}\n`);
        if (fn.description) sections.push(`\n${fn.description}`);
        sections.push(renderDeprecated(fn.tags));
        sections.push(renderTags(fn.tags));

        sections.push(`\n---\n\n## Type\n`);
        const typeLabel = fn.isComponent ? 'React Component' : fn.isHook ? 'Hook' : 'Function';
        sections.push(typeLabel);

        sections.push(`\n\n---\n\n## Signature\n`);
        sections.push('```ts\n' + fn.signature + '\n```');

        if (fn.params.length > 0) {
          sections.push(`\n\n---\n\n## Parameters\n`);
          sections.push(formatParamTable(fn.params));
        }

        if (fn.returnType && fn.returnType !== 'void') {
          sections.push(`\n\n---\n\n## Returns\n`);
          sections.push(`\`${fn.returnType}\``);
          if (fn.returnDescription) sections.push(`\n\n${fn.returnDescription}`);
        }

        sections.push(renderThrows(fn.tags));
        sections.push(renderExamples(fn.tags));
        sections.push(renderRelatedSee(fn.tags));
        parts.push(sections.join(''));
        break;
      }

      case 'interface': {
        const iface = exp as ParsedInterface;
        const sections: string[] = [];

        sections.push(`# ${iface.name}\n`);
        if (iface.description) sections.push(`\n${iface.description}`);
        sections.push(renderDeprecated(iface.tags));
        sections.push(renderTags(iface.tags));

        if (iface.extends && iface.extends.length > 0) {
          sections.push(`\n\n---\n\n## Extends\n`);
          sections.push(iface.extends.map((e) => `\`${e}\``).join(', '));
        }

        sections.push(`\n\n---\n\n## Type\n`);
        sections.push('Interface');

        if (iface.properties.length > 0) {
          sections.push(`\n\n---\n\n## Properties\n`);
          sections.push(formatPropTable(iface.properties));
        }

        sections.push(renderExamples(iface.tags));
        sections.push(renderRelatedSee(iface.tags));
        parts.push(sections.join(''));
        break;
      }

      case 'type': {
        const t = exp as ParsedType;
        const sections: string[] = [];

        sections.push(`# ${t.name}\n`);
        if (t.description) sections.push(`\n${t.description}`);
        sections.push(renderDeprecated(t.tags));
        sections.push(renderTags(t.tags));

        sections.push(`\n\n---\n\n## Type\n`);
        sections.push('Type Alias');

        sections.push(`\n\n---\n\n## Definition\n`);
        sections.push('```ts\ntype ' + t.name + ' = ' + t.definition + ';\n```');

        sections.push(renderExamples(t.tags));
        sections.push(renderRelatedSee(t.tags));
        parts.push(sections.join(''));
        break;
      }

      case 'enum': {
        const enm = exp as ParsedEnum;
        const sections: string[] = [];

        sections.push(`# ${enm.name}\n`);
        if (enm.description) sections.push(`\n${enm.description}`);
        sections.push(renderDeprecated(enm.tags));
        sections.push(renderTags(enm.tags));

        sections.push(`\n\n---\n\n## Type\n`);
        sections.push('Enum');

        if (enm.members.length > 0) {
          sections.push(`\n\n---\n\n## Values\n`);
          sections.push('| Member | Value | Description |\n|---|---|---|');
          for (const m of enm.members) {
            sections.push(`| \`${m.name}\` | \`${m.value ?? m.name}\` | ${m.description ?? '—'} |`);
          }
        }

        sections.push(renderExamples(enm.tags));
        sections.push(renderRelatedSee(enm.tags));
        parts.push(sections.join(''));
        break;
      }

      case 'class': {
        const cls = exp as ParsedClass;
        const sections: string[] = [];

        sections.push(`# ${cls.name}\n`);
        if (cls.description) sections.push(`\n${cls.description}`);
        sections.push(renderDeprecated(cls.tags));
        sections.push(renderTags(cls.tags));

        if (cls.extends || (cls.implements && cls.implements.length > 0)) {
          sections.push(`\n\n---\n\n## Type\n`);
          const parts2: string[] = ['Class'];
          if (cls.extends) parts2.push(`extends \`${cls.extends}\``);
          if (cls.implements && cls.implements.length > 0) {
            parts2.push(`implements ${cls.implements.map((i) => `\`${i}\``).join(', ')}`);
          }
          sections.push(parts2.join(' '));
        } else {
          sections.push(`\n\n---\n\n## Type\nClass`);
        }

        if (cls.decorators && cls.decorators.length > 0) {
          sections.push(`\n\n---\n\n## Decorators\n`);
          sections.push(cls.decorators.map((d) => `\`@${d}\``).join(', '));
        }

        if (cls.constructorParams && cls.constructorParams.length > 0) {
          sections.push(`\n\n---\n\n## Constructor\n`);
          sections.push('```ts\nnew ' + cls.name + '(' + cls.constructorParams.map((p) => p.name + ': ' + p.type).join(', ') + ')\n```');
          sections.push('\n' + formatParamTable(cls.constructorParams));
        }

        if (cls.properties.length > 0) {
          sections.push(`\n\n---\n\n## Properties\n`);
          sections.push(formatPropTable(cls.properties));
        }

        if (cls.methods.length > 0) {
          sections.push(`\n\n---\n\n## Methods\n`);
          for (const m of cls.methods) {
            sections.push(`### ${m.name}()\n`);
            if (m.description) sections.push(`\n${m.description}\n`);
            sections.push('```ts\n' + m.signature + '\n```');
            if (m.params.length > 0) {
              sections.push('\n' + formatParamTable(m.params));
            }
            if (m.returnType && m.returnType !== 'void') {
              sections.push(`\n**Returns:** \`${m.returnType}\``);
              if (m.returnDescription) sections.push(` — ${m.returnDescription}`);
            }
            sections.push('\n');
          }
        }

        sections.push(renderExamples(cls.tags));
        sections.push(renderRelatedSee(cls.tags));
        parts.push(sections.join(''));
        break;
      }

      case 'namespace': {
        const ns = exp as ParsedNamespace;
        const sections: string[] = [];

        sections.push(`# ${ns.name}\n`);
        if (ns.description) sections.push(`\n${ns.description}`);

        sections.push(`\n\n---\n\n## Type\nNamespace`);

        if (ns.exports.length > 0) {
          sections.push(`\n\n---\n\n## Exports\n`);
          for (const sub of ns.exports) {
            sections.push(`- **${sub.name}** (${sub.kind})`);
          }
        }

        parts.push(sections.join(''));
        break;
      }
    }
  }

  return parts.join('\n\n---\n\n');
}

export function parseCode(code: string, language: SupportedLanguage): ParseResult {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return parseTypeScript(code);
    case 'python':
      return parsePython(code);
    case 'go':
      return parseGo(code);
    case 'rust':
      return parseRust(code);
    case 'csharp':
      return parseCSharp(code);
    case 'cpp':
      return parseCpp(code);
    case 'kotlin':
      return parseKotlin(code);
    case 'ruby':
      return parseRuby(code);
    default:
      return parseTypeScript(code);
  }
}

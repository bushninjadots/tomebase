import { parseTypeScript } from './parsers/typescript';
import type { SupportedLanguage } from './languages';
import type { ParseResult, ParsedExport, ParsedFunction, ParsedInterface, ParsedType, ParsedClass, ParsedEnum, Param, Prop } from './types';
export type { ParseResult, ParsedExport, ParsedFunction, ParsedInterface, ParsedType, ParsedClass, ParsedEnum, Param, Prop, SupportedLanguage };
export { supportedLanguages } from './languages';
export type { LanguageConfig } from './languages';

export function parseCode(code: string, language: SupportedLanguage): ParseResult {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return parseTypeScript(code);
    default:
      // Fallback to TypeScript parser for any language
      // Language-specific parsers will be added as needed
      return parseTypeScript(code);
  }
}

export function exportsToMarkdown(result: ParseResult): string {
  const parts: string[] = [];

  for (const exp of result.exports) {
    switch (exp.kind) {
      case 'function': {
        const params = exp.params
          .map((p) => `  - \`${p.name}\`${p.optional ? ' (optional)' : ''}: \`${p.type}\`${p.description ? ` — ${p.description}` : ''}`)
          .join('\n');
        parts.push(
          `## ${exp.name}\n\n` +
            `${exp.description}\n\n` +
            '```typescript\n' +
            `${exp.signature}\n` +
            '```\n\n' +
            `**Returns:** \`${exp.returnType}\`${exp.returnDescription ? ` — ${exp.returnDescription}` : ''}\n\n` +
            (params ? `**Parameters:**\n${params}\n\n` : ''),
        );
        break;
      }
      case 'interface': {
        const props = exp.properties
          .map((p) => `  - \`${p.name}\`${p.optional ? ' (optional)' : ''}: \`${p.type}\`${p.description ? ` — ${p.description}` : ''}`)
          .join('\n');
        parts.push(
          `## ${exp.name}\n\n` +
            `${exp.description}\n\n` +
            '```typescript\n' +
            `interface ${exp.name} {\n` +
            exp.properties.map((p) => `  ${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n') +
            '\n}\n```\n\n' +
            (props ? `**Properties:**\n${props}\n\n` : ''),
        );
        break;
      }
      case 'type': {
        parts.push(
          `## ${exp.name}\n\n` +
            `${exp.description}\n\n` +
            '```typescript\n' +
            `type ${exp.name} = ${exp.definition};\n` +
            '```\n\n',
        );
        break;
      }
      case 'enum': {
        parts.push(
          `## ${exp.name}\n\n` +
            `${exp.description}\n\n` +
            '```typescript\n' +
            `enum ${exp.name} {\n` +
            exp.members.map((m) => `  ${m},`).join('\n') +
            '\n}\n```\n\n' +
            `**Members:** ${exp.members.map((m) => `\`${m}\``).join(', ')}\n\n`,
        );
        break;
      }
      case 'class': {
        const methods = exp.methods
          .map((m) => `  - \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(', ')})\` → \`${m.returnType}\``)
          .join('\n');
        const props = exp.properties
          .map((p) => `  - \`${p.name}\`: \`${p.type}\``)
          .join('\n');
        parts.push(
          `## ${exp.name}\n\n` +
            `${exp.description}\n\n` +
            '```typescript\n' +
            `class ${exp.name} { ... }\n` +
            '```\n\n' +
            (methods ? `**Methods:**\n${methods}\n\n` : '') +
            (props ? `**Properties:**\n${props}\n\n` : ''),
        );
        break;
      }
    }
  }

  return parts.join('---\n\n');
}

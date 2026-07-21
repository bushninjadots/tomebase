import type { Diagnostic } from '@fluid/types';
import { makeDiagnostic, type DiagnosticRule } from './_infrastructure';

export const missingFrontmatterRule: DiagnosticRule = {
  id: 'missing-frontmatter',
  category: 'missing_frontmatter',
  title: 'Missing Frontmatter',
  description: 'Page content does not start with YAML frontmatter.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    if (!page.content.trimStart().startsWith('---')) {
      const firstContentLine = page.content.split('\n').findIndex((l) => l.trim().length > 0);
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Missing YAML frontmatter',
          'This page does not have a YAML frontmatter block at the top.',
          'Frontmatter provides structured metadata for your documentation. Add a --- block at the top with title, description, and other fields.',
          page,
          firstContentLine >= 0 ? firstContentLine + 1 : 1,
          null,
          true,
          {
            originalContent: page.content,
            fixedContent: `---\ntitle: "${page.title}"\ndescription: ""\ntags: []\n---\n\n${page.content}`,
            description: 'Add empty frontmatter block with title, description, and tags fields.',
            confidence: 'medium',
          },
        ),
      ];
    }
    return [];
  },
};

export const missingTitleRule: DiagnosticRule = {
  id: 'missing-title',
  category: 'missing_title',
  title: 'Missing Title in Frontmatter',
  description: 'Frontmatter exists but does not include a title field.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    if (!/^title\s*:/m.test(frontmatter)) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Missing title in frontmatter',
          'The frontmatter block does not contain a title field.',
          'The title field helps with SEO and navigation. Add title: "Your Page Title" to the frontmatter.',
          page,
          1,
          null,
          true,
          {
            originalContent: content,
            fixedContent: content.replace(/^---\n/, `---\ntitle: "${page.title}"\n`),
            description: `Add title: "${page.title}" to frontmatter.`,
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const missingDescriptionRule: DiagnosticRule = {
  id: 'missing-description',
  category: 'missing_description',
  title: 'Missing Description in Frontmatter',
  description: 'Frontmatter exists but does not include a description field.',
  severity: 'warning',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    if (!/^description\s*:/m.test(frontmatter)) {
      const frontmatterEnd = content.indexOf('---', content.indexOf('---') + 3);
      const line = content.substring(0, frontmatterEnd).split('\n').length;
      const descriptionLine = 'description: ""';
      const updatedContent = content.replace(
        /^(---\n(?:title:.*\n)?)/m,
        `$1${descriptionLine}\n`,
      );
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'Missing description in frontmatter',
          'The frontmatter block does not contain a description field.',
          'A description helps with SEO and provides context when pages are linked. Add a brief description of this page.',
          page,
          line,
          null,
          true,
          {
            originalContent: content,
            fixedContent: updatedContent,
            description: 'Add empty description field to frontmatter.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const missingOwnerRule: DiagnosticRule = {
  id: 'missing-owner',
  category: 'missing_owner',
  title: 'Missing Owner',
  description: 'No owner or author is specified for this page.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    const hasOwner = /^owner\s*:/m.test(frontmatter) || /^author\s*:/m.test(frontmatter);
    if (!hasOwner) {
      const updatedContent = content.replace(
        /^(---\n[\s\S]*?)(\n---)/m,
        '$1\nowner: ""$2',
      );
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'No owner specified',
          'This page does not have an owner or author assigned.',
          'Assigning an owner makes it clear who is responsible for keeping this documentation up to date.',
          page,
          1,
          null,
          true,
          {
            originalContent: content,
            fixedContent: updatedContent,
            description: 'Add empty owner field to frontmatter.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const missingTagsRule: DiagnosticRule = {
  id: 'missing-tags',
  category: 'missing_tags',
  title: 'Missing Tags',
  description: 'No tags are specified for this page.',
  severity: 'info',
  canAutoFix: true,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const frontmatter = frontmatterMatch[1]!;
    const hasTags = /^tags\s*:/m.test(frontmatter) || /^categories\s*:/m.test(frontmatter);
    if (!hasTags) {
      const updatedContent = content.replace(
        /^(---\n[\s\S]*?)(\n---)/m,
        '$1\ntags: []$2',
      );
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          'No tags specified',
          'This page does not have any tags assigned.',
          'Tags help organize documentation and make it easier to find related pages.',
          page,
          1,
          null,
          true,
          {
            originalContent: content,
            fixedContent: updatedContent,
            description: 'Add empty tags array to frontmatter.',
            confidence: 'high',
          },
        ),
      ];
    }
    return [];
  },
};

export const frontmatterOverUsageRule: DiagnosticRule = {
  id: 'frontmatter-over-usage',
  category: 'missing_frontmatter',
  title: 'Excessive Frontmatter Fields',
  description: 'The frontmatter has too many fields, reducing readability.',
  severity: 'info',
  canAutoFix: false,
  detect(page) {
    const content = page.content;
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];

    const fieldCount = frontmatterMatch[1]!.split('\n').filter((l) => l.includes(':')).length;
    if (fieldCount > 15) {
      return [
        makeDiagnostic(
          this.id,
          this.category,
          this.severity,
          `Excessive frontmatter (${fieldCount} fields)`,
          `This page has ${fieldCount} frontmatter fields, which is more than recommended.`,
          'Too many frontmatter fields make pages harder to maintain. Consider moving metadata to a separate config file.',
          page,
          1,
        ),
      ];
    }
    return [];
  },
};

import { describe, it, expect } from 'vitest';
import { templateService, pageTemplates, projectTemplates, type PageTemplate } from './templates';

describe('page templates', () => {
  it('has a blank template', () => {
    const blank = pageTemplates.find((t) => t.id === 'blank');
    expect(blank).toBeDefined();
    expect(blank!.content).toBe('');
  });

  it('has all required fields for every template', () => {
    for (const template of pageTemplates) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(typeof template.content).toBe('string');
      expect(template.category).toBeTruthy();
      expect(template.icon).toBeTruthy();
      expect(Array.isArray(template.placeholders)).toBe(true);
      expect(Array.isArray(template.tags)).toBe(true);
    }
  });

  it('has unique template IDs', () => {
    const ids = pageTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains {{title}} placeholder in most templates', () => {
    const skipIds = ['blank'];
    for (const template of pageTemplates) {
      if (skipIds.includes(template.id)) continue;
      expect(template.content).toContain('{{title}}');
    }
  });

  it('contains {{date}} placeholder in applicable templates', () => {
    const dateTemplates = ['release-notes', 'changelog', 'rfc', 'meeting-notes', 'postmortem'];
    for (const id of dateTemplates) {
      const template = pageTemplates.find((t) => t.id === id);
      expect(template?.content).toContain('{{date}}');
    }
  });

  it('has at least 10 templates', () => {
    expect(pageTemplates.length).toBeGreaterThanOrEqual(10);
  });

  it('includes wiki links in relevant templates', () => {
    const templatesWithLinks = pageTemplates.filter((t) => t.content.includes('[['));
    expect(templatesWithLinks.length).toBeGreaterThan(0);
  });
});

describe('project templates', () => {
  it('has a blank template', () => {
    const blank = projectTemplates.find((t) => t.id === 'blank');
    expect(blank).toBeDefined();
    expect(blank!.pages).toHaveLength(0);
  });

  it('has all required fields', () => {
    for (const template of projectTemplates) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.icon).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(Array.isArray(template.pages)).toBe(true);
    }
  });

  it('has unique template IDs', () => {
    const ids = projectTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references valid page template IDs', () => {
    const validIds = new Set(pageTemplates.map((t) => t.id));
    for (const pt of projectTemplates) {
      for (const page of pt.pages) {
        expect(validIds.has(page.templateId)).toBe(true);
      }
    }
  });
});

describe('templateService', () => {
  it('returns all page templates', () => {
    expect(templateService.getAllPageTemplates()).toHaveLength(pageTemplates.length);
  });

  it('returns all project templates', () => {
    expect(templateService.getAllProjectTemplates()).toHaveLength(projectTemplates.length);
  });

  it('gets page template by ID', () => {
    const t = templateService.getPageTemplate('api-reference');
    expect(t).toBeDefined();
    expect(t!.name).toBe('API Reference');
  });

  it('gets project template by ID', () => {
    const t = templateService.getProjectTemplate('api-docs');
    expect(t).toBeDefined();
    expect(t!.name).toBe('API Documentation');
  });

  it('returns categories', () => {
    const cats = templateService.getCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(cats).toContain('getting-started');
  });

  it('returns metadata', () => {
    const meta = templateService.getMetadata();
    expect(meta.pageCount).toBe(pageTemplates.length);
    expect(meta.projectCount).toBe(projectTemplates.length);
    expect(meta.categories.length).toBeGreaterThan(0);
  });

  it('searches page templates by name', () => {
    const results = templateService.searchPageTemplates('api');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.template.id).toBe('api-reference');
  });

  it('searches page templates by tags', () => {
    const results = templateService.searchPageTemplates('incident');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.template.id === 'runbook')).toBe(true);
  });

  it('searches page templates by description', () => {
    const results = templateService.searchPageTemplates('endpoints');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns all templates for empty query', () => {
    const results = templateService.searchPageTemplates('');
    expect(results).toHaveLength(pageTemplates.length);
  });

  it('resolves content with title', () => {
    const content = templateService.resolveContent('getting-started', { title: 'My App' });
    expect(content).toContain('My App');
    expect(content).not.toContain('{{title}}');
  });

  it('resolves content with date', () => {
    const content = templateService.resolveContent('release-notes', { title: 'v1', date: '2024-01-15' });
    expect(content).toContain('2024-01-15');
    expect(content).not.toContain('{{date}}');
  });

  it('resolves project template pages', () => {
    const pages = templateService.resolveProjectTemplate('api-docs', { date: '2024-01-15' });
    expect(pages.length).toBe(2);
    expect(pages[0]!.title).toBe('Getting Started');
    expect(pages[0]!.content).toContain('Getting Started');
    expect(pages[0]!.content).not.toContain('{{title}}');
    expect(pages[1]!.title).toBe('API Reference');
    expect(pages[1]!.content).toContain('API Reference');
  });

  it('resolves blank project template as empty', () => {
    const pages = templateService.resolveProjectTemplate('blank');
    expect(pages).toHaveLength(0);
  });

  it('filters page templates by category', () => {
    const ops = templateService.getPageTemplatesByCategory('operations');
    expect(ops.length).toBeGreaterThan(0);
    expect(ops.every((t) => t.category === 'operations')).toBe(true);
  });

  it('filters project templates by category', () => {
    const api = templateService.getProjectTemplatesByCategory('api');
    expect(api.length).toBeGreaterThan(0);
    expect(api.every((t) => t.category === 'api')).toBe(true);
  });
});

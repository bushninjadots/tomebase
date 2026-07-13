import { describe, it, expect } from 'vitest';
import { templates } from './templates';

describe('templates', () => {
  it('has a blank template', () => {
    const blank = templates.find((t) => t.id === 'blank');
    expect(blank).toBeDefined();
    expect(blank!.content).toBe('');
  });

  it('has all required fields for every template', () => {
    for (const template of templates) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(typeof template.content).toBe('string');
    }
  });

  it('has unique template IDs', () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains {{title}} placeholder in most templates', () => {
    const skipIds = ['blank'];
    for (const template of templates) {
      if (skipIds.includes(template.id)) continue;
      expect(template.content).toContain('{{title}}');
    }
  });

  it('contains {{date}} placeholder in applicable templates', () => {
    const dateTemplates = ['release-notes', 'changelog', 'rfc', 'meeting-notes', 'postmortem'];
    for (const id of dateTemplates) {
      const template = templates.find((t) => t.id === id);
      expect(template?.content).toContain('{{date}}');
    }
  });

  it('has at least 10 templates', () => {
    expect(templates.length).toBeGreaterThanOrEqual(10);
  });

  it('includes wiki links in relevant templates', () => {
    const templatesWithLinks = templates.filter((t) => t.content.includes('[['));
    expect(templatesWithLinks.length).toBeGreaterThan(0);
  });
});

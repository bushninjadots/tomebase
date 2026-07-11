import { describe, it, expect } from 'vitest';
import { extractDescription, extractHeadings } from './content';

describe('extractDescription', () => {
  it('extracts first heading as description', () => {
    expect(extractDescription('# Getting Started\nSome content')).toBe('Getting Started');
  });

  it('skips empty lines to find content', () => {
    const content = '\n\n# Hello World\nContent';
    expect(extractDescription(content)).toBe('Hello World');
  });

  it('extracts first non-heading paragraph', () => {
    expect(extractDescription('This is a paragraph with enough text')).toBe('This is a paragraph with enough text');
  });

  it('strips markdown formatting from paragraph', () => {
    expect(extractDescription('**Bold** and *italic* text')).toBe('Bold and italic text');
  });

  it('truncates long descriptions to 120 chars', () => {
    const long = 'A'.repeat(200);
    expect(extractDescription(long)).toHaveLength(120);
  });

  it('returns empty string for empty content', () => {
    expect(extractDescription('')).toBe('');
  });

  it('returns empty string for very short lines', () => {
    expect(extractDescription('ok\nHi')).toBe('');
  });
});

describe('extractHeadings', () => {
  it('extracts h1 headings', () => {
    const headings = extractHeadings('# Title');
    expect(headings).toEqual([{ level: 1, text: 'Title', id: 'title' }]);
  });

  it('extracts multiple heading levels', () => {
    const content = '# H1\n## H2\n### H3';
    const headings = extractHeadings(content);
    expect(headings).toEqual([
      { level: 1, text: 'H1', id: 'h1' },
      { level: 2, text: 'H2', id: 'h2' },
      { level: 3, text: 'H3', id: 'h3' },
    ]);
  });

  it('generates slug ids from heading text', () => {
    const headings = extractHeadings('## API Reference v2.0');
    expect(headings[0]!.id).toBe('api-reference-v2-0');
  });

  it('ignores lines that are not headings', () => {
    const content = 'Not a heading\n# Real heading\nRegular text';
    expect(extractHeadings(content)).toHaveLength(1);
  });

  it('strips formatting from heading text', () => {
    const headings = extractHeadings('## **Bold** heading');
    expect(headings[0]!.text).toBe('Bold heading');
  });

  it('returns empty array for no headings', () => {
    expect(extractHeadings('No headings here.')).toEqual([]);
  });
});

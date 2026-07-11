import { describe, it, expect } from 'vitest';
import {
  extractWikiLinks,
  resolveWikiLink,
  preprocessWikiLinks,
  extractTags,
} from './wiki';

describe('extractWikiLinks', () => {
  it('extracts single wiki link', () => {
    const content = 'See [[Getting Started]] for details.';
    expect(extractWikiLinks(content)).toEqual(['Getting Started']);
  });

  it('extracts multiple wiki links', () => {
    const content = 'Check [[Page A]] and [[Page B]] and [[Page C]].';
    expect(extractWikiLinks(content)).toEqual(['Page A', 'Page B', 'Page C']);
  });

  it('returns empty array for no links', () => {
    expect(extractWikiLinks('No links here.')).toEqual([]);
  });

  it('deduplicates wiki links', () => {
    const content = 'See [[Page A]] and [[Page A]] again.';
    expect(extractWikiLinks(content)).toEqual(['Page A']);
  });

  it('handles wiki links with special characters', () => {
    const content = '[[API Reference v2.0]] and [[Auth & Security]].';
    expect(extractWikiLinks(content)).toEqual(['API Reference v2.0', 'Auth & Security']);
  });

  it('ignores malformed wiki links', () => {
    const content = '[[valid]] and [notdouble] and [[noend';
    expect(extractWikiLinks(content)).toEqual(['valid']);
  });
});

describe('resolveWikiLink', () => {
  const pages = [
    { id: '1', title: 'Getting Started', slug: 'getting-started' },
    { id: '2', title: 'API Reference', slug: 'api-reference' },
    { id: '3', title: 'Auth & Security', slug: 'auth-security' },
  ];

  it('resolves exact title match', () => {
    const result = resolveWikiLink('Getting Started', pages);
    expect(result).toEqual({ id: '1', slug: 'getting-started', title: 'Getting Started' });
  });

  it('resolves case-insensitive match', () => {
    const result = resolveWikiLink('getting started', pages);
    expect(result).toEqual({ id: '1', slug: 'getting-started', title: 'Getting Started' });
  });

  it('returns undefined for no match', () => {
    expect(resolveWikiLink('Nonexistent Page', pages)).toBeUndefined();
  });
});

describe('preprocessWikiLinks', () => {
  it('converts wiki links to markdown links', () => {
    const pages = [
      { id: '1', title: 'Getting Started', slug: 'getting-started' },
    ];
    const content = 'See [[Getting Started]] for help.';
    const result = preprocessWikiLinks(content, pages, 'project-1');
    expect(result).toContain('[Getting Started](project-1/getting-started)');
  });

  it('leaves content without wiki links unchanged', () => {
    const content = 'No links here.';
    expect(preprocessWikiLinks(content, [], 'proj')).toBe(content);
  });
});

describe('extractTags', () => {
  it('extracts hashtags from content (with # prefix)', () => {
    const content = 'This is #important and #todo';
    expect(extractTags(content)).toEqual(['#important', '#todo']);
  });

  it('extracts tags from headings', () => {
    const content = '# Overview #backend #api\nSome content';
    expect(extractTags(content)).toEqual(['#backend', '#api']);
  });

  it('deduplicates tags', () => {
    const content = '#test and #test again';
    expect(extractTags(content)).toEqual(['#test']);
  });

  it('returns empty array for no tags', () => {
    expect(extractTags('No tags here.')).toEqual([]);
  });
});

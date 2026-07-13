import { describe, it, expect } from 'vitest';
import {
  extractWikiLinks,
  resolveWikiLink,
  preprocessWikiLinks,
  extractTags,
  findBacklinks,
  getPageLinks,
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

describe('findBacklinks', () => {
  const pages = [
    { title: 'Getting Started', slug: 'getting-started', content: 'See [[API Reference]] for details.' },
    { title: 'API Reference', slug: 'api-reference', content: 'Welcome to the API.' },
    { title: 'Architecture', slug: 'architecture', content: 'Uses [[Getting Started]] as a base.' },
    { title: 'Other', slug: 'other', content: 'No wiki links here.' },
  ];

  it('finds pages that link to a given title', () => {
    const backlinks = findBacklinks('Getting Started', pages);
    expect(backlinks).toEqual([
      { title: 'Architecture', slug: 'architecture' },
    ]);
  });

  it('returns empty array when no pages link to the title', () => {
    const backlinks = findBacklinks('Nonexistent', pages);
    expect(backlinks).toEqual([]);
  });

  it('excludes the page itself from backlinks', () => {
    const selfRef = [
      { title: 'Page A', slug: 'page-a', content: 'Link to [[Page A]]' },
    ];
    const backlinks = findBacklinks('Page A', selfRef);
    expect(backlinks).toEqual([]);
  });

  it('finds backlinks with alias syntax', () => {
    const withAlias = [
      { title: 'Source', slug: 'source', content: 'See [[Target|click here]].' },
      { title: 'Target', slug: 'target', content: 'Some content.' },
    ];
    const backlinks = findBacklinks('Target', withAlias);
    expect(backlinks).toEqual([{ title: 'Source', slug: 'source' }]);
  });
});

describe('getPageLinks', () => {
  const pages = [
    { title: 'Getting Started', slug: 'getting-started' },
    { title: 'API Reference', slug: 'api-reference' },
  ];

  it('returns resolved links', () => {
    const result = getPageLinks('See [[Getting Started]] and [[API Reference]].', pages);
    expect(result).toEqual([
      { title: 'Getting Started', slug: 'getting-started', resolved: true },
      { title: 'API Reference', slug: 'api-reference', resolved: true },
    ]);
  });

  it('marks unresolved links', () => {
    const result = getPageLinks('See [[Missing Page]].', pages);
    expect(result).toEqual([
      { title: 'Missing Page', slug: '', resolved: false },
    ]);
  });

  it('returns empty array for no links', () => {
    expect(getPageLinks('No links.', pages)).toEqual([]);
  });

  it('handles mixed resolved and unresolved', () => {
    const result = getPageLinks('[[Getting Started]] and [[Unknown]].', pages);
    expect(result).toEqual([
      { title: 'Getting Started', slug: 'getting-started', resolved: true },
      { title: 'Unknown', slug: '', resolved: false },
    ]);
  });
});

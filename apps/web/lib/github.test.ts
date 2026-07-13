import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRepoContents, fetchMarkdownFromRepo } from './github';

describe('fetchRepoContents', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches repo contents from GitHub API', async () => {
    const mockData = [
      { name: 'README.md', path: 'docs/README.md', type: 'file', download_url: 'https://example.com/readme' },
      { name: 'guide.md', path: 'docs/guide.md', type: 'file', download_url: 'https://example.com/guide' },
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await fetchRepoContents('owner/repo', 'main', 'docs');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/contents/docs?ref=main',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/vnd.github.v3+json' }) }),
    );
  });

  it('includes auth header when token is provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    await fetchRepoContents('owner/repo', 'main', '.', 'ghp_token123');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_token123',
        }),
      }),
    );
  });

  it('throws on non-OK response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    } as Response);

    await expect(fetchRepoContents('owner/repo', 'main', 'missing')).rejects.toThrow('GitHub API error (404)');
  });
});

describe('fetchMarkdownFromRepo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses markdown files', async () => {
    const entries = [
      { name: 'intro.md', path: 'docs/intro.md', type: 'file' as const, download_url: 'https://example.com/intro' },
      { name: 'guide.md', path: 'docs/guide.md', type: 'file' as const, download_url: 'https://example.com/guide' },
    ];
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => entries } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => '# Welcome\n\nThis is the intro.' } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => '# User Guide\n\nStep by step.' } as Response);

    const result = await fetchMarkdownFromRepo('owner/repo', 'main', 'docs');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ slug: 'intro', title: 'Welcome', content: '# Welcome\n\nThis is the intro.' });
    expect(result[1]).toEqual({ slug: 'guide', title: 'User Guide', content: '# User Guide\n\nStep by step.' });
  });

  it('falls back to filename when no heading found', async () => {
    const entries = [
      { name: 'notes.md', path: 'docs/notes.md', type: 'file' as const, download_url: 'https://example.com/notes' },
    ];
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => entries } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => 'Some content without a heading.' } as Response);

    const result = await fetchMarkdownFromRepo('owner/repo', 'main', 'docs');
    expect(result[0]!.title).toBe('notes');
  });

  it('skips files without download_url', async () => {
    const entries = [
      { name: 'subdir', path: 'docs/subdir', type: 'dir' as const, download_url: null },
      { name: 'readme.md', path: 'docs/readme.md', type: 'file' as const, download_url: null },
    ];
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => entries } as Response);

    const result = await fetchMarkdownFromRepo('owner/repo', 'main', 'docs');
    expect(result).toHaveLength(0);
  });

  it('skips non-markdown files', async () => {
    const entries = [
      { name: 'image.png', path: 'docs/image.png', type: 'file' as const, download_url: 'https://example.com/img' },
      { name: 'data.json', path: 'docs/data.json', type: 'file' as const, download_url: 'https://example.com/json' },
    ];
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => entries } as Response);

    const result = await fetchMarkdownFromRepo('owner/repo', 'main', 'docs');
    expect(result).toHaveLength(0);
  });
});

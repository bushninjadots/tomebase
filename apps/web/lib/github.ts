export async function fetchRepoContents(
  repo: string,
  branch: string,
  path: string,
  token?: string,
): Promise<{ name: string; path: string; type: 'file' | 'dir'; download_url: string | null }[]> {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${body}`);
  }
  return res.json();
}

export async function fetchMarkdownFromRepo(
  repo: string,
  branch: string,
  docsPath: string,
  token?: string,
): Promise<{ slug: string; title: string; content: string }[]> {
  const entries = await fetchRepoContents(repo, branch, docsPath, token);
  const mdFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));

  const results: { slug: string; title: string; content: string }[] = [];

  for (const file of mdFiles) {
    if (!file.download_url) continue;
    const res = await fetch(file.download_url);
    const content = await res.text();

    // Extract title from first # heading, fall back to filename
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1]!.trim() : file.name.replace(/\.md$/, '');
    const slug = file.name.replace(/\.md$/, '');

    results.push({ slug, title, content });
  }

  return results;
}

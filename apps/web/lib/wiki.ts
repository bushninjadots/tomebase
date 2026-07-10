export function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]!.trim());
  }
  return [...new Set(links)];
}

export function resolveWikiLink(
  title: string,
  pages: { title: string; slug: string }[]
): { slug: string; title: string } | undefined {
  const lower = title.toLowerCase();
  
  // Exact match
  const exact = pages.find((p) => p.title.toLowerCase() === lower);
  if (exact) return exact;

  // Starts with match
  const startsWith = pages.find((p) => p.title.toLowerCase().startsWith(lower));
  if (startsWith) return startsWith;

  // Contains match
  const contains = pages.find((p) => p.title.toLowerCase().includes(lower));
  if (contains) return contains;

  return undefined;
}

export function preprocessWikiLinks(
  content: string,
  pages: { title: string; slug: string }[],
  basePath: string
): string {
  return content.replace(
    /\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g,
    (_match: string, title: string, alias?: string) => {
      const trimmed = title.trim();
      const displayText = alias?.trim() || trimmed;
      const page = resolveWikiLink(trimmed, pages);
      if (page) {
        return `[${displayText}](${basePath}/${page.slug})`;
      }
      return `<span class="wiki-link-unresolved">${displayText}</span>`;
    }
  );
}

export function extractTags(content: string): string[] {
  const regex = /(?:^|\s)(#[a-zA-Z][a-zA-Z0-9_/-]*)/g;
  const tags: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1]!.toLowerCase());
  }
  return [...new Set(tags)];
}

export function findBacklinks(
  title: string,
  pages: { title: string; content: string; slug: string }[]
): { title: string; slug: string }[] {
  const pattern = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\[${pattern}(?:\\|[^\\]]+)?\\]\\]`, 'i');
  return pages
    .filter((p) => p.title !== title && regex.test(p.content))
    .map((p) => ({ title: p.title, slug: p.slug }));
}

export function getPageLinks(
  content: string,
  pages: { title: string; slug: string }[]
): { title: string; slug: string; resolved: boolean }[] {
  const links = extractWikiLinks(content);
  return links.map((link) => {
    const page = resolveWikiLink(link, pages);
    return {
      title: link,
      slug: page?.slug || '',
      resolved: !!page,
    };
  });
}

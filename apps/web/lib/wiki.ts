export function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
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
  return pages.find(
    (p) => p.title.toLowerCase() === title.toLowerCase()
  );
}

export function preprocessWikiLinks(
  content: string,
  pages: { title: string; slug: string }[],
  basePath: string
): string {
  return content.replace(
    /\[\[([^\]]+)\]\]/g,
    (_match: string, title: string) => {
      const trimmed = title.trim();
      const page = resolveWikiLink(trimmed, pages);
      if (page) {
        return `[${trimmed}](${basePath}/${page.slug})`;
      }
      return `*${trimmed}*`;
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
  const regex = new RegExp(`\\[\\[${pattern}\\]\\]`, 'i');
  return pages
    .filter((p) => p.title !== title && regex.test(p.content))
    .map((p) => ({ title: p.title, slug: p.slug }));
}

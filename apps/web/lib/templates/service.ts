import type {
  PageTemplate,
  ProjectTemplate,
  TemplateCategory,
  TemplateMetadata,
  TemplateSearchResult,
} from './types';
import { pageTemplates, projectTemplates } from './data';
import { TEMPLATE_CATEGORY_LABELS } from './types';

export const templateService = {
  getAllPageTemplates(): PageTemplate[] {
    return pageTemplates;
  },

  getPageTemplate(id: string): PageTemplate | undefined {
    return pageTemplates.find((t) => t.id === id);
  },

  getAllProjectTemplates(): ProjectTemplate[] {
    return projectTemplates;
  },

  getProjectTemplate(id: string): ProjectTemplate | undefined {
    return projectTemplates.find((t) => t.id === id);
  },

  getPageTemplatesByCategory(category: TemplateCategory): PageTemplate[] {
    return pageTemplates.filter((t) => t.category === category);
  },

  getProjectTemplatesByCategory(category: TemplateCategory): ProjectTemplate[] {
    return projectTemplates.filter((t) => t.category === category);
  },

  getCategories(): TemplateCategory[] {
    const cats = new Set<TemplateCategory>();
    for (const t of pageTemplates) cats.add(t.category);
    for (const t of projectTemplates) cats.add(t.category);
    return Array.from(cats).sort();
  },

  getCategoryLabel(category: TemplateCategory): string {
    return TEMPLATE_CATEGORY_LABELS[category] ?? category;
  },

  getMetadata(): TemplateMetadata {
    const categories = new Set<TemplateCategory>();
    for (const t of pageTemplates) categories.add(t.category);
    for (const t of projectTemplates) categories.add(t.category);
    return {
      pageCount: pageTemplates.length,
      projectCount: projectTemplates.length,
      categories: Array.from(categories).sort(),
    };
  },

  searchPageTemplates(query: string): TemplateSearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q) return pageTemplates.map((t) => ({ template: t, score: 1 }));

    const results: TemplateSearchResult[] = [];
    for (const template of pageTemplates) {
      let score = 0;
      if (template.name.toLowerCase().includes(q)) score += 10;
      if (template.id.toLowerCase().includes(q)) score += 8;
      if (template.description.toLowerCase().includes(q)) score += 5;
      for (const tag of template.tags) {
        if (tag.toLowerCase().includes(q)) score += 3;
      }
      if (template.category.toLowerCase().includes(q)) score += 2;
      if (score > 0) results.push({ template, score });
    }
    return results.sort((a, b) => b.score - a.score);
  },

  resolveContent(templateId: string, vars: { title: string; date?: string }): string {
    const template = pageTemplates.find((t) => t.id === templateId);
    if (!template) return '';
    let content = template.content;
    content = content.replace(/\{\{title\}\}/g, vars.title);
    if (vars.date) {
      content = content.replace(/\{\{date\}\}/g, vars.date);
    }
    return content;
  },

  resolveProjectTemplate(
    projectTemplateId: string,
    vars: { date?: string } = {},
  ): { title: string; content: string; description: string | null }[] {
    const projectTemplate = projectTemplates.find((t) => t.id === projectTemplateId);
    if (!projectTemplate) return [];

    const date = vars.date ?? new Date().toLocaleDateString();
    return projectTemplate.pages.map((pageDef) => {
      const content = templateService.resolveContent(pageDef.templateId, {
        title: pageDef.title,
        date,
      });
      return {
        title: pageDef.title,
        content,
        description: pageDef.description ?? null,
      };
    });
  },

  getIconName(template: PageTemplate | ProjectTemplate): string {
    return template.icon;
  },
};

export type TemplateService = typeof templateService;

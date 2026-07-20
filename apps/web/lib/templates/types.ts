export type TemplateCategory =
  | 'getting-started'
  | 'api'
  | 'operations'
  | 'planning'
  | 'reference'
  | 'process';

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  'getting-started': 'Getting Started',
  'api': 'API & SDK',
  'operations': 'Operations',
  'planning': 'Planning & Design',
  'reference': 'Reference',
  'process': 'Process',
};

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: TemplateCategory;
  icon: string;
  placeholders: string[];
  tags: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  pages: ProjectTemplatePage[];
}

export interface ProjectTemplatePage {
  title: string;
  templateId: string;
  description?: string;
}

export interface TemplateMetadata {
  pageCount: number;
  projectCount: number;
  categories: TemplateCategory[];
}

export interface TemplateSearchResult {
  template: PageTemplate;
  score: number;
}

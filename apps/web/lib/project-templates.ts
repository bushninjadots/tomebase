export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  pages: { title: string; templateId: string; description?: string }[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with no pages',
    icon: 'FileText',
    pages: [],
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    description: 'Getting Started + API Reference pages',
    icon: 'Code2',
    pages: [
      { title: 'Getting Started', templateId: 'getting-started', description: 'Quick start guide' },
      { title: 'API Reference', templateId: 'api-reference', description: 'Available endpoints and methods' },
    ],
  },
  {
    id: 'internal-wiki',
    name: 'Internal Wiki',
    description: 'Home page + Getting Started for team knowledge base',
    icon: 'Users',
    pages: [
      { title: 'Home', templateId: 'blank', description: 'Welcome to the team wiki' },
      { title: 'Getting Started', templateId: 'getting-started', description: 'How to contribute' },
    ],
  },
  {
    id: 'product-docs',
    name: 'Product Documentation',
    description: 'Overview, Getting Started, and Troubleshooting',
    icon: 'BookOpen',
    pages: [
      { title: 'Overview', templateId: 'blank', description: 'Product overview' },
      { title: 'Getting Started', templateId: 'getting-started', description: 'Quick start guide' },
      { title: 'Troubleshooting', templateId: 'troubleshooting', description: 'Common issues and solutions' },
    ],
  },
];

import { NextResponse } from 'next/server';
import { templateService } from '@/lib/templates';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const type = searchParams.get('type');

  if (q) {
    const results = templateService.searchPageTemplates(q);
    return NextResponse.json({ results });
  }

  if (category) {
    const validCategory = category as import('@/lib/templates').TemplateCategory;
    if (type === 'project') {
      const templates = templateService.getProjectTemplatesByCategory(validCategory);
      return NextResponse.json({ templates });
    }
    const templates = templateService.getPageTemplatesByCategory(validCategory);
    return NextResponse.json({ templates });
  }

  if (type === 'project') {
    const templates = templateService.getAllProjectTemplates();
    const metadata = templateService.getMetadata();
    return NextResponse.json({ templates, metadata });
  }

  const templates = templateService.getAllPageTemplates();
  const metadata = templateService.getMetadata();
  return NextResponse.json({ templates, metadata });
}

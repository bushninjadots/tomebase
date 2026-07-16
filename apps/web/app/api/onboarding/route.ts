import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceName, template } = await req.json();

  // Mark user as onboarded
  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboarded: true },
  });

  // Create team with custom name if provided
  if (workspaceName) {
    const team = await getOrCreatePersonalTeam(session.user.id);
    await prisma.team.update({
      where: { id: team.id },
      data: { name: workspaceName },
    });
  }

  // Create initial project based on template
  const team = await getOrCreatePersonalTeam(session.user.id);
  const projectName = template === 'blank' ? 'My Documentation' : 
    template === 'api' ? 'API Reference' :
    template === 'product' ? 'Product Docs' : 'Runbook';

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const project = await prisma.project.create({
    data: {
      name: projectName,
      slug,
      teamId: team.id,
      userId: session.user.id,
    },
  });

  // Create template pages for non-blank templates
  if (template === 'api') {
    await prisma.docPage.createMany({
      data: [
        { projectId: project.id, title: 'Getting Started', slug: 'getting-started', content: '# Getting Started\n\nWelcome to the API reference documentation.', order: 0 },
        { projectId: project.id, title: 'Authentication', slug: 'authentication', content: '# Authentication\n\nLearn how to authenticate with the API.', order: 1 },
        { projectId: project.id, title: 'Endpoints', slug: 'endpoints', content: '# Endpoints\n\nAPI endpoint reference.', order: 2 },
      ],
    });
  } else if (template === 'product') {
    await prisma.docPage.createMany({
      data: [
        { projectId: project.id, title: 'Welcome', slug: 'welcome', content: '# Welcome\n\nUser guide and tutorials.', order: 0 },
        { projectId: project.id, title: 'Features', slug: 'features', content: '# Features\n\nExplore what you can do.', order: 1 },
        { projectId: project.id, title: 'FAQ', slug: 'faq', content: '# FAQ\n\nFrequently asked questions.', order: 2 },
      ],
    });
  } else if (template === 'runbook') {
    await prisma.docPage.createMany({
      data: [
        { projectId: project.id, title: 'Incident Response', slug: 'incident-response', content: '# Incident Response\n\nHow to handle incidents.', order: 0 },
        { projectId: project.id, title: 'Deployment', slug: 'deployment', content: '# Deployment\n\nDeployment procedures.', order: 1 },
        { projectId: project.id, title: 'Rollback', slug: 'rollback', content: '# Rollback\n\nRollback procedures.', order: 2 },
      ],
    });
  }

  return NextResponse.json({ success: true, projectId: project.id });
}

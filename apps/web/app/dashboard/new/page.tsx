import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import { CreateProjectForm } from './form';

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
          <p className="mt-1 text-sm text-gray-500">
            Give your documentation project a name and description.
          </p>
          <div className="mt-8">
            <CreateProjectForm userId={session.user.id} />
          </div>
        </div>
      </Container>
    </div>
  );
}

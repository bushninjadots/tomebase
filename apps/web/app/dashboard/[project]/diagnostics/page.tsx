import { redirect } from 'next/navigation';

export default async function DiagnosticsPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: projectId } = await params;
  redirect(`/dashboard/${projectId}/health?tab=diagnostics`);
}

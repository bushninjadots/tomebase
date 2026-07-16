import { prisma } from '@fluid/database';
import { Link2, Github, CheckCircle } from 'lucide-react';

interface ConnectedAccountsSectionProps {
  userId: string;
}

export async function ConnectedAccountsSection({ userId }: ConnectedAccountsSectionProps) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { provider: true },
  });

  const connectedProviders = accounts.map((a) => a.provider);

  const providers = [
    { id: 'github', name: 'GitHub', icon: Github },
  ];

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Link2 className="h-4 w-4 text-theme-muted" />
        <h2 className="text-sm font-semibold text-theme-main">Connected Accounts</h2>
      </div>

      <div className="space-y-2">
        {providers.map((provider) => {
          const isConnected = connectedProviders.includes(provider.id);
          const Icon = provider.icon;

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-page px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-theme-muted" />
                <div>
                  <p className="text-sm font-medium text-theme-main">{provider.name}</p>
                  <p className="text-[11px] text-theme-muted">
                    {isConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Active</span>
                </div>
              ) : (
                <span className="text-xs text-theme-muted">Not connected</span>
              )}
            </div>
          );
        })}

        {connectedProviders.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-theme-muted">
              No connected accounts. Sign in with GitHub to connect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

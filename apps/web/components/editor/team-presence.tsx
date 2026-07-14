'use client';

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isOnline?: boolean;
  lastSeen?: string;
  currentPage?: string;
}

interface TeamPresenceProps {
  members: TeamMember[];
  currentUserId?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function Avatar({ name, email, image, online, size = 'md' }: {
  name: string | null;
  email: string | null;
  image: string | null;
  online?: boolean;
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]';
  const dotClasses = size === 'sm' ? 'w-2 h-2 -bottom-0 -right-0' : 'w-2.5 h-2.5 -bottom-0.5 -right-0.5';

  return (
    <div className="relative shrink-0">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name || 'User'} className={`${sizeClasses} rounded-full object-cover`} />
      ) : (
        <div className={`${sizeClasses} rounded-full bg-theme-accent/15 flex items-center justify-center font-medium text-theme-accent`}>
          {(name || email || '?').charAt(0).toUpperCase()}
        </div>
      )}
      {online !== undefined && (
        <div className={`absolute ${dotClasses} rounded-full border-2 border-theme-card ${online ? 'bg-green-500' : 'bg-theme-muted/40'}`} />
      )}
    </div>
  );
}

export function TeamPresence({ members, currentUserId }: TeamPresenceProps) {
  const online = members.filter((m) => m.isOnline);
  const offline = members.filter((m) => !m.isOnline);

  return (
    <div className="space-y-4">
      {online.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] font-medium text-theme-muted uppercase tracking-wider">Online</span>
            <span className="text-[10px] text-theme-muted/60">({online.length})</span>
          </div>
          <div className="space-y-1">
            {online.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-theme-hover transition-colors duration-150"
              >
                <Avatar name={member.name} email={member.email} image={member.image} online />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-theme-main truncate">
                    {member.name || 'Unknown'}
                    {member.id === currentUserId && (
                      <span className="text-[10px] text-theme-muted ml-1 font-normal">(you)</span>
                    )}
                  </div>
                  {member.currentPage && (
                    <div className="text-[11px] text-theme-muted truncate">
                      {member.currentPage}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {offline.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-theme-muted/40" />
            <span className="text-[11px] font-medium text-theme-muted uppercase tracking-wider">Offline</span>
            <span className="text-[10px] text-theme-muted/60">({offline.length})</span>
          </div>
          <div className="space-y-1">
            {offline.slice(0, 8).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-theme-hover transition-colors duration-150 opacity-60"
              >
                <Avatar name={member.name} email={member.email} image={member.image} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-theme-muted truncate">
                    {member.name || 'Unknown'}
                  </div>
                  {member.lastSeen && (
                    <div className="text-[10px] text-theme-muted/60">
                      {formatTimeAgo(new Date(member.lastSeen))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {offline.length > 8 && (
              <div className="text-[10px] text-theme-muted/60 px-2 pt-1">
                +{offline.length - 8} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

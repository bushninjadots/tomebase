'use client';

import { useState, useEffect } from 'react';
import { Users, Circle, Clock } from 'lucide-react';

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

export function TeamPresence({ members, currentUserId }: TeamPresenceProps) {
  const onlineMembers = members.filter((m) => m.isOnline && m.id !== currentUserId);
  const offlineMembers = members.filter((m) => !m.isOnline && m.id !== currentUserId);

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-theme-muted">
          <Users className="h-3 w-3" />
          Team Members
        </div>
        <span className="text-[10px] text-theme-muted bg-theme-hover px-2 py-0.5 rounded-full">
          {onlineMembers.length} online
        </span>
      </div>

      <div className="space-y-2">
        {onlineMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-2.5 py-1">
            <div className="relative">
              {member.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.image}
                  alt={member.name || 'User'}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-medium text-theme-accent">
                  {(member.name || member.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-green-500 text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-theme-main truncate">
                {member.name || 'Unknown'}
                {member.id === currentUserId && (
                  <span className="text-[10px] text-theme-muted ml-1">(you)</span>
                )}
              </div>
              {member.currentPage && (
                <div className="text-[10px] text-theme-muted truncate">
                  Viewing: {member.currentPage}
                </div>
              )}
            </div>
          </div>
        ))}

        {offlineMembers.length > 0 && (
          <>
            <div className="pt-2 mt-2 border-t border-theme-border">
              <div className="text-[10px] text-theme-muted mb-2">Offline</div>
            </div>
            {offlineMembers.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center gap-2.5 py-1 opacity-60">
                <div className="relative">
                  {member.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.image}
                      alt={member.name || 'User'}
                      className="h-6 w-6 rounded-full object-cover grayscale"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-theme-hover flex items-center justify-center text-[10px] font-medium text-theme-muted">
                      {(member.name || member.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-theme-muted truncate">
                    {member.name || 'Unknown'}
                  </div>
                  {member.lastSeen && (
                    <div className="flex items-center gap-1 text-[10px] text-theme-muted/60">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTimeAgo(new Date(member.lastSeen))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {offlineMembers.length > 5 && (
              <div className="text-[10px] text-theme-muted text-center">
                +{offlineMembers.length - 5} more
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
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

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Trash2, Reply, AtSign, X } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  replies?: Comment[];
}

interface CommentsProps {
  pageId: string;
  teamMembers: User[];
}

export function Comments({ pageId, teamMembers }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchComments();
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [pageId]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/pages/${pageId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyingTo,
        }),
      });

      if (res.ok) {
        setNewComment('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch {
      // ignore
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/pages/${pageId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        fetchComments();
      }
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @mentions
    const cursorPos = e.target.selectionStart;
    const textBefore = value.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1 && (lastAt === cursorPos - 1 || !textBefore.slice(lastAt).includes(' '))) {
      const query = textBefore.slice(lastAt + 1);
      setMentionQuery(query);
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: User) => {
    const name = user.name || user.email || 'User';
    const cursorPos = textareaRef.current?.selectionStart || newComment.length;
    const textBefore = newComment.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf('@');
    const textAfter = newComment.slice(cursorPos);
    
    const newText = newComment.slice(0, lastAt) + `@${name} ` + textAfter;
    setNewComment(newText);
    setShowMentions(false);
    
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newPos = lastAt + name.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    });
  };

  const filteredMembers = teamMembers.filter(
    (m) => m.id !== currentUser?.id &&
    (m.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
     m.email?.toLowerCase().includes(mentionQuery.toLowerCase()))
  );

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function renderComment(comment: Comment, isReply = false) {
    const isOwn = comment.user.id === currentUser?.id;
    const mentionedYou = comment.content.includes(`@${currentUser?.name}`);

    return (
      <div
        key={comment.id}
        className={`group ${isReply ? 'ml-8 mt-2' : 'mt-4'}`}
      >
        <div className={`rounded-xl border ${mentionedYou ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white'} p-3`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {comment.user.image ? (
                <img
                  src={comment.user.image}
                  alt={comment.user.name || ''}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  {(comment.user.name || comment.user.email || '?')[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {comment.user.name || comment.user.email}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatTime(comment.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  title="Reply"
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
              )}
              {isOwn && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {renderContent(comment.content)}
          </div>
        </div>
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    );
  }

  function renderContent(content: string) {
    // Simple @mention highlighting
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="inline-flex items-center gap-0.5 rounded bg-fluid-100 px-1 py-0.5 text-xs font-medium text-fluid-700">
            <AtSign className="h-3 w-3" />
            {part.slice(1)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Discussion
            {comments.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-4 text-sm text-gray-400">Loading comments...</div>
        ) : (
          <>
            {comments.length === 0 && !replyingTo && (
              <div className="text-center py-6">
                <MessageSquare className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No comments yet</p>
                <p className="text-xs text-gray-300 mt-1">Start the discussion</p>
              </div>
            )}

            {comments.map((comment) => renderComment(comment))}

            {/* Reply indicator */}
            {replyingTo && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                <Reply className="h-3 w-3" />
                <span>Replying to comment</span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-auto p-0.5 hover:bg-gray-200 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Comment input */}
            <div className="mt-4 relative">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={replyingTo ? 'Write a reply...' : 'Add a comment... (@ to mention)'}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none resize-none focus:border-fluid-500 focus:ring-1 focus:ring-fluid-500/20"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || submitting}
                  className="absolute right-2 bottom-2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {/* Mentions dropdown */}
              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    Mention someone
                  </div>
                  {filteredMembers.slice(0, 5).map((member, i) => (
                    <button
                      key={member.id}
                      onClick={() => insertMention(member)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        i === mentionIndex ? 'bg-fluid-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {member.image ? (
                        <img src={member.image} alt="" className="h-5 w-5 rounded-full" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                          {(member.name || member.email || '?')[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{member.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400">{member.email}</span>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-1.5 text-[11px] text-gray-400">
                Press <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded">⌘ Enter</kbd> to send · <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded">@</kbd> to mention
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

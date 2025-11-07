'use client';

import { useState, useEffect } from 'react';
import { X, Send, Clock, User } from 'lucide-react';
import type { ActionItem, ActionNote } from '@/types/action-center';
import { getNotes, addNote } from '@/lib/mocks/action-center/service';

interface NotesDrawerProps {
  item: ActionItem | null;
  onClose: () => void;
}

export function NotesDrawer({ item, onClose }: NotesDrawerProps) {
  const [notes, setNotes] = useState<ActionNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      loadNotes();
    }
  }, [item?.id]);

  const loadNotes = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const fetchedNotes = await getNotes(item.id);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!item || !newNote.trim()) return;

    setSubmitting(true);
    try {
      const note = await addNote(item.id, newNote.trim());
      setNotes([...notes, note]);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900">{item.title}</h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                <span className="font-mono">{item.id}</span>
                <span>•</span>
                <span>{item.refId}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-3 text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Item Details */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium text-gray-900 capitalize">{item.status}</span>
            </div>
            <div>
              <span className="text-gray-500">Reason:</span>
              <span className="ml-2 font-medium text-gray-900">
                {item.reasonCode.replace(/_/g, ' ')}
              </span>
            </div>
            {item.whoName && (
              <div>
                <span className="text-gray-500">Contact:</span>
                <span className="ml-2 font-medium text-gray-900">{item.whoName}</span>
              </div>
            )}
            {item.assigneeName && (
              <div>
                <span className="text-gray-500">Assigned to:</span>
                <span className="ml-2 font-medium text-gray-900">{item.assigneeName}</span>
              </div>
            )}
            {item.amountAtRisk && (
              <div>
                <span className="text-gray-500">Amount at Risk:</span>
                <span className="ml-2 font-medium text-red-600">
                  {(item.amountAtRisk / 100).toLocaleString('fr-FR')} CFA
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Activity Timeline</h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
              <p className="text-sm text-gray-500 mt-2">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No notes yet. Be the first to add one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Item opened event */}
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Action item created</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDateTime(item.openedAt)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {notes.map((note) => (
                <div key={note.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{note.authorName}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(note.createdAt)}</p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{note.body}</p>
                  </div>
                </div>
              ))}

              {/* Status updates */}
              {item.status === 'resolved' && item.meta?.resolvedAt && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      ✓
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Item resolved</span>
                      {item.meta.resolution && ` - ${item.meta.resolution}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDateTime(item.meta.resolvedAt)}
                    </p>
                  </div>
                </div>
              )}

              {item.status === 'snoozed' && item.meta?.snoozedUntil && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                      ⏰
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Item snoozed</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Until {formatDateTime(item.meta.snoozedUntil)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Note Form */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <label htmlFor="new-note" className="block text-sm font-medium text-gray-700 mb-2">
            Add a note
          </label>
          <div className="flex gap-2">
            <textarea
              id="new-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddNote();
                }
              }}
              placeholder="Add context, updates, or decisions..."
              rows={3}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || submitting}
              className="self-end px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Press <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Cmd</kbd> + <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd> to send
          </p>
        </div>
      </div>
    </>
  );
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // If less than 24 hours ago, show relative time
  if (diffHours < 24) {
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }

  // Otherwise show full date
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}

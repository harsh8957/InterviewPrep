import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Clock,
  BookOpen,
  CheckCircle2,
  Edit3,
  Trash2,
  ExternalLink,
  FolderPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface BookmarkList {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  itemCount: number;
}

interface RevisionItem {
  _id: string;
  itemType: 'problem' | 'system_design' | 'core_cs' | 'behavioral';
  itemId: string;
  title: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  url: string;
  notes?: string;
  tags?: string[];
  listId?: string;
  reviewCount: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
  intervalDays: number;
  easeFactor: number;
  isCompleted: boolean;
}

export const RevisionPage: React.FC = () => {
  const [lists, setLists] = useState<BookmarkList[]>([]);
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'due' | 'all'>('due');
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Notes editing state
  const [editingItem, setEditingItem] = useState<RevisionItem | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // New list modal
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  // Quick message banner
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchBookmarksAndQueue = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [listsRes, queueRes] = await Promise.all([
        fetch('/api/bookmarks/lists', { headers }),
        fetch('/api/bookmarks/revision-queue', { headers }),
      ]);

      if (listsRes.ok) {
        const data = await listsRes.json();
        setLists(data.lists || []);
      }
      if (queueRes.ok) {
        const data = await queueRes.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarksAndQueue();
  }, []);

  const handleReviewRating = async (itemId: string, rating: 1 | 3 | 5) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookmarks/revision-queue/${itemId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedItem = data.item;
        setItems(prev => prev.map(it => (it._id === itemId ? updatedItem : it)));
        setBanner({
          message: `Item reviewed! Scheduled next in ${updatedItem.intervalDays} day(s).`,
          type: 'success',
        });
        setTimeout(() => setBanner(null), 3000);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingItem) return;
    try {
      setSavingNotes(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookmarks/items/${editingItem._id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: notesDraft }),
      });

      if (res.ok) {
        const data = await res.json();
        setItems(prev => prev.map(it => (it._id === editingItem._id ? data.item : it)));
        setEditingItem(null);
        setBanner({ message: 'Revision notes saved successfully!', type: 'success' });
        setTimeout(() => setBanner(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Remove from your revision bookmarks? (The underlying challenge is not deleted)')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookmarks/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems(prev => prev.filter(it => it._id !== itemId));
        setBanner({ message: 'Bookmark removed from revision queue.', type: 'success' });
        setTimeout(() => setBanner(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      setCreatingList(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookmarks/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDesc.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLists(prev => [...prev, data.list]);
        setNewListName('');
        setNewListDesc('');
        setShowNewListModal(false);
        setBanner({ message: `Created list "${data.list.name}"!`, type: 'success' });
        setTimeout(() => setBanner(null), 3000);
      }
    } catch (err) {
      console.error('Failed to create list:', err);
    } finally {
      setCreatingList(false);
    }
  };

  const now = new Date();
  const dueItems = items.filter(it => new Date(it.nextReviewAt) <= now);
  const displayedItems = (activeTab === 'due' ? dueItems : items).filter(it => {
    if (selectedListId === 'all') return true;
    return it.listId === selectedListId;
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground animate-pulse font-medium">Loading revision queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              SM-2 Spaced Repetition
            </span>
            <span className="text-xs text-muted-foreground">
              {dueItems.length} item(s) due today
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2.5">
            <BookmarkCheck className="text-primary" size={28} />
            Bookmarks & Spaced Repetition Revision
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Revisit challenging coding problems, architecture patterns, and core CS questions at scientifically optimized intervals.
          </p>
        </div>

        <button
          onClick={() => setShowNewListModal(true)}
          className="btn btn-outline flex items-center gap-2 self-start sm:self-auto"
        >
          <FolderPlus size={16} />
          <span>New Bookmark List</span>
        </button>
      </div>

      {banner && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm flex items-center gap-2 animate-fade-in border",
            banner.type === 'success'
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          <CheckCircle2 size={16} />
          <span>{banner.message}</span>
        </div>
      )}

      {/* Tabs & List Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Main Tabs */}
        <div className="flex p-1 bg-muted/40 rounded-xl border border-border/60 self-start">
          <button
            onClick={() => setActiveTab('due')}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'due'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock size={14} />
            <span>Due Today ({dueItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'all'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen size={14} />
            <span>All Bookmarks ({items.length})</span>
          </button>
        </div>

        {/* List Filter Selector */}
        {lists.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Filter by list:</span>
            <select
              value={selectedListId}
              onChange={e => setSelectedListId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="all">All Lists ({items.length})</option>
              {lists.map(l => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Revision Queue List */}
      {displayedItems.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {activeTab === 'due' ? 'You are all caught up for today!' : 'No bookmarked items yet.'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {activeTab === 'due'
              ? 'Great job! Check back tomorrow or browse all saved bookmarks to review ahead of schedule.'
              : 'Save challenging problems or system design cases while solving to schedule them in your spaced repetition queue.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedItems.map(item => {
            const isDue = new Date(item.nextReviewAt) <= now;
            return (
              <div
                key={item._id}
                className={cn(
                  "card p-5 space-y-4 border transition-all flex flex-col justify-between",
                  isDue ? "border-primary/40 bg-card" : "border-border/60 bg-muted/10 opacity-80"
                )}
              >
                <div className="space-y-3">
                  {/* Top metadata */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {item.itemType.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.difficulty && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            item.difficulty === 'easy'
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : item.difficulty === 'medium'
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}
                        >
                          {item.difficulty}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        title="Remove bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Link */}
                  <div>
                    <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                      <Link to={item.url} className="hover:text-primary transition-colors flex items-center gap-1">
                        <span>{item.title}</span>
                        <ExternalLink size={13} className="text-muted-foreground" />
                      </Link>
                    </h3>
                    {item.category && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                    )}
                  </div>

                  {/* Notes Preview */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold flex items-center gap-1">
                        <Edit3 size={12} /> Notes
                      </span>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setNotesDraft(item.notes || '');
                        }}
                        className="text-primary hover:underline"
                      >
                        {item.notes ? 'Edit' : 'Add Note'}
                      </button>
                    </div>
                    <p className="text-foreground/90 italic">
                      {item.notes || 'No notes added yet. Add key algorithmic tricks or invariants here.'}
                    </p>
                  </div>

                  {/* SM-2 Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span>Reviews: <strong className="text-foreground">{item.reviewCount}</strong></span>
                    <span>Interval: <strong className="text-foreground">{item.intervalDays}d</strong></span>
                    <span>
                      Next:{' '}
                      <strong className={cn(isDue ? "text-amber-500" : "text-foreground")}>
                        {new Date(item.nextReviewAt).toLocaleDateString()}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Rating Buttons */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Record Recall Quality (SM-2):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleReviewRating(item._id, 1)}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                      title="Forgot concept (Resets interval to 1 day)"
                    >
                      Again (1d)
                    </button>
                    <button
                      onClick={() => handleReviewRating(item._id, 3)}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                      title="Remembered with effort"
                    >
                      Good ({Math.max(1, Math.round(item.intervalDays * (item.easeFactor || 2.5)))}d)
                    </button>
                    <button
                      onClick={() => handleReviewRating(item._id, 5)}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                      title="Mastered and instant recall"
                    >
                      Easy ({Math.max(2, Math.round(item.intervalDays * (item.easeFactor || 2.5) * 1.3))}d)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg space-y-4 shadow-xl border-border">
            <h3 className="font-bold text-lg text-foreground">
              Revision Notes: {editingItem.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              Write key memory hooks, common pitfalls, and complexity trade-offs for this item.
            </p>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={5}
              placeholder="e.g. Always check edge cases with 0 and negative values. Use two pointers with tail sorting."
              className="w-full p-3 rounded-xl border border-border bg-muted/20 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="btn btn-primary text-xs"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateList}
            className="card p-6 w-full max-w-md space-y-4 shadow-xl border-border"
          >
            <h3 className="font-bold text-lg text-foreground">Create Bookmark List</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  List Name *
                </label>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="e.g. Google Interview Must-Do"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newListDesc}
                  onChange={e => setNewListDesc(e.target.value)}
                  placeholder="e.g. High-probability graph and dynamic programming challenges"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewListModal(false)}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingList || !newListName.trim()}
                className="btn btn-primary text-xs"
              >
                {creatingList ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RevisionPage;

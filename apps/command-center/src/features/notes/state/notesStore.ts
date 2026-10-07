import { create } from 'zustand';
import { clampNote, isEmptyNote, type ChecklistItem, type Note } from '@/lib/domain/notes';
import { newId } from '@/lib/ids';
import { seedNotes } from './seedNotes';

/**
 * PREVIEW notes store (in memory, resets on reload), like the expense store. Each
 * action maps to a future `notes` repository call (Phase 3 adds the table with RLS).
 */
export type NoteDraft = Pick<Note, 'title' | 'body' | 'items' | 'color' | 'pinned' | 'labels'>;

type NotesState = {
  notes: Note[];
  /** Saves a new or edited note; an empty new note is discarded (returns null). */
  saveNote: (draft: NoteDraft, id?: string | null) => Note | null;
  patchNote: (id: string, patch: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  toggleItem: (id: string, itemId: string) => void;
  /** Removes a note; returns it so the caller can offer Undo. */
  deleteNote: (id: string) => Note | null;
  restoreNote: (note: Note) => void;
  resetPreview: () => void;
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: seedNotes(),

  saveNote: (draft, id) => {
    const existing = id ? get().notes.find((note) => note.id === id) : undefined;
    const clean = clampNote(draft);
    if (!existing && isEmptyNote(clean)) return null;
    const now = Date.now();
    const note: Note = {
      ...clean,
      id: existing?.id ?? newId(),
      archived: existing?.archived ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    set((state) => ({
      notes: existing
        ? state.notes.map((item) => (item.id === note.id ? note : item))
        : [note, ...state.notes],
    }));
    return note;
  },

  patchNote: (id, patch) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...patch,
              // Archiving unpins, as in Keep.
              pinned: patch.archived ? false : (patch.pinned ?? note.pinned),
              updatedAt: Date.now(),
            }
          : note,
      ),
    })),

  toggleItem: (id, itemId) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id && note.items
          ? {
              ...note,
              items: note.items.map((item): ChecklistItem =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
              updatedAt: Date.now(),
            }
          : note,
      ),
    })),

  deleteNote: (id) => {
    const removed = get().notes.find((note) => note.id === id) ?? null;
    if (removed) set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
    return removed;
  },

  restoreNote: (note) =>
    set((state) => ({ notes: [note, ...state.notes.filter((item) => item.id !== note.id)] })),

  resetPreview: () => set({ notes: seedNotes() }),
}));

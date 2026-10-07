import { NOTE_LIMITS, type Note } from './types';

export type NoteFilter = { query: string; label: string | null; archived: boolean };

/** Text searched for a note: title, body, checklist items and labels. */
const haystack = (note: Note) =>
  [note.title, note.body, ...(note.items ?? []).map((item) => item.text), ...note.labels]
    .join('\n')
    .toLocaleLowerCase();

/**
 * Notes for the current view, split into pinned and others (Keep's sections), each
 * most recently edited first. Archived notes show only in the archive, never pinned.
 */
export function visibleNotes(notes: Note[], { query, label, archived }: NoteFilter) {
  const needle = query.trim().toLocaleLowerCase();
  const matches = notes
    .filter((note) => note.archived === archived)
    .filter((note) => !label || note.labels.includes(label))
    .filter((note) => !needle || haystack(note).includes(needle))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return {
    pinned: archived ? [] : matches.filter((note) => note.pinned),
    others: archived ? matches : matches.filter((note) => !note.pinned),
  };
}

/** Every label in use, alphabetically (case-insensitive). */
export const allLabels = (notes: Note[]): string[] =>
  [...new Set(notes.flatMap((note) => note.labels))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );

/** A note with nothing in it is discarded instead of saved (as Keep does). */
export const isEmptyNote = (note: Pick<Note, 'title' | 'body' | 'items'>) =>
  !note.title.trim() &&
  (note.items ? note.items.every((item) => !item.text.trim()) : !note.body.trim());

/** Trims a note to the stored limits (titles, text, checklist and labels). */
export function clampNote<T extends Pick<Note, 'title' | 'body' | 'items' | 'labels'>>(note: T): T {
  return {
    ...note,
    title: note.title.slice(0, NOTE_LIMITS.title),
    body: note.body.slice(0, NOTE_LIMITS.body),
    items: note.items
      ? note.items
          .slice(0, NOTE_LIMITS.items)
          .map((item) => ({ ...item, text: item.text.slice(0, NOTE_LIMITS.itemText) }))
      : null,
    labels: [...new Set(note.labels.map((label) => label.trim().slice(0, NOTE_LIMITS.label)))]
      .filter(Boolean)
      .slice(0, NOTE_LIMITS.labels),
  };
}

/** Text note ⇄ checklist, keeping the content: lines become items and back. */
export function toggleChecklist<T extends Pick<Note, 'body' | 'items'>>(
  note: T,
  newId: () => string,
): T {
  if (note.items) {
    return { ...note, body: note.items.map((item) => item.text).join('\n'), items: null };
  }
  const lines = note.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    ...note,
    body: '',
    items: lines.map((text) => ({ id: newId(), text, done: false })),
  };
}

/** "3/5 done" style progress for checklist cards. */
export function checklistProgress(note: Note): { done: number; total: number } | null {
  if (!note.items) return null;
  return { done: note.items.filter((item) => item.done).length, total: note.items.length };
}

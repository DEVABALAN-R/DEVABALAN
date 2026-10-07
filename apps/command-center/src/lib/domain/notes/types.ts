import type { NoteColor } from '@/theme/noteColors';

export type { NoteColor };

export type ChecklistItem = { id: string; text: string; done: boolean };

/**
 * A note (Google Keep style): a text note, or a checklist when `items` is not null.
 * Mirrors the planned `notes` table so the preview store can become a repository.
 */
export type Note = {
  id: string;
  title: string;
  body: string;
  /** null = text note; otherwise the checklist (body is unused). */
  items: ChecklistItem[] | null;
  color: NoteColor;
  pinned: boolean;
  archived: boolean;
  labels: string[];
  createdAt: number;
  updatedAt: number;
};

export const NOTE_LIMITS = {
  title: 120,
  body: 20_000,
  items: 200,
  itemText: 300,
  labels: 10,
  label: 30,
} as const;

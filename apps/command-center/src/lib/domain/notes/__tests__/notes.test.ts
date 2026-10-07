import {
  allLabels,
  checklistProgress,
  clampNote,
  isEmptyNote,
  toggleChecklist,
  visibleNotes,
} from '../notes';
import type { Note } from '../types';

const note = (patch: Partial<Note>): Note => ({
  id: 'n',
  title: '',
  body: '',
  items: null,
  color: 'default',
  pinned: false,
  archived: false,
  labels: [],
  createdAt: 0,
  updatedAt: 0,
  ...patch,
});

const notes = [
  note({
    id: 'a',
    title: 'Groceries',
    items: [{ id: 'i', text: 'Milk', done: true }],
    updatedAt: 3,
  }),
  note({
    id: 'b',
    title: 'Trip ideas',
    body: 'Ooty in May',
    pinned: true,
    labels: ['Travel'],
    updatedAt: 2,
  }),
  note({ id: 'c', title: 'Old', body: 'archived', archived: true, pinned: true, updatedAt: 5 }),
  note({ id: 'd', body: 'Call the bank', labels: ['finance', 'Travel'], updatedAt: 4 }),
];

describe('notes', () => {
  it('splits pinned and others, newest first, archive kept apart', () => {
    const view = visibleNotes(notes, { query: '', label: null, archived: false });
    expect(view.pinned.map((item) => item.id)).toEqual(['b']);
    expect(view.others.map((item) => item.id)).toEqual(['d', 'a']);
    const archive = visibleNotes(notes, { query: '', label: null, archived: true });
    expect(archive).toEqual({ pinned: [], others: [notes[2]] });
  });

  it('searches titles, text, checklist items and labels, and filters by label', () => {
    const find = (query: string, label: string | null = null) =>
      visibleNotes(notes, { query, label, archived: false }).others.map((item) => item.id);
    expect(find('milk')).toEqual(['a']);
    expect(find('BANK')).toEqual(['d']);
    expect(
      visibleNotes(notes, { query: '', label: 'Travel', archived: false }).pinned,
    ).toHaveLength(1);
    expect(find('', 'Travel')).toEqual(['d']);
  });

  it('lists labels once, alphabetically', () => {
    expect(allLabels(notes)).toEqual(['finance', 'Travel']);
  });

  it('treats a note with no title and no text as empty', () => {
    expect(isEmptyNote(note({ body: '  ' }))).toBe(true);
    expect(isEmptyNote(note({ items: [{ id: 'x', text: ' ', done: false }] }))).toBe(true);
    expect(isEmptyNote(note({ title: 'Hi' }))).toBe(false);
  });

  it('converts between text and checklist without losing content', () => {
    let next = 0;
    const list = toggleChecklist(note({ body: 'Eggs\n\n Bread ' }), () => `id${next++}`);
    expect(list.items).toEqual([
      { id: 'id0', text: 'Eggs', done: false },
      { id: 'id1', text: 'Bread', done: false },
    ]);
    expect(toggleChecklist(list, () => 'x')).toMatchObject({ body: 'Eggs\nBread', items: null });
    expect(
      checklistProgress({ ...list, items: [{ id: 'a', text: 'A', done: true }, ...list.items!] }),
    ).toEqual({
      done: 1,
      total: 3,
    });
  });

  it('clamps text and de-duplicates labels', () => {
    const clamped = clampNote(note({ title: 'x'.repeat(200), labels: ['A', ' A ', '', 'B'] }));
    expect(clamped.title).toHaveLength(120);
    expect(clamped.labels).toEqual(['A', 'B']);
  });
});

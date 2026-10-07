import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { NotesScreen } from '../NotesScreen';
import { useNotesStore } from '../state/notesStore';

const notes = () => useNotesStore.getState().notes;

beforeEach(() => useNotesStore.getState().resetPreview());

describe('NotesScreen', () => {
  it('shows pinned notes apart and finds notes by search', async () => {
    await renderWithProviders(<NotesScreen />);
    expect(screen.getByText('Pinned')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open pinned note: Review SIPs' })).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Search notes'), 'curry');
    expect(screen.queryByRole('button', { name: 'Open pinned note: Review SIPs' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open note: Groceries' })).toBeTruthy();
  });

  it('ticks a checklist item straight from the card', async () => {
    await renderWithProviders(<NotesScreen />);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Rice 5 kg' }));
    const groceries = notes().find((note) => note.id === 'note-groceries')!;
    expect(groceries.items?.find((item) => item.text === 'Rice 5 kg')?.done).toBe(true);
  });

  it('creates a note on Done and discards an empty one', async () => {
    await renderWithProviders(<NotesScreen />);
    const before = notes().length;
    await fireEvent.press(screen.getByRole('button', { name: 'Take a note' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(notes()).toHaveLength(before);
    await fireEvent.press(screen.getByRole('button', { name: 'Take a note' }));
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Ideas');
    await fireEvent.changeText(screen.getByLabelText('Note'), 'Plan the weekend');
    await fireEvent.press(screen.getByRole('radio', { name: 'mint colour' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(notes()[0]).toMatchObject({ title: 'Ideas', body: 'Plan the weekend', color: 'mint' });
  });

  it('archives a note and deletes with undo', async () => {
    await renderWithProviders(<NotesScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Open note: Hometown trip' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Archive note' }));
    expect(notes().find((note) => note.id === 'note-trip')?.archived).toBe(true);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Archive' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Open note: Hometown trip' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete note' }));
    expect(notes().some((note) => note.id === 'note-trip')).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(notes().some((note) => note.id === 'note-trip')).toBe(true);
  });

  it('turns a text note into a checklist', async () => {
    await renderWithProviders(<NotesScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Take a note' }));
    await fireEvent.changeText(screen.getByLabelText('Note'), 'Eggs\nBread');
    await fireEvent.press(screen.getByRole('button', { name: 'Show as checklist' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(notes()[0].items?.map((item) => item.text)).toEqual(['Eggs', 'Bread']);
  });
});

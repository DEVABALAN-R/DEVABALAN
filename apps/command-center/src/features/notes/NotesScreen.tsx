import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Archive, ListChecks, Search, StickyNote } from '@/components/icons';
import { EmptyState } from '@/components/feedback';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen } from '@/components/layout/Screen';
import { Chip, IconButton, Text } from '@/components/ui';
import { allLabels, visibleNotes, type Note } from '@/lib/domain/notes';
import { SampleDataBadge } from '@/features/preview/SampleDataBadge';
import { fontFamily, useTheme } from '@/theme';
import { NoteEditor } from './components/NoteEditor';
import { NoteGrid } from './components/NoteGrid';
import { useNotesStore } from './state/notesStore';

type Editing = { note: Note | null; checklist?: boolean } | null;

/** Notes (Google Keep style): quick capture, pinned and other notes, labels, archive, search. */
export function NotesScreen() {
  const theme = useTheme();
  const notes = useNotesStore((state) => state.notes);
  const [query, setQuery] = useState('');
  const [label, setLabel] = useState<string | null>(null);
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const labels = useMemo(() => allLabels(notes), [notes]);
  const view = useMemo(
    () => visibleNotes(notes, { query, label, archived }),
    [notes, query, label, archived],
  );
  const open = (note: Note) => setEditing({ note });
  const empty = !view.pinned.length && !view.others.length;
  return (
    <Screen>
      <PageHeader title="Notes" meta={<SampleDataBadge editable />} size="compact" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[2],
          paddingHorizontal: theme.space[3],
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Search size={16} color={theme.colors.textSecondary} aria-hidden />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes"
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel="Search notes"
          style={{
            flex: 1,
            paddingVertical: 9,
            color: theme.colors.textPrimary,
            fontFamily: fontFamily.regular,
            fontSize: 14,
            outlineWidth: 0,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
        <Chip
          label="All notes"
          selected={!label && !archived}
          onPress={() => {
            setLabel(null);
            setArchived(false);
          }}
        />
        {labels.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={label === item && !archived}
            onPress={() => {
              setLabel(item);
              setArchived(false);
            }}
          />
        ))}
        <Chip label="Archive" selected={archived} onPress={() => setArchived(true)} />
      </View>
      {archived ? null : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'center',
            width: '100%',
            maxWidth: 600,
            paddingLeft: theme.space[4],
            paddingRight: theme.space[2],
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.borderStrong,
          }}
        >
          <Pressable
            role="button"
            accessibilityLabel="Take a note"
            onPress={() => setEditing({ note: null })}
            style={{ flex: 1, paddingVertical: theme.space[3] }}
          >
            <Text color="textSecondary">Take a note…</Text>
          </Pressable>
          <IconButton
            icon={ListChecks}
            accessibilityLabel="New checklist"
            onPress={() => setEditing({ note: null, checklist: true })}
          />
        </View>
      )}
      {empty ? (
        <EmptyState
          icon={archived ? Archive : StickyNote}
          title={archived ? 'Nothing archived' : query ? 'No notes match' : 'No notes yet'}
          body={
            archived
              ? 'Archived notes appear here.'
              : query
                ? 'Try another word, or clear the search.'
                : 'Notes you add appear here.'
          }
        />
      ) : null}
      {view.pinned.length ? (
        <View style={{ gap: theme.space[2] }}>
          <Text variant="eyebrow" color="textTertiary" uppercase>
            Pinned
          </Text>
          <NoteGrid notes={view.pinned} onOpen={open} />
        </View>
      ) : null}
      {view.others.length ? (
        <View style={{ gap: theme.space[2] }}>
          {view.pinned.length ? (
            <Text variant="eyebrow" color="textTertiary" uppercase>
              Others
            </Text>
          ) : null}
          <NoteGrid notes={view.others} onOpen={open} />
        </View>
      ) : null}
      {editing ? (
        <NoteEditor
          key={editing.note?.id ?? 'new'}
          note={editing.note}
          checklist={editing.checklist}
          label={label}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Screen>
  );
}

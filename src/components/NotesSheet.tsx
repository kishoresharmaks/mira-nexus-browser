import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BottomSheet } from './BottomSheet';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { useToast } from './Toast';
import { haptic } from '@/lib/haptics';
import { createWebNote, exportNotesMarkdown, getNotesForUrl } from '@/lib/notes';
import { isWebUrl } from '@/lib/url';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { WebNote } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  notes: WebNote[];
  activeUrl?: string;
  activeTitle?: string;
  onSaveNote: (note: WebNote) => void;
  onDeleteNote: (id: string) => void;
  onOpenUrl?: (url: string) => void;
};

export function NotesSheet({
  visible,
  onClose,
  notes,
  activeUrl,
  activeTitle,
  onSaveNote,
  onDeleteNote,
  onOpenUrl,
}: Props) {
  const { theme } = useTheme();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCurrentPage, setFilterCurrentPage] = useState(false);

  // Editor modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<WebNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteUrl, setNoteUrl] = useState('');

  const currentPageNotes = useMemo(() => {
    if (!activeUrl || !isWebUrl(activeUrl)) return [];
    return getNotesForUrl(notes, activeUrl);
  }, [notes, activeUrl]);

  const filteredNotes = useMemo(() => {
    let list = notes;
    if (filterCurrentPage && activeUrl) {
      list = currentPageNotes;
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.host && n.host.toLowerCase().includes(q)) ||
          (n.url && n.url.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [notes, filterCurrentPage, activeUrl, currentPageNotes, searchQuery]);

  const handleOpenAddNote = () => {
    haptic.tap();
    setEditingNote(null);
    setNoteTitle(activeTitle ? `Note: ${activeTitle}` : '');
    setNoteContent('');
    setNoteUrl(activeUrl && isWebUrl(activeUrl) ? activeUrl : '');
    setModalOpen(true);
  };

  const handleEditNote = (note: WebNote) => {
    haptic.tap();
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteUrl(note.url);
    setModalOpen(true);
  };

  const handleSaveNoteSubmit = () => {
    if (!noteContent.trim()) {
      toast.show('Note content cannot be empty');
      return;
    }
    haptic.success();
    if (editingNote) {
      onSaveNote({
        ...editingNote,
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        url: noteUrl.trim(),
        updatedAt: Date.now(),
      });
      toast.show('Note updated');
    } else {
      const newNote = createWebNote(noteTitle, noteContent, noteUrl);
      onSaveNote(newNote);
      toast.show('Note saved');
    }
    setModalOpen(false);
  };

  const handleDeleteConfirm = (note: WebNote) => {
    Alert.alert('Delete Note?', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptic.warn();
          onDeleteNote(note.id);
          toast.show('Note deleted');
        },
      },
    ]);
  };

  const handleExportAll = async () => {
    haptic.tap();
    const md = exportNotesMarkdown(notes);
    await Clipboard.setStringAsync(md);
    toast.show('All notes copied in Markdown format to clipboard');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            PERSONAL ANNOTATIONS
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Web Notes
          </Text>
        </View>

        <View style={styles.headerActions}>
          <PressableScale
            onPress={handleOpenAddNote}
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            accessibilityLabel="New note"
          >
            <Icon name="plus" size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>New</Text>
          </PressableScale>

          {notes.length > 0 && (
            <IconButton
              icon="share"
              label="Export notes"
              size={34}
              iconSize={15}
              variant="surface"
              onPress={handleExportAll}
            />
          )}

          <IconButton
            icon="close"
            label="Close notes"
            size={34}
            iconSize={16}
            variant="surface"
            onPress={onClose}
          />
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Icon name="search" size={14} color={theme.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.ink }]}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>

        {activeUrl && isWebUrl(activeUrl) && (
          <PressableScale
            onPress={() => {
              haptic.select();
              setFilterCurrentPage(!filterCurrentPage);
            }}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterCurrentPage ? theme.accent : theme.surface,
                borderColor: filterCurrentPage ? theme.accent : theme.line,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 11.5,
                color: filterCurrentPage ? '#FFFFFF' : theme.inkSoft,
              }}
            >
              This Page ({currentPageNotes.length})
            </Text>
          </PressableScale>
        )}
      </View>

      {/* Notes List */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={[styles.iconOrb, { backgroundColor: theme.accentSoft }]}>
                <Icon name="note" size={24} color={theme.accent} strokeWidth={2} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                {searchQuery ? 'No notes match your search' : 'No notes saved yet'}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.muted }]}>
                Capture key takeaways, thoughts, code snippets, or research quotes linked directly to any website.
              </Text>
              <PressableScale
                onPress={handleOpenAddNote}
                style={[styles.createNoteBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.createNoteBtnText}>+ Create Note</Text>
              </PressableScale>
            </View>
          </View>
        ) : (
          filteredNotes.map((note) => (
            <View
              key={note.id}
              style={[
                styles.noteCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.noteCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.noteTitle, { color: theme.ink }]}>
                    {note.title}
                  </Text>
                  {note.url ? (
                    <PressableScale
                      onPress={() => {
                        if (onOpenUrl) {
                          haptic.tap();
                          onOpenUrl(note.url);
                          onClose();
                        }
                      }}
                      style={styles.sourceRow}
                    >
                      <Favicon host={note.host} size={14} />
                      <Text numberOfLines={1} style={[styles.sourceHost, { color: theme.accent }]}>
                        {note.host || note.url}
                      </Text>
                    </PressableScale>
                  ) : null}
                </View>

                <View style={styles.noteCardActions}>
                  <PressableScale
                    onPress={() => handleEditNote(note)}
                    style={styles.iconMiniBtn}
                    accessibilityLabel="Edit note"
                  >
                    <Icon name="edit" size={14} color={theme.inkSoft} />
                  </PressableScale>
                  <PressableScale
                    onPress={() => handleDeleteConfirm(note)}
                    style={styles.iconMiniBtn}
                    accessibilityLabel="Delete note"
                  >
                    <Icon name="trash" size={14} color={theme.inkSoft} />
                  </PressableScale>
                </View>
              </View>

              <Text style={[styles.noteBody, { color: theme.inkSoft }]}>
                {note.content}
              </Text>

              <Text style={[styles.noteDate, { color: theme.muted }]}>
                Updated {new Date(note.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Note Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.ink }]}>
              {editingNote ? 'Edit Note' : 'Create Web Note'}
            </Text>

            <Text style={[styles.inputLabel, { color: theme.muted }]}>TITLE</Text>
            <TextInput
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Note title or topic"
              placeholderTextColor={theme.muted}
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>WEBSITE URL (OPTIONAL)</Text>
            <TextInput
              value={noteUrl}
              onChangeText={setNoteUrl}
              placeholder="https://example.com"
              placeholderTextColor={theme.muted}
              autoCapitalize="none"
              keyboardType="url"
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>CONTENT</Text>
            <TextInput
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Type your notes, code snippets, or thoughts..."
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={6}
              style={[styles.modalInput, styles.textArea, { color: theme.ink, borderColor: theme.line }]}
            />

            <View style={styles.modalButtons}>
              <PressableScale
                onPress={() => setModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: theme.chip }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: theme.ink }}>Cancel</Text>
              </PressableScale>
              <PressableScale
                onPress={handleSaveNoteSubmit}
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: '#FFFFFF' }}>Save</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    gap: 4,
  },
  actionBtnText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    padding: 0,
  },
  filterPill: {
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listScroll: {
    maxHeight: 460,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  noteCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  sourceHost: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  noteCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconMiniBtn: {
    padding: 6,
  },
  noteBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  noteDate: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  emptyWrap: {
    paddingTop: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  createNoteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  createNoteBtnText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
  },
  modalTitle: {
    fontFamily: fonts.serif,
    fontSize: 19,
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: 12,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
});

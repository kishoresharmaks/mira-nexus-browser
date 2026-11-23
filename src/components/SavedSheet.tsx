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
import {
  createBookmark,
  exportBookmarksHtml,
  exportBookmarksJson,
  findDuplicateBookmark,
  parseImportedBookmarksJson,
} from '@/lib/collections';
import { haptic } from '@/lib/haptics';
import { isWebUrl } from '@/lib/url';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Bookmark, Collection, CuratedPage } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  collections: Collection[];
  bookmarks: Bookmark[];
  activeUrl?: string;
  activeTitle?: string;
  onOpenUrl: (url: string) => void;
  onSaveBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
  onSaveCollection: (collection: Collection) => void;
  onDeleteCollection: (id: string) => void;
  onImportBookmarks: (collections: Collection[], bookmarks: Bookmark[]) => void;
};

export function SavedSheet({
  visible,
  onClose,
  collections,
  bookmarks,
  activeUrl,
  activeTitle,
  onOpenUrl,
  onSaveBookmark,
  onDeleteBookmark,
  onSaveCollection,
  onDeleteCollection,
  onImportBookmarks,
}: Props) {
  const { theme } = useTheme();
  const toast = useToast();

  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Editors
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [bmUrl, setBmUrl] = useState('');
  const [bmTitle, setBmTitle] = useState('');
  const [bmCollectionId, setBmCollectionId] = useState('favorites');
  const [bmNotes, setBmNotes] = useState('');

  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Saved articles
  const savedArticles = useMemo<CuratedPage[]>(() => {
    return [];
  }, []);

  // Filtered bookmarks
  const filteredBookmarks = useMemo(() => {
    if (activeCategoryId === 'articles') return [];
    let list = bookmarks;
    if (activeCategoryId !== 'all') {
      list = list.filter((b) => b.collectionId === activeCategoryId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.host.toLowerCase().includes(q) ||
          (b.notes && b.notes.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [bookmarks, activeCategoryId, searchQuery]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    if (activeCategoryId !== 'all' && activeCategoryId !== 'articles') return [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return savedArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.host.toLowerCase().includes(q) ||
          a.note.toLowerCase().includes(q),
      );
    }
    return savedArticles;
  }, [savedArticles, activeCategoryId, searchQuery]);

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === activeCategoryId),
    [collections, activeCategoryId],
  );

  // Duplicate check for add bookmark dialog
  const duplicateBookmark = useMemo(() => {
    if (!bmUrl.trim() || !isWebUrl(bmUrl.trim())) return undefined;
    return findDuplicateBookmark(bookmarks, bmUrl.trim(), editingBookmark?.id);
  }, [bmUrl, bookmarks, editingBookmark]);

  const handleOpenAddBookmark = () => {
    haptic.tap();
    setEditingBookmark(null);
    setBmUrl(activeUrl && isWebUrl(activeUrl) ? activeUrl : '');
    setBmTitle(activeTitle || '');
    setBmCollectionId(activeCategoryId !== 'all' && activeCategoryId !== 'articles' ? activeCategoryId : 'favorites');
    setBmNotes('');
    setBookmarkModalOpen(true);
  };

  const handleEditBookmark = (item: Bookmark) => {
    haptic.tap();
    setEditingBookmark(item);
    setBmUrl(item.url);
    setBmTitle(item.title);
    setBmCollectionId(item.collectionId);
    setBmNotes(item.notes || '');
    setBookmarkModalOpen(true);
  };

  const handleSaveBookmarkSubmit = () => {
    if (!bmUrl.trim() || !isWebUrl(bmUrl.trim())) {
      toast.show('Please enter a valid web URL');
      return;
    }

    haptic.success();
    if (editingBookmark) {
      onSaveBookmark({
        ...editingBookmark,
        url: bmUrl.trim(),
        title: bmTitle.trim() || editingBookmark.title,
        collectionId: bmCollectionId,
        notes: bmNotes.trim() || undefined,
      });
      toast.show('Bookmark updated');
    } else {
      const newBm = createBookmark(
        bmUrl.trim(),
        bmTitle.trim(),
        bmCollectionId,
        undefined,
        bmNotes.trim() || undefined,
      );
      onSaveBookmark(newBm);
      toast.show('Saved to collection');
    }
    setBookmarkModalOpen(false);
  };

  const handleDeleteBookmarkConfirm = (item: Bookmark) => {
    haptic.warn();
    onDeleteBookmark(item.id);
    toast.show('Bookmark removed');
  };

  const handleOpenAddCollection = () => {
    haptic.tap();
    setEditingCollection(null);
    setColName('');
    setColDesc('');
    setCollectionModalOpen(true);
  };

  const handleEditCollection = (col: Collection) => {
    haptic.tap();
    setEditingCollection(col);
    setColName(col.name);
    setColDesc(col.description || '');
    setCollectionModalOpen(true);
  };

  const handleSaveCollectionSubmit = () => {
    if (!colName.trim()) {
      toast.show('Please enter a collection name');
      return;
    }
    haptic.success();
    if (editingCollection) {
      onSaveCollection({
        ...editingCollection,
        name: colName.trim(),
        description: colDesc.trim() || undefined,
      });
      toast.show('Collection updated');
    } else {
      const newCol: Collection = {
        id: `col-${Date.now().toString(36)}`,
        name: colName.trim(),
        description: colDesc.trim() || undefined,
        icon: 'folder',
        createdAt: Date.now(),
        isSystem: false,
      };
      onSaveCollection(newCol);
      setActiveCategoryId(newCol.id);
      toast.show(`Created collection "${newCol.name}"`);
    }
    setCollectionModalOpen(false);
  };

  const handleDeleteCollectionConfirm = (col: Collection) => {
    if (col.isSystem) {
      toast.show('System collections cannot be deleted');
      return;
    }
    Alert.alert(
      'Delete Collection?',
      `Delete "${col.name}"? Bookmarks inside will be moved to Favorites.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptic.warn();
            onDeleteCollection(col.id);
            setActiveCategoryId('all');
            toast.show('Collection deleted');
          },
        },
      ],
    );
  };

  const handleExportJson = async () => {
    haptic.tap();
    const jsonStr = exportBookmarksJson(collections, bookmarks);
    await Clipboard.setStringAsync(jsonStr);
    toast.show('Bookmarks copied as JSON to clipboard');
  };

  const handleExportHtml = async () => {
    haptic.tap();
    const htmlStr = exportBookmarksHtml(collections, bookmarks);
    await Clipboard.setStringAsync(htmlStr);
    toast.show('HTML bookmark format copied to clipboard');
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const parsed = parseImportedBookmarksJson(importJsonText);
    if (!parsed) {
      toast.show('Invalid bookmarks JSON format');
      return;
    }
    haptic.success();
    onImportBookmarks(parsed.collections, parsed.bookmarks);
    setImportModalOpen(false);
    setImportJsonText('');
    toast.show(`Imported ${parsed.bookmarks.length} bookmarks`);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>
            SAVED HUBS
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Saved
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Bookmarks, collections and saved articles
          </Text>
        </View>

        <View style={styles.headerActions}>
          <PressableScale
            onPress={handleOpenAddBookmark}
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            accessibilityLabel="Add bookmark"
          >
            <Icon name="plus" size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>Add</Text>
          </PressableScale>

          <IconButton
            icon="share"
            label="Export Bookmarks"
            size={34}
            iconSize={15}
            variant="surface"
            onPress={() => {
              Alert.alert('Bookmark Backup', 'Choose an action for your saved items:', [
                { text: 'Copy JSON Backup', onPress: handleExportJson },
                { text: 'Copy HTML Format', onPress: handleExportHtml },
                { text: 'Import JSON Backup', onPress: () => setImportModalOpen(true) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />

          <IconButton
            icon="close"
            label="Close saved hub"
            size={34}
            iconSize={16}
            variant="surface"
            onPress={onClose}
          />
        </View>
      </View>

      {/* Search Bar */}
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
            placeholder="Search saved bookmarks, articles or notes..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.ink }]}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        <PressableScale
          onPress={() => {
            haptic.select();
            setActiveCategoryId('all');
          }}
          style={[
            styles.categoryPill,
            {
              backgroundColor: activeCategoryId === 'all' ? theme.accent : theme.surface,
              borderColor: activeCategoryId === 'all' ? theme.accent : theme.line,
            },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: activeCategoryId === 'all' ? '#FFFFFF' : theme.inkSoft },
            ]}
          >
            All ({bookmarks.length + savedArticles.length})
          </Text>
        </PressableScale>

        <PressableScale
          onPress={() => {
            haptic.select();
            setActiveCategoryId('articles');
          }}
          style={[
            styles.categoryPill,
            {
              backgroundColor: activeCategoryId === 'articles' ? theme.accent : theme.surface,
              borderColor: activeCategoryId === 'articles' ? theme.accent : theme.line,
            },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: activeCategoryId === 'articles' ? '#FFFFFF' : theme.inkSoft },
            ]}
          >
            Articles ({savedArticles.length})
          </Text>
        </PressableScale>

        {collections.map((cat) => {
          const active = cat.id === activeCategoryId;
          const count = bookmarks.filter((b) => b.collectionId === cat.id).length;
          return (
            <PressableScale
              key={cat.id}
              onPress={() => {
                haptic.select();
                setActiveCategoryId(cat.id);
              }}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: active ? theme.accent : theme.surface,
                  borderColor: active ? theme.accent : theme.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: active ? '#FFFFFF' : theme.inkSoft },
                ]}
              >
                {cat.name} ({count})
              </Text>
            </PressableScale>
          );
        })}

        <PressableScale
          onPress={handleOpenAddCollection}
          style={[
            styles.categoryPill,
            { backgroundColor: theme.chip, borderColor: theme.line },
          ]}
          accessibilityLabel="Create collection"
        >
          <Icon name="plus" size={12} color={theme.inkSoft} strokeWidth={2} />
          <Text style={[styles.categoryText, { color: theme.inkSoft, marginLeft: 4 }]}>
            New
          </Text>
        </PressableScale>
      </ScrollView>

      {/* Active Custom Collection Controls (if custom collection) */}
      {activeCollection && activeCategoryId !== 'all' && activeCategoryId !== 'articles' && (
        <View
          style={[
            styles.collectionBanner,
            { backgroundColor: theme.chip, borderColor: theme.line },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.collectionBannerTitle, { color: theme.ink }]}>
              {activeCollection.name}
            </Text>
            {activeCollection.description ? (
              <Text style={[styles.collectionBannerDesc, { color: theme.muted }]}>
                {activeCollection.description}
              </Text>
            ) : null}
          </View>
          <View style={styles.bannerActions}>
            <PressableScale
              onPress={() => handleEditCollection(activeCollection)}
              style={styles.bannerBtn}
            >
              <Icon name="edit" size={14} color={theme.inkSoft} />
            </PressableScale>
            {!activeCollection.isSystem && (
              <PressableScale
                onPress={() => handleDeleteCollectionConfirm(activeCollection)}
                style={styles.bannerBtn}
              >
                <Icon name="trash" size={14} color={theme.inkSoft} />
              </PressableScale>
            )}
          </View>
        </View>
      )}

      {/* Items List */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bookmarks */}
        {filteredBookmarks.map((item) => {
          const col = collections.find((c) => c.id === item.collectionId);
          return (
            <PressableScale
              key={item.id}
              onPress={() => {
                haptic.tap();
                onOpenUrl(item.url);
                onClose();
              }}
              style={[
                styles.itemCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Favicon host={item.host} size={28} />
                <View style={styles.cardMeta}>
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.ink }]}>
                    {item.title}
                  </Text>
                  <View style={styles.tagRow}>
                    <Text style={[styles.hostTag, { color: theme.muted }]}>
                      {item.host}
                    </Text>
                    {col ? (
                      <View style={[styles.colPill, { backgroundColor: theme.chip }]}>
                        <Text style={[styles.colPillText, { color: theme.inkSoft }]}>
                          {col.name}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <PressableScale
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditBookmark(item);
                    }}
                    style={styles.iconMiniBtn}
                  >
                    <Icon name="edit" size={14} color={theme.inkSoft} />
                  </PressableScale>
                  <PressableScale
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteBookmarkConfirm(item);
                    }}
                    style={styles.iconMiniBtn}
                  >
                    <Icon name="trash" size={14} color={theme.inkSoft} />
                  </PressableScale>
                </View>
              </View>

              {item.notes ? (
                <View style={[styles.notesWrap, { borderTopColor: theme.line }]}>
                  <Text numberOfLines={2} style={[styles.notesText, { color: theme.inkSoft }]}>
                    {item.notes}
                  </Text>
                </View>
              ) : null}
            </PressableScale>
          );
        })}

        {/* Saved Articles */}
        {(activeCategoryId === 'all' || activeCategoryId === 'articles') &&
          filteredArticles.map((art) => (
            <PressableScale
              key={art.id}
              onPress={() => {
                haptic.tap();
                onOpenUrl(art.url);
                onClose();
              }}
              style={[
                styles.itemCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Favicon host={art.host} size={28} />
                <View style={styles.cardMeta}>
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.ink }]}>
                    {art.title}
                  </Text>
                  <View style={styles.tagRow}>
                    <Text style={[styles.hostTag, { color: theme.muted }]}>
                      {art.host} · {art.readMinutes} min read
                    </Text>
                    <View style={[styles.colPill, { backgroundColor: theme.accentSoft }]}>
                      <Text style={[styles.colPillText, { color: theme.accent }]}>
                        Article
                      </Text>
                    </View>
                  </View>
                </View>
                <Icon name="arrowRight" size={14} color={theme.muted} />
              </View>

              {art.note ? (
                <View style={[styles.notesWrap, { borderTopColor: theme.line }]}>
                  <Text numberOfLines={2} style={[styles.notesText, { color: theme.inkSoft }]}>
                    {art.note}
                  </Text>
                </View>
              ) : null}
            </PressableScale>
          ))}

        {filteredBookmarks.length === 0 && filteredArticles.length === 0 && (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <Icon name="bookmark" size={24} color={theme.accent} strokeWidth={2} />
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                {searchQuery ? 'No saved items match your search' : 'No items saved yet'}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.muted }]}>
                Save articles, websites, and research to keep your web organized.
              </Text>
              <PressableScale
                onPress={handleOpenAddBookmark}
                style={[styles.addBookmarkBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.addBookmarkBtnText}>+ Save Website</Text>
              </PressableScale>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Bookmark Modal */}
      <Modal
        visible={bookmarkModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBookmarkModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.ink }]}>
              {editingBookmark ? 'Edit Bookmark' : 'Save to Collection'}
            </Text>

            {duplicateBookmark && (
              <View style={[styles.duplicateWarning, { backgroundColor: theme.chip }]}>
                <Text style={[styles.duplicateWarningText, { color: theme.accent }]}>
                  ⚠️ Already in collection: &quot;{collections.find((c) => c.id === duplicateBookmark.collectionId)?.name || 'Bookmarks'}&quot;
                </Text>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: theme.muted }]}>WEBSITE URL</Text>
            <TextInput
              value={bmUrl}
              onChangeText={setBmUrl}
              placeholder="https://example.com"
              placeholderTextColor={theme.muted}
              autoCapitalize="none"
              keyboardType="url"
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>TITLE</Text>
            <TextInput
              value={bmTitle}
              onChangeText={setBmTitle}
              placeholder="Page title"
              placeholderTextColor={theme.muted}
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>COLLECTION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {collections.map((c) => (
                <PressableScale
                  key={c.id}
                  onPress={() => setBmCollectionId(c.id)}
                  style={[
                    styles.pickerPill,
                    {
                      backgroundColor: bmCollectionId === c.id ? theme.accent : theme.chip,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 12,
                      color: bmCollectionId === c.id ? '#FFFFFF' : theme.inkSoft,
                    }}
                  >
                    {c.name}
                  </Text>
                </PressableScale>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: theme.muted }]}>NOTES / REMINDER</Text>
            <TextInput
              value={bmNotes}
              onChangeText={setBmNotes}
              placeholder="Why you saved this..."
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={3}
              style={[
                styles.modalInput,
                styles.textArea,
                { color: theme.ink, borderColor: theme.line },
              ]}
            />

            <View style={styles.modalButtons}>
              <PressableScale
                onPress={() => setBookmarkModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: theme.chip }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: theme.ink }}>Cancel</Text>
              </PressableScale>
              <PressableScale
                onPress={handleSaveBookmarkSubmit}
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: '#FFFFFF' }}>Save</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Collection Modal */}
      <Modal
        visible={collectionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCollectionModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.ink }]}>
              {editingCollection ? 'Edit Collection' : 'New Collection'}
            </Text>

            <Text style={[styles.inputLabel, { color: theme.muted }]}>NAME</Text>
            <TextInput
              value={colName}
              onChangeText={setColName}
              placeholder="e.g. Design Systems, React Docs"
              placeholderTextColor={theme.muted}
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              value={colDesc}
              onChangeText={setColDesc}
              placeholder="Short description..."
              placeholderTextColor={theme.muted}
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <View style={styles.modalButtons}>
              <PressableScale
                onPress={() => setCollectionModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: theme.chip }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: theme.ink }}>Cancel</Text>
              </PressableScale>
              <PressableScale
                onPress={handleSaveCollectionSubmit}
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: '#FFFFFF' }}>Save</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal
        visible={importModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setImportModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.ink }]}>Import Bookmarks</Text>
            <Text style={[styles.emptyBody, { color: theme.muted, marginBottom: 12 }]}>
              Paste your Nexus bookmarks JSON backup:
            </Text>
            <TextInput
              value={importJsonText}
              onChangeText={setImportJsonText}
              placeholder='{"collections": [...], "bookmarks": [...]}'
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={6}
              style={[styles.modalInput, styles.textArea, { color: theme.ink, borderColor: theme.line }]}
            />
            <View style={styles.modalButtons}>
              <PressableScale
                onPress={() => setImportModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: theme.chip }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: theme.ink }}>Cancel</Text>
              </PressableScale>
              <PressableScale
                onPress={handleImportSubmit}
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: '#FFFFFF' }}>Import</Text>
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
    alignItems: 'flex-start',
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
    fontSize: 22,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
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
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBox: {
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
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  collectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  collectionBannerTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  collectionBannerDesc: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 2,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerBtn: {
    padding: 6,
  },
  listScroll: {
    maxHeight: 460,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 10,
  },
  itemCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMeta: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  hostTag: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  colPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  colPillText: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconMiniBtn: {
    padding: 6,
  },
  notesWrap: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  notesText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
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
  addBookmarkBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  addBookmarkBtnText: {
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
    height: 72,
    textAlignVertical: 'top',
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  duplicateWarning: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  duplicateWarningText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
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

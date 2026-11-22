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
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { useToast } from './Toast';
import { formatBytes } from '@/lib/downloads';
import { haptic } from '@/lib/haptics';
import { isWebUrl } from '@/lib/url';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { DownloadItem } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  downloads: DownloadItem[];
  onStartDownload: (url: string, filename?: string) => void;
  onCancelDownload: (id: string) => void;
  onOpenDownload: (item: DownloadItem) => void;
  onDeleteDownload: (item: DownloadItem) => void;
  onClearCompleted: () => void;
};

export function DownloadsSheet({
  visible,
  onClose,
  downloads,
  onStartDownload,
  onCancelDownload,
  onOpenDownload,
  onDeleteDownload,
  onClearCompleted,
}: Props) {
  const { theme } = useTheme();
  const toast = useToast();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [downloadUrlInput, setDownloadUrlInput] = useState('');
  const [customFilename, setCustomFilename] = useState('');

  const activeDownloads = useMemo(
    () => downloads.filter((d) => d.status === 'downloading'),
    [downloads],
  );

  const completedDownloads = useMemo(
    () => downloads.filter((d) => d.status === 'completed'),
    [downloads],
  );

  const failedDownloads = useMemo(
    () => downloads.filter((d) => d.status === 'failed' || d.status === 'cancelled'),
    [downloads],
  );

  const totalStorageBytes = useMemo(
    () => completedDownloads.reduce((sum, d) => sum + (d.fileSize || 0), 0),
    [completedDownloads],
  );

  const handleStartManualDownload = () => {
    if (!downloadUrlInput.trim() || !isWebUrl(downloadUrlInput.trim())) {
      toast.show('Please enter a valid file download URL');
      return;
    }
    haptic.success();
    onStartDownload(downloadUrlInput.trim(), customFilename.trim() || undefined);
    setDownloadUrlInput('');
    setCustomFilename('');
    setAddModalOpen(false);
    toast.show('Download started');
  };

  const handleDeleteConfirm = (item: DownloadItem) => {
    Alert.alert('Delete Download?', `Delete "${item.filename}" from device storage?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptic.warn();
          onDeleteDownload(item);
          toast.show('Download removed');
        },
      },
    ]);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            NEXUS DROP · STORAGE
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Downloads
          </Text>
        </View>

        <View style={styles.headerActions}>
          <PressableScale
            onPress={() => {
              haptic.tap();
              setAddModalOpen(true);
            }}
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            accessibilityLabel="Download URL"
          >
            <Icon name="plus" size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>Download URL</Text>
          </PressableScale>

          <IconButton
            icon="close"
            label="Close downloads"
            size={34}
            iconSize={16}
            variant="surface"
            onPress={onClose}
          />
        </View>
      </View>

      {/* Storage Summary Bar */}
      {completedDownloads.length > 0 && (
        <View
          style={[
            styles.storageBar,
            { backgroundColor: theme.chip, borderColor: theme.line },
          ]}
        >
          <View style={styles.storageCopy}>
            <Icon name="download" size={15} color={theme.accent} />
            <Text style={[styles.storageText, { color: theme.ink }]}>
              {completedDownloads.length} {completedDownloads.length === 1 ? 'file' : 'files'} · {formatBytes(totalStorageBytes)} stored locally
            </Text>
          </View>
          <PressableScale
            onPress={() => {
              haptic.warn();
              onClearCompleted();
              toast.show('Cleared completed list');
            }}
            style={styles.clearBtn}
          >
            <Text style={[styles.clearBtnText, { color: theme.muted }]}>Clear list</Text>
          </PressableScale>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {downloads.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={[styles.iconOrb, { backgroundColor: theme.accentSoft }]}>
                <Icon name="download" size={24} color={theme.accent} strokeWidth={2} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                No downloads yet
              </Text>
              <Text style={[styles.emptyBody, { color: theme.muted }]}>
                Downloaded documents, PDFs, media, and archives will appear here with secure sandboxed isolation.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Active Downloads */}
            {activeDownloads.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>
                  DOWNLOADING ({activeDownloads.length})
                </Text>
                {activeDownloads.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      { backgroundColor: theme.surface, borderColor: theme.line },
                      softShadow(theme.mode, 'card'),
                    ]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.filename, { color: theme.ink }]}>
                          {item.filename}
                        </Text>
                        <Text style={[styles.fileProgressLabel, { color: theme.muted }]}>
                          {Math.round(item.progress * 100)}%
                        </Text>
                      </View>
                      <PressableScale
                        onPress={() => onCancelDownload(item.id)}
                        style={[styles.cancelBtn, { backgroundColor: theme.chip }]}
                      >
                        <Text style={[styles.cancelBtnText, { color: theme.accent }]}>Cancel</Text>
                      </PressableScale>
                    </View>

                    {/* Progress Bar */}
                    <View style={[styles.progressTrack, { backgroundColor: theme.chip }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: theme.accent,
                            width: `${Math.round(item.progress * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Completed Downloads */}
            {completedDownloads.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: theme.muted }]}>
                  COMPLETED ({completedDownloads.length})
                </Text>
                {completedDownloads.map((item) => (
                  <PressableScale
                    key={item.id}
                    onPress={() => onOpenDownload(item)}
                    style={[
                      styles.itemCard,
                      { backgroundColor: theme.surface, borderColor: theme.line },
                      softShadow(theme.mode, 'card'),
                    ]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.filename, { color: theme.ink }]}>
                          {item.filename}
                        </Text>
                        <Text style={[styles.fileSub, { color: theme.muted }]}>
                          {formatBytes(item.fileSize)} · {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'Ready'}
                        </Text>
                      </View>

                      <View style={styles.cardActions}>
                        <PressableScale
                          onPress={(e) => {
                            e.stopPropagation();
                            onOpenDownload(item);
                          }}
                          style={[styles.openBtn, { backgroundColor: theme.chip }]}
                          accessibilityLabel="Open or share file"
                        >
                          <Icon name="share" size={13} color={theme.inkSoft} />
                          <Text style={[styles.openBtnText, { color: theme.inkSoft }]}>Open</Text>
                        </PressableScale>

                        <PressableScale
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirm(item);
                          }}
                          style={styles.iconMiniBtn}
                          accessibilityLabel="Delete file"
                        >
                          <Icon name="trash" size={14} color={theme.inkSoft} />
                        </PressableScale>
                      </View>
                    </View>
                  </PressableScale>
                ))}
              </View>
            )}

            {/* Failed or Cancelled */}
            {failedDownloads.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: theme.muted }]}>
                  FAILED / CANCELLED ({failedDownloads.length})
                </Text>
                {failedDownloads.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      { backgroundColor: theme.surface, borderColor: theme.line },
                    ]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.filename, { color: theme.ink }]}>
                          {item.filename}
                        </Text>
                        <Text style={[styles.fileSub, { color: theme.muted }]}>
                          {item.status === 'cancelled' ? 'Cancelled' : (item.error || 'Failed')}
                        </Text>
                      </View>
                      <PressableScale
                        onPress={() => handleDeleteConfirm(item)}
                        style={styles.iconMiniBtn}
                      >
                        <Icon name="trash" size={14} color={theme.inkSoft} />
                      </PressableScale>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Manual URL Download Modal */}
      <Modal
        visible={addModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.ink }]}>
              Download File
            </Text>

            <Text style={[styles.inputLabel, { color: theme.muted }]}>FILE URL</Text>
            <TextInput
              value={downloadUrlInput}
              onChangeText={setDownloadUrlInput}
              placeholder="https://example.com/document.pdf"
              placeholderTextColor={theme.muted}
              autoCapitalize="none"
              keyboardType="url"
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>SAVE AS (OPTIONAL)</Text>
            <TextInput
              value={customFilename}
              onChangeText={setCustomFilename}
              placeholder="custom-name.pdf"
              placeholderTextColor={theme.muted}
              style={[styles.modalInput, { color: theme.ink, borderColor: theme.line }]}
            />

            <View style={styles.modalButtons}>
              <PressableScale
                onPress={() => setAddModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: theme.chip }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: theme.ink }}>Cancel</Text>
              </PressableScale>
              <PressableScale
                onPress={handleStartManualDownload}
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={{ fontFamily: fonts.medium, color: '#FFFFFF' }}>Download</Text>
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
  storageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  storageCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storageText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearBtnText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  scroll: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 16,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1,
  },
  itemCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filename: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  fileSub: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 2,
  },
  fileProgressLabel: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  openBtnText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  iconMiniBtn: {
    padding: 6,
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

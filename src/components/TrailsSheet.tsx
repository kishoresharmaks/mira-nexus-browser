import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { haptic } from '@/lib/haptics';
import {
  trailDateLabel,
  trailDurationLabel,
  trailPageLabel,
  trailTimeRange,
  trailTitle,
} from '@/lib/trails';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Trail } from '@/types';
import { BottomSheet } from './BottomSheet';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { TrailDots } from './TrailDots';

type Props = {
  visible: boolean;
  onClose: () => void;
  trails: Trail[];
  onOpen: (url: string) => void;
  onResume: (trail: Trail) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

/**
 * Trails are the memory of a browsing session. Each card is a small record:
 * when it began, how long it lasted, and the shape of the pages inside it.
 */
export function TrailsSheet({
  visible,
  onClose,
  trails,
  onOpen,
  onResume,
  onRename,
  onDelete,
}: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setExpandedId(null);
      setEditingId(null);
      setConfirmId(null);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const startRename = (trail: Trail) => {
    haptic.tap();
    setEditingId(trail.id);
    setDraft(trail.name ?? '');
    setConfirmId(null);
  };

  const saveRename = () => {
    if (!editingId) return;
    haptic.success();
    onRename(editingId, draft);
    setEditingId(null);
    setDraft('');
  };

  const requestDelete = (id: string) => {
    if (confirmId === id) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirmId(null);
      if (editingId === id) setEditingId(null);
      haptic.warn();
      onDelete(id);
      return;
    }
    haptic.tap();
    setConfirmId(id);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmId(null), 3200);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>TRAILS</Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Where you&apos;ve been
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {trails.length === 0
              ? 'A quiet record of your wandering.'
              : `${trails.length} ${trails.length === 1 ? 'trail' : 'trails'}, kept on this device.`}
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close trails"
          variant="surface"
          size={36}
          iconSize={16}
          onPress={onClose}
        />
      </View>

      <ScrollView
        style={{ maxHeight: height * 0.62 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {trails.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyOrb, { backgroundColor: theme.chip }]}>
              <Icon name="trail" size={26} color={theme.inkSoft} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>
              No trail yet
            </Text>
            <Text style={[styles.emptyBody, { color: theme.muted }]}>
              Start reading. Nexus groups pages into trails whenever you take a
              pause of about half an hour.
            </Text>
          </View>
        ) : (
          trails.map((trail) => {
            const expanded = expandedId === trail.id;
            const editing = editingId === trail.id;
            const confirming = confirmId === trail.id;

            return (
              <View
                key={trail.id}
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.line },
                  softShadow(theme.mode),
                ]}
              >
                <Pressable
                  onPress={() => {
                    haptic.tap();
                    setExpandedId(expanded ? null : trail.id);
                  }}
                  style={styles.cardHead}
                  accessibilityRole="button"
                  accessibilityLabel={`${trailTitle(trail)}, ${trailPageLabel(trail.pages.length)}`}
                  accessibilityHint="Shows the pages in this trail"
                >
                  <View style={styles.headCopy}>
                    <Text
                      numberOfLines={1}
                      style={[styles.cardTitle, { color: theme.ink }]}
                    >
                      {trailTitle(trail)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.cardDate, { color: theme.muted }]}
                    >
                      {trailDateLabel(trail)} · {trailTimeRange(trail)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.chevron,
                      {
                        backgroundColor: theme.chip,
                        transform: [{ rotate: expanded ? '180deg' : '0deg' }],
                      },
                    ]}
                  >
                    <Icon
                      name="chevronDown"
                      size={13}
                      color={theme.inkSoft}
                      strokeWidth={2}
                    />
                  </View>
                </Pressable>

                <View style={styles.dotsRow}>
                  <TrailDots pages={trail.pages} max={22} />
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.meta, { color: theme.faint }]}>
                    {trailPageLabel(trail.pages.length)} ·{' '}
                    {trailDurationLabel(trail)}
                  </Text>
                  <View style={styles.actions}>
                    <PressableScale
                      onPress={() => {
                        haptic.tap();
                        onResume(trail);
                      }}
                      style={[
                        styles.resume,
                        { backgroundColor: theme.accentSoft },
                      ]}
                      accessibilityLabel={`Resume ${trailTitle(trail)}`}
                    >
                      <Icon
                        name="globe"
                        size={13}
                        color={theme.accent}
                        strokeWidth={1.9}
                      />
                      <Text style={[styles.resumeText, { color: theme.accent }]}>
                        Resume
                      </Text>
                    </PressableScale>
                    <IconButton
                      icon="edit"
                      label={`Rename ${trailTitle(trail)}`}
                      size={32}
                      iconSize={15}
                      onPress={() => startRename(trail)}
                    />
                    <IconButton
                      icon="trash"
                      label={`Delete ${trailTitle(trail)}`}
                      size={32}
                      iconSize={15}
                      color={confirming ? theme.danger : undefined}
                      onPress={() => requestDelete(trail.id)}
                    />
                  </View>
                </View>

                {confirming ? (
                  <Text style={[styles.confirm, { color: theme.danger }]}>
                    Tap delete again to remove this trail.
                  </Text>
                ) : null}

                {editing ? (
                  <View
                    style={[
                      styles.renameRow,
                      { backgroundColor: theme.chip, borderColor: theme.line },
                    ]}
                  >
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={trailTitle(trail)}
                      placeholderTextColor={theme.faint}
                      style={[styles.renameInput, { color: theme.ink }]}
                      autoFocus
                      selectTextOnFocus
                      maxLength={48}
                      returnKeyType="done"
                      onSubmitEditing={saveRename}
                      accessibilityLabel="Trail name"
                    />
                    <IconButton
                      icon="check"
                      label="Save trail name"
                      size={32}
                      iconSize={15}
                      color={theme.accent}
                      onPress={saveRename}
                    />
                    <IconButton
                      icon="close"
                      label="Cancel rename"
                      size={32}
                      iconSize={14}
                      onPress={() => {
                        setEditingId(null);
                        setDraft('');
                      }}
                    />
                  </View>
                ) : null}

                {expanded ? (
                  <View style={[styles.pages, { borderTopColor: theme.line }]}>
                    {trail.pages.map((page, index) => (
                      <Pressable
                        key={`${page.id}-${index}`}
                        onPress={() => {
                          haptic.tap();
                          onOpen(page.url);
                        }}
                        style={({ pressed }) => [
                          styles.pageRow,
                          index > 0
                            ? {
                                borderTopWidth: StyleSheet.hairlineWidth,
                                borderTopColor: theme.line,
                              }
                            : null,
                          pressed ? { opacity: 0.65 } : null,
                        ]}
                        accessibilityRole="link"
                        accessibilityLabel={`Open ${page.title}`}
                      >
                        <Text style={[styles.pageIndex, { color: theme.faint }]}>
                          {String(index + 1).padStart(2, '0')}
                        </Text>
                        <Favicon host={page.host} title={page.title} size={28} />
                        <View style={styles.pageCopy}>
                          <Text
                            numberOfLines={1}
                            style={[styles.pageTitle, { color: theme.ink }]}
                          >
                            {page.title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[styles.pageHost, { color: theme.muted }]}
                          >
                            {page.host}
                          </Text>
                        </View>
                        <Icon
                          name="arrowUpRight"
                          size={14}
                          color={theme.faint}
                          strokeWidth={1.9}
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <Text style={[styles.footer, { color: theme.faint }]}>
        Trails close after 25 quiet minutes. They never leave this device.
      </Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 27,
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },
  emptyOrb: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 25,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
  },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fonts.serif,
    fontSize: 23,
    lineHeight: 25,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  cardDate: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  chevron: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    marginTop: 12,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  resume: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 2,
  },
  resumeText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
  },
  confirm: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    marginTop: 8,
  },
  renameRow: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 44,
  },
  renameInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    paddingVertical: 8,
  },
  pages: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 2,
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
  },
  pageIndex: {
    fontFamily: fonts.medium,
    fontSize: 9,
    width: 16,
  },
  pageCopy: {
    flex: 1,
    gap: 1,
  },
  pageTitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  pageHost: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
  footer: {
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 10,
    paddingHorizontal: 30,
    paddingTop: 8,
    paddingBottom: 2,
  },
});

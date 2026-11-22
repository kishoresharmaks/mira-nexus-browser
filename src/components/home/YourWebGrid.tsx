import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Favicon } from '../Favicon';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Shortcut } from '@/types';

type FeatureShortcut = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
};

type Props = {
  shortcuts: Shortcut[];
  onOpenCollections: () => void;
  onOpenHistory: () => void;
  onOpenTrails: () => void;
  onOpenDownloads: () => void;
  onOpenNotes: () => void;
  onOpenPrivacy: () => void;
  onOpenShortcut: (url: string) => void;
  onRemoveShortcut: (shortcut: Shortcut) => void;
  onResetShortcuts: () => void;
};

export function YourWebGrid({
  shortcuts,
  onOpenCollections,
  onOpenHistory,
  onOpenTrails,
  onOpenDownloads,
  onOpenNotes,
  onOpenPrivacy,
  onOpenShortcut,
  onRemoveShortcut,
  onResetShortcuts,
}: Props) {
  const { theme } = useTheme();
  const [editingPins, setEditingPins] = useState(false);

  const features: FeatureShortcut[] = [
    {
      id: 'collections',
      title: 'Collections',
      subtitle: 'Bookmarks & tags',
      icon: 'bookmark',
      onPress: onOpenCollections,
    },
    {
      id: 'history',
      title: 'History',
      subtitle: 'Recent timeline',
      icon: 'clock',
      onPress: onOpenHistory,
    },
    {
      id: 'trails',
      title: 'Trails',
      subtitle: 'Browsing sessions',
      icon: 'trail',
      onPress: onOpenTrails,
    },
    {
      id: 'downloads',
      title: 'Downloads',
      subtitle: 'Nexus Drop files',
      icon: 'download',
      onPress: onOpenDownloads,
    },
    {
      id: 'notes',
      title: 'Web Notes',
      subtitle: 'Page highlights',
      icon: 'note',
      onPress: onOpenNotes,
    },
    {
      id: 'privacy',
      title: 'Privacy',
      subtitle: 'Shield & storage',
      icon: 'shield',
      onPress: onOpenPrivacy,
    },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          YOUR WEB
        </Text>
      </View>

      {/* 6-item Feature Grid */}
      <View style={styles.grid}>
        {features.map((item) => (
          <PressableScale
            key={item.id}
            onPress={() => {
              haptic.tap();
              item.onPress();
            }}
            scaleTo={0.97}
            style={[
              styles.featureCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
              softShadow(theme.mode, 'card'),
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.subtitle}`}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: theme.accentSoft }]}>
              <Icon name={item.icon} size={18} color={theme.accent} strokeWidth={2} />
            </View>
            <Text numberOfLines={1} style={[styles.featureTitle, { color: theme.ink }]}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={[styles.featureSubtitle, { color: theme.muted }]}>
              {item.subtitle}
            </Text>
          </PressableScale>
        ))}
      </View>

      {/* Preserved User Website Shortcuts */}
      {shortcuts.length > 0 ? (
        <View style={styles.pinnedSection}>
          <View style={styles.pinnedHeader}>
            <Text style={[styles.pinnedLabel, { color: theme.muted }]}>
              PINNED SITES
            </Text>
            <Pressable
              onPress={() => {
                haptic.select();
                setEditingPins((v) => !v);
              }}
              hitSlop={10}
            >
              <Text
                style={[
                  styles.pinnedAction,
                  { color: editingPins ? theme.accent : theme.inkSoft },
                ]}
              >
                {editingPins ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.pinnedGrid}>
            {shortcuts.map((shortcut) => (
              <View key={shortcut.id} style={styles.pinnedItemWrap}>
                <PressableScale
                  onPress={() => {
                    if (editingPins) {
                      haptic.warn();
                      onRemoveShortcut(shortcut);
                    } else {
                      haptic.tap();
                      onOpenShortcut(shortcut.url);
                    }
                  }}
                  scaleTo={0.95}
                  style={[
                    styles.pinnedCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: editingPins ? theme.danger : theme.line,
                    },
                  ]}
                  accessibilityLabel={shortcut.title || shortcut.host}
                >
                  <Favicon host={shortcut.host} title={shortcut.title} size={28} />
                  <Text numberOfLines={1} style={[styles.pinnedTitle, { color: theme.inkSoft }]}>
                    {shortcut.title || shortcut.host}
                  </Text>
                  {editingPins ? (
                    <View style={[styles.deleteBadge, { backgroundColor: theme.danger }]}>
                      <Icon name="close" size={9} color="#FFFFFF" strokeWidth={2.6} />
                    </View>
                  ) : null}
                </PressableScale>
              </View>
            ))}
          </View>

          {editingPins ? (
            <View style={styles.editFooter}>
              <Text style={[styles.editHint, { color: theme.muted }]}>
                Tap any pinned site to unpin it.
              </Text>
              <Pressable
                onPress={() => {
                  haptic.select();
                  onResetShortcuts();
                }}
                hitSlop={8}
              >
                <Text style={[styles.restoreText, { color: theme.accent }]}>
                  Restore defaults
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    width: '31.3%',
    flexGrow: 1,
    minWidth: 100,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  featureSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    marginTop: 2,
  },
  pinnedSection: {
    marginTop: 20,
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  pinnedLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  pinnedAction: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  pinnedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pinnedItemWrap: {
    width: '22.5%',
    flexGrow: 1,
    minWidth: 70,
  },
  pinnedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    position: 'relative',
  },
  pinnedTitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: 'center',
  },
  deleteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  editHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  restoreText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
});

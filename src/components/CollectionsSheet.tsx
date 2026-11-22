import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Shortcut } from '@/types';

type CollectionCategory = {
  id: string;
  name: string;
  count: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
  onOpenShortcut: (url: string) => void;
};

export function CollectionsSheet({
  visible,
  onClose,
  shortcuts,
  onOpenShortcut,
}: Props) {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories: CollectionCategory[] = [
    { id: 'all', name: 'All Sites', count: shortcuts.length },
    { id: 'work', name: 'Work', count: 0 },
    { id: 'learning', name: 'Learning', count: 1 },
    { id: 'technology', name: 'Technology', count: 3 },
    { id: 'shopping', name: 'Shopping', count: 0 },
    { id: 'research', name: 'Research', count: 2 },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            SMART BOOKMARKS
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Collections
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close collections"
          size={36}
          iconSize={16}
          variant="surface"
          onPress={onClose}
        />
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((cat) => {
          const active = cat.id === activeCategory;
          return (
            <PressableScale
              key={cat.id}
              onPress={() => {
                haptic.select();
                setActiveCategory(cat.id);
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
                {cat.name}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* Bookmarked / Pinned Items */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {shortcuts.map((shortcut) => (
          <PressableScale
            key={shortcut.id}
            onPress={() => {
              haptic.tap();
              onClose();
              onOpenShortcut(shortcut.url);
            }}
            scaleTo={0.98}
            style={[
              styles.itemCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
              softShadow(theme.mode, 'card'),
            ]}
          >
            <Favicon host={shortcut.host} title={shortcut.title} size={28} />
            <View style={styles.copy}>
              <Text numberOfLines={1} style={[styles.itemTitle, { color: theme.ink }]}>
                {shortcut.title || shortcut.host}
              </Text>
              <Text numberOfLines={1} style={[styles.itemHost, { color: theme.muted }]}>
                {shortcut.host}
              </Text>
            </View>
            <Icon name="arrowUpRight" size={14} color={theme.faint} strokeWidth={2} />
          </PressableScale>
        ))}
      </ScrollView>
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
    paddingBottom: 12,
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
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 9,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  itemHost: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 1,
  },
});

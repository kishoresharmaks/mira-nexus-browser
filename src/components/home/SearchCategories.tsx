import { ScrollView, StyleSheet, Text } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { useCatalogConfig } from '@/lib/catalog-provider';
import type { SearchCategoryKey } from '@/lib/catalog';
import { haptic } from '@/lib/haptics';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export type SearchCategory = SearchCategoryKey;

type Props = {
  activeCategory: SearchCategory;
  onSelectCategory: (category: SearchCategory) => void;
};

const CATEGORIES: { id: SearchCategory; label: string; icon: IconName }[] = [
  { id: 'web', label: 'Web', icon: 'globe' },
  { id: 'ai', label: 'AI', icon: 'sparkle' },
  { id: 'images', label: 'Images', icon: 'image' },
  { id: 'news', label: 'News', icon: 'newspaper' },
  { id: 'videos', label: 'Videos', icon: 'video' },
];

export function SearchCategories({
  activeCategory,
  onSelectCategory,
}: Props) {
  const { theme } = useTheme();
  const { activeCategories } = useCatalogConfig();

  const visibleCategories = CATEGORIES.filter((cat) =>
    activeCategories ? activeCategories.includes(cat.id) : true,
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {visibleCategories.map((cat) => {
        const active = cat.id === activeCategory;
        return (
          <PressableScale
            key={cat.id}
            onPress={() => {
              haptic.select();
              onSelectCategory(cat.id);
            }}
            scaleTo={0.96}
            style={[
              styles.pill,
              {
                backgroundColor: active ? theme.surface : 'transparent',
                borderColor: active ? theme.line : 'transparent',
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${cat.label} search mode`}
          >
            <Icon
              name={cat.icon}
              size={13}
              color={active ? theme.accent : theme.muted}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active ? theme.ink : theme.muted,
                  fontFamily: active ? fonts.semibold : fonts.sans,
                },
              ]}
            >
              {cat.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
  },
});

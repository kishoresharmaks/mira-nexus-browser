import {
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
  containerStyle?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export const SEARCH_CATEGORY_ITEMS: {
  id: SearchCategory;
  label: string;
  icon: IconName;
}[] = [
  { id: 'web', label: 'Web', icon: 'globe' },
  { id: 'ai', label: 'AI', icon: 'sparkle' },
  { id: 'images', label: 'Images', icon: 'image' },
  { id: 'news', label: 'News', icon: 'newspaper' },
  { id: 'videos', label: 'Videos', icon: 'video' },
];

export function SearchCategories({
  activeCategory,
  onSelectCategory,
  containerStyle,
  compact = false,
}: Props) {
  const { theme } = useTheme();
  const { activeCategories } = useCatalogConfig();

  const visibleCategories = SEARCH_CATEGORY_ITEMS.filter((cat) =>
    activeCategories ? activeCategories.includes(cat.id) : true,
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, containerStyle]}
      keyboardShouldPersistTaps="handled"
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
              compact && styles.pillCompact,
              {
                backgroundColor: active ? theme.surface : 'transparent',
                borderColor: active ? theme.accent : theme.line,
                borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${cat.label} search mode`}
          >
            <Icon
              name={cat.icon}
              size={compact ? 12 : 13}
              color={active ? theme.accent : theme.muted}
              strokeWidth={active ? 2.3 : 1.8}
            />
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
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
    gap: 6,
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
  },
  pillCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  label: {
    fontSize: 12,
  },
  labelCompact: {
    fontSize: 11,
  },
});

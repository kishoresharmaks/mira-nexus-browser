import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export type NavItem = 'home' | 'tabs' | 'ai' | 'saved' | 'explore' | 'bookmarks' | 'apps';

type Props = {
  activeTab?: NavItem;
  tabCount: number;
  onPressHome: () => void;
  onPressTabs: () => void;
  onPressAi: () => void;
  onPressSaved?: () => void;
  onPressBookmarks?: () => void;
  onPressExplore?: () => void;
  onPressApps?: () => void;
};

export function HomeBottomNavigation({
  activeTab = 'home',
  tabCount,
  onPressHome,
  onPressTabs,
  onPressAi,
  onPressSaved,
  onPressBookmarks,
  onPressExplore,
  onPressApps,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSaved = onPressSaved ?? onPressBookmarks ?? (() => {});
  const handleExplore = onPressExplore ?? onPressApps ?? (() => {});

  const isSavedActive = activeTab === 'saved' || activeTab === 'bookmarks';
  const isExploreActive = activeTab === 'explore' || activeTab === 'apps';

  const items: {
    id: NavItem;
    label: string;
    icon: IconName;
    active: boolean;
    onPress: () => void;
  }[] = [
    { id: 'home', label: 'Home', icon: 'home', active: activeTab === 'home', onPress: onPressHome },
    { id: 'tabs', label: 'Tabs', icon: 'tabs', active: activeTab === 'tabs', onPress: onPressTabs },
    { id: 'ai', label: 'AI', icon: 'sparkle', active: activeTab === 'ai', onPress: onPressAi },
    { id: 'saved', label: 'Saved', icon: 'bookmark', active: isSavedActive, onPress: handleSaved },
    { id: 'explore', label: 'Explore', icon: 'compass', active: isExploreActive, onPress: handleExplore },
  ];

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(12, insets.bottom + 6) }]}
    >
      <View
        style={[
          styles.dock,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
          softShadow(theme.mode, 'dock'),
        ]}
      >
        {items.map((item) => {
          return (
            <PressableScale
              key={item.id}
              onPress={() => {
                haptic.tap();
                item.onPress();
              }}
              scaleTo={0.92}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: item.active }}
              accessibilityLabel={`${item.label} navigation button`}
            >
              <View style={styles.iconWrap}>
                <Icon
                  name={item.icon}
                  size={20}
                  color={item.active ? theme.accent : theme.muted}
                  strokeWidth={item.active ? 2.2 : 1.8}
                />
                {item.id === 'tabs' && tabCount > 0 ? (
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.badgeText}>
                      {tabCount > 9 ? '9+' : tabCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: item.active ? theme.accent : theme.muted,
                    fontFamily: item.active ? fonts.semibold : fonts.sans,
                  },
                ]}
              >
                {item.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 99,
  },
  dock: {
    width: '100%',
    maxWidth: 480,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  iconWrap: {
    position: 'relative',
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  label: {
    fontSize: 10,
    marginTop: 3,
  },
});

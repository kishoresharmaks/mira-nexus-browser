import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { getDisplayUrl } from '@/lib/url';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { CommunityThread, PageSnapshot } from '@/types';
import { CommunityChip } from './CommunityChip';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type Props = {
  snapshot: PageSnapshot;
  tabCount: number;
  communityThreads?: CommunityThread[];
  onOpenCommunity?: () => void;
  onBack: () => void;
  onForward: () => void;
  onOpenAddress: () => void;
  onOpenTabs: () => void;
  onOpenMenu: () => void;
  onCopy: () => void;
};

export function BrowserToolbar({
  snapshot,
  tabCount,
  communityThreads = [],
  onOpenCommunity,
  onBack,
  onForward,
  onOpenAddress,
  onOpenTabs,
  onOpenMenu,
  onCopy,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const display = getDisplayUrl(snapshot.url);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: insets.bottom + 10 }]}
    >
      {communityThreads.length > 0 && onOpenCommunity ? (
        <View pointerEvents="box-none" style={styles.communityRow}>
          <CommunityChip
            threads={communityThreads}
            onPress={onOpenCommunity}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
          softShadow(theme.mode, 'dock'),
        ]}
      >
        <IconButton
          icon="chevronLeft"
          label="Go back"
          size={38}
          iconSize={19}
          disabled={!snapshot.canGoBack}
          onPress={() => {
            haptic.tap();
            onBack();
          }}
        />

        <IconButton
          icon="chevronRight"
          label="Go forward"
          size={38}
          iconSize={19}
          disabled={!snapshot.canGoForward}
          onPress={() => {
            haptic.tap();
            onForward();
          }}
        />

        <PressableScale
          onPress={() => {
            haptic.tap();
            onOpenAddress();
          }}
          onLongPress={() => {
            onCopy();
          }}
          scaleTo={0.985}
          style={[
            styles.address,
            { backgroundColor: theme.chip, borderColor: theme.line },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Address, ${display.host}${display.path ? `, ${display.path}` : ''}`}
          accessibilityHint="Opens the address bar. Long press copies the link."
        >
          <Icon
            name={display.secure ? 'lock' : 'unlock'}
            size={11}
            color={theme.faint}
            strokeWidth={2}
          />
          <Text
            numberOfLines={1}
            style={[styles.addressText, { color: theme.inkSoft }]}
          >
            {display.host}
            {display.path ? (
              <Text style={[styles.addressPath, { color: theme.muted }]}>
                {display.path}
              </Text>
            ) : null}
          </Text>
        </PressableScale>

        <PressableScale
          onPress={() => {
            haptic.tap();
            onOpenTabs();
          }}
          scaleTo={0.94}
          style={[
            styles.tabsButton,
            { backgroundColor: theme.chip, borderColor: theme.line },
          ]}
          accessibilityLabel={`${tabCount} open ${tabCount === 1 ? 'tab' : 'tabs'}`}
          accessibilityHint="Opens the tab grid"
        >
          <Icon
            name="tabs"
            size={15}
            color={theme.inkSoft}
            strokeWidth={1.9}
          />
          <Text style={[styles.tabsCount, { color: theme.inkSoft }]}>
            {tabCount}
          </Text>
        </PressableScale>

        <IconButton
          icon="more"
          label="Open page menu"
          size={38}
          iconSize={18}
          onPress={() => {
            haptic.tap();
            onOpenMenu();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  communityRow: {
    width: '100%',
    maxWidth: 560,
    alignItems: 'flex-end',
    paddingRight: 6,
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    maxWidth: 560,
    height: 58,
    borderRadius: 29,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  address: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    marginHorizontal: 2,
  },
  addressText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  addressPath: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  tabsButton: {
    height: 34,
    minWidth: 44,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: 1,
  },
  tabsCount: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
});

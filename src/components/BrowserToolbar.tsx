import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { haptic } from '@/lib/haptics';
import { getDisplayUrl } from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { CommunityThread, PageSnapshot } from '@/types';
import { CommunityChip } from './CommunityChip';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type Props = {
  visible?: boolean;
  snapshot: PageSnapshot;
  tabCount: number;
  privateTab?: boolean;
  communityThreads?: CommunityThread[];
  onOpenCommunity?: () => void;
  onOpenPrivateInfo?: () => void;
  onOpenReader?: () => void;
  onOpenAiSummary?: () => void;
  onBack: () => void;
  onForward: () => void;
  onOpenAddress: () => void;
  onOpenTabs: () => void;
  onOpenExplore?: () => void;
  onOpenMenu: () => void;
  onCopy: () => void;
};

export function BrowserToolbar({
  visible = true,
  snapshot,
  tabCount,
  privateTab = false,
  communityThreads = [],
  onOpenCommunity,
  onOpenPrivateInfo,
  onOpenReader,
  onOpenAiSummary,
  onBack,
  onForward,
  onOpenAddress,
  onOpenTabs,
  onOpenExplore,
  onOpenMenu,
  onCopy,
}: Props) {
  const { theme } = useTheme();
  const { engines } = useCatalogConfig();
  const insets = useSafeAreaInsets();
  const display = getDisplayUrl(snapshot.url, engines);
  const empty = !snapshot.url;

  const translateY = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 160 + insets.bottom,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, insets.bottom, translateY]);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.host,
        {
          bottom: insets.bottom + 10,
          transform: [{ translateY }],
        },
      ]}
    >
      {privateTab ? (
        <View pointerEvents="box-none" style={styles.privateRow}>
          <PressableScale
            onPress={onOpenPrivateInfo}
            scaleTo={0.96}
            style={[
              styles.privatePill,
              {
                backgroundColor: theme.surface,
                borderColor: 'rgba(143, 168, 255, 0.22)',
              },
            ]}
            accessibilityLabel="Private tab, no history. Opens details"
          >
            <Icon name="mask" size={11} color={theme.accent} strokeWidth={1.8} />
            <Text style={[styles.privateLabel, { color: theme.accent }]}>
              PRIVATE
            </Text>
            <View style={[styles.privateDot, { backgroundColor: theme.faint }]} />
            <Text style={[styles.privateNote, { color: theme.muted }]}>
              no history
            </Text>
          </PressableScale>
        </View>
      ) : communityThreads.length > 0 && onOpenCommunity ? (
        <View pointerEvents="box-none" style={styles.communityRow}>
          <CommunityChip
            threads={communityThreads}
            onPress={onOpenCommunity}
          />
        </View>
      ) : snapshot.article && snapshot.article.text.length > 250 && (onOpenReader || onOpenAiSummary) ? (
        <View pointerEvents="box-none" style={styles.quickActionsRow}>
          {onOpenReader ? (
            <PressableScale
              onPress={onOpenReader}
              scaleTo={0.96}
              style={[
                styles.quickPill,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
              accessibilityLabel="Open in Reader Mode"
            >
              <Icon name="book" size={11} color={theme.accent} strokeWidth={2} />
              <Text style={[styles.quickPillLabel, { color: theme.inkSoft }]}>
                Reader
              </Text>
            </PressableScale>
          ) : null}
          {onOpenAiSummary ? (
            <PressableScale
              onPress={onOpenAiSummary}
              scaleTo={0.96}
              style={[
                styles.quickPill,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
              accessibilityLabel="View AI Summary"
            >
              <Icon name="sparkle" size={11} color={theme.accent} strokeWidth={2} />
              <Text style={[styles.quickPillLabel, { color: theme.inkSoft }]}>
                Summary
              </Text>
            </PressableScale>
          ) : null}
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
          accessibilityLabel={
            empty
              ? 'Private tab, no page yet'
              : `Address, ${display.host}${display.path ? `, ${display.path}` : ''}`
          }
          accessibilityHint="Opens the address bar. Long press copies the link."
        >
          <Icon
            name={privateTab ? 'mask' : display.secure ? 'lock' : 'unlock'}
            size={11}
            color={privateTab ? theme.accent : theme.faint}
            strokeWidth={2}
          />
          <Text
            numberOfLines={1}
            style={[styles.addressText, { color: theme.inkSoft }]}
          >
            {empty ? 'Private tab' : display.host}
            {!empty && display.path ? (
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

        {onOpenExplore ? (
          <IconButton
            icon="compass"
            label="Explore tools"
            size={38}
            iconSize={19}
            onPress={() => {
              haptic.tap();
              onOpenExplore();
            }}
          />
        ) : null}

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
    </Animated.View>
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
  quickActionsRow: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingRight: 6,
    marginBottom: 8,
  },
  quickPill: {
    height: 29,
    borderRadius: 14.5,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  quickPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  privateRow: {
    width: '100%',
    maxWidth: 560,
    alignItems: 'flex-start',
    paddingLeft: 6,
    marginBottom: 8,
  },
  privatePill: {
    height: 29,
    borderRadius: 14.5,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privateLabel: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.15,
  },
  privateDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  privateNote: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
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
    paddingHorizontal: 10,
    marginHorizontal: 1,
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
    minWidth: 40,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginHorizontal: 1,
  },
  tabsCount: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
});

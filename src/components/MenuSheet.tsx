import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { shouldLookupCommunity } from '@/lib/community';
import { haptic } from '@/lib/haptics';
import { privateCookieMenuMeta } from '@/lib/privateCopy';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';
import { Favicon } from './Favicon';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { getDisplayUrl } from '@/lib/url';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  url: string;
  pinned: boolean;
  onCopy: () => void;
  onShare: () => void;
  onTogglePin: () => void;
  onOpenExternal: () => void;
  onReload: () => void;
  onGoHome: () => void;
  onOpenHistory: () => void;
  onOpenTabs: () => void;
  onOpenTrails: () => void;
  onOpenCommunity: () => void;
  onCloseTab: () => void;
  tabCount: number;
  trailCount: number;
  communityEnabled: boolean;
  communityThreadCount: number;
  privateTab: boolean;
  onOpenPrivateInfo: () => void;
  onNewPrivateTab: () => void;
};

export function MenuSheet({
  visible,
  onClose,
  title,
  url,
  pinned,
  onCopy,
  onShare,
  onTogglePin,
  onOpenExternal,
  onReload,
  onGoHome,
  onOpenHistory,
  onOpenTabs,
  onOpenTrails,
  onOpenCommunity,
  onCloseTab,
  tabCount,
  trailCount,
  communityEnabled,
  communityThreadCount,
  privateTab = false,
  onOpenPrivateInfo,
  onNewPrivateTab,
}: Props) {
  const { theme, mode, setMode } = useTheme();
  const { height } = useWindowDimensions();
  const display = getDisplayUrl(url);
  const host = display.host;
  const hasPage = Boolean(url);
  const showDiscussions = !privateTab && shouldLookupCommunity(url);
  const discussionMeta = !communityEnabled
    ? 'Off'
    : communityThreadCount > 0
      ? String(communityThreadCount)
      : 'Look up';

  const run = (action: () => void) => {
    haptic.tap();
    onClose();
    action();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: height * 0.72 }}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.pageHeader}>
          {privateTab ? (
            <View
              style={[
                styles.privateHeaderTile,
                {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.line,
                },
              ]}
            >
              <Icon
                name="mask"
                size={22}
                color={theme.accent}
                strokeWidth={1.6}
              />
            </View>
          ) : (
            <Favicon host={host} title={title} size={46} />
          )}
          <View style={styles.pageCopy}>
            <Text numberOfLines={2} style={[styles.pageTitle, { color: theme.ink }]}>
              {hasPage ? title || host : privateTab ? 'Private tab' : title || host}
            </Text>
            <View style={styles.pageMetaRow}>
              <Icon
                name={privateTab ? 'mask' : display.secure ? 'lock' : 'unlock'}
                size={11}
                color={privateTab ? theme.accent : theme.faint}
                strokeWidth={1.9}
              />
              <Text numberOfLines={1} style={[styles.pageMeta, { color: theme.muted }]}>
                {privateTab ? privateCookieMenuMeta : host}
              </Text>
            </View>
          </View>
          <IconButton
            icon="close"
            label="Close menu"
            variant="surface"
            size={36}
            iconSize={16}
            onPress={onClose}
          />
        </View>

        <View style={styles.actions}>
          {privateTab ? (
            <SheetAction
              icon="mask"
              label="Private"
              active
              onPress={() => run(onOpenPrivateInfo)}
            />
          ) : null}
          {hasPage ? (
            <>
              <SheetAction
                icon="copy"
                label="Copy link"
                onPress={() => run(onCopy)}
              />
              <SheetAction
                icon="share"
                label="Share"
                onPress={() => run(onShare)}
              />
            </>
          ) : null}
          {!privateTab && hasPage ? (
            <SheetAction
              icon={pinned ? 'pinFilled' : 'pin'}
              label={pinned ? 'Unpin page' : 'Pin page'}
              active={pinned}
              onPress={() => run(onTogglePin)}
            />
          ) : null}
          {hasPage ? (
            <>
              <SheetAction
                icon="external"
                label="Open in browser"
                onPress={() => run(onOpenExternal)}
              />
              <SheetAction
                icon="refresh"
                label="Reload"
                onPress={() => run(onReload)}
              />
            </>
          ) : null}
          <SheetAction
            icon="home"
            label="Home"
            onPress={() => run(onGoHome)}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.line }]} />

        <PressableScale
          onPress={() => run(onOpenTabs)}
          style={styles.listRow}
          accessibilityLabel={`Open tabs, ${tabCount} open`}
        >
          <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
            <Icon name="tabs" size={18} color={theme.inkSoft} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.ink }]}>Tabs</Text>
          <Text style={[styles.rowMeta, { color: theme.faint }]}>
            {tabCount}
          </Text>
          <Icon
            name="chevronRight"
            size={16}
            color={theme.faint}
            strokeWidth={1.9}
          />
        </PressableScale>

        {!privateTab ? (
          <>
            <PressableScale
              onPress={() => run(onOpenTrails)}
              style={styles.listRow}
              accessibilityLabel={`Open trails, ${trailCount} saved`}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Icon name="trail" size={18} color={theme.inkSoft} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Trails</Text>
              <Text style={[styles.rowMeta, { color: theme.faint }]}>
                {trailCount}
              </Text>
              <Icon
                name="chevronRight"
                size={16}
                color={theme.faint}
                strokeWidth={1.9}
              />
            </PressableScale>

            {showDiscussions ? (
              <PressableScale
                onPress={() => run(onOpenCommunity)}
                style={styles.listRow}
                accessibilityLabel={`Discussions, ${discussionMeta.toLowerCase()}`}
              >
                <View
                  style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}
                >
                  <Icon name="message" size={18} color={theme.inkSoft} />
                </View>
                <Text style={[styles.rowLabel, { color: theme.ink }]}>
                  Discussions
                </Text>
                <Text style={[styles.rowMeta, { color: theme.faint }]}>
                  {discussionMeta}
                </Text>
                <Icon
                  name="chevronRight"
                  size={16}
                  color={theme.faint}
                  strokeWidth={1.9}
                />
              </PressableScale>
            ) : null}

            <PressableScale
              onPress={() => run(onOpenHistory)}
              style={styles.listRow}
              accessibilityLabel="Open history"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Icon name="clock" size={18} color={theme.inkSoft} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>History</Text>
              <Icon
                name="chevronRight"
                size={16}
                color={theme.faint}
                strokeWidth={1.9}
              />
            </PressableScale>

            <View style={styles.listRow}>
              <View style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}>
                <Icon
                  name={mode === 'dark' ? 'moon' : 'sun'}
                  size={18}
                  color={theme.inkSoft}
                />
              </View>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>
                Appearance
              </Text>
              <View style={[styles.segment, { backgroundColor: theme.chip }]}>
                <ModeOption
                  label="Light"
                  active={mode === 'light'}
                  onPress={() => setMode('light')}
                />
                <ModeOption
                  label="Dark"
                  active={mode === 'dark'}
                  onPress={() => setMode('dark')}
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.line }]} />

            <PressableScale
              onPress={() => run(onNewPrivateTab)}
              style={styles.listRow}
              accessibilityLabel="Open a private tab"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.accentSoft }]}>
                <Icon
                  name="mask"
                  size={18}
                  color={theme.accent}
                  strokeWidth={1.7}
                />
              </View>
              <View style={styles.privateRowCopy}>
                <Text style={[styles.privateRowTitle, { color: theme.ink }]}>
                  New private tab
                </Text>
                <Text style={[styles.rowHint, { color: theme.muted }]}>
                  No history, no cache, no capture
                </Text>
              </View>
              <Icon
                name="chevronRight"
                size={16}
                color={theme.faint}
                strokeWidth={1.9}
              />
            </PressableScale>
          </>
        ) : null}

        <View style={[styles.divider, { backgroundColor: theme.line }]} />

        <PressableScale
          onPress={() => run(onCloseTab)}
          style={styles.listRow}
          accessibilityLabel="Close this tab"
        >
          <View style={[styles.rowIcon, { backgroundColor: theme.chip }]}>
            <Icon name="close" size={17} color={theme.danger} strokeWidth={2} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.danger }]}>
            Close this tab
          </Text>
        </PressableScale>

        <Text style={[styles.footer, { color: theme.faint }]}>
          {privateTab ? 'Mira 1.0 · Private tab' : 'Mira 1.0 · A quieter web'}
        </Text>
      </ScrollView>
    </BottomSheet>
  );
}

function SheetAction({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      style={styles.action}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: active ? theme.accentSoft : theme.surfaceAlt,
          },
        ]}
      >
        <Icon
          name={icon}
          size={20}
          color={active ? theme.accent : theme.inkSoft}
          strokeWidth={1.8}
        />
      </View>
      <Text style={[styles.actionLabel, { color: theme.inkSoft }]}>{label}</Text>
    </PressableScale>
  );
}

function ModeOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <PressableScale
      onPress={() => {
        onPress();
      }}
      scaleTo={0.96}
      style={[
        styles.segmentOption,
        active
          ? [
              styles.segmentActive,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]
          : null,
      ]}
      accessibilityLabel={`${label} appearance`}
    >
      <Text
        style={[
          styles.segmentText,
          { color: active ? theme.ink : theme.muted },
        ]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  pageCopy: {
    flex: 1,
    gap: 3,
  },
  privateHeaderTile: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 21,
  },
  pageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageMeta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  action: {
    width: '33.333%',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 7,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 4,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14.5,
  },
  rowMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginRight: 2,
  },
  privateRowCopy: {
    flex: 1,
    gap: 1,
  },
  privateRowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
  },
  rowHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  segmentOption: {
    height: 29,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  footer: {
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 10.5,
    marginTop: 16,
  },
});

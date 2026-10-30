import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { haptic } from '@/lib/haptics';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { getDisplayUrl, hostOf } from '@/lib/url';
import { MAX_TABS } from '@/lib/storage-keys';
import { fonts, privateTheme } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { BrowserTab } from '@/types';
import { BottomSheet } from './BottomSheet';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type Props = {
  visible: boolean;
  onClose: () => void;
  tabs: BrowserTab[];
  activeTabId: string | null;
  privateMode: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onNewPrivateTab: () => void;
  onOpenPrivateInfo: () => void;
  onClosePrivateTabs: () => void;
};

/**
 * Tabs are deliberately a small set. Private tabs sit in their own night-time
 * group: same shelf, different room. The grid reads as a shelf of warm pages,
 * not an infinite stack.
 */
export function TabsSheet({
  visible,
  onClose,
  tabs,
  activeTabId,
  privateMode,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onNewPrivateTab,
  onOpenPrivateInfo,
  onClosePrivateTabs,
}: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();

  const privateTabs = tabs.filter((tab) => tab.private);
  const normalTabs = tabs.filter((tab) => !tab.private);
  const grouped = privateTabs.length > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>TABS</Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            {tabs.length} of {MAX_TABS} open
          </Text>
        </View>
        <PressableScale
          onPress={() => {
            haptic.tap();
            onNewTab();
          }}
          style={[styles.newTab, { backgroundColor: theme.accent }]}
          accessibilityLabel={
            privateMode ? 'Open a new private tab' : 'Open a new tab'
          }
        >
          <Icon
            name={privateMode ? 'mask' : 'plus'}
            size={privateMode ? 13 : 14}
            color={theme.accentInk}
            strokeWidth={privateMode ? 1.9 : 2.4}
          />
          <Text style={[styles.newTabText, { color: theme.accentInk }]}>
            {privateMode ? 'New private' : 'New tab'}
          </Text>
        </PressableScale>
        <IconButton
          icon="close"
          label="Close tabs"
          variant="surface"
          size={36}
          iconSize={16}
          onPress={onClose}
        />
      </View>

      <ScrollView
        style={{ maxHeight: height * 0.58 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <PressableScale
          onPress={() => {
            haptic.tap();
            onNewPrivateTab();
          }}
          scaleTo={0.985}
          style={styles.privateStrip}
          accessibilityLabel="Open a private tab. No history, no cache, no screen capture."
        >
          <View style={styles.privateOrb}>
            <Icon name="mask" size={19} color={privateTheme.accent} strokeWidth={1.6} />
          </View>
          <View style={styles.privateCopy}>
            <Text style={styles.privateTitle}>Open a private tab</Text>
            <Text style={styles.privateHint}>
              No history · no cache · no capture
            </Text>
          </View>
          <View style={styles.privateAdd}>
            <Icon
              name="plus"
              size={14}
              color={privateTheme.accent}
              strokeWidth={2.3}
            />
          </View>
        </PressableScale>

        {privateTabs.length > 0 ? (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={styles.groupLabelRow}>
                <Icon name="mask" size={11} color={theme.accent} strokeWidth={1.9} />
                <Text style={[styles.groupLabel, { color: theme.muted }]}>
                  PRIVATE · {privateTabs.length}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  haptic.warn();
                  onClosePrivateTabs();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close all private tabs"
              >
                <Text style={[styles.groupAction, { color: theme.danger }]}>
                  Close all
                </Text>
              </Pressable>
            </View>
            <View style={styles.grid}>
              {privateTabs.map((tab) => (
                <TabCard
                  key={tab.id}
                  tab={tab}
                  active={tab.id === activeTabId}
                  onSelect={onSelectTab}
                  onClose={onCloseTab}
                />
              ))}
            </View>
          </View>
        ) : null}

        {normalTabs.length > 0 ? (
          <View style={styles.group}>
            {grouped ? (
              <View style={styles.groupHeader}>
                <Text style={[styles.groupLabel, { color: theme.muted }]}>
                  OPEN · {normalTabs.length}
                </Text>
                <Pressable
                  onPress={() => {
                    haptic.tap();
                    onOpenPrivateInfo();
                  }}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="How private tabs work"
                >
                  <Text style={[styles.groupAction, { color: theme.inkSoft }]}>
                    About private
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.grid}>
              {normalTabs.map((tab) => (
                <TabCard
                  key={tab.id}
                  tab={tab}
                  active={tab.id === activeTabId}
                  onSelect={onSelectTab}
                  onClose={onCloseTab}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[styles.hint, { color: theme.faint }]}>
          Pages stay warm while Mira is open. Private tabs close without a
          history entry.
        </Text>
      </ScrollView>
    </BottomSheet>
  );
}

function TabCard({
  tab,
  active,
  onSelect,
  onClose,
}: {
  tab: BrowserTab;
  active: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const { theme } = useTheme();
  const { engines } = useCatalogConfig();
  const tone = tab.private ? privateTheme : theme;
  const url = tab.snapshot.url || tab.initialUrl;
  const display = getDisplayUrl(url, engines);
  const blank = tab.private && !url;
  const title = blank ? 'Private tab' : tab.snapshot.title || hostOf(url);
  const host = blank ? 'No page yet' : display.host;
  // A cross-origin page can report its host as the title. Showing the same
  // string twice under each other reads like a layout bug.
  const titleIsHost =
    !blank && title.trim().toLowerCase() === host.toLowerCase();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: active
            ? tone.chip
            : tab.private
              ? privateTheme.surfaceAlt
              : theme.surfaceAlt,
          borderColor: active ? tone.accent : tone.line,
          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <PressableScale
        onPress={() => {
          haptic.tap();
          onSelect(tab.id);
        }}
        scaleTo={0.975}
        style={styles.cardBody}
        accessibilityLabel={`${active ? 'Current tab' : 'Open tab'}: ${title}${
          tab.private ? ', private' : ''
        }`}
      >
        <View style={styles.cardTop}>
          {blank ? (
            <View style={styles.privateTile}>
              <Icon
                name="mask"
                size={14}
                color={privateTheme.accent}
                strokeWidth={1.7}
              />
            </View>
          ) : (
            <Favicon host={host} title={title} size={26} plain />
          )}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: active ? tone.accent : tone.faint },
              ]}
            />
            <Text
              style={[
                styles.status,
                { color: active ? tone.accent : tone.faint },
              ]}
            >
              {tab.private ? 'PRIVATE' : active ? 'CURRENT' : 'OPEN'}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={titleIsHost ? 1 : 2}
          style={[
            styles.cardTitle,
            titleIsHost ? styles.cardTitleHost : null,
            { color: tone.ink },
          ]}
        >
          {title}
        </Text>
        {titleIsHost ? null : (
          <Text
            numberOfLines={1}
            style={[styles.cardHost, { color: tone.muted }]}
          >
            {host}
          </Text>
        )}
      </PressableScale>
      <View style={styles.cardFooter}>
        <Text
          numberOfLines={1}
          style={[styles.cardPath, { color: tone.faint }]}
        >
          {blank ? 'No history' : display.path || 'Front page'}
        </Text>
        <Pressable
          onPress={() => {
            haptic.warn();
            onClose(tab.id);
          }}
          hitSlop={10}
          style={[
            styles.closeTab,
            {
              backgroundColor: tab.private ? privateTheme.bg : theme.bg,
              borderColor: tone.line,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title}`}
        >
          <Icon name="close" size={10} color={tone.inkSoft} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  newTab: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  newTabText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  privateStrip: {
    minHeight: 64,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(143, 168, 255, 0.2)',
    backgroundColor: privateTheme.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  privateOrb: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: privateTheme.accentSoft,
  },
  privateCopy: {
    flex: 1,
    gap: 2,
  },
  privateTitle: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: privateTheme.ink,
  },
  privateHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: privateTheme.muted,
  },
  privateAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(143, 168, 255, 0.28)',
  },
  group: {
    marginTop: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 18,
    marginBottom: 10,
  },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.5,
  },
  groupAction: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48.4%',
    minHeight: 142,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  privateTile: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: privateTheme.accentSoft,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  status: {
    fontFamily: fonts.semibold,
    fontSize: 7.5,
    letterSpacing: 0.9,
  },
  cardTitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 17,
    marginTop: 10,
  },
  cardTitleHost: {
    fontFamily: fonts.serif,
    fontSize: 19,
    lineHeight: 21,
    letterSpacing: -0.2,
    marginTop: 12,
  },
  cardHost: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    marginTop: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  cardPath: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 9.5,
  },
  closeTab: {
    width: 23,
    height: 23,
    borderRadius: 11.5,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 10.5,
    paddingHorizontal: 30,
    paddingTop: 18,
    paddingBottom: 2,
  },
});

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { haptic } from '@/lib/haptics';
import { getDisplayUrl, hostOf } from '@/lib/url';
import { MAX_TABS } from '@/lib/storage-keys';
import { fonts } from '@/theme';
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
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
};

/**
 * Tabs are deliberately a small set. The grid is a shelf of warm pages, not an
 * infinite stack, and the active page wears the accent.
 */
export function TabsSheet({
  visible,
  onClose,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();

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
          accessibilityLabel="Open a new tab"
        >
          <Icon name="plus" size={14} color={theme.accentInk} strokeWidth={2.4} />
          <Text style={[styles.newTabText, { color: theme.accentInk }]}>
            New tab
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
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {tabs.map((tab) => {
          const url = tab.snapshot.url || tab.initialUrl;
          const display = getDisplayUrl(url);
          const active = tab.id === activeTabId;
          const title = tab.snapshot.title || hostOf(url);
          // A cross-origin page can report its host as the title. Showing the
          // same string twice under each other reads like a layout bug.
          const titleIsHost =
            title.trim().toLowerCase() === display.host.toLowerCase();

          return (
            <View
              key={tab.id}
              style={[
                styles.card,
                {
                  backgroundColor: active ? theme.chip : theme.surfaceAlt,
                  borderColor: active ? theme.accent : theme.line,
                  borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <PressableScale
                onPress={() => {
                  haptic.tap();
                  onSelectTab(tab.id);
                }}
                scaleTo={0.975}
                style={styles.cardBody}
                accessibilityLabel={`${active ? 'Current tab' : 'Open tab'}: ${title}`}
              >
                <View style={styles.cardTop}>
                  <Favicon host={display.host} title={title} size={26} plain />
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: active
                            ? theme.accent
                            : theme.faint,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.status,
                        { color: active ? theme.accent : theme.faint },
                      ]}
                    >
                      {active ? 'CURRENT' : 'OPEN'}
                    </Text>
                  </View>
                </View>

                <Text
                  numberOfLines={titleIsHost ? 1 : 2}
                  style={[
                    styles.cardTitle,
                    titleIsHost ? styles.cardTitleHost : null,
                    { color: theme.ink },
                  ]}
                >
                  {title}
                </Text>
                {titleIsHost ? null : (
                  <Text
                    numberOfLines={1}
                    style={[styles.cardHost, { color: theme.muted }]}
                  >
                    {display.host}
                  </Text>
                )}
              </PressableScale>
              <View style={styles.cardFooter}>
                <Text
                  numberOfLines={1}
                  style={[styles.cardPath, { color: theme.faint }]}
                >
                  {display.path || 'Front page'}
                </Text>
                <Pressable
                  onPress={() => {
                    haptic.warn();
                    onCloseTab(tab.id);
                  }}
                  hitSlop={10}
                  style={[
                    styles.closeTab,
                    {
                      backgroundColor: theme.bg,
                      borderColor: theme.line,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Close ${title}`}
                >
                  <Icon
                    name="close"
                    size={10}
                    color={theme.inkSoft}
                    strokeWidth={2.4}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Text style={[styles.hint, { color: theme.faint }]}>
        Pages stay warm while Mira is open. Closing a tab releases it.
      </Text>
    </BottomSheet>
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
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 8,
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
    paddingTop: 8,
    paddingBottom: 2,
  },
});

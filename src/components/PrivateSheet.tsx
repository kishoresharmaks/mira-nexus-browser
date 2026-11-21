import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { privateCookieBody, privateCookieTitle } from '@/lib/privateCopy';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type Props = {
  visible: boolean;
  onClose: () => void;
  privateCount: number;
  onCloseAll: () => void;
};

const PROMISES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'mask',
    title: 'No history, no cache',
    body: "Pages opened here never reach Recents or Trails, and private requests bypass WebView's page cache.",
  },
  {
    icon: 'shield',
    title: privateCookieTitle,
    body: privateCookieBody,
  },
  {
    icon: 'lock',
    title: 'Screen capture blocked',
    body: 'Screenshots and recordings are blocked while a private tab is open, and the app switcher shows a quiet screen instead.',
  },
  {
    icon: 'message',
    title: 'Discussions stay off',
    body: 'Page addresses are never sent to Hacker News or Lobsters from a private tab.',
  },
];

/**
 * The privacy contract, stated plainly. This sheet is the one place where Nexus
 * explains what it can and cannot protect, so it deliberately avoids absolutes.
 */
export function PrivateSheet({
  visible,
  onClose,
  privateCount,
  onCloseAll,
}: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: height * 0.82 }}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View style={[styles.orb, { backgroundColor: theme.accentSoft }]}>
            <Icon name="mask" size={26} color={theme.accent} strokeWidth={1.6} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.muted }]}>
              PRIVATE BROWSING
            </Text>
            <Text style={[styles.title, { color: theme.ink }]}>
              A room Nexus forgets
            </Text>
          </View>
          <IconButton
            icon="close"
            label="Close private tab details"
            variant="surface"
            size={36}
            iconSize={16}
            onPress={onClose}
          />
        </View>

        <Text style={[styles.lede, { color: theme.muted }]}>
          {privateCount > 0
            ? `${privateCount} private ${
                privateCount === 1 ? 'tab is' : 'tabs are'
              } open. Closing one leaves no history in Nexus.`
            : 'Private tabs leave no history in Nexus.'}
        </Text>

        <View style={styles.rows}>
          {PROMISES.map((promise, index) => (
            <View
              key={promise.title}
              style={[
                styles.row,
                index > 0
                  ? {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.line,
                    }
                  : null,
              ]}
            >
              <View
                style={[styles.rowIcon, { backgroundColor: theme.surfaceAlt }]}
              >
                <Icon
                  name={promise.icon}
                  size={18}
                  color={theme.accent}
                  strokeWidth={1.75}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: theme.ink }]}>
                  {promise.title}
                </Text>
                <Text style={[styles.rowBody, { color: theme.muted }]}>
                  {promise.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.note,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.line },
          ]}
        >
          <Icon name="shield" size={14} color={theme.faint} strokeWidth={1.7} />
          <Text style={[styles.noteText, { color: theme.muted }]}>
            Nexus keeps no record of the visit, but a site still sees your IP
            address and knows that someone visited. Private tabs hide your trail
            in Nexus, not your identity on the web.
          </Text>
        </View>

        {privateCount > 0 ? (
          <PressableScale
            onPress={onCloseAll}
            scaleTo={0.98}
            style={[
              styles.closeAll,
              {
                backgroundColor: 'rgba(255, 138, 122, 0.1)',
                borderColor: 'rgba(255, 138, 122, 0.32)',
              },
            ]}
            accessibilityLabel={
              privateCount === 1
                ? 'Close the private tab'
                : `Close all ${privateCount} private tabs`
            }
          >
            <Icon name="trash" size={16} color={theme.danger} strokeWidth={1.9} />
            <Text style={[styles.closeAllText, { color: theme.danger }]}>
              Close all private tabs
            </Text>
          </PressableScale>
        ) : null}

        <PressableScale
          onPress={onClose}
          scaleTo={0.98}
          style={styles.done}
          accessibilityLabel="Keep browsing"
        >
          <Text style={[styles.doneText, { color: theme.inkSoft }]}>
            Keep browsing
          </Text>
        </PressableScale>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
    paddingBottom: 4,
  },
  orb: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 25,
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  lede: {
    marginTop: 10,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 420,
  },
  rows: {
    marginTop: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  rowBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17.5,
  },
  note: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 17,
  },
  closeAll: {
    marginTop: 18,
    height: 50,
    borderRadius: 25,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeAllText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
  },
  done: {
    marginTop: 6,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});

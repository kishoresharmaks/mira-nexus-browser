import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  curatedDateLabel,
  getCuratedArchive,
  getDailyPage,
} from '@/lib/curation';
import { haptic } from '@/lib/haptics';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { TodayCard } from './TodayCard';

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpen: (url: string) => void;
};

/**
 * One page a day, plus the last ten days. There is no server, no ranking, and
 * no personalization — just a small shelf that rotates with the calendar.
 */
export function TodaySheet({ visible, onClose, onOpen }: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const today = getDailyPage();
  const archive = getCuratedArchive(11).slice(1);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            THE DAILY PAGE
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>Today</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {curatedDateLabel()}
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close today's page"
          variant="surface"
          size={36}
          iconSize={16}
          onPress={onClose}
        />
      </View>

      <ScrollView
        style={{ maxHeight: height * 0.6 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TodayCard
          page={today}
          dateLabel="TODAY"
          roomy
          onPress={() => onOpen(today.url)}
        />

        <View style={styles.archiveHead}>
          <Text style={[styles.archiveLabel, { color: theme.muted }]}>
            PAST 10 DAYS
          </Text>
          <Icon name="archive" size={14} color={theme.faint} strokeWidth={1.8} />
        </View>

        <View
          style={[
            styles.archiveCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          {archive.map((day, index) => (
            <Pressable
              key={`${day.page.id}-${day.offset}`}
              onPress={() => {
                haptic.tap();
                onOpen(day.page.url);
              }}
              style={({ pressed }) => [
                styles.row,
                index > 0
                  ? {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.line,
                    }
                  : null,
                pressed ? { opacity: 0.65 } : null,
              ]}
              accessibilityRole="link"
              accessibilityLabel={`Open ${day.page.title} from ${day.label}`}
            >
              <Text style={[styles.rowDate, { color: theme.faint }]}>
                {day.label}
              </Text>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowCategory, { color: theme.accent }]}>
                  {day.page.category}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.rowTitle, { color: theme.ink }]}
                >
                  {day.page.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.rowHost, { color: theme.muted }]}
                >
                  {day.page.host} · {day.page.readMinutes} min
                </Text>
              </View>
              <Icon
                name="arrowUpRight"
                size={14}
                color={theme.faint}
                strokeWidth={1.9}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.footer, { color: theme.faint }]}>
        Hand-picked. No algorithm, no feed, no tracking.
      </Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  headerCopy: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.55,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  archiveHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  archiveLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.55,
  },
  archiveCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  rowDate: {
    width: 48,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowCategory: {
    fontFamily: fonts.semibold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 17,
  },
  rowHost: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
  footer: {
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 10,
    paddingTop: 10,
    paddingBottom: 2,
  },
});

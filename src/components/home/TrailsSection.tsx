import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../Icon';
import { TrailCard } from '../TrailCard';
import { haptic } from '@/lib/haptics';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Trail } from '@/types';

type Props = {
  trails: Trail[];
  onResumeTrail: (trail: Trail) => void;
  onOpenTrails: () => void;
};

export function TrailsSection({
  trails,
  onResumeTrail,
  onOpenTrails,
}: Props) {
  const { theme } = useTheme();
  const latestTrail = trails[0];

  if (!latestTrail) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          TRAILS — BROWSING JOURNEY
        </Text>
        <Pressable
          onPress={() => {
            haptic.tap();
            onOpenTrails();
          }}
          hitSlop={10}
          style={styles.seeAll}
          accessibilityRole="button"
          accessibilityLabel="See all browsing trails"
        >
          <Text style={[styles.sectionAction, { color: theme.inkSoft }]}>
            See all
          </Text>
          <Icon name="chevronRight" size={13} color={theme.faint} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.cardWrap}>
        <TrailCard
          trail={latestTrail}
          onPress={() => {
            haptic.tap();
            onResumeTrail(latestTrail);
          }}
          onOpenAll={() => {
            haptic.tap();
            onOpenTrails();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionAction: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  cardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DownloadsSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            NEXUS DROP
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Downloads
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close downloads"
          size={36}
          iconSize={16}
          variant="surface"
          onPress={onClose}
        />
      </View>

      <View style={styles.emptyWrap}>
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
            softShadow(theme.mode, 'card'),
          ]}
        >
          <View style={[styles.iconOrb, { backgroundColor: theme.accentSoft }]}>
            <Icon name="download" size={24} color={theme.accent} strokeWidth={2} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>
            No active downloads
          </Text>
          <Text style={[styles.emptyBody, { color: theme.muted }]}>
            Files, PDFs, and media downloaded from websites will be securely stored and accessible here.
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    marginTop: 2,
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    marginBottom: 6,
  },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
});

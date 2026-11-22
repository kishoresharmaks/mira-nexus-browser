import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type UtilityApp = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenDownloads: () => void;
  onOpenNotes: () => void;
  onOpenPrivacy: () => void;
  onOpenTrails: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
};

export function AppsSheet({
  visible,
  onClose,
  onOpenDownloads,
  onOpenNotes,
  onOpenPrivacy,
  onOpenTrails,
  onOpenArchive,
  onOpenSettings,
}: Props) {
  const { theme } = useTheme();

  const apps: UtilityApp[] = [
    {
      id: 'downloads',
      title: 'Nexus Drop',
      description: 'Manage downloaded documents and media files.',
      icon: 'download',
      onPress: () => {
        onClose();
        onOpenDownloads();
      },
    },
    {
      id: 'notes',
      title: 'Web Notes',
      description: 'Annotate webpages, clip quotes and save insights.',
      icon: 'note',
      onPress: () => {
        onClose();
        onOpenNotes();
      },
    },
    {
      id: 'privacy',
      title: 'Privacy Shield',
      description: 'Inspect HTTPS security, permissions and site cookies.',
      icon: 'shield',
      onPress: () => {
        onClose();
        onOpenPrivacy();
      },
    },
    {
      id: 'trails',
      title: 'Browsing Trails',
      description: 'Revisit contextual research sessions and page paths.',
      icon: 'trail',
      onPress: () => {
        onClose();
        onOpenTrails();
      },
    },
    {
      id: 'archive',
      title: 'Discovery Archive',
      description: 'Browse previous Websites and Articles of the Day.',
      icon: 'archive',
      onPress: () => {
        onClose();
        onOpenArchive();
      },
    },
    {
      id: 'settings',
      title: 'Settings & Catalog',
      description: 'Configure search engines, themes and preferences.',
      icon: 'settings',
      onPress: () => {
        onClose();
        onOpenSettings();
      },
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            NEXUS UTILITIES
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Apps & Tools
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close apps"
          size={36}
          iconSize={16}
          variant="surface"
          onPress={onClose}
        />
      </View>

      <View style={styles.list}>
        {apps.map((app) => (
          <PressableScale
            key={app.id}
            onPress={() => {
              haptic.tap();
              app.onPress();
            }}
            scaleTo={0.98}
            style={[
              styles.appCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
              softShadow(theme.mode, 'card'),
            ]}
          >
            <View style={[styles.iconOrb, { backgroundColor: theme.accentSoft }]}>
              <Icon name={app.icon} size={18} color={theme.accent} strokeWidth={2} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.appTitle, { color: theme.ink }]}>
                {app.title}
              </Text>
              <Text style={[styles.appDesc, { color: theme.muted }]}>
                {app.description}
              </Text>
            </View>
            <Icon name="chevronRight" size={14} color={theme.faint} strokeWidth={2} />
          </PressableScale>
        ))}
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
    paddingBottom: 16,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  iconOrb: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  appTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  appDesc: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
});

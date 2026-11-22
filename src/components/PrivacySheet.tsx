import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { useToast } from './Toast';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  onOpenPrivateTab: () => void;
};

type PrivacyFeature = {
  title: string;
  subtitle: string;
  status: string;
  icon: IconName;
  active: boolean;
};

export function PrivacySheet({
  visible,
  onClose,
  onClearHistory,
  onOpenPrivateTab,
}: Props) {
  const { theme } = useTheme();
  const toast = useToast();

  const features: PrivacyFeature[] = [
    {
      title: 'Google Safe Browsing',
      subtitle: 'Real-time protection against malware, phishing and deceptive scams',
      status: 'Active',
      icon: 'shield',
      active: true,
    },
    {
      title: 'HTTPS Only & Anti-Cleartext',
      subtitle: 'Insecure HTTP connections and mixed content are strictly blocked',
      status: 'Enforced',
      icon: 'lock',
      active: true,
    },
    {
      title: 'Sandbox File Isolation',
      subtitle: 'Web pages are denied access to your local filesystem and storage',
      status: 'Isolated',
      icon: 'mask',
      active: true,
    },
    {
      title: 'Anti-Tracking Cookies',
      subtitle: 'Cross-site third-party tracking cookies are rejected automatically',
      status: 'Blocked',
      icon: 'unlock',
      active: true,
    },
    {
      title: '22 Dangerous Permissions Blocked',
      subtitle: 'Camera, microphone, GPS location, contacts and SMS are stripped',
      status: 'Denied',
      icon: 'shield',
      active: true,
    },
  ];

  const handleClearHistory = () => {
    haptic.warn();
    onClearHistory();
    toast.show('Browsing history cleared');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>
            SECURITY & SHIELD
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Privacy Dashboard
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close privacy dashboard"
          size={36}
          iconSize={16}
          variant="surface"
          onPress={onClose}
        />
      </View>

      <View style={styles.content}>
        {/* Status Cards */}
        <View style={styles.featuresList}>
          {features.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.featureCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={[styles.iconOrb, { backgroundColor: theme.accentSoft }]}>
                <Icon name={item.icon} size={16} color={theme.accent} strokeWidth={2} />
              </View>
              <View style={styles.copy}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.ink }]}>
                    {item.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: theme.chip }]}>
                    <Text style={[styles.statusText, { color: theme.accent }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Controls */}
        <View style={styles.actions}>
          <PressableScale
            onPress={() => {
              onClose();
              onOpenPrivateTab();
            }}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Icon name="mask" size={16} color="#FFFFFF" strokeWidth={1.8} />
            <Text style={styles.primaryButtonText}>Open Private Tab</Text>
          </PressableScale>

          <PressableScale
            onPress={handleClearHistory}
            style={[styles.dangerButton, { borderColor: theme.line, backgroundColor: theme.chip }]}
          >
            <Icon name="trash" size={14} color={theme.danger} strokeWidth={2} />
            <Text style={[styles.dangerButtonText, { color: theme.danger }]}>
              Clear History & Cache
            </Text>
          </PressableScale>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  featuresList: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconOrb: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});

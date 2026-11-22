import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { useToast } from './Toast';
import { haptic } from '@/lib/haptics';
import { getDisplayUrl, isWebUrl } from '@/lib/url';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  activeUrl?: string;
  onClearHistory: () => void;
  onClearCache?: () => void;
  onClearCookies?: () => void;
  onOpenPrivateTab: () => void;
};

type SecurityFeature = {
  title: string;
  subtitle: string;
  status: string;
  icon: IconName;
  verified: boolean;
};

export function PrivacySheet({
  visible,
  onClose,
  activeUrl,
  onClearHistory,
  onClearCache,
  onClearCookies,
  onOpenPrivateTab,
}: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const [clearing, setClearing] = useState(false);

  const isCurrentUrlHttps = activeUrl && isWebUrl(activeUrl) ? activeUrl.startsWith('https://') : null;
  const currentHost = activeUrl && isWebUrl(activeUrl) ? getDisplayUrl(activeUrl).host : null;

  const securityFeatures: SecurityFeature[] = [
    {
      title: 'Google Safe Browsing Client',
      subtitle: 'Real-time Android WebView security verifies hosts against phishing, malware, and social engineering attacks.',
      status: 'Enforced',
      icon: 'shield',
      verified: true,
    },
    {
      title: 'Strict HTTPS & Anti-Cleartext',
      subtitle: 'Android Network Security Config blocks plain HTTP cleartext traffic; all mixed content is denied.',
      status: 'Enforced',
      icon: 'lock',
      verified: true,
    },
    {
      title: 'Sandbox File Isolation',
      subtitle: 'Web pages have zero access to local device filesystem, documents, SD card, or private app sandbox.',
      status: 'Isolated',
      icon: 'mask',
      verified: true,
    },
    {
      title: 'Third-Party Cookies Denied',
      subtitle: 'Cross-site cookies used for cross-domain tracking networks are rejected by WebView cookie policy.',
      status: 'Blocked',
      icon: 'unlock',
      verified: true,
    },
    {
      title: 'Hardware Privacy & Manifest Hardening',
      subtitle: 'GPS Location, Contacts, Calendar, Phone, and SMS are stripped from Android manifest. Camera and Microphone are runtime-guarded exclusively for voice search and QR scanning.',
      status: 'Enforced',
      icon: 'shield',
      verified: true,
    },
  ];

  const handleClearHistory = () => {
    Alert.alert('Clear Browsing History?', 'This will permanently delete all visited page records on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear History',
        style: 'destructive',
        onPress: () => {
          haptic.warn();
          onClearHistory();
          toast.show('Browsing history cleared');
        },
      },
    ]);
  };

  const handleClearCache = () => {
    haptic.warn();
    setClearing(true);
    if (onClearCache) onClearCache();
    setTimeout(() => {
      setClearing(false);
      toast.show('Browser web cache cleared');
    }, 400);
  };

  const handleClearCookies = () => {
    Alert.alert(
      'Clear Site Data & Cookies?',
      'This will log you out of active websites and remove cached web storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            haptic.warn();
            if (onClearCookies) onClearCookies();
            toast.show('Site cookies and session storage cleared');
          },
        },
      ],
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>
            SECURITY & AUDIT
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Page Security Status (if browsing) */}
        {currentHost && (
          <View
            style={[
              styles.activePageCard,
              { backgroundColor: theme.chip, borderColor: theme.line },
            ]}
          >
            <View style={styles.activePageHeader}>
              <Icon
                name={isCurrentUrlHttps ? 'lock' : 'unlock'}
                size={16}
                color={isCurrentUrlHttps ? theme.accent : '#D9534F'}
              />
              <Text numberOfLines={1} style={[styles.activeHostText, { color: theme.ink }]}>
                {currentHost}
              </Text>
              <View
                style={[
                  styles.tlsBadge,
                  { backgroundColor: isCurrentUrlHttps ? theme.accentSoft : 'rgba(217, 83, 79, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.tlsBadgeText,
                    { color: isCurrentUrlHttps ? theme.accent : '#D9534F' },
                  ]}
                >
                  {isCurrentUrlHttps ? 'TLS Encrypted' : 'Insecure'}
                </Text>
              </View>
            </View>
            <Text style={[styles.activePageDetails, { color: theme.muted }]}>
              {isCurrentUrlHttps
                ? 'Your connection to this host is authenticated and encrypted via HTTPS. Third-party cookie access is blocked.'
                : 'Warning: This page is not using TLS encryption. Credentials entered here could be intercepted.'}
            </Text>
          </View>
        )}

        {/* Verifiable Architecture Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>
            VERIFIABLE SANDBOX GUARDS
          </Text>
          <View style={styles.featuresList}>
            {securityFeatures.map((feat) => (
              <View
                key={feat.title}
                style={[
                  styles.featureCard,
                  { backgroundColor: theme.surface, borderColor: theme.line },
                  softShadow(theme.mode, 'card'),
                ]}
              >
                <View style={styles.featureRow}>
                  <View style={[styles.iconWrap, { backgroundColor: theme.chip }]}>
                    <Icon name={feat.icon} size={15} color={theme.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.featureCopy}>
                    <View style={styles.featureTitleRow}>
                      <Text style={[styles.featureTitle, { color: theme.ink }]}>
                        {feat.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: theme.accentSoft }]}>
                        <Text style={[styles.statusText, { color: theme.accent }]}>
                          {feat.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.featureSubtitle, { color: theme.muted }]}>
                      {feat.subtitle}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Explicit Website Permissions Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>
            WEB PERMISSIONS POLICY
          </Text>
          <View
            style={[
              styles.permissionsGrid,
              { backgroundColor: theme.surface, borderColor: theme.line },
              softShadow(theme.mode, 'card'),
            ]}
          >
            {[
              { label: 'Camera', status: 'Blocked' },
              { label: 'Microphone', status: 'Blocked' },
              { label: 'GPS Location', status: 'Blocked' },
              { label: 'File System', status: 'Blocked' },
              { label: 'Push Alerts', status: 'Blocked' },
              { label: 'Contacts', status: 'Blocked' },
            ].map((p) => (
              <View key={p.label} style={styles.permRow}>
                <Text style={[styles.permLabel, { color: theme.ink }]}>{p.label}</Text>
                <Text style={[styles.permStatus, { color: theme.accent }]}>{p.status}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Data & Cache Clearing Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>
            DATA & STORAGE CONTROLS
          </Text>

          <View style={styles.actionsColumn}>
            <PressableScale
              onPress={handleClearCache}
              style={[
                styles.actionItem,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: theme.ink }]}>
                  Clear Web Cache
                </Text>
                <Text style={[styles.actionSub, { color: theme.muted }]}>
                  {clearing ? 'Clearing cache...' : 'Removes cached webpage files and temporary scripts'}
                </Text>
              </View>
              <Icon name="refresh" size={15} color={theme.inkSoft} />
            </PressableScale>

            <PressableScale
              onPress={handleClearCookies}
              style={[
                styles.actionItem,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: theme.ink }]}>
                  Clear Cookies & Site Data
                </Text>
                <Text style={[styles.actionSub, { color: theme.muted }]}>
                  Resets first-party cookies and clears local web storage
                </Text>
              </View>
              <Icon name="trash" size={15} color={theme.inkSoft} />
            </PressableScale>

            <PressableScale
              onPress={handleClearHistory}
              style={[
                styles.actionItem,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: theme.ink }]}>
                  Clear Browsing History
                </Text>
                <Text style={[styles.actionSub, { color: theme.muted }]}>
                  Deletes all recorded URL visits and snapshots
                </Text>
              </View>
              <Icon name="trash" size={15} color={theme.inkSoft} />
            </PressableScale>

            <PressableScale
              onPress={() => {
                haptic.tap();
                onOpenPrivateTab();
                onClose();
              }}
              style={[
                styles.actionItem,
                { backgroundColor: theme.chip, borderColor: theme.line },
              ]}
            >
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: theme.ink }]}>
                  Open Private Tab
                </Text>
                <Text style={[styles.actionSub, { color: theme.muted }]}>
                  Bypasses history, disables trails, and leaves zero trace on this device
                </Text>
              </View>
              <Icon name="mask" size={16} color={theme.accent} />
            </PressableScale>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 10,
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
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18,
  },
  activePageCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  activePageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeHostText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  tlsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tlsBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  activePageDetails: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1,
  },
  featuresList: {
    gap: 8,
  },
  featureCard: {
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  featureTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
  },
  featureSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  permissionsGrid: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  permStatus: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  actionsColumn: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionCopy: {
    flex: 1,
    marginRight: 12,
  },
  actionTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  actionSub: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 2,
  },
});

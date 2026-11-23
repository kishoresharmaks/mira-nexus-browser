import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PermissionsCard } from './privacy/PermissionsCard';
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
      'Clear Active Origin Storage?',
      'This clears active origin localStorage and sessionStorage for loaded tabs. To protect your active sessions in normal tabs, persistent HTTP cookies are preserved. For complete erasure of cookies and offline databases, use Android Settings > Clear Data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            haptic.warn();
            if (onClearCookies) onClearCookies();
            toast.show('Active origin web storage cleared');
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

        {/* Dynamic Android OS Permissions, Website Permissions, and Nexus Controls */}
        <PermissionsCard />

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
                  Clear Active Web Storage
                </Text>
                <Text style={[styles.actionSub, { color: theme.muted }]}>
                  Clears origin localStorage and sessionStorage; preserves persistent logins
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
                  Bypasses history and trails; isolates cache. Note: Android WebView shares cookie storage.
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
    maxHeight: 560,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 16,
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
    paddingVertical: 2,
    borderRadius: 6,
  },
  tlsBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  activePageDetails: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1.1,
  },
  actionsColumn: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  actionSub: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15,
  },
});

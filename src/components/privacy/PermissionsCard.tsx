import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { haptic } from '@/lib/haptics';
import {
  type PermissionRegistryItem,
  type PermissionStatus,
  usePermissionManager,
} from '@/lib/permissions';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

function getStatusBadge(status: PermissionStatus, theme: any) {
  switch (status) {
    case 'granted':
      return {
        label: 'Allowed',
        bg: 'rgba(52, 199, 89, 0.14)',
        color: '#28A745',
        border: 'rgba(52, 199, 89, 0.3)',
      };
    case 'denied':
      return {
        label: 'Denied',
        bg: 'rgba(255, 149, 0, 0.14)',
        color: '#E67E22',
        border: 'rgba(255, 149, 0, 0.3)',
      };
    case 'blocked':
      return {
        label: 'Blocked in OS',
        bg: 'rgba(217, 83, 79, 0.14)',
        color: '#D9534F',
        border: 'rgba(217, 83, 79, 0.3)',
      };
    case 'restricted':
      return {
        label: 'Policy Restricted',
        bg: 'rgba(217, 83, 79, 0.14)',
        color: '#D9534F',
        border: 'rgba(217, 83, 79, 0.3)',
      };
    case 'not-applicable':
      return {
        label: 'Not Applicable',
        bg: theme.chip,
        color: theme.muted,
        border: theme.line,
      };
    case 'install-time':
      return {
        label: 'Install-Time',
        bg: theme.chip,
        color: theme.inkSoft,
        border: theme.line,
      };
    case 'not-declared':
      return {
        label: 'Removed',
        bg: 'rgba(217, 83, 79, 0.08)',
        color: '#D9534F',
        border: 'rgba(217, 83, 79, 0.2)',
      };
    default:
      return {
        label: 'Unsupported',
        bg: theme.chip,
        color: theme.muted,
        border: theme.line,
      };
  }
}

type Props = {
  compact?: boolean;
};

export function PermissionsCard({ compact = false }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const {
    runtimePermissions,
    installTimePermissions,
    blockedPermissions,
    request,
    openSettings,
    refresh,
  } = usePermissionManager();

  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleAction = async (perm: PermissionRegistryItem) => {
    haptic.tap();
    if (perm.status === 'blocked' || perm.status === 'granted') {
      // User must manage it in OS Settings
      await openSettings();
      toast.show('Opening Android App Settings');
    } else if (perm.status === 'denied') {
      // Request permission
      setRequestingId(perm.id);
      try {
        const nextStatus = await request(perm.id);
        if (nextStatus === 'granted') {
          haptic.success();
          toast.show(`${perm.name} permission granted`);
        } else if (nextStatus === 'blocked') {
          haptic.warn();
          toast.show(`${perm.name} permanently denied. Manage in Settings.`);
        } else {
          toast.show(`${perm.name} permission was not granted`);
        }
      } finally {
        setRequestingId(null);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* SECTION A: Android App Permissions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>
          A. ANDROID OS PERMISSIONS (DYNAMIC)
        </Text>
        <PressableScale
          onPress={() => {
            haptic.tap();
            void refresh();
            toast.show('Permissions refreshed');
          }}
          style={styles.refreshBtn}
        >
          <Icon name="refresh" size={12} color={theme.accent} />
          <Text style={[styles.refreshText, { color: theme.accent }]}>Refresh</Text>
        </PressableScale>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode, 'card'),
        ]}
      >
        <Text style={[styles.cardLead, { color: theme.muted }]}>
          Permissions granted by Android directly to Nexus Browser. Monitored in real time:
        </Text>

        <View style={styles.list}>
          {runtimePermissions.map((perm) => {
            const badge = getStatusBadge(perm.status, theme);
            const isRequesting = requestingId === perm.id;

            return (
              <View
                key={perm.id}
                style={[styles.permItem, { borderBottomColor: theme.line }]}
              >
                <View style={styles.permMainRow}>
                  <View style={[styles.iconWrap, { backgroundColor: theme.chip }]}>
                    <Icon name={perm.icon} size={15} color={theme.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.permInfo}>
                    <View style={styles.permTitleRow}>
                      <Text style={[styles.permName, { color: theme.ink }]}>
                        {perm.name}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: badge.bg, borderColor: badge.border },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.permFeature, { color: theme.accent }]}>
                      {perm.feature}
                    </Text>
                    <Text style={[styles.permExplanation, { color: theme.muted }]}>
                      {perm.explanation}
                    </Text>
                  </View>
                </View>

                {/* Contextual Action Button */}
                <View style={styles.actionRow}>
                  {perm.status === 'granted' ? (
                    <PressableScale
                      onPress={() => handleAction(perm)}
                      style={[styles.actionBtn, { borderColor: theme.line, backgroundColor: theme.chip }]}
                    >
                      <Icon name="settings" size={12} color={theme.inkSoft} />
                      <Text style={[styles.actionBtnText, { color: theme.inkSoft }]}>
                        Manage in Settings
                      </Text>
                    </PressableScale>
                  ) : perm.status === 'blocked' ? (
                    <PressableScale
                      onPress={() => handleAction(perm)}
                      style={[styles.actionBtn, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
                    >
                      <Icon name="settings" size={12} color={theme.accent} />
                      <Text style={[styles.actionBtnText, { color: theme.accent }]}>
                        Open Android Settings
                      </Text>
                    </PressableScale>
                  ) : perm.status === 'denied' ? (
                    <PressableScale
                      onPress={() => handleAction(perm)}
                      disabled={isRequesting}
                      style={[styles.actionBtn, { borderColor: theme.accent, backgroundColor: theme.accent }]}
                    >
                      <Icon name="check" size={12} color={theme.accentInk} />
                      <Text style={[styles.actionBtnText, { color: theme.accentInk }]}>
                        {isRequesting ? 'Requesting...' : 'Request Permission'}
                      </Text>
                    </PressableScale>
                  ) : null}
                </View>
              </View>
            );
          })}

          {/* Install time permissions */}
          {installTimePermissions.map((perm) => {
            const badge = getStatusBadge(perm.status, theme);
            return (
              <View
                key={perm.id}
                style={[styles.permItem, { borderBottomColor: theme.line }]}
              >
                <View style={styles.permMainRow}>
                  <View style={[styles.iconWrap, { backgroundColor: theme.chip }]}>
                    <Icon name={perm.icon} size={15} color={theme.inkSoft} strokeWidth={2} />
                  </View>
                  <View style={styles.permInfo}>
                    <View style={styles.permTitleRow}>
                      <Text style={[styles.permName, { color: theme.ink }]}>
                        {perm.name}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: badge.bg, borderColor: badge.border },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.permFeature, { color: theme.muted }]}>
                      {perm.feature}
                    </Text>
                    <Text style={[styles.permExplanation, { color: theme.muted }]}>
                      {perm.explanation}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* SECTION B: Website Permissions Policy */}
      <View style={[styles.sectionHeader, { marginTop: 18 }]}>
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>
          B. WEBSITE PERMISSIONS (WEBVIEW SANDBOX)
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode, 'card'),
        ]}
      >
        <Text style={[styles.cardLead, { color: theme.muted }]}>
          Website permissions are handled entirely separate from Android OS permissions. Android Camera and Microphone permissions enable Nexus native features only (QR scanning and Voice search). Websites visited inside Nexus are strictly quarantined:
        </Text>

        <View style={styles.noticeBox}>
          <Icon name="shield" size={13} color={theme.accent} />
          <Text style={[styles.noticeText, { color: theme.inkSoft }]}>
            Nexus Browser enforces zero-trust website sandboxing. Website camera/microphone access is unconditionally blocked by engine policy. Nexus does not offer per-origin website permission grants.
          </Text>
        </View>

        <View style={styles.grid}>
          {[
            {
              name: 'Web Camera & Microphone',
              policy: 'Unconditionally Denied',
              reason: 'mediaCapturePermissionGrantType="deny" prevents any visited website from accessing video or audio hardware.',
              icon: 'mask' as const,
            },
            {
              name: 'Web Geolocation',
              policy: 'Unconditionally Denied',
              reason: 'geolocationEnabled={false} rejects all HTML5 Geolocation queries from web scripts.',
              icon: 'pin' as const,
            },
            {
              name: 'Local File System Access',
              policy: 'Unconditionally Denied',
              reason: 'allowFileAccess={false} blocks access to device storage, SD card, and file:// URLs.',
              icon: 'folder' as const,
            },
            {
              name: 'Insecure Mixed HTTP Content',
              policy: 'Blocked',
              reason: 'mixedContentMode="never" stops unencrypted HTTP resources from loading on secure HTTPS pages.',
              icon: 'lock' as const,
            },
            {
              name: 'Unsolicited Web Popups',
              policy: 'Blocked',
              reason: 'javaScriptCanOpenWindowsAutomatically={false} stops automated script popups.',
              icon: 'external' as const,
            },
          ].map((item, idx) => (
            <View
              key={item.name}
              style={[
                styles.webPolicyItem,
                idx > 0 && { borderTopWidth: 1, borderTopColor: theme.line },
              ]}
            >
              <View style={styles.webPolicyHead}>
                <Icon name={item.icon} size={14} color={theme.accent} />
                <Text style={[styles.webPolicyName, { color: theme.ink }]}>
                  {item.name}
                </Text>
                <View style={[styles.badge, { backgroundColor: 'rgba(217, 83, 79, 0.1)', borderColor: 'rgba(217, 83, 79, 0.25)' }]}>
                  <Text style={[styles.badgeText, { color: '#D9534F' }]}>
                    {item.policy}
                  </Text>
                </View>
              </View>
              <Text style={[styles.webPolicyReason, { color: theme.muted }]}>
                {item.reason}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* SECTION C: Nexus Privacy Controls */}
      <View style={[styles.sectionHeader, { marginTop: 18 }]}>
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>
          C. NEXUS BROWSER PRIVACY CONTROLS
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode, 'card'),
        ]}
      >
        {[
          {
            title: 'Google Safe Browsing Client',
            status: 'Enforced',
            icon: 'shield' as const,
            desc: 'Real-time Android WebView security verifies hosts against phishing, malware, and social engineering attacks.',
          },
          {
            title: 'Anti-Cleartext & TLS Enforcement',
            status: 'Enforced',
            icon: 'lock' as const,
            desc: 'Android Network Security Config blocks plain HTTP cleartext; insecure mixed content is rejected.',
          },
          {
            title: 'Third-Party Cookies Denied',
            status: 'Blocked',
            icon: 'globe' as const,
            desc: 'Cross-site cookies used by ad-tracking networks are rejected by WebView cookie policy.',
          },
          {
            title: 'Zero Browser Telemetry',
            status: 'Opted Out',
            icon: 'sparkle' as const,
            desc: 'WebView usage metrics disabled via MetricsOptOut meta-data. Nexus does not track or profile browsing.',
          },
        ].map((ctrl, index) => (
          <View
            key={ctrl.title}
            style={[
              styles.ctrlItem,
              index > 0 && { borderTopWidth: 1, borderTopColor: theme.line },
            ]}
          >
            <View style={styles.ctrlHead}>
              <View style={[styles.iconWrapSmall, { backgroundColor: theme.chip }]}>
                <Icon name={ctrl.icon} size={13} color={theme.accent} />
              </View>
              <Text style={[styles.ctrlTitle, { color: theme.ink }]}>{ctrl.title}</Text>
              <View style={[styles.badge, { backgroundColor: theme.accentSoft, borderColor: 'transparent' }]}>
                <Text style={[styles.badgeText, { color: theme.accent }]}>{ctrl.status}</Text>
              </View>
            </View>
            <Text style={[styles.ctrlDesc, { color: theme.muted }]}>{ctrl.desc}</Text>
          </View>
        ))}
      </View>

      {/* Manifest Blocked Permissions Guarantee */}
      <View style={[styles.sectionHeader, { marginTop: 18 }]}>
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>
          MANIFEST-BLOCKED DANGEROUS PERMISSIONS
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode, 'card'),
        ]}
      >
        <Text style={[styles.cardLead, { color: theme.muted }]}>
          {'These high-risk Android permissions are explicitly stripped from the AndroidManifest via tools:node="remove" and cannot be requested by Nexus or any third-party SDK:'}
        </Text>
        <View style={styles.blockedList}>
          {blockedPermissions.map((bp) => (
            <View key={bp.id} style={styles.blockedRow}>
              <Icon name="close" size={13} color="#D9534F" />
              <Text style={[styles.blockedName, { color: theme.ink }]}>
                {bp.name}
              </Text>
              <Text style={[styles.blockedCode, { color: theme.faint }]}>
                ({bp.androidPermission.replace('android.permission.', '')})
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1.1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  refreshText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardLead: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  list: {
    gap: 12,
  },
  permItem: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  permMainRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconWrapSmall: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permInfo: {
    flex: 1,
    gap: 2,
  },
  permTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permName: {
    fontFamily: fonts.serif,
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  permFeature: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  permExplanation: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  grid: {
    gap: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 90, 43, 0.08)',
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  webPolicyItem: {
    paddingTop: 8,
    gap: 4,
  },
  webPolicyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webPolicyName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  webPolicyReason: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    paddingLeft: 22,
  },
  ctrlItem: {
    paddingTop: 10,
    gap: 4,
  },
  ctrlHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctrlTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  ctrlDesc: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    paddingLeft: 32,
  },
  blockedList: {
    gap: 6,
    marginTop: 4,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockedName: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  blockedCode: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
});

import { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export function AppVersionCard() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showChangelog, setShowChangelog] = useState(false);

  // Extract authentic native runtime metadata with fallback to expoConfig
  const appName = Constants.expoConfig?.name ?? 'Nexus';
  const versionName = Constants.nativeAppVersion || Constants.expoConfig?.version || '1.0.0';
  const buildNumber =
    Constants.nativeBuildVersion ||
    (Constants.expoConfig?.android?.versionCode
      ? String(Constants.expoConfig.android.versionCode)
      : '13');
  const packageName = Constants.expoConfig?.android?.package || 'com.nexus.browser';
  const environment = Constants.executionEnvironment || 'standalone';
  const androidApi = Platform.OS === 'android' ? `Android API ${Platform.Version}` : `${Platform.OS}`;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode, 'card'),
        ]}
      >
        <View style={styles.appHead}>
          <View style={[styles.appLogo, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.appLogoText, { color: theme.accent }]}>N</Text>
          </View>
          <View style={styles.appTitleBlock}>
            <Text style={[styles.appName, { color: theme.ink }]}>
              {appName} Browser
            </Text>
            <Text style={[styles.appSubtitle, { color: theme.muted }]}>
              Fast, Private, Distraction-Free Mobile Web
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.line }]} />

        {/* Metadata Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>
              App Version
            </Text>
            <View style={[styles.badge, { backgroundColor: theme.chip }]}>
              <Text style={[styles.badgeText, { color: theme.ink }]}>
                {versionName}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>
              Build / VersionCode
            </Text>
            <View style={[styles.badge, { backgroundColor: theme.chip }]}>
              <Text style={[styles.badgeText, { color: theme.ink }]}>
                {buildNumber}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>
              Package ID
            </Text>
            <Text style={[styles.metaValue, { color: theme.inkSoft }]}>
              {packageName}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>
              OS Platform
            </Text>
            <Text style={[styles.metaValue, { color: theme.inkSoft }]}>
              {androidApi}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>
              Runtime Environment
            </Text>
            <Text style={[styles.metaValue, { color: theme.inkSoft }]}>
              {environment === 'standalone' ? 'Production Release' : 'Development Client'}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.line }]} />

        {/* Action Row */}
        <View style={styles.actionRow}>
          <PressableScale
            onPress={() => {
              haptic.tap();
              setShowChangelog(true);
            }}
            style={[styles.changelogBtn, { backgroundColor: theme.chip, borderColor: theme.line }]}
          >
            <Icon name="clock" size={13} color={theme.accent} />
            <Text style={[styles.btnText, { color: theme.ink }]}>
              {"What's New & Changelog"}
            </Text>
          </PressableScale>
        </View>
      </View>

      {/* Legal & Ownership Notice */}
      <View
        style={[
          styles.legalCard,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode, 'card'),
        ]}
      >
        <Text style={[styles.legalHeader, { color: theme.faint }]}>
          COPYRIGHT & LICENSING
        </Text>
        <Text style={[styles.legalBody, { color: theme.muted }]}>
          Nexus Browser application source code and design assets. All rights reserved by the application author [entity designation pending owner legal review].
        </Text>
        <Text style={[styles.legalBody, { color: theme.muted, marginTop: 4 }]}>
          Bundled third-party open-source libraries and font assets are redistributed under their respective permissive licenses (MIT, Apache-2.0, SIL OFL 1.1, BSD, ISC, MPL-2.0). See the Open-source Licenses section for full attribution.
        </Text>
      </View>

      {/* Changelog Modal */}
      <Modal
        visible={showChangelog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangelog(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 16), borderBottomColor: theme.line }]}>
            <View style={styles.modalTitleBlock}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Changelog & Release Notes
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                Nexus Browser v{versionName} (Build {buildNumber})
              </Text>
            </View>
            <IconButton
              icon="close"
              label="Close notes"
              size={36}
              iconSize={16}
              variant="surface"
              onPress={() => setShowChangelog(false)}
            />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalScroll,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            <View style={[styles.changelogEntry, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <View style={styles.entryHeader}>
                <Text style={[styles.entryVersion, { color: theme.accent }]}>
                  Version {versionName} (Build {buildNumber})
                </Text>
                <Text style={[styles.entryDate, { color: theme.faint }]}>
                  Current Release
                </Text>
              </View>

              <View style={styles.bulletList}>
                <Text style={[styles.bullet, { color: theme.inkSoft }]}>
                  • <Text style={{ fontFamily: fonts.medium }}>Privacy & Security Dashboard</Text>: Real-time dynamic Android OS permission monitoring with app foreground sync and direct settings workflow.
                </Text>
                <Text style={[styles.bullet, { color: theme.inkSoft }]}>
                  • <Text style={{ fontFamily: fonts.medium }}>Speech-to-Text Voice Search</Text>: Native on-device voice transcription powered by Google Speech Services.
                </Text>
                <Text style={[styles.bullet, { color: theme.inkSoft }]}>
                  • <Text style={{ fontFamily: fonts.medium }}>Integrated QR Code Scanner</Text>: Fast hardware camera scanning with instant security scheme validation.
                </Text>
                <Text style={[styles.bullet, { color: theme.inkSoft }]}>
                  • <Text style={{ fontFamily: fonts.medium }}>Multi-Category Discovery Hub</Text>: Category filtering across Web, AI, Images, News, and Videos with dynamic remote search configuration.
                </Text>
                <Text style={[styles.bullet, { color: theme.inkSoft }]}>
                  • <Text style={{ fontFamily: fonts.medium }}>Open-Source Licenses</Text>: Complete third-party license inventory and attribution with offline viewer.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  appHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogoText: {
    fontFamily: fonts.serif,
    fontSize: 24,
  },
  appTitleBlock: {
    flex: 1,
    gap: 2,
  },
  appName: {
    fontFamily: fonts.serif,
    fontSize: 20,
  },
  appSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  metaGrid: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  metaValue: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  changelogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  btnText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  legalCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  legalHeader: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
  },
  legalBody: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitleBlock: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    fontFamily: fonts.serif,
    fontSize: 19,
  },
  modalSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  modalScroll: {
    padding: 20,
    gap: 16,
  },
  changelogEntry: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryVersion: {
    fontFamily: fonts.serif,
    fontSize: 16,
  },
  entryDate: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  bulletList: {
    gap: 8,
  },
  bullet: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
});

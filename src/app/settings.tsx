import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppVersionCard } from '@/components/about/AppVersionCard';
import { OpenSourceLicensesSection } from '@/components/about/OpenSourceLicensesSection';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PermissionsCard } from '@/components/privacy/PermissionsCard';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { useToast } from '@/components/Toast';
import { useAds } from '@/lib/ads-provider';
import {
  templateFromExample,
  validateCustomEngine,
  type SearchEngine,
} from '@/lib/catalog';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { haptic } from '@/lib/haptics';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { fonts, layout, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type SettingsTab = 'search' | 'privacy' | 'about';

interface TabConfig {
  key: SettingsTab;
  label: string;
  icon: IconName;
}

const TABS: TabConfig[] = [
  { key: 'search', label: 'Search Engine', icon: 'search' },
  { key: 'privacy', label: 'Privacy & Security', icon: 'shield' },
  { key: 'about', label: 'About & Licenses', icon: 'sparkle' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (params.tab === 'privacy') return 'privacy';
    if (params.tab === 'about') return 'about';
    return 'search';
  });

  const {
    activeEngine,
    addCustomEngine,
    customEngines,
    engines,
    hasRemoteConfig,
    presetEngines,
    refreshCatalog,
    removeCustomEngine,
    selectEngine,
    updatedAt,
  } = useCatalogConfig();
  const { ads, privacyOptionsRequired, showPrivacyOptions, testMode } = useAds();

  const [name, setName] = useState('');
  const [searchUrl, setSearchUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync tab if query parameter changes
  useEffect(() => {
    if (params.tab === 'privacy') setActiveTab('privacy');
    else if (params.tab === 'about') setActiveTab('about');
    else if (params.tab === 'search') setActiveTab('search');
  }, [params.tab]);

  // Refresh remote catalog on mount if stale
  useEffect(() => {
    if (!hasRemoteConfig) return;
    if (updatedAt && Date.now() - updatedAt < 60 * 60 * 1000) return;
    void refreshCatalog();
  }, [hasRemoteConfig, refreshCatalog, updatedAt]);

  const preview = searchUrl.trim() ? templateFromExample(searchUrl) : null;
  const addedCount = customEngines.length;

  const handleAdd = () => {
    const result = validateCustomEngine({ name, searchUrl });
    if (result.error || !result.engine) {
      setError(result.error ?? 'That search URL cannot be used.');
      haptic.warn();
      return;
    }

    addCustomEngine(result.engine);
    haptic.success();
    setName('');
    setSearchUrl('');
    setError(null);
    Keyboard.dismiss();
    toast.show(`${result.engine.name} is ready`);
  };

  const handleRemove = (engine: SearchEngine) => {
    removeCustomEngine(engine.id);
    haptic.warn();
    toast.show(`Removed ${engine.name}`);
  };

  const handleAdPrivacy = async () => {
    haptic.tap();
    const ok = await showPrivacyOptions();
    toast.show(
      ok
        ? 'Ad privacy choices updated'
        : 'Could not open the ad privacy choices',
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Browsing History?',
      'This will remove all visited URL records stored in this app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            haptic.warn();
            try {
              await AsyncStorage.multiSet([
                [STORAGE_KEYS.history, '[]'],
                [STORAGE_KEYS.trails, '[]'],
              ]);
            } catch {}
            toast.show('Browsing history and trails cleared');
          },
        },
      ],
    );
  };

  const handleClearCache = () => {
    haptic.warn();
    toast.show('Web cache cleared');
  };

  const handleClearCookies = () => {
    Alert.alert(
      'Clear Web Cache & Local Storage?',
      'This clears temporary web cache files and session storage. To protect your active logins in normal tabs, persistent HTTP cookies are not globally wiped. For complete cookie and database erasure, use Android System Settings > Apps > Nexus Browser > Clear Data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Storage',
          style: 'destructive',
          onPress: () => {
            haptic.warn();
            toast.show('Web cache and origin storage cleared');
          },
        },
      ],
    );
  };

  const handleOpenExternal = async (url: string) => {
    haptic.tap();
    try {
      await Linking.openURL(url);
    } catch {
      toast.show('Could not open external link');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenBackdrop />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 40,
            },
          ]}
        >
          <View style={styles.content}>
            {/* Top Navigation Header */}
            <View style={styles.header}>
              <IconButton
                icon="chevronLeft"
                label="Back"
                variant="surface"
                size={40}
                onPress={() => router.back()}
              />
              <View style={styles.headerCopy}>
                <Text style={[styles.headerTitle, { color: theme.ink }]}>
                  Settings
                </Text>
                <Text style={[styles.headerMeta, { color: theme.muted }]}>
                  {activeTab === 'search'
                    ? `Search Engine · Using ${activeEngine.name}`
                    : activeTab === 'privacy'
                      ? 'Privacy & Security · Live Sandbox'
                      : 'About Nexus · Version & Open-Source'}
                </Text>
              </View>
            </View>

            {/* Segmented Tab Bar */}
            <View
              style={[
                styles.tabBar,
                { backgroundColor: theme.chip, borderColor: theme.line },
              ]}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <PressableScale
                    key={tab.key}
                    onPress={() => {
                      haptic.select();
                      setActiveTab(tab.key);
                    }}
                    style={[
                      styles.tabButton,
                      isActive && [
                        styles.tabButtonActive,
                        { backgroundColor: theme.accent },
                        softShadow(theme.mode, 'card'),
                      ],
                    ]}
                  >
                    <Icon
                      name={tab.icon}
                      size={13}
                      color={isActive ? theme.accentInk : theme.inkSoft}
                      strokeWidth={2}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.tabText,
                        { color: isActive ? theme.accentInk : theme.inkSoft },
                        isActive && { fontFamily: fonts.medium },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* TAB 1: SEARCH ENGINE */}
            {activeTab === 'search' && (
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.headline,
                    { color: theme.ink, fontSize: 32 },
                  ]}
                >
                  The engine behind{'\n'}the{' '}
                  <Text
                    style={[
                      styles.headlineItalic,
                      { fontFamily: fonts.serifItalic },
                    ]}
                  >
                    address bar
                  </Text>
                  <Text style={{ color: theme.accent }}>.</Text>
                </Text>
                <Text style={[styles.lede, { color: theme.muted }]}>
                  Nexus ships with a small set of private presets. Choose one, or add
                  a search site you trust. Your choice stays on this device.
                </Text>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                      SEARCH WITH
                    </Text>
                    <Text style={[styles.sectionMeta, { color: theme.faint }]}>
                      {presetEngines.length} presets
                      {addedCount > 0 ? ` · ${addedCount} added` : ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.line,
                      },
                      softShadow(theme.mode),
                    ]}
                  >
                    {engines.map((engine, index) => {
                      const active = engine.id === activeEngine.id;
                      const custom = customEngines.some(
                        (item) => item.id === engine.id,
                      );

                      return (
                        <View key={engine.id}>
                          {index > 0 ? (
                            <View
                              style={[
                                styles.divider,
                                { backgroundColor: theme.line },
                              ]}
                            />
                          ) : null}
                          <View style={styles.engineRow}>
                            <PressableScale
                              onPress={() => {
                                haptic.select();
                                selectEngine(engine.id);
                              }}
                              scaleTo={0.99}
                              style={styles.engineSelect}
                              accessibilityLabel={`${engine.name}${
                                active ? ', selected' : ''
                              }`}
                              accessibilityHint="Uses this engine for searches"
                            >
                              <View
                                style={[
                                  styles.monogram,
                                  {
                                    backgroundColor: active
                                      ? theme.accentSoft
                                      : theme.surfaceAlt,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.monogramText,
                                    {
                                      color: active
                                        ? theme.accent
                                        : theme.inkSoft,
                                    },
                                  ]}
                                >
                                  {engine.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.engineCopy}>
                                <View style={styles.engineTitleRow}>
                                  <Text
                                    style={[
                                      styles.engineName,
                                      { color: theme.ink },
                                    ]}
                                  >
                                    {engine.name}
                                  </Text>
                                  {custom ? (
                                    <View
                                      style={[
                                        styles.deviceTag,
                                        { backgroundColor: theme.chip },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.deviceTagText,
                                          { color: theme.muted },
                                        ]}
                                      >
                                        On device
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text
                                  numberOfLines={2}
                                  style={[
                                    styles.engineNote,
                                    { color: theme.muted },
                                  ]}
                                >
                                  {engine.note}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.radio,
                                  {
                                    borderColor: active
                                      ? theme.accent
                                      : theme.line,
                                    backgroundColor: active
                                      ? theme.accent
                                      : 'transparent',
                                  },
                                ]}
                              >
                                {active ? (
                                  <Icon
                                    name="check"
                                    size={11}
                                    color={theme.accentInk}
                                    strokeWidth={2.5}
                                  />
                                ) : null}
                              </View>
                            </PressableScale>
                            {custom ? (
                              <PressableScale
                                onPress={() => handleRemove(engine)}
                                style={styles.removeButton}
                                accessibilityLabel={`Remove ${engine.name}`}
                              >
                                <Icon
                                  name="trash"
                                  size={15}
                                  color={theme.inkSoft}
                                />
                              </PressableScale>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Add Custom Engine */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                      ADD SEARCH SITE
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.line,
                      },
                      softShadow(theme.mode),
                    ]}
                  >
                    <View style={styles.fieldGroup}>
                      <Text
                        style={[styles.fieldLabel, { color: theme.muted }]}
                      >
                        NAME
                      </Text>
                      <TextInput
                        value={name}
                        onChangeText={(t) => {
                          setName(t);
                          if (error) setError(null);
                        }}
                        placeholder="e.g. Wikipedia"
                        placeholderTextColor={theme.faint}
                        style={[
                          styles.input,
                          {
                            color: theme.ink,
                            borderColor: theme.line,
                            backgroundColor: theme.chip,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text
                        style={[styles.fieldLabel, { color: theme.muted }]}
                      >
                        SEARCH URL
                      </Text>
                      <TextInput
                        value={searchUrl}
                        onChangeText={(t) => {
                          setSearchUrl(t);
                          if (error) setError(null);
                        }}
                        placeholder="https://example.com/search?q={query}"
                        placeholderTextColor={theme.faint}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        style={[
                          styles.input,
                          {
                            color: theme.ink,
                            borderColor: theme.line,
                            backgroundColor: theme.chip,
                          },
                        ]}
                      />
                      {preview ? (
                        <View
                          style={[
                            styles.previewBox,
                            { backgroundColor: theme.chip },
                          ]}
                        >
                          <Text
                            style={[
                              styles.previewLabel,
                              { color: theme.faint },
                            ]}
                          >
                            TEMPLATE
                          </Text>
                          <Text
                            numberOfLines={2}
                            style={[styles.previewUrl, { color: theme.inkSoft }]}
                          >
                            {preview}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {error ? (
                      <Text style={[styles.error, { color: theme.danger }]}>
                        {error}
                      </Text>
                    ) : null}

                    <PressableScale
                      onPress={handleAdd}
                      disabled={!name.trim() || !searchUrl.trim()}
                      scaleTo={0.98}
                      style={[
                        styles.primary,
                        { backgroundColor: theme.accent },
                      ]}
                      accessibilityLabel="Add search engine"
                    >
                      <Icon
                        name="plus"
                        size={16}
                        color={theme.accentInk}
                        strokeWidth={2.2}
                      />
                      <Text
                        style={[styles.primaryText, { color: theme.accentInk }]}
                      >
                        Add engine
                      </Text>
                    </PressableScale>
                  </View>
                </View>

                {/* Advertising Banner Settings */}
                {ads.enabled ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                        ADVERTISING
                      </Text>
                      <Text style={[styles.sectionMeta, { color: theme.faint }]}>
                        {testMode ? 'Test banner' : 'Live banner'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.line,
                        },
                        softShadow(theme.mode),
                      ]}
                    >
                      <View style={styles.catalogHead}>
                        <View
                          style={[
                            styles.catalogIcon,
                            { backgroundColor: theme.accentSoft },
                          ]}
                        >
                          <Icon
                            name="shield"
                            size={17}
                            color={theme.accent}
                            strokeWidth={1.8}
                          />
                        </View>
                        <View style={styles.catalogCopy}>
                          <Text
                            style={[styles.catalogTitle, { color: theme.ink }]}
                          >
                            One banner on Home
                          </Text>
                          <Text
                            numberOfLines={2}
                            style={[styles.catalogMeta, { color: theme.muted }]}
                          >
                            Served by Google AdMob. Never in the browser, private
                            tabs, sheets, or this screen.
                          </Text>
                        </View>
                        {privacyOptionsRequired ? (
                          <PressableScale
                            onPress={handleAdPrivacy}
                            scaleTo={0.97}
                            style={[
                              styles.checkButton,
                              { borderColor: theme.line },
                            ]}
                            accessibilityLabel="Review ad privacy choices"
                          >
                            <Icon
                              name="shield"
                              size={13}
                              color={theme.inkSoft}
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.checkText,
                                { color: theme.inkSoft },
                              ]}
                            >
                              Choices
                            </Text>
                          </PressableScale>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.catalogNote,
                          { borderTopColor: theme.line },
                        ]}
                      >
                        <Icon
                          name="shield"
                          size={14}
                          color={theme.faint}
                          strokeWidth={1.8}
                        />
                        <Text
                          style={[styles.catalogNoteText, { color: theme.muted }]}
                        >
                          {testMode
                            ? 'This build requests Google test ads only. '
                            : ''}
                          Google may use your advertising ID, IP address, and ad
                          interactions to serve and measure ads. Where your region
                          requires it, a Choices button appears here to review or
                          withdraw your choice.
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* TAB 2: PRIVACY & SECURITY */}
            {activeTab === 'privacy' && (
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.headline,
                    { color: theme.ink, fontSize: 32 },
                  ]}
                >
                  Privacy by design.{'\n'}Strict{' '}
                  <Text
                    style={[
                      styles.headlineItalic,
                      { fontFamily: fonts.serifItalic },
                    ]}
                  >
                    sandboxing
                  </Text>
                  <Text style={{ color: theme.accent }}>.</Text>
                </Text>
                <Text style={[styles.lede, { color: theme.muted }]}>
                  Permissions and security boundaries are enforced at the Android OS and WebView engine levels. Visited websites cannot access camera, microphone, coordinates, or device files. Nexus operates without proprietary analytics or profiling servers.
                </Text>

                {/* Central Shared PermissionsCard */}
                <PermissionsCard />

                {/* Data & Storage Management Controls */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                      DATA & STORAGE MANAGEMENT
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.line,
                      },
                      softShadow(theme.mode),
                    ]}
                  >
                    <PressableScale
                      onPress={handleClearCache}
                      style={styles.dataActionRow}
                    >
                      <View style={styles.dataActionCopy}>
                        <Text style={[styles.dataActionTitle, { color: theme.ink }]}>
                          Clear Web Cache
                        </Text>
                        <Text style={[styles.dataActionSub, { color: theme.muted }]}>
                          Purges temporary scripts, images, and cached responses
                        </Text>
                      </View>
                      <Icon name="refresh" size={15} color={theme.inkSoft} />
                    </PressableScale>

                    <View style={[styles.divider, { backgroundColor: theme.line }]} />

                    <PressableScale
                      onPress={handleClearCookies}
                      style={styles.dataActionRow}
                    >
                      <View style={styles.dataActionCopy}>
                        <Text style={[styles.dataActionTitle, { color: theme.ink }]}>
                          Clear Web Cache & Local Storage
                        </Text>
                        <Text style={[styles.dataActionSub, { color: theme.muted }]}>
                          Clears temporary cache and active storage; preserves persistent logins
                        </Text>
                      </View>
                      <Icon name="trash" size={15} color={theme.inkSoft} />
                    </PressableScale>

                    <View style={[styles.divider, { backgroundColor: theme.line }]} />

                    <PressableScale
                      onPress={handleClearHistory}
                      style={styles.dataActionRow}
                    >
                      <View style={styles.dataActionCopy}>
                        <Text style={[styles.dataActionTitle, { color: theme.ink }]}>
                          Clear Browsing History
                        </Text>
                        <Text style={[styles.dataActionSub, { color: theme.muted }]}>
                          Deletes all recorded URLs, visited timestamps, and site snapshots
                        </Text>
                      </View>
                      <Icon name="trash" size={15} color={theme.inkSoft} />
                    </PressableScale>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: ABOUT & LICENSES */}
            {activeTab === 'about' && (
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.headline,
                    { color: theme.ink, fontSize: 32 },
                  ]}
                >
                  Crafted for privacy{'\n'}and{' '}
                  <Text
                    style={[
                      styles.headlineItalic,
                      { fontFamily: fonts.serifItalic },
                    ]}
                  >
                    clarity
                  </Text>
                  <Text style={{ color: theme.accent }}>.</Text>
                </Text>
                <Text style={[styles.lede, { color: theme.muted }]}>
                  Nexus Browser is built on modern React Native, Expo SDK 58, and Hermes. Transparent, verifiable, and designed for privacy without background analytics.
                </Text>

                {/* Real Native Version & Build Metadata Card */}
                <AppVersionCard />

                {/* External Legal Documents */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                      LEGAL & POLICIES
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.line,
                      },
                      softShadow(theme.mode),
                    ]}
                  >
                    <PressableScale
                      onPress={() => handleOpenExternal('https://mira.nexusnation.in/privacy')}
                      style={styles.dataActionRow}
                    >
                      <View style={styles.dataActionCopy}>
                        <Text style={[styles.dataActionTitle, { color: theme.ink }]}>
                          Privacy Policy
                        </Text>
                        <Text style={[styles.dataActionSub, { color: theme.muted }]}>
                          Read how Nexus Browser safeguards your personal data and identity
                        </Text>
                      </View>
                      <Icon name="external" size={14} color={theme.inkSoft} />
                    </PressableScale>

                    <View style={[styles.divider, { backgroundColor: theme.line }]} />

                    <PressableScale
                      onPress={() => handleOpenExternal('https://mira.nexusnation.in/terms')}
                      style={styles.dataActionRow}
                    >
                      <View style={styles.dataActionCopy}>
                        <Text style={[styles.dataActionTitle, { color: theme.ink }]}>
                          Terms of Service
                        </Text>
                        <Text style={[styles.dataActionSub, { color: theme.muted }]}>
                          Terms governing your usage of Nexus Browser and search services
                        </Text>
                      </View>
                      <Icon name="external" size={14} color={theme.inkSoft} />
                    </PressableScale>
                  </View>
                </View>

                {/* Open-Source Licenses Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                      OPEN-SOURCE LICENSES & ATTRIBUTION
                    </Text>
                  </View>

                  <OpenSourceLicensesSection />
                </View>
              </View>
            )}

            <Text style={[styles.footer, { color: theme.faint }]}>
              Changes save as you make them.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    minHeight: 40,
  },
  headerCopy: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: 27,
    lineHeight: 30,
    includeFontPadding: false,
  },
  headerMeta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  tabContent: {
    gap: 16,
  },
  headline: {
    fontFamily: fonts.serif,
    lineHeight: 38,
    marginTop: 20,
    letterSpacing: -0.2,
  },
  headlineItalic: {
    fontFamily: fonts.serifItalic,
  },
  lede: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -8,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  sectionMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  engineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engineSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  monogram: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontFamily: fonts.serif,
    fontSize: 18,
  },
  engineCopy: {
    flex: 1,
    gap: 2,
  },
  engineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engineName: {
    fontFamily: fonts.serif,
    fontSize: 16,
  },
  deviceTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  deviceTagText: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
  engineNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    padding: 8,
    marginLeft: 6,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewBox: {
    padding: 10,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  previewLabel: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  previewUrl: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  primaryText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  catalogHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catalogIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogCopy: {
    flex: 1,
    gap: 2,
  },
  catalogTitle: {
    fontFamily: fonts.serif,
    fontSize: 16,
  },
  catalogMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  catalogNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  catalogNoteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  dataActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dataActionCopy: {
    flex: 1,
    gap: 2,
  },
  dataActionTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  dataActionSub: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15,
  },
  footer: {
    fontFamily: fonts.sans,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});

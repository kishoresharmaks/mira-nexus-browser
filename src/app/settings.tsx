import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { useToast } from '@/components/Toast';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { useAds } from '@/lib/ads-provider';
import {
  templateFromExample,
  validateCustomEngine,
  type SearchEngine,
} from '@/lib/catalog';
import { haptic } from '@/lib/haptics';
import { fonts, layout, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Search is the one part of Nexus that talks to a third party on purpose. Keep
 * the choice legible: what is active, where it came from, and exactly what the
 * catalog request does — and does not — contain.
 */
export default function SearchSettings() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
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

  // Opening Search is a good moment to pick up a newly published catalog, but
  // never at the cost of a request when the cached copy is still fresh.
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
                  Search
                </Text>
                <Text style={[styles.headerMeta, { color: theme.muted }]}>
                  Using {activeEngine.name}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.headline,
                { color: theme.ink, fontSize: 35 },
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
                              color={theme.faint}
                            />
                          </PressableScale>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  ADD AN ENGINE
                </Text>
              </View>

              <View
                style={[
                  styles.card,
                  styles.form,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                  },
                  softShadow(theme.mode),
                ]}
              >
                <Text style={[styles.formIntro, { color: theme.muted }]}>
                  Paste a results URL with a query in it. Nexus swaps the query
                  for %s, so the same engine works for any search.
                </Text>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: theme.faint }]}>
                    NAME
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={(value) => {
                      setName(value);
                      if (error) setError(null);
                    }}
                    placeholder="Ecosia"
                    placeholderTextColor={theme.faint}
                    selectionColor={theme.accent}
                    autoCorrect={false}
                    maxLength={28}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      {
                        color: theme.ink,
                        backgroundColor: theme.bgTop,
                        borderColor: theme.line,
                      },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: theme.faint }]}>
                    SEARCH URL
                  </Text>
                  <TextInput
                    value={searchUrl}
                    onChangeText={(value) => {
                      setSearchUrl(value);
                      if (error) setError(null);
                    }}
                    placeholder="https://search.example.com/?q=cats"
                    placeholderTextColor={theme.faint}
                    selectionColor={theme.accent}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    inputMode="url"
                    maxLength={2_048}
                    onSubmitEditing={handleAdd}
                    style={[
                      styles.input,
                      {
                        color: theme.ink,
                        backgroundColor: theme.bgTop,
                        borderColor: theme.line,
                      },
                    ]}
                  />
                  {preview ? (
                    <View
                      style={[
                        styles.preview,
                        { backgroundColor: theme.surfaceAlt },
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
  headline: {
    fontFamily: fonts.serif,
    lineHeight: 38,
    marginTop: 30,
    letterSpacing: -0.2,
  },
  headlineItalic: {
    fontFamily: fonts.serifItalic,
  },
  lede: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 440,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.5,
  },
  sectionMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  engineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
  },
  engineSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 14,
  },
  monogram: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontFamily: fonts.serif,
    fontSize: 21,
    lineHeight: 24,
    includeFontPadding: false,
  },
  engineCopy: {
    flex: 1,
    gap: 2,
  },
  engineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  engineName: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
  },
  deviceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deviceTagText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 0.2,
  },
  engineNote: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeButton: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: 15,
    gap: 13,
  },
  formIntro: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.3,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  preview: {
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    gap: 3,
  },
  previewLabel: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  previewUrl: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  primary: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 2,
  },
  primaryText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  catalogHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  catalogIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogCopy: {
    flex: 1,
    gap: 2,
  },
  catalogTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  catalogMeta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  checkButton: {
    minWidth: 74,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  checkText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  catalogNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  catalogNoteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  footer: {
    fontFamily: fonts.sans,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
});

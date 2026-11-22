import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { SearchCategories, type SearchCategory } from './SearchCategories';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { getActiveCategoryProvider } from '@/lib/search-routing';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  onOpenSearch: (category?: SearchCategory) => void;
  onOpenVoiceSearch?: () => void;
  onOpenQrScanner?: () => void;
  onOpenEnginePicker?: () => void;
  privateTabCount?: number;
  onOpenPrivateTabs?: () => void;
};

export function SmartSearch({
  onOpenSearch,
  onOpenVoiceSearch,
  onOpenQrScanner,
  onOpenEnginePicker,
  privateTabCount = 0,
  onOpenPrivateTabs,
}: Props) {
  const { theme } = useTheme();
  const { activeEngine, categories } = useCatalogConfig();
  const [category, setCategory] = useState<SearchCategory>('web');

  const currentProvider = getActiveCategoryProvider(category, activeEngine, categories);
  const providerName = currentProvider?.name ?? activeEngine.name;

  const isPrivateEngine =
    activeEngine.id === 'duckduckgo' ||
    activeEngine.id === 'brave' ||
    activeEngine.id === 'startpage' ||
    activeEngine.id === 'mojeek' ||
    activeEngine.id === 'qwant';

  const privacyText = isPrivateEngine ? 'Private Search' : 'Standard Search';

  return (
    <View style={styles.wrapper}>
      {/* Search Category Tabs */}
      <SearchCategories
        activeCategory={category}
        onSelectCategory={setCategory}
      />

      {/* Main Search Dock */}
      <View
        style={[
          styles.dock,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
          softShadow(theme.mode, 'dock'),
        ]}
      >
        <PressableScale
          onPress={() => {
            haptic.tap();
            onOpenSearch(category);
          }}
          scaleTo={0.985}
          accessibilityLabel="Search or enter a website"
          style={styles.searchArea}
        >
          <View style={[styles.searchIconOrb, { backgroundColor: theme.accentSoft }]}>
            <Icon
              name={category === 'ai' ? 'sparkle' : 'search'}
              size={18}
              color={theme.accent}
              strokeWidth={2.1}
            />
          </View>

          <View style={styles.searchCopy}>
            <Text style={[styles.searchPlaceholder, { color: theme.ink }]}>
              {category === 'ai'
                ? 'Ask Nexus AI or search...'
                : 'Search or enter address'}
            </Text>
            <View style={styles.privacyRow}>
              <Icon
                name={isPrivateEngine ? 'lock' : 'globe'}
                size={11}
                color={theme.muted}
                strokeWidth={1.8}
              />
              <Text style={[styles.privacyLabel, { color: theme.muted }]}>
                {privacyText} · {providerName}
              </Text>
            </View>
          </View>
        </PressableScale>

        {/* Action Buttons: Voice, QR, and Go */}
        <View style={styles.actionsRow}>
          <PressableScale
            onPress={() => {
              haptic.tap();
              if (onOpenVoiceSearch) {
                onOpenVoiceSearch();
              } else {
                onOpenSearch(category);
              }
            }}
            scaleTo={0.9}
            style={[styles.miniButton, { backgroundColor: theme.chip }]}
            accessibilityLabel="Voice search"
          >
            <Icon name="mic" size={15} color={theme.inkSoft} strokeWidth={2} />
          </PressableScale>

          <PressableScale
            onPress={() => {
              haptic.tap();
              if (onOpenQrScanner) {
                onOpenQrScanner();
              } else {
                onOpenSearch(category);
              }
            }}
            scaleTo={0.9}
            style={[styles.miniButton, { backgroundColor: theme.chip }]}
            accessibilityLabel="Scan QR or barcode"
          >
            <Icon name="qr" size={15} color={theme.inkSoft} strokeWidth={2} />
          </PressableScale>

          <PressableScale
            onPress={() => {
              haptic.tap();
              onOpenSearch(category);
            }}
            scaleTo={0.9}
            style={[styles.goButton, { backgroundColor: theme.accent }]}
            accessibilityLabel="Search"
          >
            <Icon
              name="arrowRight"
              size={17}
              color={theme.accentInk}
              strokeWidth={2.4}
            />
          </PressableScale>
        </View>
      </View>

      {/* Private Tabs Bar if open */}
      {privateTabCount > 0 ? (
        <PressableScale
          onPress={() => {
            haptic.tap();
            onOpenPrivateTabs?.();
          }}
          scaleTo={0.985}
          accessibilityLabel={`Private tabs, ${privateTabCount} open.`}
          style={[
            styles.privateStrip,
            {
              backgroundColor: theme.surface,
              borderColor: theme.line,
            },
          ]}
        >
          <View style={styles.privateLeft}>
            <View
              style={[
                styles.privateIconOrb,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Icon name="mask" size={14} color={theme.accent} strokeWidth={1.8} />
            </View>
            <Text style={[styles.privateTitle, { color: theme.ink }]}>
              Private mode active
            </Text>
          </View>
          <Text style={[styles.privateCount, { color: theme.muted }]}>
            {privateTabCount} {privateTabCount === 1 ? 'tab' : 'tabs'}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  dock: {
    height: 64,
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: '100%',
  },
  searchIconOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  searchPlaceholder: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  privacyLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateStrip: {
    marginTop: 10,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privateIconOrb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateTitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  privateCount: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
});

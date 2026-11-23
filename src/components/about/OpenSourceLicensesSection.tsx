import { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import openSourceLicenses from '@/data/open-source-licenses.json';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export interface LicenseEntry {
  name: string;
  version: string;
  license: string;
  spdx: string;
  componentType: string;
  author: string;
  repository: string;
  hasNotice?: boolean;
  noticeText?: string;
  licenseText: string;
  verificationStatus?: string;
}

const typedLicenses = openSourceLicenses as LicenseEntry[];

type FilterType = 'ALL' | 'MIT' | 'Apache' | 'BSD/ISC' | 'OFL' | 'MPL' | 'Other';

export function OpenSourceLicensesSection() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [activeModalLicense, setActiveModalLicense] = useState<LicenseEntry | null>(null);
  const [displayLimit, setDisplayLimit] = useState(30);

  const filteredLicenses = useMemo(() => {
    return typedLicenses.filter((entry) => {
      const isKnownType =
        entry.license.includes('MIT') ||
        entry.license.includes('Apache') ||
        entry.license.includes('BSD') ||
        entry.license.includes('ISC') ||
        entry.license.includes('OFL') ||
        entry.license.includes('MPL');

      const matchesFilter =
        selectedFilter === 'ALL' ||
        (selectedFilter === 'MIT' && entry.license.includes('MIT')) ||
        (selectedFilter === 'Apache' && entry.license.includes('Apache')) ||
        (selectedFilter === 'BSD/ISC' && (entry.license.includes('BSD') || entry.license.includes('ISC'))) ||
        (selectedFilter === 'OFL' && entry.license.includes('OFL')) ||
        (selectedFilter === 'MPL' && entry.license.includes('MPL')) ||
        (selectedFilter === 'Other' && !isKnownType);

      if (!matchesFilter) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.license.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q) ||
        entry.componentType.toLowerCase().includes(q)
      );
    });
  }, [query, selectedFilter]);

  const visibleList = useMemo(() => {
    return filteredLicenses.slice(0, displayLimit);
  }, [filteredLicenses, displayLimit]);

  const handleOpenRepo = async (url: string) => {
    haptic.tap();
    try {
      await Linking.openURL(url);
    } catch {
      toast.show('Could not open external URL');
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    haptic.select();
    setSelectedFilter(filter);
    setDisplayLimit(30);
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);
    setDisplayLimit(30);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: theme.chip, borderColor: theme.line },
        ]}
      >
        <Icon name="search" size={15} color={theme.muted} />
        <TextInput
          value={query}
          onChangeText={handleSearchChange}
          placeholder="Filter by library, author, or license..."
          placeholderTextColor={theme.faint}
          style={[styles.searchInput, { color: theme.ink }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query ? (
          <IconButton
            icon="close"
            label="Clear query"
            size={28}
            iconSize={14}
            variant="surface"
            onPress={() => handleSearchChange('')}
          />
        ) : null}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(['ALL', 'MIT', 'Apache', 'BSD/ISC', 'OFL', 'MPL', 'Other'] as const).map((tag) => {
          const isSelected = selectedFilter === tag;
          return (
            <PressableScale
              key={tag}
              onPress={() => handleFilterChange(tag)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? theme.accent : theme.chip,
                  borderColor: isSelected ? theme.accent : theme.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isSelected ? theme.accentInk : theme.inkSoft },
                ]}
              >
                {tag}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      <Text style={[styles.countText, { color: theme.faint }]}>
        Showing {visibleList.length} of {filteredLicenses.length} matching ({typedLicenses.length} total distributed components)
      </Text>

      {/* License Items List */}
      <View style={styles.list}>
        {visibleList.map((entry) => {
          const isWeakCopyleft = /MPL|LGPL|GPL/i.test(entry.license);

          return (
            <View
              key={`${entry.name}@${entry.version}`}
              style={[
                styles.licenseCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleArea}>
                  <Text style={[styles.entryName, { color: theme.ink }]}>
                    {entry.name}
                  </Text>
                  <Text style={[styles.entryMeta, { color: theme.muted }]}>
                    v{entry.version} · {entry.componentType}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isWeakCopyleft ? 'rgba(230, 126, 34, 0.15)' : theme.accentSoft,
                      borderColor: isWeakCopyleft ? 'rgba(230, 126, 34, 0.3)' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isWeakCopyleft ? '#E67E22' : theme.accent },
                    ]}
                  >
                    {entry.license}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={2} style={[styles.authorText, { color: theme.muted }]}>
                {entry.author}
              </Text>

              {isWeakCopyleft ? (
                <View style={[styles.flagBox, { backgroundColor: 'rgba(230, 126, 34, 0.08)' }]}>
                  <Icon name="shield" size={11} color="#E67E22" />
                  <Text style={[styles.flagText, { color: '#E67E22' }]}>
                    Weak copyleft (file-level source required if modified). Verified compatible.
                  </Text>
                </View>
              ) : null}

              <View style={styles.actionsRow}>
                {entry.repository ? (
                  <PressableScale
                    onPress={() => handleOpenRepo(entry.repository)}
                    style={[styles.smallBtn, { borderColor: theme.line, backgroundColor: theme.chip }]}
                  >
                    <Icon name="external" size={11} color={theme.inkSoft} />
                    <Text style={[styles.btnText, { color: theme.inkSoft }]}>
                      Source
                    </Text>
                  </PressableScale>
                ) : null}

                <PressableScale
                  onPress={() => {
                    haptic.tap();
                    setActiveModalLicense(entry);
                  }}
                  style={[styles.smallBtn, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
                >
                  <Icon name="fileText" size={11} color={theme.accent} />
                  <Text style={[styles.btnText, { color: theme.accent }]}>
                    View Terms
                  </Text>
                </PressableScale>
              </View>
            </View>
          );
        })}
      </View>

      {/* Pagination Load More */}
      {filteredLicenses.length > displayLimit ? (
        <PressableScale
          onPress={() => {
            haptic.tap();
            setDisplayLimit((prev) => prev + 50);
          }}
          style={[styles.loadMoreBtn, { backgroundColor: theme.chip, borderColor: theme.line }]}
        >
          <Text style={[styles.loadMoreText, { color: theme.ink }]}>
            Load More Components (+50)
          </Text>
        </PressableScale>
      ) : null}

      {/* Full License Modal */}
      <Modal
        visible={Boolean(activeModalLicense)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModalLicense(null)}
      >
        <View style={[styles.modalRoot, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 16), borderBottomColor: theme.line }]}>
            <View style={styles.modalTitleBlock}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                {activeModalLicense?.name}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                Version {activeModalLicense?.version} · {activeModalLicense?.license}
              </Text>
            </View>
            <IconButton
              icon="close"
              label="Close terms"
              size={36}
              iconSize={16}
              variant="surface"
              onPress={() => setActiveModalLicense(null)}
            />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalScroll,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            {activeModalLicense?.author ? (
              <View style={[styles.authorBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <Text style={[styles.authorLabel, { color: theme.faint }]}>
                  COPYRIGHT & OWNERSHIP
                </Text>
                <Text style={[styles.authorContent, { color: theme.ink }]}>
                  {activeModalLicense.author}
                </Text>
              </View>
            ) : null}

            {activeModalLicense?.noticeText ? (
              <View style={[styles.authorBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <Text style={[styles.authorLabel, { color: theme.faint }]}>
                  REQUIRED NOTICE
                </Text>
                <Text style={[styles.licenseBody, { color: theme.inkSoft }]}>
                  {activeModalLicense.noticeText}
                </Text>
              </View>
            ) : null}

            <View style={[styles.licenseBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <Text style={[styles.authorLabel, { color: theme.faint }]}>
                FULL LICENSE TEXT
              </Text>
              <Text style={[styles.licenseBody, { color: theme.inkSoft }]}>
                {activeModalLicense?.licenseText}
              </Text>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  countText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  licenseCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleArea: {
    flex: 1,
    gap: 1,
  },
  entryName: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  entryMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
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
  },
  authorText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15,
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  flagText: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  btnText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  loadMoreBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  loadMoreText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
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
  authorBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  authorLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
  },
  authorContent: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  licenseBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  licenseBody: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});

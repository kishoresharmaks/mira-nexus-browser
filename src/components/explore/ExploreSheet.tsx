import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { ExploreHeader } from './ExploreHeader';
import {
  ExploreProductivityModals,
  type ActiveModal,
} from './ExploreProductivityModals';
import { ExploreToolCard, type ToolItem } from './ExploreToolCard';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  currentUrl?: string;
  onClose: () => void;
  onOpenSearch: (category?: 'web' | 'ai' | 'images' | 'news' | 'videos') => void;
  onOpenVoiceSearch?: () => void;
  onOpenQrScanner?: () => void;
  onOpenDownloads: () => void;
  onOpenNotes: () => void;
  onOpenPrivacy: () => void;
  onOpenTrails: () => void;
  onOpenHistory: () => void;
  onOpenReader?: () => void;
  onOpenAiSummary?: () => void;
  onOpenSettings: () => void;
  onOpenPrivateTab: () => void;
  onTranslatePage?: () => void;
};

type CategoryFilter =
  | 'all'
  | 'search'
  | 'productivity'
  | 'reading'
  | 'developer'
  | 'files'
  | 'privacy';

export function ExploreSheet({
  visible,
  currentUrl,
  onClose,
  onOpenSearch,
  onOpenVoiceSearch,
  onOpenQrScanner,
  onOpenDownloads,
  onOpenPrivacy,
  onOpenTrails,
  onOpenHistory,
  onOpenReader,
  onOpenAiSummary,
  onOpenSettings,
  onOpenPrivateTab,
  onTranslatePage,
}: Props) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  const tools: ToolItem[] = useMemo(
    () => [
      // 1. SEARCH TOOLS
      {
        id: 'qr',
        title: 'QR Scanner',
        description: 'Scan barcodes & web QR codes directly with your camera.',
        category: 'search',
        icon: 'qr',
        badge: 'Live',
        onPress: () => {
          onClose();
          onOpenQrScanner?.();
        },
      },
      {
        id: 'imagesearch',
        title: 'Image Search',
        description: 'Search visual web results through your default engine.',
        category: 'search',
        icon: 'image',
        onPress: () => {
          onClose();
          onOpenSearch('images');
        },
      },
      {
        id: 'voice',
        title: 'Voice Search',
        description: 'Speak your query naturally with instant speech recognition.',
        category: 'search',
        icon: 'mic',
        badge: 'Live',
        onPress: () => {
          onClose();
          onOpenVoiceSearch?.();
        },
      },
      {
        id: 'websearch',
        title: 'Web Search',
        description: 'Open the smart address dock to browse any address.',
        category: 'search',
        icon: 'search',
        onPress: () => {
          onClose();
          onOpenSearch('web');
        },
      },
      {
        id: 'searchengine',
        title: 'Search Providers',
        description: 'Switch between DuckDuckGo, Brave, Google, Bing, Startpage.',
        category: 'search',
        icon: 'settings',
        onPress: () => {
          onClose();
          onOpenSettings();
        },
      },

      // 2. PRODUCTIVITY
      {
        id: 'calc',
        title: 'Calculator',
        description: 'Fast floating arithmetic calculator with clipboard export.',
        category: 'productivity',
        icon: 'calculator',
        badge: 'Built-in',
        onPress: () => setActiveModal('calculator'),
      },
      {
        id: 'converter',
        title: 'Unit Converter',
        description: 'Convert length, weight, temperature, and digital data.',
        category: 'productivity',
        icon: 'refresh',
        badge: 'Built-in',
        onPress: () => setActiveModal('converter'),
      },
      {
        id: 'wordcount',
        title: 'Word Counter',
        description: 'Analyze word count, characters, sentences and reading time.',
        category: 'productivity',
        icon: 'fileText',
        badge: 'Built-in',
        onPress: () => setActiveModal('wordcounter'),
      },
      {
        id: 'timer',
        title: 'Focus Timer',
        description: '25m Pomodoro & break timer to keep you on task while reading.',
        category: 'productivity',
        icon: 'timer',
        badge: 'Timer',
        onPress: () => setActiveModal('timer'),
      },
      {
        id: 'clip',
        title: 'Clipboard Tools',
        description: 'Inspect copied text, view character counts, or clear clipboard.',
        category: 'productivity',
        icon: 'clipboard',
        badge: 'Inspector',
        onPress: () => setActiveModal('clipboard'),
      },

      // 3. READING TOOLS
      {
        id: 'reader',
        title: 'Reader Mode',
        description: 'Distraction-free typography, custom serif reading & TTS.',
        category: 'reading',
        icon: 'book',
        onPress: () => {
          onClose();
          onOpenReader?.();
        },
      },
      {
        id: 'summary',
        title: 'Page Summary',
        description: 'Extract key takeaways and summary with on-device AI.',
        category: 'reading',
        icon: 'sparkle',
        onPress: () => {
          onClose();
          onOpenAiSummary?.();
        },
      },
      {
        id: 'translate',
        title: 'Translate Page',
        description: 'Translate current webpage safely into English or other languages.',
        category: 'reading',
        icon: 'globe',
        onPress: () => {
          onClose();
          onTranslatePage?.();
        },
      },
      {
        id: 'history',
        title: 'Reading History',
        description: 'Review and search all visited pages saved locally.',
        category: 'reading',
        icon: 'clock',
        onPress: () => {
          onClose();
          onOpenHistory();
        },
      },
      {
        id: 'trails',
        title: 'Browsing Trails',
        description: 'Contextual research sessions with multi-tab restore.',
        category: 'reading',
        icon: 'trail',
        onPress: () => {
          onClose();
          onOpenTrails();
        },
      },

      // 4. DEVELOPER TOOLS
      {
        id: 'siteinfo',
        title: 'Website Information',
        description: 'Inspect current hostname, TLS 1.3 protocol, and Hermes engine.',
        category: 'developer',
        icon: 'shield',
        badge: 'Dev',
        onPress: () => setActiveModal('devinfo'),
      },
      {
        id: 'urlinspector',
        title: 'URL Inspector',
        description: 'Deconstruct URL pathname, query parameters and fragments.',
        category: 'developer',
        icon: 'code',
        badge: 'Dev',
        onPress: () => setActiveModal('urlinspector'),
      },
      {
        id: 'pagesource',
        title: 'Page Source Viewer',
        description: 'Inspect underlying HTML DOM markup and web assets.',
        category: 'developer',
        icon: 'code',
        badge: 'Dev',
        onPress: () => setActiveModal('pagesource'),
      },
      {
        id: 'securityinfo',
        title: 'HTTPS Security Audit',
        description: 'Audit SSL certificates and anti-cleartext network policy.',
        category: 'developer',
        icon: 'lock',
        onPress: () => {
          onClose();
          onOpenPrivacy();
        },
      },

      // 5. FILE TOOLS
      {
        id: 'downloads',
        title: 'Nexus Drop',
        description: 'Manage active downloads, downloaded files & storage.',
        category: 'files',
        icon: 'download',
        onPress: () => {
          onClose();
          onOpenDownloads();
        },
      },
      {
        id: 'filemanager',
        title: 'File Storage Manager',
        description: 'View space used by sandboxed files and clear temporary data.',
        category: 'files',
        icon: 'folder',
        onPress: () => {
          onClose();
          onOpenDownloads();
        },
      },

      // 6. PRIVACY & SECURITY
      {
        id: 'privacy',
        title: 'Privacy Dashboard',
        description: 'Review Google Safe Browsing, HTTPS Only & manifest policy.',
        category: 'privacy',
        icon: 'shield',
        onPress: () => {
          onClose();
          onOpenPrivacy();
        },
      },
      {
        id: 'cookies',
        title: 'Tracking Protection',
        description: 'Cross-site third-party tracking cookies blocked by default.',
        category: 'privacy',
        icon: 'unlock',
        onPress: () => {
          onClose();
          onOpenPrivacy();
        },
      },
      {
        id: 'cleardata',
        title: 'Clear Browsing Data',
        description: 'One-tap deletion of browser cache, cookies, and history.',
        category: 'privacy',
        icon: 'trash',
        onPress: () => {
          onClose();
          onOpenPrivacy();
        },
      },
      {
        id: 'private',
        title: 'Private Browsing',
        description: 'Launch an ephemeral private tab that writes zero local trace.',
        category: 'privacy',
        icon: 'mask',
        badge: 'Ghost',
        onPress: () => {
          onClose();
          onOpenPrivateTab();
        },
      },
    ],
    [
      onClose,
      onOpenQrScanner,
      onOpenSearch,
      onOpenVoiceSearch,
      onOpenSettings,
      onOpenReader,
      onOpenAiSummary,
      onTranslatePage,
      onOpenHistory,
      onOpenTrails,
      onOpenPrivacy,
      onOpenDownloads,
      onOpenPrivateTab,
    ],
  );

  const filteredTools = useMemo(() => {
    let list = tools;
    if (activeCategory !== 'all') {
      list = list.filter((t) => t.category === activeCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tools, activeCategory, searchQuery]);

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Tools' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'search', label: 'Search' },
    { id: 'reading', label: 'Reading' },
    { id: 'developer', label: 'Developer' },
    { id: 'files', label: 'Files' },
    { id: 'privacy', label: 'Privacy' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ExploreHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={onClose}
      />

      {/* Categories Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((cat) => {
          const active = cat.id === activeCategory;
          return (
            <PressableScale
              key={cat.id}
              onPress={() => {
                haptic.select();
                setActiveCategory(cat.id);
              }}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: active ? theme.accent : theme.surface,
                  borderColor: active ? theme.accent : theme.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: active ? '#FFFFFF' : theme.inkSoft },
                ]}
              >
                {cat.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* Tools Grid */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTools.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <Icon name="search" size={24} color={theme.muted} />
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                No tools found
              </Text>
              <Text style={[styles.emptyBody, { color: theme.muted }]}>
                Try searching for &quot;calculator&quot;, &quot;timer&quot;, &quot;qr&quot;, or &quot;inspect&quot;.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTools.map((tool) => (
              <ExploreToolCard key={tool.id} tool={tool} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Built-in Productivity & Dev Modals */}
      <ExploreProductivityModals
        activeModal={activeModal}
        currentUrl={currentUrl}
        onClose={() => setActiveModal('none')}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emptyWrap: {
    paddingTop: 16,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
});

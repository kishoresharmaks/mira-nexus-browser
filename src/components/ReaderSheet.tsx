import { useMemo, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExtractedArticle } from '@/types';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type ReaderTheme = 'paper' | 'sepia' | 'dark';
type FontSize = 'small' | 'medium' | 'large';

type Props = {
  visible: boolean;
  onClose: () => void;
  article: ExtractedArticle | null;
  onListen?: () => void;
  onSummary?: () => void;
};

const THEMES: Record<
  ReaderTheme,
  { bg: string; surface: string; ink: string; muted: string; line: string }
> = {
  paper: {
    bg: '#F5F1E8',
    surface: '#FFFFFF',
    ink: '#191610',
    muted: '#7A7468',
    line: 'rgba(25, 22, 16, 0.12)',
  },
  sepia: {
    bg: '#F4ECD8',
    surface: '#EDE3CB',
    ink: '#382B1C',
    muted: '#85735B',
    line: 'rgba(56, 43, 28, 0.14)',
  },
  dark: {
    bg: '#14120E',
    surface: '#1E1B15',
    ink: '#EDEAE4',
    muted: '#969188',
    line: 'rgba(255, 255, 255, 0.1)',
  },
};

export function ReaderSheet({
  visible,
  onClose,
  article,
  onListen,
  onSummary,
}: Props) {
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(
    mode === 'dark' ? 'dark' : 'paper',
  );
  const [fontChoice, setFontChoice] = useState<'serif' | 'sans'>('serif');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [scrollProgress, setScrollProgress] = useState(0);

  const colors = THEMES[readerTheme];

  const fontSizeValues = useMemo(() => {
    switch (fontSize) {
      case 'small':
        return { body: 16, line: 26, title: 26, titleLine: 32 };
      case 'large':
        return { body: 21, line: 34, title: 34, titleLine: 42 };
      default:
        return { body: 18, line: 29, title: 30, titleLine: 37 };
    }
  }, [fontSize]);

  if (!article) {
    if (!visible) return null;
    return (
      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View
          style={[
            styles.root,
            {
              backgroundColor: colors.bg,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            },
          ]}
        >
          <Icon name="book" size={36} color={colors.muted} />
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 20,
              color: colors.ink,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Extracting clean reader view...
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              color: colors.muted,
              marginTop: 8,
              textAlign: 'center',
              maxWidth: 280,
            }}
          >
            Looking for article body text on this page.
          </Text>
          <View style={{ marginTop: 24 }}>
            <IconButton
              icon="close"
              label="Close reader"
              variant="surface"
              size={40}
              iconSize={18}
              onPress={onClose}
            />
          </View>
        </View>
      </Modal>
    );
  }

  const paragraphs = article.text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, (contentOffset.y / maxScroll) * 100));
      setScrollProgress(progress);
    }
  };

  const cycleTheme = () => {
    haptic.tap();
    const sequence: ReaderTheme[] = ['paper', 'sepia', 'dark'];
    const idx = sequence.indexOf(readerTheme);
    setReaderTheme(sequence[(idx + 1) % sequence.length]);
  };

  const cycleFontSize = () => {
    haptic.tap();
    const sequence: FontSize[] = ['small', 'medium', 'large'];
    const idx = sequence.indexOf(fontSize);
    setFontSize(sequence[(idx + 1) % sequence.length]);
  };

  const toggleFont = () => {
    haptic.tap();
    setFontChoice((curr) => (curr === 'serif' ? 'sans' : 'serif'));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {/* Top Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${scrollProgress}%`, backgroundColor: colors.ink },
            ]}
          />
        </View>

        {/* Top Floating Controls Header */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top, 14),
              borderBottomColor: colors.line,
              backgroundColor: colors.bg,
            },
          ]}
        >
          <View style={styles.leftControls}>
            <IconButton
              icon="close"
              label="Back to page"
              size={36}
              iconSize={16}
              onPress={onClose}
            />
            <Text style={[styles.readingTimePill, { color: colors.muted }]}>
              {article.readMinutes} min read
            </Text>
          </View>

          <View style={styles.rightControls}>
            {onSummary ? (
              <PressableScale
                onPress={onSummary}
                style={[styles.actionPill, { borderColor: colors.line, backgroundColor: colors.surface }]}
                accessibilityLabel="AI Summary"
              >
                <Icon name="sparkle" size={14} color={colors.ink} />
                <Text style={[styles.actionPillText, { color: colors.ink }]}>Summary</Text>
              </PressableScale>
            ) : null}

            {onListen ? (
              <PressableScale
                onPress={onListen}
                style={[styles.actionPill, { borderColor: colors.line, backgroundColor: colors.surface }]}
                accessibilityLabel="Listen"
              >
                <Icon name="volume" size={14} color={colors.ink} />
                <Text style={[styles.actionPillText, { color: colors.ink }]}>Listen</Text>
              </PressableScale>
            ) : null}

            <PressableScale
              onPress={toggleFont}
              style={[styles.iconPill, { borderColor: colors.line, backgroundColor: colors.surface }]}
              accessibilityLabel={`Switch font (${fontChoice})`}
            >
              <Text style={[styles.fontChoiceText, { color: colors.ink }]}>
                {fontChoice === 'serif' ? 'Serif' : 'Sans'}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={cycleFontSize}
              style={[styles.iconPill, { borderColor: colors.line, backgroundColor: colors.surface }]}
              accessibilityLabel="Change font size"
            >
              <Text style={[styles.fontSizeLabel, { color: colors.ink }]}>
                A{fontSize === 'small' ? '⁻' : fontSize === 'large' ? '⁺' : ''}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={cycleTheme}
              style={[styles.iconPill, { borderColor: colors.line, backgroundColor: colors.surface }]}
              accessibilityLabel={`Theme ${readerTheme}`}
            >
              <View
                style={[
                  styles.themeCircle,
                  { backgroundColor: readerTheme === 'dark' ? '#FFFFFF' : '#191610' },
                ]}
              />
            </PressableScale>
          </View>
        </View>

        {/* Article Reading Scroll */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 60 },
          ]}
        >
          {/* Metadata */}
          <View style={styles.articleHeader}>
            <Text style={[styles.hostLabel, { color: colors.muted }]}>
              {article.host.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.articleTitle,
                {
                  color: colors.ink,
                  fontSize: fontSizeValues.title,
                  lineHeight: fontSizeValues.titleLine,
                  fontFamily: fontChoice === 'serif' ? fonts.serif : fonts.sans,
                },
              ]}
            >
              {article.title}
            </Text>

            {article.author ? (
              <Text style={[styles.authorLabel, { color: colors.muted }]}>
                By {article.author}
              </Text>
            ) : null}

            <View style={[styles.rule, { backgroundColor: colors.line }]} />
          </View>

          {/* Article Text Content */}
          <View style={styles.body}>
            {paragraphs.map((paragraph, index) => (
              <Text
                key={index}
                style={[
                  styles.paragraph,
                  {
                    color: colors.ink,
                    fontSize: fontSizeValues.body,
                    lineHeight: fontSizeValues.line,
                    fontFamily: fontChoice === 'serif' ? fonts.serif : fonts.sans,
                  },
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 100,
  },
  progressBarFill: {
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 50,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readingTimePill: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 32,
  },
  fontChoiceText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  fontSizeLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  themeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  articleHeader: {
    marginBottom: 24,
  },
  hostLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  articleTitle: {
    marginBottom: 8,
  },
  authorLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: 16,
  },
  rule: {
    height: 1,
    width: '100%',
    marginTop: 12,
  },
  body: {
    gap: 20,
  },
  paragraph: {
    textAlign: 'left',
  },
});

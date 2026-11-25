import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { generateLocalSummary } from '@/lib/summarizer';
import { speechService } from '@/lib/speech';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExtractedArticle } from '@/types';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { useToast } from './Toast';

type Props = {
  visible: boolean;
  onClose: () => void;
  article: ExtractedArticle | null;
  onOpenReader?: () => void;
};

export function AiSummarySheet({
  visible,
  onClose,
  article,
  onOpenReader,
}: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const toast = useToast();

  if (!article) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Icon name="sparkle" size={32} color={theme.accent} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 16,
              color: theme.ink,
              marginTop: 14,
            }}
          >
            {Platform.OS === 'web'
              ? 'Web preview only'
              : 'Analyzing page content...'}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              color: theme.muted,
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            {Platform.OS === 'web'
              ? 'AI summary requires the native mobile WebView to extract article text.'
              : 'Extracting key points and core takeaways'}
          </Text>
        </View>
      </BottomSheet>
    );
  }

  const summary = generateLocalSummary(article);

  const handleCopy = async () => {
    haptic.tap();
    const formatted = `TL;DR: ${summary.tldr}\n\nKey Takeaways:\n${summary.takeaways
      .map((t, i) => `${i + 1}. ${t}`)
      .join('\n')}\n\nSource: ${article.url}`;
    await Clipboard.setStringAsync(formatted);
    toast.show('Summary copied to clipboard');
  };

  const handleListen = () => {
    haptic.tap();
    onClose();
    const textToRead = `Key Takeaways for ${article.title}. ${summary.tldr}. ${summary.takeaways.join('. ')}`;
    speechService.start(article.title, textToRead, 1.0);
  };

  const handleReader = () => {
    haptic.tap();
    onClose();
    onOpenReader?.();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: height * 0.78 }}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.sparkleIcon, { backgroundColor: theme.accentSoft }]}>
            <Icon name="sparkle" size={20} color={theme.accent} strokeWidth={1.8} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.accent }]}>AI SUMMARY</Text>
            <Text numberOfLines={1} style={[styles.title, { color: theme.ink }]}>
              {article.title || article.host}
            </Text>
          </View>
          <IconButton
            icon="close"
            label="Close summary"
            size={34}
            iconSize={15}
            variant="surface"
            onPress={onClose}
          />
        </View>

        {/* Time Saved Metric Pill */}
        <View style={styles.metricRow}>
          <View style={[styles.metricPill, { backgroundColor: theme.chip, borderColor: theme.line }]}>
            <Icon name="clock" size={12} color={theme.muted} />
            <Text style={[styles.metricText, { color: theme.inkSoft }]}>
              {article.readMinutes} min read · Saves ~{summary.timeSavedMinutes} min
            </Text>
          </View>
        </View>

        {/* TL;DR Card */}
        <View
          style={[
            styles.tldrCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
            softShadow(theme.mode, 'card'),
          ]}
        >
          <View style={styles.tldrBadge}>
            <Text style={[styles.tldrBadgeText, { color: theme.accent }]}>TL;DR</Text>
          </View>
          <Text style={[styles.tldrText, { color: theme.ink }]}>
            {summary.tldr}
          </Text>
        </View>

        {/* Key Takeaways */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>
            KEY TAKEAWAYS
          </Text>
        </View>

        <View style={styles.takeawaysList}>
          {summary.takeaways.map((takeaway, idx) => (
            <View
              key={idx}
              style={[
                styles.takeawayItem,
                { backgroundColor: theme.surface, borderColor: theme.line },
              ]}
            >
              <View style={[styles.takeawayNumber, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.numberText, { color: theme.accent }]}>
                  {idx + 1}
                </Text>
              </View>
              <Text style={[styles.takeawayText, { color: theme.inkSoft }]}>
                {takeaway}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <PressableScale
            onPress={handleListen}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Icon name="volume" size={15} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Listen to Summary</Text>
          </PressableScale>

          <PressableScale
            onPress={handleCopy}
            style={[styles.secondaryButton, { backgroundColor: theme.chip, borderColor: theme.line }]}
          >
            <Icon name="copy" size={15} color={theme.inkSoft} />
            <Text style={[styles.secondaryButtonText, { color: theme.inkSoft }]}>
              Copy
            </Text>
          </PressableScale>

          {onOpenReader ? (
            <PressableScale
              onPress={handleReader}
              style={[styles.secondaryButton, { backgroundColor: theme.chip, borderColor: theme.line }]}
            >
              <Icon name="book" size={15} color={theme.inkSoft} />
              <Text style={[styles.secondaryButtonText, { color: theme.inkSoft }]}>
                Reader
              </Text>
            </PressableScale>
          ) : null}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 17,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 8,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  metricText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  tldrCard: {
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  tldrBadge: {
    marginBottom: 6,
  },
  tldrBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  tldrText: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  takeawaysList: {
    gap: 10,
  },
  takeawayItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  takeawayNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  numberText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  takeawayText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});

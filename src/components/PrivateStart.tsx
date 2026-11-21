import { useEffect } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { privateCookieStartNote } from '@/lib/privateCopy';
import { fonts, privateTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

const T = privateTheme;

const ASSURANCES: { icon: IconName; label: string; meta: string }[] = [
  { icon: 'mask', label: 'No history', meta: 'not saved' },
  { icon: 'refresh', label: 'No cache', meta: 'bypassed' },
  { icon: 'lock', label: 'No capture', meta: 'blocked' },
];

type Props = {
  onSearch: () => void;
  onOpenInfo: () => void;
};

/**
 * The first page of a private tab. Nexus owns this room completely: no network
 * request is made until the reader chooses an address, so opening a private tab
 * tells nobody anything.
 */
export function PrivateStart({ onSearch, onOpenInfo }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { activeEngine } = useCatalogConfig();
  const reveal = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  const headline = Math.min(50, Math.max(40, width * 0.122));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0B0E15', '#0A0C12', '#07090D']}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="privateGlow" cx="82%" cy="6%" r="72%">
            <Stop offset="0" stopColor={T.accent} stopOpacity="0.2" />
            <Stop offset="1" stopColor={T.accent} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="privateCool" cx="10%" cy="92%" r="58%">
            <Stop offset="0" stopColor="#4D6BB8" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#4D6BB8" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#privateGlow)" />
        <Rect width="100%" height="100%" fill="url(#privateCool)" />
      </Svg>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 26,
            paddingBottom: insets.bottom + 126,
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: reveal,
            transform: [
              {
                translateY: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.eyebrowRow}>
            <View style={styles.rule} />
            <Text style={styles.eyebrow}>PRIVATE TAB</Text>
          </View>

          <View style={styles.orb}>
            <Icon name="mask" size={30} color={T.accent} strokeWidth={1.6} />
          </View>

          <Text style={[styles.headline, { fontSize: headline }]}>
            Nothing here{'\n'}
            <Text style={styles.headlineItalic}>is kept</Text>
            <Text style={{ color: T.accent }}>.</Text>
          </Text>
          <Text style={styles.subline}>
            Search, read, close the tab. Nexus keeps no record of where you went.
          </Text>

          <PressableScale
            onPress={onSearch}
            scaleTo={0.985}
            style={styles.searchDock}
            accessibilityLabel="Search privately or enter a website"
            accessibilityHint="Opens the private address bar"
          >
            <View style={styles.searchOrb}>
              <Icon name="mask" size={19} color={T.accent} strokeWidth={1.7} />
            </View>
            <View style={styles.searchCopy}>
              <Text style={styles.searchTitle}>Search privately</Text>
              <Text style={styles.searchHint}>
                or type a link · {activeEngine.name}
              </Text>
            </View>
            <View style={styles.searchGo}>
              <Icon
                name="arrowRight"
                size={18}
                color={T.accentInk}
                strokeWidth={2.1}
              />
            </View>
          </PressableScale>

          <View style={styles.assurances}>
            {ASSURANCES.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.assurance,
                  index > 0
                    ? {
                        borderLeftWidth: StyleSheet.hairlineWidth,
                        borderLeftColor: T.line,
                      }
                    : null,
                ]}
              >
                <Icon name={item.icon} size={16} color={T.accent} strokeWidth={1.7} />
                <Text style={styles.assuranceLabel}>{item.label}</Text>
                <Text style={styles.assuranceMeta}>{item.meta}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cookieNote}>
            <Icon name="shield" size={13} color={T.muted} strokeWidth={1.7} />
            <Text style={styles.cookieNoteText}>{privateCookieStartNote}</Text>
          </View>

          <PressableScale
            onPress={onOpenInfo}
            scaleTo={0.98}
            style={styles.infoLink}
            accessibilityLabel="How private tabs work"
          >
            <Icon name="shield" size={13} color={T.muted} strokeWidth={1.7} />
            <Text style={styles.infoText}>How private tabs work</Text>
            <Icon name="chevronRight" size={13} color={T.faint} strokeWidth={2} />
          </PressableScale>

          <Text style={styles.footnote}>
            Sites still see your IP address. Private tabs protect your trail in
            Nexus, not your identity on the web.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rule: {
    width: 17,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: T.accent,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.9,
    color: T.muted,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 24,
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(143, 168, 255, 0.24)',
    shadowColor: T.accent,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  headline: {
    marginTop: 19,
    fontFamily: fonts.serif,
    lineHeight: 50,
    letterSpacing: -1.5,
    color: T.ink,
    includeFontPadding: false,
  },
  headlineItalic: {
    fontFamily: fonts.serifItalic,
    letterSpacing: -0.8,
  },
  subline: {
    marginTop: 14,
    maxWidth: 306,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: T.muted,
  },
  searchDock: {
    marginTop: 26,
    minHeight: 72,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(143, 168, 255, 0.18)',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
  searchOrb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.accentSoft,
  },
  searchCopy: {
    flex: 1,
    gap: 2,
  },
  searchTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: T.ink,
  },
  searchHint: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: T.muted,
  },
  searchGo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.accent,
  },
  assurances: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line,
    backgroundColor: 'rgba(18, 23, 34, 0.72)',
    overflow: 'hidden',
  },
  assurance: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 13,
    paddingHorizontal: 6,
  },
  assuranceLabel: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: T.inkSoft,
  },
  assuranceMeta: {
    fontFamily: fonts.sans,
    fontSize: 9.5,
    letterSpacing: 0.2,
    color: T.faint,
  },
  cookieNote: {
    marginTop: 10,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  cookieNoteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: T.muted,
  },
  infoLink: {
    marginTop: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: T.inkSoft,
  },
  footnote: {
    marginTop: 15,
    alignSelf: 'center',
    maxWidth: 320,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 10.5,
    lineHeight: 16,
    color: T.faint,
  },
});

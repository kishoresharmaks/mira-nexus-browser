import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';
import type { SearchCategoryKey } from '@/lib/catalog';
import { haptic } from '@/lib/haptics';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { PressableScale } from '../PressableScale';

type VoiceState =
  | 'idle'
  | 'requesting'
  | 'denied'
  | 'listening'
  | 'processing'
  | 'done'
  | 'error'
  | 'unsupported';

type Props = {
  visible: boolean;
  category?: SearchCategoryKey;
  onClose: () => void;
  onSubmit: (query: string, category?: SearchCategoryKey) => void;
};

// Safe retrieval of native module without crashing in Expo Go or Web
const NativeSpeechRecognition: any =
  Platform.OS !== 'web' ? requireOptionalNativeModule('ExpoSpeechRecognition') : null;

export function VoiceSearchSheet({
  visible,
  category = 'web',
  onClose,
  onSubmit,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [voiceState, setVoiceState] = useState<VoiceState>(
    NativeSpeechRecognition ? 'idle' : 'unsupported',
  );
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnDevice, setIsOnDevice] = useState(false);

  useEffect(() => {
    if (NativeSpeechRecognition?.supportsOnDeviceRecognition) {
      try {
        setIsOnDevice(Boolean(NativeSpeechRecognition.supportsOnDeviceRecognition()));
      } catch {}
    }
  }, []);

  // Pulse animation for listening state
  const pulseAnim = useAnimatedValue(1);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseAnim.setValue(1);
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    pulseLoopRef.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseLoopRef.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  // Speech Recognition Event Listeners
  useEffect(() => {
    if (!NativeSpeechRecognition) return;

    const startSub = NativeSpeechRecognition.addListener?.('start', () => {
      setVoiceState('listening');
      setErrorMessage(null);
      startPulse();
    });

    const endSub = NativeSpeechRecognition.addListener?.('end', () => {
      stopPulse();
      setVoiceState((prev) => (prev === 'listening' ? 'done' : prev));
    });

    const resultSub = NativeSpeechRecognition.addListener?.(
      'result',
      (event: ExpoSpeechRecognitionResultEvent) => {
        const text = event.results?.[0]?.transcript ?? '';
        if (text) {
          if (event.isFinal) {
            setTranscript(text);
            setInterimText('');
            setVoiceState('done');
            haptic.success();
          } else {
            setInterimText(text);
          }
        }
      },
    );

    const errorSub = NativeSpeechRecognition.addListener?.(
      'error',
      (event: ExpoSpeechRecognitionErrorEvent) => {
        stopPulse();
        if (event.error === 'no-speech' || event.error === 'speech-timeout') {
          setErrorMessage('No speech detected. Try speaking closer to the microphone.');
        } else if (event.error === 'not-allowed') {
          setVoiceState('denied');
          setErrorMessage('Microphone access was denied.');
          return;
        } else if (event.error === 'network') {
          setErrorMessage('Network connection required for speech recognition.');
        } else if (event.error === 'aborted') {
          return;
        } else {
          setErrorMessage(event.message || 'Speech recognition encountered an issue.');
        }
        setVoiceState('error');
        haptic.warn();
      },
    );

    return () => {
      startSub?.remove?.();
      endSub?.remove?.();
      resultSub?.remove?.();
      errorSub?.remove?.();
    };
  }, [startPulse, stopPulse]);

  // Start recognition workflow
  const startRecognition = useCallback(async () => {
    if (!NativeSpeechRecognition) {
      setVoiceState('unsupported');
      return;
    }

    try {
      setErrorMessage(null);
      setTranscript('');
      setInterimText('');
      setVoiceState('requesting');

      const perm = await NativeSpeechRecognition.requestPermissionsAsync();
      if (!perm.granted) {
        setVoiceState('denied');
        setErrorMessage('Nexus needs microphone permission to transcribe your voice search.');
        return;
      }

      setVoiceState('listening');
      haptic.tap();

      NativeSpeechRecognition.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        androidIntentOptions: {
          EXTRA_PREFER_OFFLINE: true,
        },
      });
    } catch (err: unknown) {
      stopPulse();
      setVoiceState('error');
      const msg = err instanceof Error ? err.message : 'Unable to start speech recognition.';
      setErrorMessage(msg);
    }
  }, [stopPulse]);

  // Stop recognition
  const stopRecognition = useCallback(() => {
    stopPulse();
    try {
      NativeSpeechRecognition?.stop?.();
    } catch {}
  }, [stopPulse]);

  // Abort on close or background
  const abortRecognition = useCallback(() => {
    stopPulse();
    try {
      NativeSpeechRecognition?.abort?.();
    } catch {}
  }, [stopPulse]);

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (visible) {
      if (NativeSpeechRecognition) {
        startRecognition();
      } else {
        setVoiceState('unsupported');
      }
    } else {
      abortRecognition();
      setVoiceState(NativeSpeechRecognition ? 'idle' : 'unsupported');
      setTranscript('');
      setInterimText('');
      setErrorMessage(null);
    }

    return () => {
      abortRecognition();
    };
  }, [visible, startRecognition, abortRecognition]);

  // Stop when app is backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        abortRecognition();
      }
    });
    return () => sub.remove();
  }, [abortRecognition]);

  const handleSearchSubmit = () => {
    const finalQuery = (transcript || interimText).trim();
    if (!finalQuery) return;
    haptic.tap();
    abortRecognition();
    onClose();
    onSubmit(finalQuery, category);
  };

  const handleOpenSettings = async () => {
    haptic.tap();
    try {
      await Linking.openSettings();
    } catch {}
  };

  if (!visible) return null;

  const currentDisplay = transcript || interimText;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.line,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
            softShadow(theme.mode, 'dock'),
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconOrb, { backgroundColor: theme.accentSoft }]}>
                <Icon name="mic" size={17} color={theme.accent} strokeWidth={2.2} />
              </View>
              <Text style={[styles.title, { color: theme.ink }]}>Voice Search</Text>
            </View>
            <IconButton icon="close" label="Close voice search" size={32} iconSize={16} onPress={onClose} />
          </View>

          {/* Body Content */}
          <View style={styles.body}>
            {/* Listening Indicator / Pulse Orb */}
            <View style={styles.orbContainer}>
              {voiceState === 'listening' ? (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      borderColor: theme.accent,
                      backgroundColor: theme.accentSoft,
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
              ) : null}

              <PressableScale
                onPress={() => {
                  if (voiceState === 'listening') {
                    stopRecognition();
                  } else if (NativeSpeechRecognition) {
                    startRecognition();
                  }
                }}
                disabled={voiceState === 'unsupported'}
                scaleTo={0.92}
                style={[
                  styles.micButton,
                  {
                    backgroundColor:
                      voiceState === 'listening'
                        ? theme.accent
                        : voiceState === 'denied' || voiceState === 'error'
                          ? theme.chip
                          : theme.accentSoft,
                  },
                  softShadow(theme.mode, 'card'),
                ]}
                accessibilityLabel={
                  voiceState === 'listening' ? 'Listening, tap to finish' : 'Tap to speak'
                }
              >
                <Icon
                  name={voiceState === 'denied' ? 'shield' : 'mic'}
                  size={28}
                  color={voiceState === 'listening' ? '#FFFFFF' : theme.accent}
                  strokeWidth={2.2}
                />
              </PressableScale>
            </View>

            {/* Status Label */}
            <Text style={[styles.statusLabel, { color: theme.muted }]}>
              {voiceState === 'requesting'
                ? 'Requesting microphone...'
                : voiceState === 'listening'
                  ? 'Listening... speak clearly'
                  : voiceState === 'processing'
                    ? 'Processing speech...'
                    : voiceState === 'done'
                      ? 'Speech recognized'
                      : voiceState === 'denied'
                        ? 'Microphone access required'
                        : voiceState === 'error'
                          ? 'Recognition paused'
                          : voiceState === 'unsupported'
                            ? 'Native Speech Module Required'
                            : 'Tap microphone to speak'}
            </Text>

            {/* Content states */}
            {voiceState === 'unsupported' ? (
              <View style={[styles.infoBox, { backgroundColor: theme.chip, borderColor: theme.line }]}>
                <Text style={[styles.infoTitle, { color: theme.ink }]}>
                  Development Build Required
                </Text>
                <Text style={[styles.infoBody, { color: theme.muted }]}>
                  Native voice recognition requires an Android development build (`npx expo run:android`) because custom native speech libraries are not bundled in Expo Go.
                </Text>
                <PressableScale
                  onPress={onClose}
                  scaleTo={0.97}
                  style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                  accessibilityLabel="Type your search instead"
                >
                  <Text style={[styles.actionBtnText, { color: theme.accentInk }]}>
                    Type Search Instead
                  </Text>
                </PressableScale>
              </View>
            ) : voiceState === 'denied' ? (
              <View style={[styles.infoBox, { backgroundColor: theme.chip, borderColor: theme.line }]}>
                <Text style={[styles.infoTitle, { color: theme.ink }]}>
                  Microphone Permission Required
                </Text>
                <Text style={[styles.infoBody, { color: theme.muted }]}>
                  Nexus processes your speech directly on-device. To use voice search, please grant microphone access in Android settings.
                </Text>
                <PressableScale
                  onPress={handleOpenSettings}
                  style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                  accessibilityLabel="Open settings to grant microphone permission"
                >
                  <Text style={[styles.actionBtnText, { color: theme.accentInk }]}>
                    Open App Settings
                  </Text>
                </PressableScale>
              </View>
            ) : (
              <View style={[styles.transcriptContainer, { backgroundColor: theme.chip, borderColor: theme.line }]}>
                <TextInput
                  value={currentDisplay}
                  onChangeText={(val) => {
                    setTranscript(val);
                    setInterimText('');
                  }}
                  placeholder="Your query will appear here..."
                  placeholderTextColor={theme.faint}
                  multiline
                  style={[styles.transcriptInput, { color: theme.ink }]}
                />
              </View>
            )}

            {/* Error Message if any */}
            {errorMessage && voiceState !== 'denied' && voiceState !== 'unsupported' ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Action Bar */}
            {currentDisplay.trim() ? (
              <View style={styles.footerRow}>
                <PressableScale
                  onPress={() => {
                    setTranscript('');
                    setInterimText('');
                    startRecognition();
                  }}
                  scaleTo={0.96}
                  style={[styles.retryBtn, { borderColor: theme.line }]}
                  accessibilityLabel="Speak again"
                >
                  <Icon name="refresh" size={15} color={theme.ink} strokeWidth={2} />
                  <Text style={[styles.retryText, { color: theme.ink }]}>Speak again</Text>
                </PressableScale>

                <PressableScale
                  onPress={handleSearchSubmit}
                  scaleTo={0.96}
                  style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                  accessibilityLabel="Search recognized query"
                >
                  <Text style={[styles.submitText, { color: theme.accentInk }]}>
                    {category === 'ai'
                      ? 'Search AI'
                      : category === 'images'
                        ? 'Search Images'
                        : category === 'news'
                          ? 'Search News'
                          : category === 'videos'
                            ? 'Search Videos'
                            : 'Search Web'}
                  </Text>
                  <Icon name="arrowRight" size={16} color={theme.accentInk} strokeWidth={2.4} />
                </PressableScale>
              </View>
            ) : voiceState === 'error' ? (
              <PressableScale
                onPress={startRecognition}
                scaleTo={0.96}
                style={[styles.actionBtn, { backgroundColor: theme.accent, marginTop: 12 }]}
                accessibilityLabel="Try speaking again"
              >
                <Icon name="refresh" size={15} color={theme.accentInk} strokeWidth={2} />
                <Text style={[styles.actionBtnText, { color: theme.accentInk }]}>Try Again</Text>
              </PressableScale>
            ) : null}

            {/* Privacy Disclosure */}
            {voiceState !== 'unsupported' && voiceState !== 'denied' ? (
              <View style={styles.privacyNoteRow}>
                <Icon name="shield" size={11} color={theme.faint} strokeWidth={1.8} />
                <Text style={[styles.privacyNote, { color: theme.faint }]}>
                  {isOnDevice
                    ? 'On-device recognition · Audio stays on device'
                    : 'Speech service · No recordings stored or profiled'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  body: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  orbContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  micButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  transcriptContainer: {
    width: '100%',
    minHeight: 88,
    maxHeight: 140,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  transcriptInput: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  infoBox: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  infoBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
  },
  actionBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: '#D9534F',
    marginTop: 8,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retryText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  submitBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
  },
  privacyNote: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
});

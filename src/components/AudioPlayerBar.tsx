import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { speechService } from '@/lib/speech';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type Props = {
  bottomOffset?: number;
  onOpenReader?: () => void;
};

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

export function AudioPlayerBar({ bottomOffset = 68, onOpenReader }: Props) {
  const { theme } = useTheme();
  const [state, setState] = useState(speechService.getState());

  useEffect(() => {
    return speechService.subscribe((next) => {
      setState(next);
    });
  }, []);

  if (!state.isSpeaking && !state.isPaused && state.totalChunks === 0) {
    return null;
  }

  const cycleSpeed = () => {
    haptic.tap();
    const currentIdx = SPEEDS.indexOf(state.rate);
    const nextIdx = (currentIdx + 1) % SPEEDS.length;
    speechService.setRate(SPEEDS[nextIdx]);
  };

  const togglePlay = () => {
    haptic.tap();
    if (state.isPaused) {
      speechService.resume();
    } else {
      speechService.pause();
    }
  };

  const handleClose = () => {
    haptic.tap();
    speechService.stop();
  };

  const progressPercent =
    state.totalChunks > 0
      ? Math.min(100, Math.round(((state.currentChunk + 1) / state.totalChunks) * 100))
      : 0;

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
          softShadow(theme.mode, 'dock'),
        ]}
      >
        {/* Progress line */}
        <View style={[styles.progressTrack, { backgroundColor: theme.line }]}>
          <View
            style={[
              styles.progressBar,
              { width: `${progressPercent}%`, backgroundColor: theme.accent },
            ]}
          />
        </View>

        <PressableScale
          style={styles.infoArea}
          onPress={onOpenReader}
          disabled={!onOpenReader}
        >
          <View style={[styles.soundIcon, { backgroundColor: theme.accentSoft }]}>
            <Icon name="volume" size={15} color={theme.accent} strokeWidth={2} />
          </View>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.ink }]}>
              {state.title || 'Listening to article...'}
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {state.isPaused ? 'Paused' : 'Playing'} · Part {state.currentChunk + 1}/{state.totalChunks} ({progressPercent}%)
            </Text>
          </View>
        </PressableScale>

        <View style={styles.controls}>
          <PressableScale
            onPress={cycleSpeed}
            style={[styles.speedPill, { backgroundColor: theme.chip, borderColor: theme.line }]}
            accessibilityLabel={`Speed ${state.rate}x`}
          >
            <Text style={[styles.speedText, { color: theme.inkSoft }]}>
              {state.rate}x
            </Text>
          </PressableScale>

          <IconButton
            icon={state.isPaused ? 'play' : 'pause'}
            label={state.isPaused ? 'Resume' : 'Pause'}
            size={34}
            iconSize={15}
            variant="surface"
            onPress={togglePlay}
          />

          <IconButton
            icon="close"
            label="Stop listening"
            size={32}
            iconSize={14}
            variant="surface"
            onPress={handleClose}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  progressBar: {
    height: '100%',
  },
  infoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    marginRight: 8,
  },
  soundIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  speedPill: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  speedText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
});

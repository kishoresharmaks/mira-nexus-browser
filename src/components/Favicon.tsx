import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { faviconUrl } from '@/lib/url';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export function Favicon({
  host,
  title,
  size = 34,
  plain = false,
}: {
  host: string;
  title?: string;
  size?: number;
  plain?: boolean;
}) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [host]);

  const letter = (title || host || '?').replace(/^www\./i, '').charAt(0).toUpperCase();
  const imageSize = Math.round(size * (plain ? 0.94 : 0.62));
  const source = faviconUrl(host);
  // Favicons are drawn for white pages. In dark mode a warm paper plate keeps
  // dark marks (GitHub, for one) legible without washing out the row.
  const frameBackground =
    theme.mode === 'dark' ? '#F6F1E7' : plain ? 'transparent' : theme.surfaceAlt;

  return (
    <View
      style={[
        styles.frame,
        {
          width: plain ? imageSize : size,
          height: plain ? imageSize : size,
          borderRadius: plain ? imageSize * 0.22 : size * 0.32,
          backgroundColor: frameBackground,
        },
      ]}
    >
      {failed || !source ? (
        <Text
          style={[
            styles.letter,
            {
              color: theme.inkSoft,
              fontSize: Math.round(size * (plain ? 0.52 : 0.4)),
            },
          ]}
        >
          {letter}
        </Text>
      ) : (
        <Image
          source={{ uri: source }}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    fontFamily: fonts.semibold,
    includeFontPadding: false,
  },
});

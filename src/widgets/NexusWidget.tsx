import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { CuratedPage, Shortcut } from '@/types';

type Props = {
  page?: CuratedPage | null;
  dateLabel: string;
  shortcuts: Shortcut[];
  theme: 'light' | 'dark';
  /** Height in dp, used to decide how much type fits. */
  height: number;
};

const COLORS = {
  light: {
    bg: '#F5F1E8',
    ink: '#191610',
    muted: '#6C6457',
    chip: '#FFFCF6',
    accent: '#FF5A2B',
    rule: '#E4DCCE',
  },
  dark: {
    bg: '#14120F',
    ink: '#F4EFE5',
    muted: '#A39A8B',
    chip: '#1F1C18',
    accent: '#FF6B3D',
    rule: '#2A2620',
  },
} as const;

/**
 * A deep link the widget can hand back to the running app. `OPEN_URI` is
 * executed by the launcher, so the click never depends on a headless render.
 */
function openLink(url: string, title: string): string {
  return `nexus://open?url=${encodeURIComponent(url)}&title=${encodeURIComponent(
    title.slice(0, 120),
  )}`;
}

/**
 * Today's page, typeset like the inverse card on the home screen. Plain
 * RemoteViews only: text, rules, and rounded blocks — no web content, no
 * network images, no remote code.
 */
export function NexusWidget({ page, dateLabel, shortcuts, theme, height }: Props) {
  const color = COLORS[theme];
  const compact = height < 130;
  const roomy = height >= 180 && shortcuts.length > 0;
  const titleSize = compact ? 19 : 24;
  const pad = compact ? 13 : 17;
  const date = dateLabel.toUpperCase();

  const title = page ? page.title : 'Nexus Browser';
  const subtitle = page ? `${page.host}  ·  ${page.readMinutes} min read` : 'Search & Discover';
  const actionUri = page ? openLink(page.url, page.title) : 'nexus://';
  const accessibility = page ? `Nexus. Today's page: ${page.title} on ${page.host}` : 'Nexus Browser';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={accessibility}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: color.bg,
        borderRadius: 24,
        padding: pad,
      }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget
          text="TODAY'S PAGE"
          style={{
            fontSize: compact ? 8 : 8.5,
            letterSpacing: 1.5,
            color: color.accent,
            fontFamily: 'InstrumentSans-Medium',
          }}
        />
        <TextWidget
          text={date}
          style={{
            fontSize: compact ? 8.5 : 9.5,
            letterSpacing: 0.4,
            color: color.muted,
            fontFamily: 'InstrumentSans-Medium',
          }}
        />
      </FlexWidget>

      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: actionUri }}
        accessibilityLabel={page ? `Open ${page.title}` : 'Open Nexus'}
        style={{
          width: 'match_parent',
          marginTop: compact ? 6 : 9,
          marginBottom: compact ? 6 : 9,
        }}
      >
        <TextWidget
          text={title}
          maxLines={compact ? 1 : 2}
          truncate="END"
          style={{
            fontSize: titleSize,
            lineHeight: titleSize + 1,
            color: color.ink,
            fontFamily: 'InstrumentSerif-Regular',
          }}
        />
        <TextWidget
          text={subtitle}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: compact ? 9 : 10,
            marginTop: 3,
            color: color.muted,
            fontFamily: 'InstrumentSans-Medium',
          }}
        />
      </FlexWidget>

      {roomy ? (
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 6,
            marginBottom: 8,
            borderTopWidth: 1,
            borderTopColor: color.rule,
            paddingTop: 8,
          }}
        >
          {shortcuts.map((shortcut) => (
            <FlexWidget
              key={shortcut.id}
              clickAction="OPEN_URI"
              clickActionData={{
                uri: openLink(shortcut.url, shortcut.title),
              }}
              accessibilityLabel={`Open ${shortcut.title}`}
              style={{
                backgroundColor: color.chip,
                borderRadius: 11,
                paddingHorizontal: 9,
                paddingVertical: 4,
                marginRight: 6,
              }}
            >
              <TextWidget
                text={shortcut.host}
                maxLines={1}
                truncate="END"
                style={{
                  fontSize: 9.5,
                  color: color.ink,
                  fontFamily: 'InstrumentSans-Medium',
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      ) : null}

      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: color.rule,
          paddingTop: compact ? 6 : 8,
        }}
      >
        <TextWidget
          text="READ TODAY'S PAGE"
          style={{
            fontSize: compact ? 7.5 : 8,
            letterSpacing: 1.4,
            color: color.accent,
            fontFamily: 'InstrumentSans-Medium',
          }}
        />
        <TextWidget
          text="NEXUS"
          style={{
            fontSize: compact ? 7.5 : 8,
            letterSpacing: 1.4,
            color: color.muted,
            fontFamily: 'InstrumentSans-Medium',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

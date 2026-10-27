import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  communityPlatformLabel,
  formatCommunityCount,
  loadCommunityComments,
} from '@/lib/community';
import { haptic } from '@/lib/haptics';
import { relativeTime } from '@/lib/time';
import { getDisplayUrl } from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type {
  CommunityComment,
  CommunityPlatform,
  CommunityThread,
} from '@/types';
import { BottomSheet } from './BottomSheet';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';

type Props = {
  visible: boolean;
  onClose: () => void;
  articleTitle: string;
  articleUrl: string;
  threads: CommunityThread[];
  enabled: boolean;
  loading: boolean;
  failed: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onOpenThread: (url: string) => void;
  onRetryLookup: () => void;
};

type CommentStatus = 'idle' | 'loading' | 'ready' | 'error';

type CommentState = {
  status: CommentStatus;
  comments: CommunityComment[];
  truncated: boolean;
};

const EMPTY_COMMENTS: CommentState = {
  status: 'idle',
  comments: [],
  truncated: false,
};

function flattenComments(comments: CommunityComment[]): CommunityComment[] {
  const out: CommunityComment[] = [];
  const walk = (items: CommunityComment[]) => {
    for (const item of items) {
      out.push(item);
      walk(item.children);
    }
  };
  walk(comments);
  return out;
}

function platformTint(
  platform: CommunityPlatform,
  theme: ReturnType<typeof useTheme>['theme'],
): string {
  return platform === 'hn' ? theme.accent : theme.danger;
}

/**
 * The conversation around a page, without leaving the page. The thread header
 * stays fixed, comments scroll, and the privacy toggle stays visible so it is
 * always clear when Mira is talking to HN or Lobsters.
 */
export function CommunitySheet({
  visible,
  onClose,
  articleTitle,
  articleUrl,
  threads,
  enabled,
  loading,
  failed,
  onToggleEnabled,
  onOpenThread,
  onRetryLookup,
}: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const host = getDisplayUrl(articleUrl).host;

  const [selected, setSelected] = useState<CommunityPlatform | null>(null);
  const [comments, setComments] = useState<CommentState>(EMPTY_COMMENTS);
  const [commentRetry, setCommentRetry] = useState(0);

  const activeThread =
    threads.find((thread) => thread.platform === selected) ??
    threads[0] ??
    null;

  const flatComments = useMemo(
    () => flattenComments(comments.comments),
    [comments.comments],
  );

  useEffect(() => {
    setSelected((current) => {
      if (threads.length === 0) return null;
      if (current && threads.some((thread) => thread.platform === current)) {
        return current;
      }
      return threads[0].platform;
    });
  }, [threads]);

  useEffect(() => {
    if (!visible || !activeThread) {
      setComments(EMPTY_COMMENTS);
      return;
    }

    if (activeThread.commentsCount === 0) {
      setComments({ status: 'ready', comments: [], truncated: false });
      return;
    }

    const controller = new AbortController();
    let alive = true;
    setComments({ status: 'loading', comments: [], truncated: false });

    loadCommunityComments(activeThread, {
      signal: controller.signal,
      force: commentRetry > 0,
    })
      .then((result) => {
        if (!alive) return;
        setComments({
          status: 'ready',
          comments: result.comments,
          truncated: result.truncated,
        });
      })
      .catch(() => {
        if (!alive) return;
        setComments({ status: 'error', comments: [], truncated: false });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [activeThread, commentRetry, visible]);

  const articleTitleIsHost =
    !articleTitle || articleTitle.trim().toLowerCase() === host.toLowerCase();
  const headline =
    activeThread?.title ||
    (articleTitleIsHost ? 'Discussions' : articleTitle) ||
    'Discussions';
  const commentMaxHeight = Math.min(Math.max(height * 0.42, 220), 400);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            PUBLIC DISCUSSION
          </Text>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.title, { color: theme.ink }]}
          >
            {headline}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: theme.muted }]}>
            {host}
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close discussions"
          variant="surface"
          size={36}
          iconSize={16}
          onPress={onClose}
        />
      </View>

      {activeThread ? (
        <>
          {threads.length > 1 ? (
            <View style={[styles.segment, { backgroundColor: theme.chip }]}>
              {threads.map((thread) => {
                const active = thread.platform === activeThread.platform;
                const tint = platformTint(thread.platform, theme);
                return (
                  <PressableScale
                    key={thread.platform}
                    onPress={() => {
                      haptic.select();
                      setSelected(thread.platform);
                    }}
                    scaleTo={0.97}
                    style={[
                      styles.segmentOption,
                      active
                        ? [
                            styles.segmentActive,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.line,
                            },
                          ]
                        : null,
                    ]}
                    accessibilityLabel={`Show ${communityPlatformLabel(
                      thread.platform,
                    )} discussion, ${formatCommunityCount(
                      thread.commentsCount,
                    )} comments`}
                  >
                    <View
                      style={[styles.platformDot, { backgroundColor: tint }]}
                    />
                    <Text
                      style={[
                        styles.segmentLabel,
                        { color: active ? theme.ink : theme.muted },
                      ]}
                    >
                      {communityPlatformLabel(thread.platform)}
                    </Text>
                    <Text
                      style={[
                        styles.segmentCount,
                        { color: active ? theme.inkSoft : theme.faint },
                      ]}
                    >
                      {formatCommunityCount(thread.commentsCount)}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          ) : null}

          <View style={styles.threadRow}>
            <View style={styles.threadStats}>
              <View style={styles.statsLine}>
                {threads.length === 1 ? (
                  <View
                    style={[styles.platformTag, { backgroundColor: theme.chip }]}
                  >
                    <View
                      style={[
                        styles.platformDot,
                        {
                          backgroundColor: platformTint(
                            activeThread.platform,
                            theme,
                          ),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.platformTagText,
                        { color: theme.inkSoft },
                      ]}
                    >
                      {communityPlatformLabel(activeThread.platform)}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.stat, { color: theme.inkSoft }]}>
                  {formatCommunityCount(activeThread.points)} pts
                </Text>
                <Text style={[styles.statDot, { color: theme.faint }]}>·</Text>
                <Text style={[styles.stat, { color: theme.inkSoft }]}>
                  {formatCommunityCount(activeThread.commentsCount)} comments
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.byline, { color: theme.muted }]}
              >
                {activeThread.author
                  ? `by ${activeThread.author}`
                  : 'Public thread'}
                {activeThread.createdAt > 0
                  ? ` · ${relativeTime(activeThread.createdAt)}`
                  : ''}
              </Text>
            </View>

            <PressableScale
              onPress={() => {
                haptic.tap();
                onOpenThread(activeThread.discussionUrl);
              }}
              scaleTo={0.96}
              style={[styles.openButton, { backgroundColor: theme.inverse }]}
              accessibilityLabel={`Open the ${communityPlatformLabel(
                activeThread.platform,
              )} thread`}
            >
              <Text style={[styles.openLabel, { color: theme.inverseInk }]}>
                Open thread
              </Text>
              <Icon
                name="arrowUpRight"
                size={12}
                color={theme.inverseInk}
                strokeWidth={2}
              />
            </PressableScale>
          </View>

          <View style={styles.commentsHead}>
            <Text style={[styles.sectionLabel, { color: theme.muted }]}>
              COMMENTS
            </Text>
          </View>

          <ScrollView
            style={{ maxHeight: commentMaxHeight }}
            contentContainerStyle={styles.commentsContent}
            showsVerticalScrollIndicator={false}
          >
            {comments.status === 'loading' ? <LoadingBars /> : null}

            {comments.status === 'error' ? (
              <InlineError
                platform={communityPlatformLabel(activeThread.platform)}
                onRetry={() => setCommentRetry((value) => value + 1)}
              />
            ) : null}

            {comments.status === 'ready' && flatComments.length === 0 ? (
              <Text style={[styles.emptyComments, { color: theme.muted }]}>
                No comments yet. The thread is still open on{' '}
                {communityPlatformLabel(activeThread.platform)}.
              </Text>
            ) : null}

            {comments.status === 'ready'
              ? flatComments.map((comment, index) => (
                  <CommentRow
                    key={`${comment.id}-${index}`}
                    comment={comment}
                  />
                ))
              : null}

            {comments.status === 'ready' && comments.truncated ? (
              <Text style={[styles.truncated, { color: theme.faint }]}>
                Showing the first {flatComments.length} comments. Open the thread
                for the rest.
              </Text>
            ) : null}
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          {loading ? (
            <View style={styles.notice}>
              <View style={[styles.noticeIcon, { backgroundColor: theme.chip }]}>
                <Icon
                  name="message"
                  size={20}
                  color={theme.muted}
                  strokeWidth={1.8}
                />
              </View>
              <Text style={[styles.noticeTitle, { color: theme.ink }]}>
                Looking for discussions
              </Text>
              <Text style={[styles.noticeBody, { color: theme.muted }]}>
                Checking Hacker News and Lobsters for this address.
              </Text>
              <LoadingBars />
            </View>
          ) : !enabled ? (
            <NoticeBlock
              icon="message"
              title="Discussion lookup is off"
              body="Turn it on below to see whether this page has a public thread on Hacker News or Lobsters."
            />
          ) : failed ? (
            <NoticeBlock
              icon="wifiOff"
              title="The discussion services are out of reach"
              body="Hacker News or Lobsters did not answer. Check your connection and try again."
              actionLabel="Try again"
              onAction={onRetryLookup}
            />
          ) : (
            <NoticeBlock
              icon="message"
              title="No public discussion found"
              body="Nobody has posted this page to Hacker News or Lobsters yet. Mira checks the address when a page opens."
              actionLabel="Check again"
              onAction={onRetryLookup}
            />
          )}
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: theme.line }]}>
        <View style={styles.footerCopy}>
          <Text style={[styles.footerTitle, { color: theme.ink }]}>
            Look up discussions
          </Text>
          <Text style={[styles.footerBody, { color: theme.muted }]}>
            {enabled
              ? "Sends this page's address to Hacker News and Lobsters. No account, no stored history, no analytics."
              : 'Off. Mira will not contact Hacker News or Lobsters for this page.'}
          </Text>
        </View>
        <DiscussionToggle value={enabled} onChange={onToggleEnabled} />
      </View>
    </BottomSheet>
  );
}

function CommentRow({ comment }: { comment: CommunityComment }) {
  const { theme } = useTheme();
  const indent = Math.min(comment.level, 4);

  return (
    <View
      style={[
        styles.comment,
        indent > 0
          ? {
              marginLeft: indent * 12,
              paddingLeft: 10,
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderLeftColor: theme.line,
            }
          : null,
      ]}
    >
      <View style={styles.commentMeta}>
        <Text
          numberOfLines={1}
          style={[styles.commentAuthor, { color: theme.inkSoft }]}
        >
          {comment.author}
        </Text>
        {comment.createdAt > 0 ? (
          <Text style={[styles.commentTime, { color: theme.faint }]}>
            {relativeTime(comment.createdAt)}
          </Text>
        ) : null}
      </View>
      <Text selectable style={[styles.commentText, { color: theme.ink }]}>
        {comment.text}
      </Text>
    </View>
  );
}

function InlineError({
  platform,
  onRetry,
}: {
  platform: string;
  onRetry: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.inlineError}>
      <Text style={[styles.inlineTitle, { color: theme.ink }]}>
        The conversation could not be loaded
      </Text>
      <Text style={[styles.inlineBody, { color: theme.muted }]}>
        The thread is still available on {platform}.
      </Text>
      <SmallButton label="Try again" onPress={onRetry} />
    </View>
  );
}

function NoticeBlock({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.notice}>
      <View style={[styles.noticeIcon, { backgroundColor: theme.chip }]}>
        <Icon name={icon} size={20} color={theme.muted} strokeWidth={1.8} />
      </View>
      <Text style={[styles.noticeTitle, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.noticeBody, { color: theme.muted }]}>{body}</Text>
      {actionLabel && onAction ? (
        <SmallButton label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

function SmallButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <PressableScale
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      scaleTo={0.96}
      style={[
        styles.smallButton,
        { backgroundColor: theme.chip, borderColor: theme.line },
      ]}
      accessibilityLabel={label}
    >
      <Text style={[styles.smallButtonLabel, { color: theme.inkSoft }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

function LoadingBars() {
  const { theme } = useTheme();
  const widths = ['92%', '78%', '85%', '60%'] as const;

  return (
    <View style={styles.loadingBars}>
      {widths.map((width, index) => (
        <View
          key={width}
          style={[
            styles.loadingBar,
            {
              width,
              backgroundColor: theme.chip,
              opacity: index === widths.length - 1 ? 0.7 : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

function DiscussionToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { theme } = useTheme();
  const progress = useAnimatedValue(value ? 1 : 0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [progress, value]);

  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onChange(!value);
      }}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel="Look up discussions"
      accessibilityState={{ checked: value }}
      style={[
        styles.toggle,
        {
          backgroundColor: value ? theme.accent : theme.chip,
          borderColor: value ? theme.accent : theme.line,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.toggleKnob,
          {
            backgroundColor: value ? theme.accentInk : theme.surface,
            borderColor: value ? 'transparent' : theme.line,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 18],
                }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 25,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    gap: 2,
    marginHorizontal: 20,
    marginTop: 2,
    marginBottom: 8,
  },
  segmentOption: {
    flex: 1,
    height: 34,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentActive: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  segmentLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  segmentCount: {
    fontFamily: fonts.semibold,
    fontSize: 10,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  threadStats: {
    flex: 1,
    gap: 3,
  },
  statsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  platformTag: {
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  platformTagText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    includeFontPadding: false,
  },
  stat: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  statDot: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  byline: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  openButton: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    includeFontPadding: false,
  },
  commentsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  commentsContent: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 8,
  },
  comment: {
    marginBottom: 14,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 3,
  },
  commentAuthor: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 11.5,
  },
  commentTime: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
  commentText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20.5,
  },
  emptyComments: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 8,
  },
  truncated: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 8,
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  notice: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 7,
  },
  noticeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  noticeTitle: {
    fontFamily: fonts.medium,
    fontSize: 15.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  noticeBody: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 330,
  },
  smallButton: {
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  smallButtonLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  inlineError: {
    alignItems: 'flex-start',
    gap: 5,
    paddingVertical: 6,
  },
  inlineTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  inlineBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  loadingBars: {
    width: '100%',
    gap: 7,
    marginTop: 6,
  },
  loadingBar: {
    height: 11,
    borderRadius: 5.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    marginTop: 4,
  },
  footerCopy: {
    flex: 1,
    gap: 2,
  },
  footerTitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  footerBody: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    lineHeight: 14.5,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

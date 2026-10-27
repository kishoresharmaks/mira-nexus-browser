export type Shortcut = {
  id: string;
  title: string;
  url: string;
  host: string;
};

export type HistoryEntry = {
  id: string;
  title: string;
  url: string;
  host: string;
  visitedAt: number;
};

export type PageSnapshot = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
};

export type BrowserHandle = {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  load: (url: string) => void;
  setActive: (active: boolean) => void;
};

export type TrailPage = {
  id: string;
  title: string;
  url: string;
  host: string;
  visitedAt: number;
};

/**
 * A trail is a run of pages visited without a long pause. It owns copies of
 * its pages, so clearing or trimming the flat history never breaks a trail.
 */
export type Trail = {
  id: string;
  startedAt: number;
  endedAt: number;
  pages: TrailPage[];
  name?: string;
};

export type BrowserTab = {
  id: string;
  initialUrl: string;
  createdAt: number;
  /** Drives eviction when the shelf is full. */
  lastActiveAt: number;
  /** A tab stays cold until its page is shown for the first time. */
  mounted: boolean;
  /**
   * Private tabs never write history or trails and never send a page address to
   * a discussion service. On iOS they also get a non-persistent cookie store;
   * Android's WebView shares one cookie store across all tabs. `initialUrl` is
   * empty until the reader chooses the first page.
   */
  private: boolean;
  snapshot: PageSnapshot;
};

export type CuratedPage = {
  id: string;
  title: string;
  url: string;
  host: string;
  category: string;
  note: string;
  readMinutes: number;
};

export type ToastAction = {
  label: string;
  onPress: () => void;
};

export type InputTarget = {
  url: string;
  kind: 'url' | 'search';
  host: string;
};

export type CommunityPlatform = 'hn' | 'lobsters';

/**
 * One public discussion of the page currently open. Points and comment counts
 * are snapshots from the source; the thread itself lives on HN or Lobsters.
 */
export type CommunityThread = {
  id: string;
  platform: CommunityPlatform;
  title: string;
  url: string;
  discussionUrl: string;
  points: number;
  commentsCount: number;
  author: string;
  createdAt: number;
};

export type CommunityComment = {
  id: string;
  author: string;
  createdAt: number;
  text: string;
  level: number;
  children: CommunityComment[];
};

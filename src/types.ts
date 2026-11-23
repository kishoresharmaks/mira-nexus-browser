export type Shortcut = {
  id: string;
  title: string;
  url: string;
  host: string;
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: number;
  isSystem?: boolean;
};

export type Bookmark = {
  id: string;
  url: string;
  title: string;
  host: string;
  collectionId: string;
  description?: string;
  notes?: string;
  createdAt: number;
};

export type DownloadItem = {
  id: string;
  url: string;
  filename: string;
  fileUri: string;
  fileSize: number;
  mimeType?: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  startedAt: number;
  completedAt?: number;
};

export type WebNote = {
  id: string;
  url: string;
  host: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type HistoryEntry = {
  id: string;
  title: string;
  url: string;
  host: string;
  visitedAt: number;
};

export type ExtractedArticle = {
  title: string;
  author: string;
  text: string;
  html: string;
  url: string;
  host: string;
  wordCount: number;
  readMinutes: number;
};

export type AiSummary = {
  tldr: string;
  takeaways: string[];
  readingTimeMinutes: number;
  timeSavedMinutes: number;
};

export type PageSnapshot = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  article?: ExtractedArticle | null;
};

export type BrowserHandle = {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  load: (url: string) => void;
  setActive: (active: boolean) => void;
  extractArticle: () => void;
  clearCache?: () => void;
  clearOriginStorage?: () => void;
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

export type DiscoveryContentType =
  | 'WEBSITE'
  | 'ARTICLE'
  | 'DEVELOPER_TOOL'
  | 'ESSAY'
  | 'IDEA'
  | 'CRAFT'
  | 'READING'
  | 'AI_TOOL'
  | 'REFERENCE'
  | 'NEWS'
  | 'VIDEO'
  | 'OTHER';

export type DiscoveryDailySlot =
  | 'website_of_day'
  | 'article_of_day'
  | 'developer_discovery'
  | null;

export type DiscoveryCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  enabled: boolean;
  color?: string;
  contentTypes?: DiscoveryContentType[];
};

export type DiscoveryItem = {
  id: string;
  title: string;
  url: string;
  host: string;
  category: string;
  note: string;
  readMinutes: number;
  imageUrl?: string;
  contentType: DiscoveryContentType;
  categoryId: string;
  tags: string[];
  author?: string;
  publishedAt?: string;
  expiresAt?: string;
  order: number;
  enabled: boolean;
  featured: boolean;
  dailySlot?: DiscoveryDailySlot | string;
  language?: string;
  country?: string;
  metadata?: Record<string, unknown>;
};

export type CuratedPage = DiscoveryItem;

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

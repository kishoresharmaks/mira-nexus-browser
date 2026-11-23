'use client';

import { useEffect, useId, useState } from 'react';
import {
  SEARCH_CATEGORIES,
  buildSearchUrl,
  hostOf,
  isValidHttpsUrl,
  type SearchCategoryKey,
  type SearchProvider,
} from '@/lib/catalog';

type Preset = {
  name: string;
  searchUrl: string;
  suggestUrl?: string;
  note?: string;
};

const CATEGORY_PRESETS: Record<SearchCategoryKey, Preset[]> = {
  web: [
    {
      name: 'Google',
      searchUrl: 'https://www.google.com/search?q={query}',
      suggestUrl: 'https://suggestqueries.google.com/complete/search?client=chrome&q={query}',
      note: 'The global standard search index.',
    },
    {
      name: 'DuckDuckGo',
      searchUrl: 'https://duckduckgo.com/?q={query}',
      suggestUrl: 'https://duckduckgo.com/ac/?q={query}&type=list',
      note: 'Privacy-focused web search with no tracking.',
    },
    {
      name: 'Brave Search',
      searchUrl: 'https://search.brave.com/search?q={query}',
      suggestUrl: 'https://search.brave.com/api/suggest?q={query}',
      note: 'Independent web index powered by Brave.',
    },
    {
      name: 'Startpage',
      searchUrl: 'https://www.startpage.com/sp/search?query={query}',
      note: 'Google search results through a privacy proxy.',
    },
    {
      name: 'Bing',
      searchUrl: 'https://www.bing.com/search?q={query}',
      suggestUrl: 'https://api.bing.com/osjson.aspx?query={query}',
      note: 'Microsoft Bing search engine.',
    },
    {
      name: 'Kagi',
      searchUrl: 'https://kagi.com/search?q={query}',
      note: 'Ad-free premium search engine.',
    },
    {
      name: 'Ecosia',
      searchUrl: 'https://www.ecosia.org/search?q={query}',
      note: 'Search engine that plants trees.',
    },
  ],
  ai: [
    {
      name: 'Perplexity AI',
      searchUrl: 'https://www.perplexity.ai/search?q={query}',
      note: 'Conversational search engine with citations and live data.',
    },
    {
      name: 'Brave AI Leo',
      searchUrl: 'https://search.brave.com/search?q={query}&source=llm',
      note: 'Summarized AI synthesis over independent web index.',
    },
    {
      name: 'Phind',
      searchUrl: 'https://www.phind.com/search?q={query}',
      note: 'AI search engine optimized for developers and technical queries.',
    },
    {
      name: 'You.com',
      searchUrl: 'https://you.com/search?q={query}&tbm=youchat',
      note: 'Multi-modal AI assistant and web search engine.',
    },
    {
      name: 'Kagi Assistant',
      searchUrl: 'https://kagi.com/assistant?q={query}',
      note: 'Private conversational AI research assistant.',
    },
  ],
  images: [
    {
      name: 'Unsplash',
      searchUrl: 'https://unsplash.com/s/photos/{query}',
      note: 'High-resolution freely-usable imagery by creators.',
    },
    {
      name: 'Wikimedia Commons',
      searchUrl: 'https://commons.wikimedia.org/w/index.php?search={query}&title=Special%3ASearch&go=Go',
      note: 'Free educational and historical media archive.',
    },
    {
      name: 'DuckDuckGo Images',
      searchUrl: 'https://duckduckgo.com/?q={query}&iax=images&ia=images',
      note: 'Private image discovery without tracking.',
    },
    {
      name: 'Flickr Creative Commons',
      searchUrl: 'https://www.flickr.com/search/?text={query}&license=2%2C3%2C4%2C5%2C6%2C9',
      note: 'Community photography under Creative Commons.',
    },
    {
      name: 'Openverse',
      searchUrl: 'https://openverse.org/search/image?q={query}',
      note: 'Extensive openly licensed media search.',
    },
  ],
  news: [
    {
      name: 'Google News',
      searchUrl: 'https://news.google.com/search?q={query}',
      note: 'Aggregated news headlines and publisher coverage.',
    },
    {
      name: 'Associated Press',
      searchUrl: 'https://apnews.com/search?q={query}',
      note: 'Direct wire journalism with verified reporting.',
    },
    {
      name: 'Reuters',
      searchUrl: 'https://www.reuters.com/site-search/?query={query}',
      note: 'Global financial and international wire news.',
    },
    {
      name: 'DuckDuckGo News',
      searchUrl: 'https://duckduckgo.com/?q={query}&iar=news&ia=news',
      note: 'Track-free news search across publishers.',
    },
    {
      name: 'BBC News',
      searchUrl: 'https://www.bbc.co.uk/search?q={query}&filter=news',
      note: 'International news and independent reporting.',
    },
  ],
  videos: [
    {
      name: 'YouTube',
      searchUrl: 'https://www.youtube.com/results?search_query={query}',
      note: 'World largest video catalog and creator platform.',
    },
    {
      name: 'Vimeo',
      searchUrl: 'https://vimeo.com/search?q={query}',
      note: 'High quality video platform for independent creators.',
    },
    {
      name: 'Dailymotion',
      searchUrl: 'https://www.dailymotion.com/search/{query}',
      note: 'Video discovery platform.',
    },
    {
      name: 'PeerTube',
      searchUrl: 'https://sepiasearch.org/search?search={query}',
      note: 'Decentralized federated video network search.',
    },
  ],
};

type Props = {
  isOpen: boolean;
  category: SearchCategoryKey;
  defaultPriority: number;
  busy: boolean;
  onClose: () => void;
  onAdd: (data: {
    category: SearchCategoryKey;
    name: string;
    searchUrl: string;
    suggestUrl?: string;
    note?: string;
    priority: number;
    countries: string[];
    providerType: 'external' | 'api';
  }) => void;
};

export function AddProviderModal({
  isOpen,
  category: initialCategory,
  defaultPriority,
  busy,
  onClose,
  onAdd,
}: Props) {
  const [category, setCategory] = useState<SearchCategoryKey>(initialCategory);
  const [name, setName] = useState('');
  const [searchUrl, setSearchUrl] = useState('');
  const [suggestUrl, setSuggestUrl] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState(defaultPriority);
  const [countriesText, setCountriesText] = useState('ALL');
  const [providerType, setProviderType] = useState<'external' | 'api'>('external');
  const [error, setError] = useState<string | null>(null);

  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setName('');
      setSearchUrl('');
      setSuggestUrl('');
      setNote('');
      setPriority(defaultPriority);
      setCountriesText('ALL');
      setProviderType('external');
      setError(null);
    }
  }, [isOpen, initialCategory, defaultPriority]);

  if (!isOpen) return null;

  const presets = CATEGORY_PRESETS[category] ?? [];

  const handleApplyPreset = (p: Preset) => {
    setName(p.name);
    setSearchUrl(p.searchUrl);
    setSuggestUrl(p.suggestUrl ?? '');
    setNote(p.note ?? '');
    setError(null);
  };

  const handleInsertQueryPlaceholder = () => {
    if (!searchUrl.includes('{query}') && !searchUrl.includes('%s')) {
      const sep = searchUrl.includes('?') ? '&q=' : '?q=';
      setSearchUrl(`${searchUrl}${sep}{query}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUrl = searchUrl.trim();

    if (!cleanName) {
      setError('Please provide a name for this search provider.');
      return;
    }
    if (!cleanUrl) {
      setError('Please provide a search URL template.');
      return;
    }
    if (!isValidHttpsUrl(cleanUrl, { allowTemplate: true })) {
      setError('Search URL must be a valid https URL containing {query} or %s placeholder.');
      return;
    }
    if (suggestUrl.trim() && !isValidHttpsUrl(suggestUrl.trim(), { allowTemplate: true })) {
      setError('Suggestion URL must be a valid https URL containing {query} or %s placeholder.');
      return;
    }

    const countries = countriesText
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    onAdd({
      category,
      name: cleanName,
      searchUrl: cleanUrl,
      suggestUrl: suggestUrl.trim() || undefined,
      note: note.trim() || undefined,
      priority: Math.max(1, priority),
      countries: countries.length > 0 ? countries : ['ALL'],
      providerType,
    });
  };

  const sampleProvider: SearchProvider = {
    id: 'preview',
    name: name || 'Provider',
    category,
    searchUrl: searchUrl || 'https://example.com/search?q={query}',
    note,
    enabled: true,
    priority,
    countries: ['ALL'],
    providerType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const previewUrl = searchUrl ? buildSearchUrl(sampleProvider, 'example query') : null;
  const host = hostOf(searchUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 18, 14, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'var(--color-sheet)',
          border: 'var(--rule-hair) solid var(--color-rule-strong)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: 'var(--rule-hair) solid var(--color-rule)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 id={titleId} style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-display)' }}>
              Add Search Provider
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              Configure a new search preset for client applications
            </p>
          </div>
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={onClose}
            disabled={busy}
            style={{ fontSize: '1.1rem', lineHeight: 1, padding: '0.25rem 0.5rem' }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.25rem' }}>
          {error ? (
            <div
              style={{
                background: 'var(--color-danger-soft)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)',
                padding: '0.65rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          ) : null}

          {/* Category Selector */}
          <div className="field" style={{ marginBottom: '1rem' }}>
            <label className="field-label" htmlFor="modal-cat">
              Category
            </label>
            <select
              id="modal-cat"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as SearchCategoryKey)}
              disabled={busy}
            >
              {SEARCH_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label} ({c.key})
                </option>
              ))}
            </select>
          </div>

          {/* Preset Chips */}
          {presets.length > 0 ? (
            <div style={{ marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quick Preset Templates (Click to fill)
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="btn btn-quiet btn-small"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      background: name === p.name ? 'var(--color-accent)' : 'var(--color-paper-2)',
                      color: name === p.name ? '#fff' : 'var(--color-ink)',
                    }}
                    onClick={() => handleApplyPreset(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Provider Name */}
          <div className="field" style={{ marginBottom: '1rem' }}>
            <label className="field-label" htmlFor="modal-name">
              Provider Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="modal-name"
              className="input"
              placeholder="e.g. Brave Search"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              disabled={busy}
            />
          </div>

          {/* Search URL */}
          <div className="field" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="field-label" htmlFor="modal-url">
                Search URL Template <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <button
                type="button"
                className="btn btn-quiet btn-small"
                style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', height: 'auto' }}
                onClick={handleInsertQueryPlaceholder}
              >
                + Insert &#123;query&#125;
              </button>
            </div>
            <input
              id="modal-url"
              className="input"
              placeholder="https://search.example.com/?q={query}"
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              required
              disabled={busy}
            />
            <span className="field-hint" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Must use <code>&#123;query&#125;</code> or <code>%s</code> placeholder where search text goes.
            </span>
          </div>

          {/* Preview Box */}
          {previewUrl ? (
            <div
              style={{
                background: 'var(--color-paper)',
                border: 'var(--rule-hair) solid var(--color-rule)',
                borderRadius: '4px',
                padding: '0.5rem 0.75rem',
                marginBottom: '1rem',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Live URL Preview ({host})
              </span>
              <div
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--color-ink)',
                  wordBreak: 'break-all',
                  marginTop: '0.2rem',
                }}
              >
                {previewUrl}
              </div>
            </div>
          ) : null}

          {/* Optional Suggest URL */}
          <div className="field" style={{ marginBottom: '1rem' }}>
            <label className="field-label" htmlFor="modal-suggest-url">
              Suggestion URL (Optional)
            </label>
            <input
              id="modal-suggest-url"
              className="input"
              placeholder="https://api.example.com/suggest?q={query}"
              value={suggestUrl}
              onChange={(e) => setSuggestUrl(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              disabled={busy}
            />
          </div>

          {/* Priority & Countries Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="field">
              <label className="field-label" htmlFor="modal-priority">
                Priority
              </label>
              <input
                id="modal-priority"
                type="number"
                min={1}
                max={99}
                className="input"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                disabled={busy}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="modal-countries">
                Countries
              </label>
              <input
                id="modal-countries"
                className="input"
                value={countriesText}
                onChange={(e) => setCountriesText(e.target.value)}
                placeholder="ALL, US, IN"
                disabled={busy}
              />
            </div>
          </div>

          {/* Description */}
          <div className="field" style={{ marginBottom: '1.25rem' }}>
            <label className="field-label" htmlFor="modal-note">
              Description / Notes (Optional)
            </label>
            <input
              id="modal-note"
              className="input"
              placeholder="Short note about provider index or privacy"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              disabled={busy}
            />
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: 'var(--rule-hair) solid var(--color-rule)',
            }}
          >
            <button
              type="button"
              className="btn btn-quiet"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !name.trim() || !searchUrl.trim()}
            >
              Add Provider to Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

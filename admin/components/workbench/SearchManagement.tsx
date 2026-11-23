'use client';

import { useId, useRef, useState } from 'react';
import {
  SEARCH_CATEGORIES,
  buildSearchUrl,
  hostOf,
  type SearchCategoryConfig,
  type SearchCategoryKey,
  type SearchCategoriesConfig,
  type SearchProvider,
} from '@/lib/catalog';
import { AddProviderModal } from './AddProviderModal';
import { SearchProviderEditor } from './SearchProviderEditor';

type Props = {
  categories: SearchCategoriesConfig;
  selectedProviderId: string | null;
  busy: boolean;
  onSelectProvider: (id: string) => void;
  onUpdateProvider: (category: SearchCategoryKey, providerId: string, patch: Partial<SearchProvider>) => void;
  onAddProvider: (category: SearchCategoryKey, template?: Partial<SearchProvider>) => void;
  onDeleteProvider: (category: SearchCategoryKey, providerId: string) => void;
  onMakeDefault: (category: SearchCategoryKey, providerId: string) => void;
  onUpdateCategory: (category: SearchCategoryKey, patch: Partial<SearchCategoryConfig>) => void;
};

export function SearchManagement({
  categories,
  selectedProviderId,
  busy,
  onSelectProvider,
  onUpdateProvider,
  onAddProvider,
  onDeleteProvider,
  onMakeDefault,
  onUpdateCategory,
}: Props) {
  const [activeCategoryKey, setActiveCategoryKey] = useState<SearchCategoryKey>('web');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const editorRef = useRef<HTMLDivElement>(null);

  const activeCategory = categories[activeCategoryKey] ?? {
    enabled: true,
    defaultProvider: '',
    providers: [],
  };

  const providers = activeCategory.providers ?? [];
  const filteredProviders = searchFilter.trim()
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.searchUrl.toLowerCase().includes(searchFilter.toLowerCase()),
      )
    : providers;

  const selectedProvider =
    providers.find((p) => p.id === selectedProviderId) ??
    providers[0] ??
    null;

  const handleSelectProvider = (id: string) => {
    onSelectProvider(id);
    setMobileView('editor');
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleModalAdd = (data: {
    category: SearchCategoryKey;
    name: string;
    searchUrl: string;
    suggestUrl?: string;
    note?: string;
    priority: number;
    countries: string[];
    providerType: 'external' | 'api';
  }) => {
    setIsAddModalOpen(false);
    setActiveCategoryKey(data.category);
    setSearchFilter('');
    onAddProvider(data.category, {
      name: data.name,
      searchUrl: data.searchUrl,
      suggestUrl: data.suggestUrl,
      note: data.note,
      priority: data.priority,
      countries: data.countries,
      providerType: data.providerType,
      enabled: true,
    });
    setMobileView('editor');
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="search-management">
      {/* Category Tabs Navigation */}
      <nav className="search-category-nav" aria-label="Search Categories">
        {SEARCH_CATEGORIES.map((cat) => {
          const catConfig = categories[cat.key];
          const isActive = cat.key === activeCategoryKey;
          const liveCount = catConfig?.providers?.filter((p) => p.enabled).length ?? 0;
          const totalCount = catConfig?.providers?.length ?? 0;
          const isEnabled = catConfig?.enabled !== false;

          return (
            <button
              key={cat.key}
              type="button"
              className="search-category-tab"
              data-active={isActive ? 'true' : 'false'}
              data-enabled={isEnabled ? 'true' : 'false'}
              onClick={() => {
                setActiveCategoryKey(cat.key);
                setSearchFilter('');
                const first = catConfig?.providers?.[0];
                if (first) {
                  onSelectProvider(first.id);
                }
              }}
            >
              <span>{cat.label}</span>
              <span
                className="tab-badge"
                style={
                  !isEnabled
                    ? { background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }
                    : undefined
                }
              >
                {isEnabled ? `${liveCount}/${totalCount}` : 'Off'}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Category Settings Header Bar */}
      <div className="search-controls-bar">
        <div className="search-controls-left">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={activeCategory.enabled}
              disabled={busy}
              onChange={(e) => onUpdateCategory(activeCategoryKey, { enabled: e.target.checked })}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-accent)' }}
            />
            <span>Enable {SEARCH_CATEGORIES.find((c) => c.key === activeCategoryKey)?.label} Category</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Default:</span>
            <select
              className="input"
              style={{ height: '2.1rem', padding: '0 0.5rem', fontSize: '0.85rem' }}
              value={activeCategory.defaultProvider}
              disabled={busy || !activeCategory.enabled}
              onChange={(e) => onMakeDefault(activeCategoryKey, e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.id} {!p.enabled ? '(Hidden)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="search-controls-right">
          <input
            className="search-filter-input"
            placeholder="Filter providers…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-small"
            disabled={busy}
            onClick={handleOpenAdd}
          >
            + Add Provider
          </button>
        </div>
      </div>

      {/* Mobile / Narrow Screen Tab Switcher */}
      <div className="search-mobile-tabs" style={{ display: 'none', marginBottom: '1rem', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-small"
          style={{
            flex: 1,
            background: mobileView === 'list' ? 'var(--color-accent)' : 'var(--color-sheet)',
            color: mobileView === 'list' ? '#fff' : 'var(--color-ink)',
            borderColor: 'var(--color-rule)',
          }}
          onClick={() => setMobileView('list')}
        >
          Providers List ({filteredProviders.length})
        </button>
        <button
          type="button"
          className="btn btn-small"
          style={{
            flex: 1,
            background: mobileView === 'editor' ? 'var(--color-accent)' : 'var(--color-sheet)',
            color: mobileView === 'editor' ? '#fff' : 'var(--color-ink)',
            borderColor: 'var(--color-rule)',
          }}
          onClick={() => setMobileView('editor')}
        >
          Provider Details
        </button>
      </div>

      {/* Grid: Providers List & Provider Editor */}
      <div className="work-grid search-grid">
        {/* Providers Table Panel */}
        <div
          className={`panel search-panel-list ${mobileView === 'editor' ? 'search-mobile-hidden' : ''}`}
        >
          <div className="panel-head">
            <div>
              <h3 className="panel-title" style={{ fontSize: '1.1rem' }}>
                {SEARCH_CATEGORIES.find((c) => c.key === activeCategoryKey)?.label} Providers
              </h3>
              <p className="panel-sub">
                {providers.filter((p) => p.enabled).length} live of {providers.length} total.
              </p>
            </div>
            <div className="panel-actions">
              <button
                type="button"
                className="btn btn-quiet btn-small"
                onClick={handleOpenAdd}
                disabled={busy}
              >
                + Add
              </button>
            </div>
          </div>

          {filteredProviders.length === 0 ? (
            <div className="empty">
              <p className="empty-title">No providers found.</p>
              <p className="empty-copy">
                {searchFilter
                  ? 'No providers matched your filter query.'
                  : `Add a search provider to enable ${activeCategoryKey} search.`}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={handleOpenAdd}
                disabled={busy}
              >
                + Add Provider
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Provider</th>
                    <th scope="col" style={{ width: '70px' }}>Priority</th>
                    <th scope="col" style={{ width: '130px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((p) => {
                    const isSelected = p.id === (selectedProvider?.id ?? selectedProviderId);
                    const isDefault = p.id === activeCategory.defaultProvider;
                    const monogram = (p.name || p.id).slice(0, 2).toUpperCase();

                    return (
                      <tr key={p.id} data-selected={isSelected ? 'true' : undefined}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                background: isSelected ? 'var(--color-accent)' : 'var(--color-paper-3)',
                                color: isSelected ? '#fff' : 'var(--color-ink)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {monogram}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <button
                                type="button"
                                className="row-name"
                                onClick={() => handleSelectProvider(p.id)}
                                aria-current={isSelected ? 'true' : undefined}
                                style={{ textAlign: 'left', cursor: 'pointer' }}
                              >
                                {p.name || 'Untitled provider'}
                              </button>
                              <span className="row-sub" title={p.searchUrl}>
                                {hostOf(p.searchUrl) || 'No URL configured'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                            #{p.priority ?? 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                            {isDefault ? (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  background: 'var(--color-accent)',
                                  color: '#fff',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '2px',
                                }}
                              >
                                Default
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className="pill"
                              data-live={p.enabled ? 'true' : 'false'}
                              style={{ fontSize: '0.75rem', cursor: 'pointer', border: 'none' }}
                              title="Click to toggle Live/Hidden status"
                              onClick={() =>
                                onUpdateProvider(activeCategoryKey, p.id, { enabled: !p.enabled })
                              }
                            >
                              {p.enabled ? 'Live' : 'Hidden'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Provider Editor */}
        <div
          className={`editor search-editor-panel ${mobileView === 'list' ? 'search-mobile-hidden' : ''}`}
          ref={editorRef}
        >
          {/* Mobile Back Button */}
          <div className="search-mobile-back" style={{ display: 'none', marginBottom: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-quiet btn-small"
              onClick={() => setMobileView('list')}
            >
              ← Back to Providers List
            </button>
          </div>

          {selectedProvider ? (
            <SearchProviderEditor
              key={selectedProvider.id}
              provider={selectedProvider}
              isDefault={selectedProvider.id === activeCategory.defaultProvider}
              busy={busy}
              onUpdate={(patch) => onUpdateProvider(activeCategoryKey, selectedProvider.id, patch)}
              onMakeDefault={() => onMakeDefault(activeCategoryKey, selectedProvider.id)}
              onDelete={() => onDeleteProvider(activeCategoryKey, selectedProvider.id)}
            />
          ) : (
            <div className="empty">
              <p className="empty-title">No provider selected.</p>
              <p className="empty-copy">
                Choose a provider from the list on the left, or add a new one.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={handleOpenAdd}
                disabled={busy}
              >
                + Add Provider
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Provider Modal */}
      <AddProviderModal
        isOpen={isAddModalOpen}
        category={activeCategoryKey}
        defaultPriority={(providers.length ?? 0) + 1}
        busy={busy}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleModalAdd}
      />
    </div>
  );
}

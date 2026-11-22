'use client';

import { formatUtcDateTime } from '@/lib/catalog';

type Props = {
  totalProviders: number;
  liveProviders: number;
  hiddenProviders: number;
  activeCategoriesCount: number;
  totalCategoriesCount: number;
  revision: number;
  publishedAt: string | null;
  onOpenVersions: () => void;
};

export function SearchDashboardOverview({
  totalProviders,
  liveProviders,
  hiddenProviders,
  activeCategoriesCount,
  totalCategoriesCount,
  revision,
  publishedAt,
  onOpenVersions,
}: Props) {
  return (
    <div className="search-overview-card">
      <div className="panel-head">
        <div>
          <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>
            Search Configuration Overview
          </h2>
          <p className="panel-sub">
            Centralized dynamic search provider orchestration across Web, AI, Images, News, and Videos.
          </p>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={onOpenVersions}
            title="View revision history and restore previous versions"
          >
            Revisions & Rollback
          </button>
        </div>
      </div>

      <div className="search-metrics-grid">
        <div className="search-metric-box">
          <div className="search-metric-label">Total Providers</div>
          <div className="search-metric-value">{totalProviders}</div>
          <div className="search-metric-sub">Across 5 categories</div>
        </div>

        <div className="search-metric-box">
          <div className="search-metric-label">Active / Live</div>
          <div className="search-metric-value" style={{ color: 'var(--color-accent)' }}>
            {liveProviders}
          </div>
          <div className="search-metric-sub">Served to users</div>
        </div>

        <div className="search-metric-box">
          <div className="search-metric-label">Disabled / Hidden</div>
          <div className="search-metric-value" style={{ color: 'var(--color-muted)' }}>
            {hiddenProviders}
          </div>
          <div className="search-metric-sub">Draft-only state</div>
        </div>

        <div className="search-metric-box">
          <div className="search-metric-label">Categories Active</div>
          <div className="search-metric-value">
            {activeCategoriesCount} <span style={{ fontSize: '1rem', color: 'var(--color-muted)', fontWeight: 400 }}>/ {totalCategoriesCount}</span>
          </div>
          <div className="search-metric-sub">
            {activeCategoriesCount === totalCategoriesCount ? 'All enabled' : `${totalCategoriesCount - activeCategoriesCount} disabled`}
          </div>
        </div>

        <div className="search-metric-box">
          <div className="search-metric-label">Live Version</div>
          <div className="search-metric-value">v{revision}</div>
          <div className="search-metric-sub" title={publishedAt ? formatUtcDateTime(publishedAt) : 'Bundled'}>
            {publishedAt ? formatUtcDateTime(publishedAt) : 'Bundled'}
          </div>
        </div>
      </div>
    </div>
  );
}

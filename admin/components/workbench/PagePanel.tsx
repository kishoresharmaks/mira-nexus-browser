'use client';

import { hostOf, type Page } from '@/lib/catalog';

type Props = {
  pages: Page[];
  liveCount: number;
  selectedId: string | null;
  busy: boolean;
  maxPages: number;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onOpenCategories?: () => void;
};

export function PagePanel({
  pages,
  liveCount,
  selectedId,
  busy,
  maxPages,
  onAdd,
  onSelect,
  onOpenCategories,
}: Props) {
  const atLimit = pages.length >= maxPages;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Discover Today</h2>
          <p className="panel-sub">
            {liveCount} live of {pages.length} items. Content is dynamically synchronized to Nexus mobile app.
          </p>
        </div>
        <div className="panel-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          {onOpenCategories ? (
            <button
              type="button"
              className="btn btn-quiet btn-small"
              onClick={onOpenCategories}
              disabled={busy}
            >
              Categories
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={onAdd}
            disabled={busy || atLimit}
          >
            Add item
          </button>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="empty">
          <p className="empty-title">The discovery shelf is empty.</p>
          <p className="empty-copy">
            Add discovery items and editorial categories to publish content to Nexus Browser.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={onAdd}
              disabled={busy}
            >
              Add First Item
            </button>
            {onOpenCategories ? (
              <button
                type="button"
                className="btn btn-quiet btn-small"
                onClick={onOpenCategories}
                disabled={busy}
              >
                Manage Categories
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Discovery items in the draft</caption>
            <thead>
              <tr>
                <th scope="col">Title & Host</th>
                <th scope="col">Category</th>
                <th scope="col">Slot</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const selected = page.id === selectedId;
                return (
                  <tr
                    key={page.id}
                    data-selected={selected ? 'true' : undefined}
                  >
                    <td>
                      <button
                        type="button"
                        className="row-name"
                        onClick={() => onSelect(page.id)}
                        aria-current={selected ? 'true' : undefined}
                      >
                        {page.title || 'Untitled item'}
                      </button>
                      <span className="row-sub">
                        {hostOf(page.url) || 'No URL yet'}
                        {page.contentType ? ` · ${page.contentType}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className="status status--hidden">
                        {page.category || 'GENERAL'}
                      </span>
                    </td>
                    <td>
                      {page.dailySlot ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.35rem',
                            borderRadius: '3px',
                            backgroundColor: 'var(--color-rule, #E5E5E5)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {page.dailySlot === 'website_of_day'
                            ? 'Website'
                            : page.dailySlot === 'article_of_day'
                              ? 'Article'
                              : page.dailySlot === 'developer_discovery'
                                ? 'Developer'
                                : page.dailySlot}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          page.enabled ? 'status' : 'status status--hidden'
                        }
                      >
                        {page.enabled ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {atLimit ? (
        <p className="panel-sub">
          The list is at its limit of {maxPages} pages.
        </p>
      ) : null}
    </div>
  );
}

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
};

export function PagePanel({
  pages,
  liveCount,
  selectedId,
  busy,
  maxPages,
  onAdd,
  onSelect,
}: Props) {
  const atLimit = pages.length >= maxPages;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Today&rsquo;s page</h2>
          <p className="panel-sub">
            {liveCount} live of {pages.length}. The daily rotation only uses
            live pages, in this shelf order.
          </p>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={onAdd}
            disabled={busy || atLimit}
          >
            Add page
          </button>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="empty">
          <p className="empty-title">The shelf is empty.</p>
          <p className="empty-copy">
            Nexus cannot publish a Today rotation with no pages. Add one to
            begin.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={onAdd}
            disabled={busy}
          >
            Add the first page
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Today pages in the draft</caption>
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">Category</th>
                <th scope="col">Read</th>
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
                        {page.title || 'Untitled page'}
                      </button>
                      <span className="row-sub">
                        {hostOf(page.url) || 'No page URL yet'}
                      </span>
                    </td>
                    <td>
                      <span className="status status--hidden">
                        {page.category || 'Reading'}
                      </span>
                    </td>
                    <td className="cell-figure">
                      {page.readMinutes > 0
                        ? `${page.readMinutes} min`
                        : 'None'}
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

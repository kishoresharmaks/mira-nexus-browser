'use client';

import { hostOf, type Engine } from '@/lib/catalog';

type Props = {
  engines: Engine[];
  defaultEngineId: string;
  liveCount: number;
  selectedId: string | null;
  busy: boolean;
  maxEngines: number;
  onAdd: () => void;
  onSelect: (id: string) => void;
};

export function EnginePanel({
  engines,
  defaultEngineId,
  liveCount,
  selectedId,
  busy,
  maxEngines,
  onAdd,
  onSelect,
}: Props) {
  const atLimit = engines.length >= maxEngines;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Search engines</h2>
          <p className="panel-sub">
            {liveCount} live of {engines.length}. Hidden engines stay in the
            draft and never reach the app.
          </p>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={onAdd}
            disabled={busy || atLimit}
          >
            Add engine
          </button>
        </div>
      </div>

      {engines.length === 0 ? (
        <div className="empty">
          <p className="empty-title">No engines on the shelf.</p>
          <p className="empty-copy">
            Mira cannot publish an empty engine list. Add one to begin.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={onAdd}
            disabled={busy}
          >
            Add the first engine
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Search engines in the draft</caption>
            <thead>
              <tr>
                <th scope="col">Engine</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {engines.map((engine) => {
                const selected = engine.id === selectedId;
                return (
                  <tr
                    key={engine.id}
                    data-selected={selected ? 'true' : undefined}
                  >
                    <td>
                      <button
                        type="button"
                        className="row-name"
                        onClick={() => onSelect(engine.id)}
                        aria-current={selected ? 'true' : undefined}
                      >
                        {engine.name || 'Untitled engine'}
                      </button>
                      <span className="row-sub">
                        {hostOf(engine.searchUrl) || 'No search URL yet'}
                      </span>
                    </td>
                    <td>
                      {engine.id === defaultEngineId ? (
                        <span className="row-default">Default</span>
                      ) : (
                        <span className="status status--hidden">
                          Not default
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          engine.enabled ? 'status' : 'status status--hidden'
                        }
                      >
                        {engine.enabled ? 'Live' : 'Hidden'}
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
          The list is at its limit of {maxEngines} engines.
        </p>
      ) : null}
    </div>
  );
}

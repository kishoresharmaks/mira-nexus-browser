'use client';

import { useEffect, useState } from 'react';
import { formatUtcDateTime } from '@/lib/catalog';

type VersionItem = {
  revision: number;
  publishedAt: string;
  summary?: {
    totalProviders: number;
    activeCategories: number;
  };
};

type Props = {
  isOpen: boolean;
  currentRevision: number;
  onClose: () => void;
  onRollbackSuccess: (newRevision: number) => void;
};

export function VersionRollbackModal({
  isOpen,
  currentRevision,
  onClose,
  onRollbackSuccess,
}: Props) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingBackRev, setRollingBackRev] = useState<number | null>(null);
  const [confirmingVersion, setConfirmingVersion] = useState<VersionItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setConfirmingVersion(null);
    fetch('/api/v1/admin/search/versions')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setVersions(Array.isArray(data.versions) ? data.versions : []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load version history');
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleRollback = async (rev: number) => {
    if (rollingBackRev) return;
    setRollingBackRev(rev);
    setError(null);

    try {
      const res = await fetch(`/api/v1/admin/search/rollback/${rev}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Rollback failed with status ${res.status}`);
      }
      onRollbackSuccess(data.newRevision);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Rollback failed');
    } finally {
      setRollingBackRev(null);
      setConfirmingVersion(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(25, 22, 16, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          background: 'var(--color-sheet)',
          borderRadius: '6px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-head" style={{ borderBottom: '1px solid var(--color-rule)', padding: '1rem 1.25rem' }}>
          <div>
            <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>
              Search Configuration History & Rollback
            </h2>
            <p className="panel-sub">
              Live Revision: <strong>v{currentRevision}</strong>. Restoring a previous version immediately publishes it as a new incremented revision.
            </p>
          </div>
          <button type="button" className="btn btn-quiet btn-small" onClick={onClose}>
            ✕
          </button>
        </div>

        {error ? (
          <div className="notice notice--error" style={{ margin: '1rem', marginBottom: 0 }}>
            <p>{error}</p>
          </div>
        ) : null}

        {confirmingVersion ? (
          <div
            style={{
              margin: '1.25rem',
              padding: '1.25rem',
              background: 'var(--color-paper-2)',
              border: '1px solid var(--color-rule)',
              borderRadius: '6px',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-ink)' }}>
              Confirm Rollback to Revision v{confirmingVersion.revision}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              You are about to restore the catalog configuration from{' '}
              <strong>v{confirmingVersion.revision}</strong> (published on{' '}
              {formatUtcDateTime(confirmingVersion.publishedAt)}).
            </p>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-muted)',
                marginBottom: '1rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-sheet)',
                borderRadius: '4px',
                border: '1px solid var(--color-rule)',
              }}
            >
              <div><strong>Providers:</strong> {confirmingVersion.summary?.totalProviders ?? 0} total</div>
              <div><strong>Active Categories:</strong> {confirmingVersion.summary?.activeCategories ?? 0} active</div>
              <div><strong>New Published Revision:</strong> v{currentRevision + 1} (revision will never decrease)</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-quiet btn-small"
                disabled={Boolean(rollingBackRev)}
                onClick={() => setConfirmingVersion(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-small"
                disabled={Boolean(rollingBackRev)}
                onClick={() => handleRollback(confirmingVersion.revision)}
              >
                {rollingBackRev === confirmingVersion.revision ? 'Restoring…' : `Confirm & Publish v${currentRevision + 1}`}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
            {loading ? (
              <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Loading version history…
              </p>
            ) : versions.length === 0 ? (
              <div className="empty">
                <p className="empty-title">No revision history found.</p>
                <p className="empty-copy">
                  Past versions will be archived here each time a draft is published.
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Revision</th>
                      <th scope="col">Published At</th>
                      <th scope="col">Providers</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((ver) => {
                      const isCurrent = ver.revision === currentRevision;
                      return (
                        <tr key={ver.revision}>
                          <td>
                            <strong>v{ver.revision}</strong>
                            {isCurrent ? (
                              <span
                                style={{
                                  marginLeft: '0.5rem',
                                  fontSize: '0.65rem',
                                  background: 'var(--color-accent)',
                                  color: '#fff',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px',
                                }}
                              >
                                Current
                              </span>
                            ) : null}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {formatUtcDateTime(ver.publishedAt)}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {ver.summary ? `${ver.summary.totalProviders} providers` : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-quiet btn-small"
                              disabled={isCurrent || Boolean(rollingBackRev)}
                              onClick={() => setConfirmingVersion(ver)}
                              style={{ fontSize: '0.8rem' }}
                            >
                              Rollback
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-rule)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-quiet btn-small" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

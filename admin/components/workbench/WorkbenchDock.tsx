'use client';

import { useEffect, useRef, useState } from 'react';

type Confirm = 'publish' | 'discard' | null;

type Props = {
  dirty: boolean;
  saving: boolean;
  publishing: boolean;
  issueCount: number;
  liveEngines: number;
  livePages: number;
  nextRevision: number;
  savedAt: string | null;
  editKey: string;
  onSave: () => void;
  onPublish: () => void;
  onDiscard: () => void;
};

export function WorkbenchDock({
  dirty,
  saving,
  publishing,
  issueCount,
  liveEngines,
  livePages,
  nextRevision,
  savedAt,
  editKey,
  onSave,
  onPublish,
  onDiscard,
}: Props) {
  const [confirm, setConfirm] = useState<Confirm>(null);
  const publishTriggerRef = useRef<HTMLButtonElement>(null);
  const discardTriggerRef = useRef<HTMLButtonElement>(null);
  const publishCancelRef = useRef<HTMLButtonElement>(null);
  const discardCancelRef = useRef<HTMLButtonElement>(null);
  const busy = saving || publishing;

  useEffect(() => {
    if (confirm === 'publish') publishCancelRef.current?.focus();
    else if (confirm === 'discard') discardCancelRef.current?.focus();
  }, [confirm]);

  useEffect(() => {
    setConfirm(null);
  }, [editKey]);

  useEffect(() => {
    if (!confirm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const which = confirm;
      setConfirm(null);
      window.requestAnimationFrame(() => {
        if (which === 'publish') publishTriggerRef.current?.focus();
        else discardTriggerRef.current?.focus();
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirm]);

  const cancel = () => {
    const which = confirm;
    setConfirm(null);
    window.requestAnimationFrame(() => {
      if (which === 'publish') publishTriggerRef.current?.focus();
      else discardTriggerRef.current?.focus();
    });
  };

  const title = publishing
    ? `Publishing revision ${nextRevision}…`
    : saving
      ? 'Saving the draft…'
      : dirty
        ? 'Unsaved changes'
        : savedAt
          ? 'Draft saved'
          : 'Draft loaded from storage';

  const meta =
    issueCount > 0
      ? `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'} block publishing · ${liveEngines} live ${liveEngines === 1 ? 'engine' : 'engines'} · ${livePages} live ${livePages === 1 ? 'page' : 'pages'}`
      : `${liveEngines} live ${liveEngines === 1 ? 'engine' : 'engines'} · ${livePages} live ${livePages === 1 ? 'page' : 'pages'} · next revision ${nextRevision}`;

  return (
    <div className="dock">
      {confirm === 'publish' ? (
        <div className="dock-confirm">
          <div
            className="dock-confirm-inner"
            role="alertdialog"
            aria-labelledby="publish-confirm-title"
          >
            <p id="publish-confirm-title">
              Publish revision <span className="figure">{nextRevision}</span>?
              The app fetches this on its next check; cached copies can take up
              to five minutes.
            </p>
            <div className="confirm-actions">
              <button
                ref={publishCancelRef}
                type="button"
                className="btn btn-quiet btn-small"
                onClick={cancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => {
                  setConfirm(null);
                  onPublish();
                }}
                disabled={busy}
              >
                Publish now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirm === 'discard' ? (
        <div className="dock-confirm">
          <div
            className="dock-confirm-inner"
            role="alertdialog"
            aria-labelledby="discard-confirm-title"
          >
            <p id="discard-confirm-title">
              Discard every edit since the last save? This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                ref={discardCancelRef}
                type="button"
                className="btn btn-quiet btn-small"
                onClick={cancel}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => {
                  setConfirm(null);
                  onDiscard();
                }}
                disabled={busy}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dock-inner">
        <div className="dock-status" aria-live="polite">
          <p className="dock-title">{title}</p>
          <p className="dock-meta">{meta}</p>
        </div>
        <div className="dock-actions">
          <button
            ref={discardTriggerRef}
            type="button"
            className="btn btn-quiet"
            onClick={() => setConfirm('discard')}
            disabled={!dirty || busy}
          >
            Discard
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={onSave}
            disabled={!dirty || busy}
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            ref={publishTriggerRef}
            type="button"
            className="btn btn-primary"
            onClick={() => setConfirm('publish')}
            disabled={issueCount > 0 || busy}
          >
            {publishing ? 'Publishing…' : `Publish revision ${nextRevision}`}
          </button>
        </div>
      </div>
    </div>
  );
}

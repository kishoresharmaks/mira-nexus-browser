'use client';

import { useEffect, useRef, useState } from 'react';
import { hostOf, isValidHttpsUrl, type Page } from '@/lib/catalog';

type Props = {
  page: Page;
  busy: boolean;
  onUpdate: (patch: Partial<Page>) => void;
  onDelete: () => void;
};

export function PageEditor({ page, busy, onUpdate, onDelete }: Props) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deleteArmed) deleteCancelRef.current?.focus();
  }, [deleteArmed]);

  const titleError =
    !page.title && page.enabled ? 'A live page needs a title.' : '';
  const urlError = !page.url
    ? page.enabled
      ? 'A live page needs a URL.'
      : ''
    : !isValidHttpsUrl(page.url, { allowTemplate: false })
      ? 'Use a plain https URL. Query templates are not allowed here.'
      : '';
  const minutesError =
    !Number.isInteger(page.readMinutes) ||
    page.readMinutes < 1 ||
    page.readMinutes > 120
      ? 'Use a whole number between 1 and 120.'
      : '';

  const host = hostOf(page.url);
  const urlValid = isValidHttpsUrl(page.url, { allowTemplate: false });

  const cancelDelete = () => {
    setDeleteArmed(false);
    window.requestAnimationFrame(() => deleteTriggerRef.current?.focus());
  };

  return (
    <>
      <div className="editor-head">
        <div>
          <h2 className="editor-title" id="page-editor-title">
            {page.title || 'Untitled page'}
          </h2>
          <p className="editor-id">id: {page.id}</p>
        </div>
        <span
          className="editor-status"
          data-live={page.enabled ? 'true' : 'false'}
        >
          {page.enabled ? 'Live' : 'Hidden'}
        </span>
      </div>

      <fieldset className="editor-fields" disabled={busy}>
        <div className="editor-body">
          <div className="field">
            <label className="field-label" htmlFor="page-title-input">
              Title
            </label>
            <input
              id="page-title-input"
              className="input"
              value={page.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
              maxLength={100}
              autoComplete="off"
              aria-invalid={titleError ? true : undefined}
              aria-describedby="page-title-hint page-title-error"
            />
            <span className="field-hint" id="page-title-hint">
              Up to 100 characters. This is the headline in Nexus.
            </span>
            <span className="field-error" id="page-title-error">
              {titleError}
            </span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="page-url-input">
              Page URL
            </label>
            <input
              id="page-url-input"
              className="input"
              value={page.url}
              onChange={(event) => onUpdate({ url: event.target.value })}
              maxLength={2048}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="url"
              spellCheck={false}
              aria-invalid={urlError ? true : undefined}
              aria-describedby="page-url-hint page-url-error"
            />
            <span className="field-hint" id="page-url-hint">
              A plain HTTPS address. No query template in this list.
            </span>
            <span className="field-error" id="page-url-error">
              {urlError}
            </span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="page-category-input">
              Category
            </label>
            <input
              id="page-category-input"
              className="input"
              value={page.category}
              onChange={(event) => onUpdate({ category: event.target.value })}
              maxLength={24}
              autoComplete="off"
              aria-describedby="page-category-hint"
            />
            <span className="field-hint" id="page-category-hint">
              Up to 24 characters. The public feed prints it uppercase.
            </span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="page-minutes-input">
              Reading time
            </label>
            <input
              id="page-minutes-input"
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              step={1}
              value={page.readMinutes === 0 ? '' : String(page.readMinutes)}
              onChange={(event) => {
                const raw = event.target.value;
                const minutes = raw === '' ? 0 : Number(raw);
                onUpdate({
                  readMinutes: Number.isFinite(minutes) ? minutes : 0,
                });
              }}
              aria-invalid={minutesError ? true : undefined}
              aria-describedby="page-minutes-hint page-minutes-error"
            />
            <span className="field-hint" id="page-minutes-hint">
              A whole number of minutes, 1 to 120.
            </span>
            <span className="field-error" id="page-minutes-error">
              {minutesError}
            </span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="page-note-input">
              Note
            </label>
            <textarea
              id="page-note-input"
              className="textarea"
              value={page.note}
              onChange={(event) => onUpdate({ note: event.target.value })}
              maxLength={180}
              rows={3}
              aria-describedby="page-note-hint"
            />
            <span className="field-hint" id="page-note-hint">
              {page.note.length} of 180 characters. A sentence of context on
              the card.
            </span>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={page.enabled}
              onChange={(event) =>
                onUpdate({ enabled: event.target.checked })
              }
              aria-describedby="page-live-hint"
            />
            Live in the rotation
          </label>
          <p className="field-hint" id="page-live-hint">
            Hidden pages stay in the draft and are skipped by the daily
            rotation.
          </p>

          <div className="preview">
            <span className="preview-label">
              Page preview{host ? ` · ${host}` : ''}
            </span>
            {urlValid ? (
              <>
                <a
                  className="preview-link"
                  href={page.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit {host || 'the page'}
                </a>
                <span className="preview-url">{page.url}</span>
              </>
            ) : (
              <p className="preview-empty">
                A valid page URL shows a visit link here.
              </p>
            )}
          </div>
        </div>

        <div className="editor-actions">
          <button
            ref={deleteTriggerRef}
            type="button"
            className="btn btn-danger btn-small"
            onClick={() => setDeleteArmed(true)}
            disabled={busy || deleteArmed}
            aria-expanded={deleteArmed}
            aria-controls="delete-page-confirm"
          >
            Delete page
          </button>
          <span className="field-hint editor-hint">
            Changes stay in the draft until you save or publish.
          </span>
        </div>

        {deleteArmed ? (
          <div
            className="confirm-inline"
            id="delete-page-confirm"
            role="alertdialog"
            aria-labelledby="delete-page-message"
          >
            <p id="delete-page-message">
              Delete &ldquo;{page.title || 'this page'}&rdquo; from the draft?
              The rotation closes the gap.
            </p>
            <div className="confirm-actions">
              <button
                ref={deleteCancelRef}
                type="button"
                className="btn btn-quiet btn-small"
                onClick={cancelDelete}
              >
                Keep
              </button>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={onDelete}
                disabled={busy}
              >
                Delete page
              </button>
            </div>
          </div>
        ) : null}
      </fieldset>
    </>
  );
}

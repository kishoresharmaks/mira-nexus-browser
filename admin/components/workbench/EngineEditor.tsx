'use client';

import { useEffect, useRef, useState } from 'react';
import {
  buildSearchUrl,
  hostOf,
  isValidHttpsUrl,
  templateFromExample,
  type Engine,
} from '@/lib/catalog';

type Props = {
  engine: Engine;
  isDefault: boolean;
  busy: boolean;
  onUpdate: (patch: Partial<Engine>) => void;
  onMakeDefault: () => void;
  onDelete: () => void;
};

export function EngineEditor({
  engine,
  isDefault,
  busy,
  onUpdate,
  onMakeDefault,
  onDelete,
}: Props) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deleteArmed) deleteCancelRef.current?.focus();
  }, [deleteArmed]);

  const nameError =
    !engine.name && engine.enabled ? 'A live engine needs a name.' : '';
  const urlError = !engine.searchUrl
    ? engine.enabled
      ? 'A live engine needs a search URL.'
      : ''
    : !isValidHttpsUrl(engine.searchUrl, { allowTemplate: true })
      ? 'Use an https URL with exactly one %s in the path or query.'
      : '';

  const suggestion = templateFromExample(engine.searchUrl);
  const canSuggest = Boolean(suggestion && suggestion !== engine.searchUrl);
  const previewUrl = buildSearchUrl(engine);
  const host = hostOf(engine.searchUrl);

  const cancelDelete = () => {
    setDeleteArmed(false);
    window.requestAnimationFrame(() => deleteTriggerRef.current?.focus());
  };

  return (
    <>
      <div className="editor-head">
        <div>
          <h2 className="editor-title" id="engine-editor-title">
            {engine.name || 'Untitled engine'}
          </h2>
          <p className="editor-id">id: {engine.id}</p>
        </div>
        <span
          className="editor-status"
          data-live={engine.enabled ? 'true' : 'false'}
        >
          {engine.enabled ? 'Live' : 'Hidden'}
        </span>
      </div>

      <fieldset className="editor-fields" disabled={busy}>
        <div className="editor-body">
          <div className="field">
            <label className="field-label" htmlFor="engine-name">
              Name
            </label>
            <input
              id="engine-name"
              className="input"
              value={engine.name}
              onChange={(event) => onUpdate({ name: event.target.value })}
              maxLength={28}
              autoComplete="off"
              aria-invalid={nameError ? true : undefined}
              aria-describedby="engine-name-hint engine-name-error"
            />
            <span className="field-hint" id="engine-name-hint">
              Up to 28 characters. Shown in Mira&rsquo;s search settings.
            </span>
            <span className="field-error" id="engine-name-error">
              {nameError}
            </span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="engine-url">
              Search URL
            </label>
            <input
              id="engine-url"
              className="input"
              value={engine.searchUrl}
              onChange={(event) =>
                onUpdate({ searchUrl: event.target.value })
              }
              maxLength={2048}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="url"
              spellCheck={false}
              aria-invalid={urlError ? true : undefined}
              aria-describedby="engine-url-hint engine-url-error"
            />
            <span className="field-hint" id="engine-url-hint">
              HTTPS only, with one <span className="figure">%s</span> where the
              query belongs. The app encodes the query before it is inserted.
            </span>
            <span className="field-error" id="engine-url-error">
              {urlError}
            </span>
            {canSuggest && suggestion ? (
              <button
                type="button"
                className="btn btn-quiet btn-small field-action"
                onClick={() => onUpdate({ searchUrl: suggestion })}
              >
                Use %s
              </button>
            ) : null}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="engine-note">
              Note
            </label>
            <textarea
              id="engine-note"
              className="textarea"
              value={engine.note}
              onChange={(event) => onUpdate({ note: event.target.value })}
              maxLength={120}
              rows={3}
              aria-describedby="engine-note-hint"
            />
            <span className="field-hint" id="engine-note-hint">
              {engine.note.length} of 120 characters. A short line under the
              engine name.
            </span>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={engine.enabled}
              onChange={(event) =>
                onUpdate({ enabled: event.target.checked })
              }
              aria-describedby="engine-live-hint"
            />
            Live in the app
          </label>
          <p className="field-hint" id="engine-live-hint">
            Hidden engines stay in the draft and never reach the public feed.
          </p>

          <div className="default-line">
            <span>
              {isDefault
                ? 'This is the default engine.'
                : 'The default is the first choice in Mira.'}
            </span>
            {isDefault ? (
              <span className="row-default">Default</span>
            ) : (
              <button
                type="button"
                className="btn btn-quiet btn-small"
                onClick={onMakeDefault}
                disabled={!engine.enabled}
              >
                Make default
              </button>
            )}
          </div>
          {!engine.enabled && isDefault ? (
            <p className="field-hint">
              This default is hidden. Make it live or choose another default
              before publishing.
            </p>
          ) : null}
          {!engine.enabled && !isDefault ? (
            <p className="field-hint">
              Make the engine live before it can become the default.
            </p>
          ) : null}

          <div className="preview">
            <span className="preview-label">
              Test search{host ? ` · ${host}` : ''}
            </span>
            {previewUrl ? (
              <>
                <a
                  className="preview-link"
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open &ldquo;quiet web&rdquo; results
                </a>
                <span className="preview-url">{previewUrl}</span>
              </>
            ) : (
              <p className="preview-empty">
                A valid search URL shows a test link here.
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
            aria-controls="delete-engine-confirm"
          >
            Delete engine
          </button>
          <span className="field-hint editor-hint">
            Changes stay in the draft until you save or publish.
          </span>
        </div>

        {deleteArmed ? (
          <div
            className="confirm-inline"
            id="delete-engine-confirm"
            role="alertdialog"
            aria-labelledby="delete-engine-message"
          >
            <p id="delete-engine-message">
              Delete &ldquo;{engine.name || 'this engine'}&rdquo; from the
              draft?
              {isDefault
                ? ' The default moves to the next live engine.'
                : ''}
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
                Delete engine
              </button>
            </div>
          </div>
        ) : null}
      </fieldset>
    </>
  );
}

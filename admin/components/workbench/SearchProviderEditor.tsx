'use client';

import { useEffect, useRef, useState } from 'react';
import {
  buildSearchUrl,
  hostOf,
  isValidHttpsUrl,
  templateFromExample,
  type SearchProvider,
} from '@/lib/catalog';

type Props = {
  provider: SearchProvider;
  isDefault: boolean;
  busy: boolean;
  onUpdate: (patch: Partial<SearchProvider>) => void;
  onMakeDefault: () => void;
  onDelete: () => void;
};

export function SearchProviderEditor({
  provider,
  isDefault,
  busy,
  onUpdate,
  onMakeDefault,
  onDelete,
}: Props) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (deleteArmed) deleteCancelRef.current?.focus();
  }, [deleteArmed]);

  useEffect(() => {
    if (provider.name === 'New Provider' || !provider.name) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [provider.id]);

  const nameError =
    !provider.name && provider.enabled ? 'A live provider needs a name.' : '';
  const urlError = !provider.searchUrl
    ? provider.enabled
      ? 'A live provider needs a search URL template.'
      : ''
    : !isValidHttpsUrl(provider.searchUrl, { allowTemplate: true })
      ? 'Use an https URL with {query} or %s placeholder.'
      : '';

  const suggestError = provider.suggestUrl && !isValidHttpsUrl(provider.suggestUrl, { allowTemplate: true })
    ? 'Suggestion URL must be an https URL with {query} or %s.'
    : '';

  const sampleQuery =
    provider.category === 'news'
      ? 'latest global news'
      : provider.category === 'videos'
        ? 'documentary trailer'
        : provider.category === 'images'
          ? 'space exploration'
          : provider.category === 'ai'
            ? 'how do neural networks work'
            : 'quantum computing';

  const previewUrl = buildSearchUrl(provider, sampleQuery);
  const host = hostOf(provider.searchUrl);
  const suggestion = templateFromExample(provider.searchUrl);
  const canSuggest = Boolean(suggestion && suggestion !== provider.searchUrl);

  const handleTestSearch = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const cancelDelete = () => {
    setDeleteArmed(false);
    window.requestAnimationFrame(() => deleteTriggerRef.current?.focus());
  };

  return (
    <>
      <div className="editor-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              background: 'var(--color-paper-3)',
              color: 'var(--color-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {(provider.name || provider.id).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="editor-title" id="provider-editor-title">
              {provider.name || 'Untitled provider'}
            </h2>
            <p className="editor-id">
              id: <code>{provider.id}</code> · category:{' '}
              <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{provider.category}</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isDefault ? (
            <span
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '3px',
              }}
            >
              Default
            </span>
          ) : null}
          <span
            className="editor-status"
            data-live={provider.enabled ? 'true' : 'false'}
          >
            {provider.enabled ? 'Live' : 'Hidden'}
          </span>
        </div>
      </div>

      <fieldset className="editor-fields" disabled={busy}>
        <div className="editor-body">
          <div className="field">
            <label className="field-label" htmlFor="provider-name">
              Provider Name
            </label>
            <input
              ref={nameInputRef}
              id="provider-name"
              className="input"
              value={provider.name}
              onChange={(event) => onUpdate({ name: event.target.value })}
              maxLength={40}
              autoComplete="off"
              aria-invalid={nameError ? true : undefined}
            />
            <span className="field-hint">
              Up to 40 characters. Displayed on the homepage and search options.
            </span>
            {nameError ? <span className="field-error">{nameError}</span> : null}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="provider-url">
              Search URL Template
            </label>
            <input
              id="provider-url"
              className="input"
              value={provider.searchUrl}
              onChange={(event) => onUpdate({ searchUrl: event.target.value })}
              placeholder="https://search.example.com/?q={query}"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={urlError ? true : undefined}
            />
            <span className="field-hint">
              Use <code>&#123;query&#125;</code> (or <code>%s</code>) where the user search query will be inserted.
            </span>
            {urlError ? <span className="field-error">{urlError}</span> : null}
            {canSuggest && suggestion ? (
              <div style={{ marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-quiet btn-small"
                  onClick={() => onUpdate({ searchUrl: suggestion })}
                >
                  Convert to template: <code>{suggestion}</code>
                </button>
              </div>
            ) : null}
          </div>

          {/* Live Preview & Test Search Button */}
          {previewUrl ? (
            <div className="preview-box">
              <div className="preview-box-head">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                  Live Test URL Preview ({host})
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={handleTestSearch}
                >
                  Test in Browser ↗
                </button>
              </div>
              <div className="preview-box-url">
                {previewUrl}
              </div>
            </div>
          ) : null}

          <div className="field">
            <label className="field-label" htmlFor="provider-suggest-url">
              Suggestion URL Template (Optional)
            </label>
            <input
              id="provider-suggest-url"
              className="input"
              value={provider.suggestUrl ?? ''}
              onChange={(event) => onUpdate({ suggestUrl: event.target.value.trim() || undefined })}
              placeholder="https://api.example.com/suggest?q={query}"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="field-hint">
              Optional endpoint for search autocompletion suggestions.
            </span>
            {suggestError ? <span className="field-error">{suggestError}</span> : null}
          </div>

          <div className="grid-two-col">
            <div className="field">
              <label className="field-label" htmlFor="provider-priority">
                Priority / Sort Order
              </label>
              <input
                id="provider-priority"
                type="number"
                min={1}
                max={99}
                className="input"
                value={provider.priority ?? 1}
                onChange={(event) =>
                  onUpdate({ priority: Math.max(1, parseInt(event.target.value, 10) || 1) })
                }
              />
              <span className="field-hint">Lower numbers appear first.</span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="provider-countries">
                Supported Countries
              </label>
              <input
                id="provider-countries"
                className="input"
                value={(provider.countries ?? ['ALL']).join(', ')}
                onChange={(event) =>
                  onUpdate({
                    countries: event.target.value
                      .split(',')
                      .map((c) => c.trim().toUpperCase())
                      .filter(Boolean),
                  })
                }
                placeholder="ALL, US, IN, GB"
              />
              <span className="field-hint">Comma-separated ISO codes or ALL.</span>
            </div>
          </div>

          {provider.category === 'ai' ? (
            <div className="field">
              <label className="field-label" htmlFor="provider-type">
                AI Provider Type
              </label>
              <select
                id="provider-type"
                className="input"
                value={provider.providerType ?? 'external'}
                onChange={(event) =>
                  onUpdate({ providerType: event.target.value as 'external' | 'api' })
                }
              >
                <option value="external">External Web URL (Opens conversational search in browser)</option>
                <option value="api">Backend Managed API (Protected server-side)</option>
              </select>
              <span className="field-hint">
                Private API credentials are never sent to client devices.
              </span>
            </div>
          ) : null}

          <div className="field">
            <label className="field-label" htmlFor="provider-note">
              Description / Notes
            </label>
            <textarea
              id="provider-note"
              className="input"
              rows={2}
              value={provider.note}
              onChange={(event) => onUpdate({ note: event.target.value })}
              maxLength={160}
              placeholder="Short note about privacy policy, speed, or index uniqueness."
            />
            <span className="field-hint">Up to 160 characters.</span>
          </div>
        </div>

        <div className="editor-foot">
          <div className="editor-foot-left">
            {!isDefault && provider.enabled ? (
              <button
                type="button"
                className="btn btn-quiet btn-small"
                onClick={onMakeDefault}
              >
                Make default for {provider.category}
              </button>
            ) : null}

            <button
              type="button"
              className="btn btn-quiet btn-small"
              onClick={() => onUpdate({ enabled: !provider.enabled })}
            >
              {provider.enabled ? 'Hide provider' : 'Make live'}
            </button>
          </div>

          <div>
            {deleteArmed ? (
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
                >
                  Delete permanently
                </button>
              </div>
            ) : (
              <button
                ref={deleteTriggerRef}
                type="button"
                className="btn btn-quiet btn-small btn-danger-hover"
                onClick={() => setDeleteArmed(true)}
              >
                Delete provider
              </button>
            )}
          </div>
        </div>
      </fieldset>
    </>
  );
}

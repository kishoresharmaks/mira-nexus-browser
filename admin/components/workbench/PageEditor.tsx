'use client';

import { useEffect, useRef, useState } from 'react';
import {
  hostOf,
  isValidHttpsUrl,
  type DiscoveryCategory,
  type DiscoveryContentType,
  type Page,
} from '@/lib/catalog';

const CONTENT_TYPES: DiscoveryContentType[] = [
  'WEBSITE',
  'ARTICLE',
  'DEVELOPER_TOOL',
  'ESSAY',
  'IDEA',
  'CRAFT',
  'READING',
  'AI_TOOL',
  'REFERENCE',
  'NEWS',
  'VIDEO',
  'OTHER',
];

type Props = {
  page: Page;
  busy: boolean;
  categories?: DiscoveryCategory[];
  onUpdate: (patch: Partial<Page>) => void;
  onDelete: () => void;
};

export function PageEditor({
  page,
  busy,
  categories = [],
  onUpdate,
  onDelete,
}: Props) {
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
  const imageValid = page.imageUrl
    ? isValidHttpsUrl(page.imageUrl, { allowTemplate: false })
    : true;

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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {page.featured ? (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'var(--color-signal, #FF5A2B)',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              Featured
            </span>
          ) : null}
          {page.dailySlot ? (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'var(--color-paper-2, #EFEFEF)',
                color: 'var(--color-ink)',
                fontFamily: 'monospace',
              }}
            >
              Slot: {page.dailySlot}
            </span>
          ) : null}
          <span
            className="editor-status"
            data-live={page.enabled ? 'true' : 'false'}
          >
            {page.enabled ? 'Live' : 'Hidden'}
          </span>
        </div>
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
              Destination URL
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
              A plain HTTPS address.
            </span>
            <span className="field-error" id="page-url-error">
              {urlError}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="field">
              <label className="field-label" htmlFor="page-content-type-input">
                Content Type
              </label>
              <select
                id="page-content-type-input"
                className="input"
                value={page.contentType || 'OTHER'}
                onChange={(event) =>
                  onUpdate({
                    contentType: event.target.value as DiscoveryContentType,
                  })
                }
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="page-category-input">
                Category
              </label>
              {categories.length > 0 ? (
                <select
                  id="page-category-input"
                  className="input"
                  value={page.categoryId || page.category || ''}
                  onChange={(event) => {
                    const chosen = categories.find((c) => c.id === event.target.value);
                    onUpdate({
                      categoryId: event.target.value,
                      category: chosen ? chosen.name.toUpperCase() : event.target.value,
                    });
                  }}
                >
                  <option value="">(Select Category)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="page-category-input"
                  className="input"
                  value={page.category}
                  onChange={(event) =>
                    onUpdate({
                      category: event.target.value,
                      categoryId: event.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    })
                  }
                  maxLength={24}
                  autoComplete="off"
                />
              )}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="page-image-input">
              Image URL (optional)
            </label>
            <input
              id="page-image-input"
              className="input"
              value={page.imageUrl || ''}
              onChange={(event) => onUpdate({ imageUrl: event.target.value })}
              maxLength={2048}
              placeholder="https://example.com/cover.jpg"
              autoComplete="off"
              autoCapitalize="none"
              inputMode="url"
              spellCheck={false}
              aria-invalid={!imageValid ? true : undefined}
            />
            {!imageValid ? (
              <span className="field-error">Image must be a valid https URL</span>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="field">
              <label className="field-label" htmlFor="page-slot-input">
                Daily Slot Assignment
              </label>
              <select
                id="page-slot-input"
                className="input"
                value={page.dailySlot || ''}
                onChange={(event) =>
                  onUpdate({
                    dailySlot: event.target.value ? event.target.value : null,
                  })
                }
              >
                <option value="">None (Standard rotation)</option>
                <option value="website_of_day">Website of the Day</option>
                <option value="article_of_day">Article of the Day</option>
                <option value="developer_discovery">Developer Discovery</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="page-order-input">
                Display Order
              </label>
              <input
                id="page-order-input"
                className="input"
                type="number"
                value={page.order ?? 0}
                onChange={(event) =>
                  onUpdate({ order: Number(event.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="page-tags-input">
              Tags (comma-separated)
            </label>
            <input
              id="page-tags-input"
              className="input"
              value={(page.tags || []).join(', ')}
              onChange={(event) =>
                onUpdate({
                  tags: event.target.value
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean),
                })
              }
              placeholder="tech, tools, design"
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="field">
              <label className="field-label" htmlFor="page-minutes-input">
                Reading Time (min)
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
            </div>

            <div className="field">
              <label className="field-label" htmlFor="page-author-input">
                Author / Source
              </label>
              <input
                id="page-author-input"
                className="input"
                value={page.author || ''}
                onChange={(event) => onUpdate({ author: event.target.value })}
                maxLength={64}
                placeholder="e.g. Robin Sloan"
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="page-note-input">
              Short Description / Note
            </label>
            <textarea
              id="page-note-input"
              className="textarea"
              value={page.note}
              onChange={(event) => onUpdate({ note: event.target.value })}
              maxLength={240}
              rows={3}
              aria-describedby="page-note-hint"
            />
            <span className="field-hint" id="page-note-hint">
              {page.note.length} of 240 characters. Displayed on the card.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', margin: '0.5rem 0' }}>
            <label className="check-row">
              <input
                type="checkbox"
                checked={page.enabled}
                onChange={(event) =>
                  onUpdate({ enabled: event.target.checked })
                }
              />
              Live in Discovery Feed
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={page.featured === true}
                onChange={(event) =>
                  onUpdate({ featured: event.target.checked })
                }
              />
              Featured Item
            </label>
          </div>

          {/* Visual Previews */}
          <div className="preview">
            <span className="preview-label">
              Preview{host ? ` · ${host}` : ''}
            </span>
            {urlValid ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {page.imageUrl && isValidHttpsUrl(page.imageUrl, { allowTemplate: false }) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.imageUrl}
                    alt=""
                    style={{ width: '64px', height: '64px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                ) : null}
                <div>
                  <a
                    className="preview-link"
                    href={page.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit {host || 'the page'}
                  </a>
                  <span className="preview-url">{page.url}</span>
                </div>
              </div>
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
            Delete Item
          </button>
          <span className="field-hint editor-hint">
            Changes stay in the draft until you save or publish.
          </span>
        </div>

        {deleteArmed ? (
          <div
            className="confirm-inline"
            id="delete-page-confirm"
            role="region"
            aria-live="polite"
          >
            <p className="confirm-prompt">
              Delete “{page.title || 'Untitled'}” from the draft?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={onDelete}
                disabled={busy}
              >
                Delete permanently
              </button>
              <button
                ref={deleteCancelRef}
                type="button"
                className="btn btn-quiet btn-small"
                onClick={cancelDelete}
                disabled={busy}
              >
                Keep
              </button>
            </div>
          </div>
        ) : null}
      </fieldset>
    </>
  );
}

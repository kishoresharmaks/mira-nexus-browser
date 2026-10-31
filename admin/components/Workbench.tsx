'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  MAX_ENGINES,
  MAX_PAGES,
  coerceCatalog,
  formatUtcDateTime,
  liveCounts,
  uniqueId,
  validateCatalog,
  type Catalog,
  type Engine,
  type Issue,
  type Page,
  type PublishedCatalog,
} from '@/lib/catalog';
import { MiraMark } from '@/components/MiraMark';
import { EngineEditor } from './workbench/EngineEditor';
import { EnginePanel } from './workbench/EnginePanel';
import { PageEditor } from './workbench/PageEditor';
import { PagePanel } from './workbench/PagePanel';
import { TodayLedger } from './workbench/TodayLedger';
import { WorkbenchDock } from './workbench/WorkbenchDock';

type Section = 'engines' | 'today';

type Props = {
  initialDraft: Catalog;
  initialPublished: PublishedCatalog | null;
  storage: 'mongodb' | 'file';
  storageTarget: string;
  today: { year: number; month: number; day: number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function errorText(value: unknown, fallback: string): string {
  if (isRecord(value) && typeof value.error === 'string' && value.error) {
    return value.error;
  }
  return fallback;
}

function issuesFrom(value: unknown): Issue[] {
  if (!Array.isArray(value)) return [];
  const issues: Issue[] = [];
  for (const item of value.slice(0, 40)) {
    if (!isRecord(item)) continue;
    if (typeof item.at !== 'string' || typeof item.message !== 'string') {
      continue;
    }
    issues.push({ at: item.at, message: item.message });
  }
  return issues;
}

function publishedFrom(value: unknown): PublishedCatalog | null {
  const base = coerceCatalog(value);
  if (!base || !isRecord(value)) return null;
  const revision = Number(value.revision);
  const publishedAt =
    typeof value.publishedAt === 'string' ? value.publishedAt : '';
  if (!Number.isInteger(revision) || revision < 1) return null;
  if (Number.isNaN(Date.parse(publishedAt))) return null;
  return { ...base, revision, publishedAt };
}

function EmptySelection({
  kind,
  busy,
  atLimit,
  onAdd,
}: {
  kind: 'engine' | 'page';
  busy: boolean;
  atLimit: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="empty">
      <p className="empty-title">No {kind} selected.</p>
      <p className="empty-copy">
        Choose a row in the list, or add a new {kind} to the draft.
      </p>
      <button
        type="button"
        className="btn btn-quiet btn-small"
        onClick={onAdd}
        disabled={busy || atLimit}
      >
        Add {kind}
      </button>
    </div>
  );
}

export function Workbench({
  initialDraft,
  initialPublished,
  storage,
  storageTarget,
  today,
}: Props) {
  const [draft, setDraft] = useState<Catalog>(initialDraft);
  const [savedDraft, setSavedDraft] = useState<Catalog>(initialDraft);
  const [published, setPublished] = useState<PublishedCatalog | null>(
    initialPublished,
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [section, setSection] = useState<Section>('engines');
  const [engineId, setEngineId] = useState<string | null>(
    initialDraft.engines[0]?.id ?? null,
  );
  const [pageId, setPageId] = useState<string | null>(
    initialDraft.pages[0]?.id ?? null,
  );
  const [urlReady, setUrlReady] = useState(false);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [serverIssues, setServerIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef(false);
  const signOutTriggerRef = useRef<HTMLButtonElement>(null);
  const signOutCancelRef = useRef<HTMLButtonElement>(null);

  const draftKey = useMemo(() => JSON.stringify(draft), [draft]);
  const savedKey = useMemo(() => JSON.stringify(savedDraft), [savedDraft]);
  const dirty = draftKey !== savedKey;
  const busy = saving || publishing;
  const localIssues = useMemo(() => validateCatalog(draft), [draft]);
  const issues = serverIssues.length > 0 ? serverIssues : localIssues;
  const live = useMemo(() => liveCounts(draft), [draft]);
  const selectedEngine =
    draft.engines.find((engine) => engine.id === engineId) ?? null;
  const selectedPage =
    draft.pages.find((page) => page.id === pageId) ?? null;
  const activeId = section === 'engines' ? engineId : pageId;
  const nextRevision = (published?.revision ?? 0) + 1;

  const beginEdit = () => {
    setError(null);
    setFlash(null);
    setServerIssues([]);
    setSignOutConfirm(false);
  };

  const applySavedDraft = (next: Catalog) => {
    setDraft(next);
    setSavedDraft(next);
    setEngineId((current) =>
      current && next.engines.some((engine) => engine.id === current)
        ? current
        : (next.engines[0]?.id ?? null),
    );
    setPageId((current) =>
      current && next.pages.some((page) => page.id === current)
        ? current
        : (next.pages[0]?.id ?? null),
    );
  };

  const updateEngine = (patch: Partial<Engine>) => {
    if (!selectedEngine) return;
    const id = selectedEngine.id;
    beginEdit();
    setDraft((current) => ({
      ...current,
      engines: current.engines.map((engine) =>
        engine.id === id ? { ...engine, ...patch } : engine,
      ),
    }));
  };

  const updatePage = (patch: Partial<Page>) => {
    if (!selectedPage) return;
    const id = selectedPage.id;
    beginEdit();
    setDraft((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === id ? { ...page, ...patch } : page,
      ),
    }));
  };

  const makeDefault = () => {
    if (!selectedEngine) return;
    beginEdit();
    setDraft((current) => ({
      ...current,
      defaultEngineId: selectedEngine.id,
    }));
  };

  const addEngine = () => {
    if (busy || draft.engines.length >= MAX_ENGINES) return;
    beginEdit();
    const id = uniqueId(
      'new-engine',
      new Set(draft.engines.map((engine) => engine.id)),
    );
    const engine: Engine = {
      id,
      name: '',
      searchUrl: '',
      note: '',
      enabled: true,
    };
    setDraft((current) => ({
      ...current,
      engines: [...current.engines, engine],
    }));
    setSection('engines');
    setEngineId(id);
    pendingScroll.current = true;
  };

  const addPage = () => {
    if (busy || draft.pages.length >= MAX_PAGES) return;
    beginEdit();
    const id = uniqueId(
      'new-page',
      new Set(draft.pages.map((page) => page.id)),
    );
    const page: Page = {
      id,
      title: '',
      url: '',
      category: 'READING',
      note: '',
      readMinutes: 8,
      enabled: true,
    };
    setDraft((current) => ({
      ...current,
      pages: [...current.pages, page],
    }));
    setSection('today');
    setPageId(id);
    pendingScroll.current = true;
  };

  const deleteSelectedEngine = () => {
    if (!selectedEngine) return;
    beginEdit();
    const removeIndex = draft.engines.findIndex(
      (engine) => engine.id === selectedEngine.id,
    );
    const remaining = draft.engines.filter(
      (engine) => engine.id !== selectedEngine.id,
    );
    const defaultEngineId =
      draft.defaultEngineId === selectedEngine.id
        ? (remaining.find((engine) => engine.enabled)?.id ??
          remaining[0]?.id ??
          '')
        : draft.defaultEngineId;
    const next =
      remaining[Math.min(Math.max(removeIndex, 0), remaining.length - 1)] ??
      null;
    setDraft((current) => ({
      ...current,
      defaultEngineId,
      engines: remaining,
    }));
    setEngineId(next?.id ?? null);
  };

  const deleteSelectedPage = () => {
    if (!selectedPage) return;
    beginEdit();
    const removeIndex = draft.pages.findIndex(
      (page) => page.id === selectedPage.id,
    );
    const remaining = draft.pages.filter(
      (page) => page.id !== selectedPage.id,
    );
    const next =
      remaining[Math.min(Math.max(removeIndex, 0), remaining.length - 1)] ??
      null;
    setDraft((current) => ({ ...current, pages: remaining }));
    setPageId(next?.id ?? null);
  };

  const saveDraft = async () => {
    if (busy) return;
    setSaving(true);
    setError(null);
    setFlash(null);
    setServerIssues([]);
    try {
      const response = await fetch('/api/catalog/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          response.status === 401
            ? 'Your session expired. Reload the desk to sign in again.'
            : errorText(data, 'The draft could not be saved.'),
        );
        return;
      }
      const nextDraft = isRecord(data) ? coerceCatalog(data.draft) : null;
      const savedAtValue =
        isRecord(data) &&
        typeof data.savedAt === 'string' &&
        !Number.isNaN(Date.parse(data.savedAt))
          ? data.savedAt
          : new Date().toISOString();
      applySavedDraft(nextDraft ?? draft);
      setSavedAt(savedAtValue);
      setFlash(`Draft saved ${formatUtcDateTime(savedAtValue)}.`);
    } catch {
      setError(
        'The draft could not be saved. Check the connection and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const publishCatalog = async () => {
    if (busy) return;
    if (localIssues.length > 0) {
      setServerIssues(localIssues);
      setError('Fix the catalog before publishing.');
      return;
    }
    setPublishing(true);
    setError(null);
    setFlash(null);
    setServerIssues([]);
    try {
      const response = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session expired. Reload the desk to sign in again.');
          return;
        }
        const returnedIssues = isRecord(data)
          ? issuesFrom(data.issues)
          : [];
        if (returnedIssues.length > 0) {
          setServerIssues(returnedIssues);
          setError('The server found issues in this draft. Fix them first.');
          return;
        }
        setError(errorText(data, 'The catalog could not be published.'));
        return;
      }

      const nextPublished = isRecord(data)
        ? publishedFrom(data.published)
        : null;
      const nextDraft = isRecord(data) ? coerceCatalog(data.draft) : null;
      if (!nextPublished) {
        setFlash('Published. Reload the desk to see the new revision.');
        return;
      }
      applySavedDraft(nextDraft ?? nextPublished);
      setPublished(nextPublished);
      setSavedAt(nextPublished.publishedAt);
      setFlash(
        `Revision ${nextPublished.revision} is live. The public feed can take up to five minutes to catch up.`,
      );
    } catch {
      setError(
        'The catalog could not be published. Check the connection and try again.',
      );
    } finally {
      setPublishing(false);
    }
  };

  const discardChanges = () => {
    if (!dirty) return;
    applySavedDraft(savedDraft);
    setError(null);
    setServerIssues([]);
    setFlash('Unsaved changes discarded.');
    setSignOutConfirm(false);
  };

  const chooseEngine = (id: string) => {
    setSection('engines');
    setEngineId(id);
    if (window.matchMedia('(max-width: 64rem)').matches) {
      pendingScroll.current = true;
    }
  };

  const choosePage = (id: string) => {
    setSection('today');
    setPageId(id);
    if (window.matchMedia('(max-width: 64rem)').matches) {
      pendingScroll.current = true;
    }
  };

  const switchSection = (next: Section) => {
    setSection(next);
  };

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: Section = section === 'engines' ? 'today' : 'engines';
    setSection(next);
    window.requestAnimationFrame(() => {
      document.getElementById(`tab-${next}`)?.focus();
    });
  };

  const signOut = async () => {
    if (signingOut) return;
    setSignOutConfirm(false);
    setSigningOut(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        setError('The session could not be closed. Try again.');
        setSigningOut(false);
        return;
      }
      window.location.reload();
    } catch {
      setError('The session could not be closed. Check the connection.');
      setSigningOut(false);
    }
  };

  const requestSignOut = () => {
    if (dirty) {
      setSignOutConfirm(true);
      return;
    }
    void signOut();
  };

  const cancelSignOut = () => {
    setSignOutConfirm(false);
    window.requestAnimationFrame(() => signOutTriggerRef.current?.focus());
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSection = params.get('section');
    const requestedItem = params.get('item');
    if (requestedSection === 'today') {
      setSection('today');
      const match = requestedItem
        ? initialDraft.pages.find((page) => page.id === requestedItem)
        : initialDraft.pages[0];
      setPageId(match?.id ?? null);
    } else if (requestedSection === 'engines') {
      setSection('engines');
      const match = requestedItem
        ? initialDraft.engines.find((engine) => engine.id === requestedItem)
        : initialDraft.engines[0];
      setEngineId(match?.id ?? null);
    }
    setUrlReady(true);
  }, [initialDraft]);

  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams();
    params.set('section', section);
    if (activeId) params.set('item', activeId);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}`,
    );
  }, [activeId, section, urlReady]);

  useEffect(() => {
    if (!pendingScroll.current) return;
    pendingScroll.current = false;
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [engineId, pageId, section]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 8000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) setSignOutConfirm(false);
  }, [dirty]);

  useEffect(() => {
    if (signOutConfirm) signOutCancelRef.current?.focus();
  }, [signOutConfirm]);

  useEffect(() => {
    if (!signOutConfirm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSignOutConfirm(false);
      window.requestAnimationFrame(() => signOutTriggerRef.current?.focus());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [signOutConfirm]);

  return (
    <>
      <header className="site-head">
        <div className="site-head-inner">
          <div className="brand">
            <MiraMark className="brand-mark" />
            <span className="brand-word">Mira</span>
            <span className="brand-sub">Catalog desk</span>
          </div>
          <div className="head-links">
            <a
              className="head-link"
              href="/api/catalog"
              target="_blank"
              rel="noreferrer"
            >
              Public feed
            </a>
            <button
              ref={signOutTriggerRef}
              type="button"
              className="head-link"
              onClick={requestSignOut}
              disabled={signingOut || busy}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <main className="shell">
        <div className="page-head">
          <div>
            <h1 className="page-title">Two lists, kept in order.</h1>
            <p className="page-deck">
              Search engines and the Today rotation. Edit the draft, review the
              week, then publish. The app keeps its bundled copy whenever this
              desk cannot be reached.
            </p>
          </div>
          <div className="page-meta">
            <strong>
              {published
                ? `Revision ${published.revision} is live`
                : 'No published revision'}
            </strong>
            <span>
              {published
                ? formatUtcDateTime(published.publishedAt)
                : 'The app is on its bundled catalog.'}
            </span>
            <span>
              {dirty
                ? 'Unsaved edits in the draft'
                : savedAt
                  ? `Draft saved ${formatUtcDateTime(savedAt)}`
                  : 'Draft loaded from storage'}
            </span>
            <span>
              {storage === 'mongodb'
                ? `MongoDB · ${storageTarget}`
                : 'Local file · dev only'}
            </span>
          </div>
        </div>

        {signOutConfirm ? (
          <div
            className="notice notice--error"
            role="alertdialog"
            aria-labelledby="signout-confirm-title"
          >
            <p className="notice-title" id="signout-confirm-title">
              Sign out with unsaved changes?
            </p>
            <p>
              The server keeps the last saved draft. Edits made since then will
              be discarded.
            </p>
            <div className="confirm-actions notice-actions">
              <button
                ref={signOutCancelRef}
                type="button"
                className="btn btn-quiet btn-small"
                onClick={cancelSignOut}
              >
                Stay
              </button>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => void signOut()}
                disabled={signingOut}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="notice notice--error" role="alert">
            <p className="notice-title">The desk hit a snag.</p>
            <p>{error}</p>
          </div>
        ) : null}

        {flash ? (
          <div className="notice" role="status">
            <p>{flash}</p>
          </div>
        ) : null}

        <div
          className="tabs"
          role="tablist"
          aria-label="Catalog sections"
          onKeyDown={handleTabKeyDown}
        >
          <button
            type="button"
            className="tab"
            role="tab"
            id="tab-engines"
            aria-selected={section === 'engines'}
            aria-controls="panel-engines"
            tabIndex={section === 'engines' ? 0 : -1}
            onClick={() => switchSection('engines')}
          >
            Search engines
            <span className="tab-count">{draft.engines.length}</span>
          </button>
          <button
            type="button"
            className="tab"
            role="tab"
            id="tab-today"
            aria-selected={section === 'today'}
            aria-controls="panel-today"
            tabIndex={section === 'today' ? 0 : -1}
            onClick={() => switchSection('today')}
          >
            Today&rsquo;s page
            <span className="tab-count">{draft.pages.length}</span>
          </button>
        </div>

        {issues.length > 0 ? (
          <section className="issues" aria-labelledby="issues-title">
            <h2 className="issues-title" id="issues-title">
              Fix{' '}
              {issues.length === 1
                ? 'one thing'
                : `${issues.length} things`}{' '}
              before publishing
            </h2>
            <ul>
              {issues.map((issue, index) => (
                <li key={`${issue.at}-${index}`}>
                  <strong>{issue.at}</strong>: {issue.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {section === 'engines' ? (
          <section
            className="panel-section"
            role="tabpanel"
            id="panel-engines"
            aria-labelledby="tab-engines"
            tabIndex={0}
          >
            <div className="work-grid">
              <EnginePanel
                engines={draft.engines}
                defaultEngineId={draft.defaultEngineId}
                liveCount={live.engines}
                selectedId={engineId}
                busy={busy}
                maxEngines={MAX_ENGINES}
                onAdd={addEngine}
                onSelect={chooseEngine}
              />
              <div className="editor" ref={editorRef}>
                {selectedEngine ? (
                  <EngineEditor
                    key={selectedEngine.id}
                    engine={selectedEngine}
                    isDefault={selectedEngine.id === draft.defaultEngineId}
                    busy={busy}
                    onUpdate={updateEngine}
                    onMakeDefault={makeDefault}
                    onDelete={deleteSelectedEngine}
                  />
                ) : (
                  <EmptySelection
                    kind="engine"
                    busy={busy}
                    atLimit={draft.engines.length >= MAX_ENGINES}
                    onAdd={addEngine}
                  />
                )}
              </div>
            </div>
          </section>
        ) : (
          <section
            className="panel-section"
            role="tabpanel"
            id="panel-today"
            aria-labelledby="tab-today"
            tabIndex={0}
          >
            <div className="work-grid">
              <PagePanel
                pages={draft.pages}
                liveCount={live.pages}
                selectedId={pageId}
                busy={busy}
                maxPages={MAX_PAGES}
                onAdd={addPage}
                onSelect={choosePage}
              />
              <div className="editor" ref={editorRef}>
                {selectedPage ? (
                  <PageEditor
                    key={selectedPage.id}
                    page={selectedPage}
                    busy={busy}
                    onUpdate={updatePage}
                    onDelete={deleteSelectedPage}
                  />
                ) : (
                  <EmptySelection
                    kind="page"
                    busy={busy}
                    atLimit={draft.pages.length >= MAX_PAGES}
                    onAdd={addPage}
                  />
                )}
              </div>
            </div>

            <TodayLedger
              pages={draft.pages}
              liveCount={live.pages}
              today={today}
            />
          </section>
        )}
      </main>

      <WorkbenchDock
        dirty={dirty}
        saving={saving}
        publishing={publishing}
        issueCount={issues.length}
        liveEngines={live.engines}
        livePages={live.pages}
        nextRevision={nextRevision}
        savedAt={savedAt}
        editKey={draftKey}
        onSave={() => void saveDraft()}
        onPublish={() => void publishCatalog()}
        onDiscard={discardChanges}
      />
    </>
  );
}

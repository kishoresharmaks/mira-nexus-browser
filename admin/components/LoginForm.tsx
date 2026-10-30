'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MiraMark } from './MiraMark';

export function LoginForm() {
  const router = useRouter();
  const passwordId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password) {
      setError('Enter the catalog password.');
      inputRef.current?.focus();
      return;
    }

    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          typeof (data as Record<string, unknown>).error === 'string'
            ? ((data as Record<string, unknown>).error as string)
            : 'That password did not work.';
        setError(message);
        setPassword('');
        inputRef.current?.focus();
        return;
      }
      router.refresh();
    } catch {
      setError('The desk could not be reached. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-grid">
        <section aria-labelledby="login-title">
          <div className="login-brand">
            <MiraMark className="brand-mark" />
            <span className="brand-word">Mira</span>
            <span className="brand-sub">Catalog desk</span>
          </div>
          <h1 className="login-title" id="login-title">
            Two lists.
            <br />
            One password.
          </h1>
          <p className="login-deck">
            Search engines and the Today rotation. Edit the draft here; the app
            only receives what you publish.
          </p>
          <div className="login-index" aria-hidden="true">
            <div>
              <span>Search engines</span>
              <span>Presets and default</span>
            </div>
            <div>
              <span>Today&rsquo;s page</span>
              <span>The daily rotation</span>
            </div>
            <div>
              <span>Public feed</span>
              <span>Read-only catalog</span>
            </div>
          </div>
          <p className="login-foot">
            The app falls back to its bundled catalog whenever this desk is
            unreachable.
          </p>
        </section>

        <section className="login-panel" aria-labelledby="signin-title">
          <h2 className="login-panel-title" id="signin-title">
            Sign in
          </h2>
          <p className="login-panel-copy">
            One password, no account. The session is a signed cookie that lasts
            seven days on this device.
          </p>
          <form className="login-form" onSubmit={submit}>
            <label className="field" htmlFor={passwordId}>
              <span className="field-label">Password</span>
              <span className="password-row">
                <input
                  ref={inputRef}
                  id={passwordId}
                  className="input"
                  name="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError('');
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${passwordId}-error` : undefined}
                  required
                />
                <button
                  type="button"
                  className="btn btn-quiet btn-small"
                  aria-pressed={visible}
                  onClick={() => setVisible((current) => !current)}
                >
                  {visible ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            <p className="login-error" id={`${passwordId}-error`} role="alert">
              {error}
            </p>
            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={busy}
            >
              {busy ? 'Checking…' : 'Open the desk'}
            </button>
          </form>
          <p className="login-note">
            Editing is password-protected. The public feed carries only the
            published catalog: engine names, search URLs, and Today pages.
          </p>
        </section>
      </div>
    </main>
  );
}

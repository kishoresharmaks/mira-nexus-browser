'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="state-page">
      <section className="state-panel" aria-labelledby="error-title">
        <h1 className="state-title" id="error-title">
          The catalog could not be opened.
        </h1>
        <p className="state-copy">
          The store did not answer. Nothing was published or overwritten. Check
          the Blob connection or the local data file, then try again.
        </p>
        <div className="state-actions">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
          <a className="btn btn-quiet" href="/">
            Reload the desk
          </a>
        </div>
      </section>
    </main>
  );
}

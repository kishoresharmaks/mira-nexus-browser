import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="state-page">
      <section className="state-panel" aria-labelledby="not-found-title">
        <h1 className="state-title" id="not-found-title">
          There is no page here.
        </h1>
        <p className="state-copy">
          The catalog desk has one screen. Return to it to edit engines or the
          Today rotation.
        </p>
        <div className="state-actions">
          <Link className="btn btn-primary" href="/">
            Back to the desk
          </Link>
        </div>
      </section>
    </main>
  );
}

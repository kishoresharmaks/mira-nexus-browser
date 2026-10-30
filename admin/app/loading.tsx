export default function Loading() {
  return (
    <main className="state-page">
      <section className="state-panel" aria-busy="true" aria-live="polite">
        <h1 className="state-title">Opening the catalog.</h1>
        <p className="state-copy">
          Reading the draft and the published revision from the private store.
        </p>
        <div className="loading-lines" aria-hidden="true">
          <div className="loading-line" />
          <div className="loading-line" />
          <div className="loading-line" />
        </div>
      </section>
    </main>
  );
}

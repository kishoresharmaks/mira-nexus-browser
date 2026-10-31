export function StoreProblem({
  message,
  target,
}: {
  message: string;
  target: string;
}) {
  return (
    <main className="state-page">
      <section className="state-panel" aria-labelledby="store-problem-title">
        <h1 className="state-title" id="store-problem-title">
          The catalog store is not answering.
        </h1>
        <p className="state-copy">
          The desk could not read <span className="figure">{target}</span>.
          Nothing was published or overwritten.
        </p>
        <pre className="setup-code">{message}</pre>
        <p className="state-copy">
          Check that <span className="figure">mongodb+srv</span> resolves from
          this machine, that Atlas Network Access allows this host, and that the
          database user can read and write the database. The connection string is
          never shown here.
        </p>
        <div className="state-actions">
          <a className="btn btn-primary" href="/">
            Try again
          </a>
        </div>
      </section>
    </main>
  );
}

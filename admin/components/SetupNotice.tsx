import { MiraMark } from './MiraMark';

export function SetupNotice({
  password,
  secret,
}: {
  password: boolean;
  secret: boolean;
}) {
  return (
    <main className="login-page">
      <div className="login-grid">
        <section aria-labelledby="setup-title">
          <div className="login-brand">
            <MiraMark className="brand-mark" />
            <span className="brand-word">Mira</span>
            <span className="brand-sub">Catalog desk</span>
          </div>
          <h1 className="login-title" id="setup-title">
            Finish the
            <br />
            setup.
          </h1>
          <p className="login-deck">
            The desk needs a password and a signing secret before it can open.
            Both live in the server environment, never in the browser.
          </p>
        </section>

        <section className="login-panel" aria-labelledby="setup-panel-title">
          <h2 className="login-panel-title" id="setup-panel-title">
            Environment
          </h2>
          <p className="login-panel-copy">
            Copy <span className="figure">admin/.env.example</span> to{' '}
            <span className="figure">admin/.env.local</span>, set both values,
            and restart the server.
          </p>
          <pre className="setup-code">
            {'ADMIN_PASSWORD=your-password\nADMIN_SESSION_SECRET=at-least-32-random-characters'}
          </pre>
          <ul className="setup-list">
            <li>
              <span>ADMIN_PASSWORD</span>
              <span>{password ? 'Set' : 'Missing'}</span>
            </li>
            <li>
              <span>ADMIN_SESSION_SECRET</span>
              <span>{secret ? 'Set' : 'Missing'}</span>
            </li>
          </ul>
          <p className="login-note">
            Production also needs a private Vercel Blob store connected to this
            project. Local development writes to{' '}
            <span className="figure">admin/.data</span>.
          </p>
        </section>
      </div>
    </main>
  );
}

import { NexusMark } from './NexusMark';

export function SetupNotice({
  password,
  secret,
  mongodb,
}: {
  password: boolean;
  secret: boolean;
  mongodb: boolean;
}) {
  return (
    <main className="login-page">
      <div className="login-grid">
        <section aria-labelledby="setup-title">
          <div className="login-brand">
            <NexusMark className="brand-mark" />
            <span className="brand-word">Nexus</span>
            <span className="brand-sub">Catalog desk</span>
          </div>
          <h1 className="login-title" id="setup-title">
            Finish the
            <br />
            setup.
          </h1>
          <p className="login-deck">
            The desk needs a password, a signing secret, and a MongoDB
            connection before it can open. All three live in the server
            environment, never in the browser.
          </p>
        </section>

        <section className="login-panel" aria-labelledby="setup-panel-title">
          <h2 className="login-panel-title" id="setup-panel-title">
            Environment
          </h2>
          <p className="login-panel-copy">
            Copy <span className="figure">admin/.env.example</span> to{' '}
            <span className="figure">admin/.env.local</span>, set the values, and
            restart the server.
          </p>
          <pre className="setup-code">
            {'ADMIN_PASSWORD=your-password\nADMIN_SESSION_SECRET=at-least-32-random-characters\nMONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/'}
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
            <li>
              <span>MONGODB_URI</span>
              <span>{mongodb ? 'Set' : 'Missing'}</span>
            </li>
          </ul>
          <p className="login-note">
            Use the SRV connection string from MongoDB Atlas. For a local
            preview without Atlas, set{' '}
            <span className="figure">NEXUS_DEV_FILE_STORE=1</span>; production
            ignores it.
          </p>
        </section>
      </div>
    </main>
  );
}

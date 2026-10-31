import { LoginForm } from '@/components/LoginForm';
import { SetupNotice } from '@/components/SetupNotice';
import { StoreProblem } from '@/components/StoreProblem';
import { Workbench } from '@/components/Workbench';
import {
  authConfigured,
  authConfigurationSummary,
  isAuthenticated,
} from '@/lib/auth';
import type { StoreState } from '@/lib/catalog';
import {
  mongoConfigured,
  readState,
  storageMode,
  storageTarget,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

function storageErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Unknown storage error.';
  const message = error.message
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, 'mongodb://…')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
  return message || 'Unknown storage error.';
}

export default async function Page() {
  const mode = storageMode();
  const summary = authConfigurationSummary();

  if (mode === 'none' || !authConfigured()) {
    return (
      <SetupNotice
        password={summary.password}
        secret={summary.secret}
        mongodb={mongoConfigured()}
      />
    );
  }

  if (!(await isAuthenticated())) {
    return <LoginForm />;
  }

  let state: StoreState;
  try {
    state = await readState();
  } catch (error) {
    console.error('catalog store read failed', error);
    return (
      <StoreProblem
        message={storageErrorMessage(error)}
        target={storageTarget()}
      />
    );
  }

  const now = new Date();

  return (
    <Workbench
      initialDraft={state.draft}
      initialPublished={state.published}
      storage={mode}
      storageTarget={storageTarget()}
      today={{
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
      }}
    />
  );
}

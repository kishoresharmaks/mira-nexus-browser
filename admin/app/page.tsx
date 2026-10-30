import { LoginForm } from '@/components/LoginForm';
import { SetupNotice } from '@/components/SetupNotice';
import { Workbench } from '@/components/Workbench';
import {
  authConfigured,
  authConfigurationSummary,
  isAuthenticated,
} from '@/lib/auth';
import { readState, storageMode } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!authConfigured()) {
    const summary = authConfigurationSummary();
    return <SetupNotice password={summary.password} secret={summary.secret} />;
  }

  if (!(await isAuthenticated())) {
    return <LoginForm />;
  }

  const state = await readState();
  const now = new Date();

  return (
    <Workbench
      initialDraft={state.draft}
      initialPublished={state.published}
      storage={storageMode()}
      today={{
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
      }}
    />
  );
}

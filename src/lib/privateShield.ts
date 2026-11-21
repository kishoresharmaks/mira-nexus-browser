import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Screen-capture shield for private tabs.
 *
 * On Android the native module sets FLAG_SECURE, which blocks screenshots and
 * screen recordings and blanks Nexus's thumbnail in the app switcher. On iOS it
 * installs the secure-capture layer that has the same effect. The module is
 * looked up optionally so a development build made before this feature existed
 * still runs; private tabs simply lose the shield until the next build.
 */
type ScreenCaptureModule = {
  preventScreenCapture: () => Promise<void>;
  allowScreenCapture: () => Promise<void>;
};

const native = requireOptionalNativeModule<ScreenCaptureModule>(
  'ExpoScreenCapture',
);

// Calls are serialised so a fast open/close/open sequence cannot land an
// `allow` after the final `prevent`. `desired` always describes the newest
// request; the loop keeps draining until it has been honoured.
let desired: boolean | null = null;
let running: Promise<void> | null = null;

function sync(): Promise<void> {
  if (!native) return Promise.resolve();

  if (running) {
    // A newer request has already been recorded; the loop will pick it up.
    return running;
  }

  running = (async () => {
    while (desired !== null) {
      const next = desired;
      desired = null;
      try {
        if (next) await native.preventScreenCapture();
        else await native.allowScreenCapture();
      } catch {
        // Releasing is best-effort: the OS also clears the flag when the app
        // dies. If engaging fails, the private UI still explains the limit.
      }
    }
  })().finally(() => {
    running = null;
    if (desired !== null) void sync();
  });

  return running;
}

export function engagePrivateShield(): Promise<void> {
  desired = true;
  return sync();
}

export function releasePrivateShield(): Promise<void> {
  desired = false;
  return sync();
}

import { useCallback, useRef, useState } from 'react';

export function useBusyGuard() {
  const [busy, setBusy] = useState(false);
  const active = useRef(false);

  const run = useCallback(async (action: () => Promise<void>) => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      active.current = false;
      setBusy(false);
    }
  }, []);

  return { busy, run };
}

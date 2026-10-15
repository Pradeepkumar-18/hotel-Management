import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
  opts: { tags?: string[]; enabled?: boolean } = {},
) {
  const enabled = opts.enabled !== false;
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(enabled);
  const current = useRef<AbortController | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    current.current?.abort();
    const c = new AbortController();
    current.current = c;
    setLoading(true);
    setError(undefined);
    fetcher(c.signal)
      .then((res) => {
        if (!c.signal.aborted) setData(res);
      })
      .catch((err) => {
        if (!c.signal.aborted) setError(err);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
  }, deps);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    run();
    return () => current.current?.abort();
  }, [run, enabled]);

  const tagKey = (opts.tags ?? []).join('|');
  useEffect(() => {
    if (!enabled || !tagKey) return;
    return subscribe(tagKey.split('|'), run);
  }, [run, enabled, tagKey]);

  return { data, error, loading, refetch: run, setData };
}

const subs = new Set<{ tags: string[]; fn: () => void }>();

export function invalidate(...tags: string[]) {
  subs.forEach((s) => {
    if (s.tags.some((t) => tags.includes(t))) s.fn();
  });
}

function subscribe(tags: string[], fn: () => void) {
  const entry = { tags, fn };
  subs.add(entry);
  return () => {
    subs.delete(entry);
  };
}

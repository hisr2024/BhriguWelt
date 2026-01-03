import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Key = string | readonly unknown[] | null;
type Fetcher<Data> = () => Promise<Data>;
type SWROptions = {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
};

type SWRResponse<Data> = {
  data: Data | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: (next?: Data | Promise<Data>) => Promise<Data | undefined>;
};

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function serializeKey(key: Key) {
  if (key === null) return null;
  if (typeof key === "string") return key;
  return JSON.stringify(key);
}

export default function useSWR<Data>(key: Key, fetcher: Fetcher<Data>, options: SWROptions = {}): SWRResponse<Data> {
  const serializedKey = useMemo(() => serializeKey(key), [key]);
  const [data, setData] = useState<Data | undefined>(() => (serializedKey ? (cache.get(serializedKey) as Data) : undefined));
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mountedRef = useRef(true);

  const runFetch = useCallback(async () => {
    if (!serializedKey) return undefined;
    if (inflight.has(serializedKey)) {
      return inflight.get(serializedKey) as Promise<Data>;
    }
    setIsLoading(true);
    const promise = fetcher()
      .then((result) => {
        cache.set(serializedKey, result);
        if (mountedRef.current) {
          setData(result);
          setError(undefined);
        }
        return result;
      })
      .catch((err) => {
        const normalized = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setError(normalized);
        }
        throw normalized;
      })
      .finally(() => {
        inflight.delete(serializedKey);
        if (mountedRef.current) setIsLoading(false);
      });

    inflight.set(serializedKey, promise);
    return promise;
  }, [fetcher, serializedKey]);

  useEffect(() => {
    mountedRef.current = true;
    if (!serializedKey) return () => {};
    if (cache.has(serializedKey)) {
      setData(cache.get(serializedKey) as Data);
    } else {
      void runFetch();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [runFetch, serializedKey]);

  useEffect(() => {
    if (!serializedKey || !options.refreshInterval) return () => {};
    const interval = setInterval(() => {
      void runFetch();
    }, options.refreshInterval);
    return () => clearInterval(interval);
  }, [options.refreshInterval, runFetch, serializedKey]);

  useEffect(() => {
    if (!serializedKey || !options.revalidateOnFocus) return () => {};
    const handler = () => void runFetch();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [options.revalidateOnFocus, runFetch, serializedKey]);

  const mutate = useCallback(
    async (next?: Data | Promise<Data>) => {
      if (!serializedKey) return undefined;
      const resolved = next instanceof Promise ? await next : next;
      if (resolved !== undefined) {
        cache.set(serializedKey, resolved);
        if (mountedRef.current) setData(resolved);
      } else {
        await runFetch();
      }
      return cache.get(serializedKey) as Data | undefined;
    },
    [runFetch, serializedKey],
  );

  return { data, error, isLoading, mutate };
}

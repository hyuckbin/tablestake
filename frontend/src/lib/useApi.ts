import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';
import { useSyncVersion } from './sync';

interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/**
 * GET 요청 훅. 다시 불러오는 동안 이전 데이터를 그대로 보여 줘서 화면이 깜빡이지 않는다.
 * path 가 null 이면 요청하지 않는다. 다른 화면에서 이벤트가 오면 자동으로 다시 불러온다.
 */
export function useApi<T>(path: string | null): ApiState<T> {
  const syncVersion = useSyncVersion();
  const [localVersion, setLocalVersion] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(path !== null);

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<T>(path)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof ApiError ? reason : new ApiError(0, { code: 'UNKNOWN', message: String(reason), details: [] }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, syncVersion, localVersion]);

  const reload = useCallback(() => setLocalVersion((v) => v + 1), []);
  return { data, error, loading, reload };
}

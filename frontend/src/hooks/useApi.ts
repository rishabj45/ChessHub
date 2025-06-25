// frontend/src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * useApiQuery: generic hook to fetch data.
 */
export function useApiQuery<T>(key: string, fetcher: () => Promise<T>) {
  return useQuery<T>([key], fetcher, { refetchOnWindowFocus: false });
}

/**
 * useApiMutation: generic hook for mutations.
 */
export function useApiMutation<T>(action: (data: any) => Promise<T>, onSuccess?: () => void) {
  const client = useQueryClient();
  return useMutation<T>(action, {
    onSuccess: () => {
      client.invalidateQueries();
      onSuccess && onSuccess();
    },
  });
}

import { useQuery, useMutation } from "@tanstack/react-query";

export function useApiQuery<T>(key: string, fetcher: () => Promise<T>) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: fetcher,
    refetchOnWindowFocus: false,
  });
}

export function useApiMutation<T>(key: string, action: (data: any) => Promise<T>) {
  return useMutation<T, Error, any>({
    mutationKey: [key],
    mutationFn: action,
  });
}

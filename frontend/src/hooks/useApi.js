import { useQuery, useMutation } from "@tanstack/react-query";
export function useApiQuery(key, fetcher) {
    return useQuery({
        queryKey: [key],
        queryFn: fetcher,
        refetchOnWindowFocus: false,
    });
}
export function useApiMutation(key, action) {
    return useMutation({
        mutationKey: [key],
        mutationFn: action,
    });
}

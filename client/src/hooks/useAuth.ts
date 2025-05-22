import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
    error
  };
}
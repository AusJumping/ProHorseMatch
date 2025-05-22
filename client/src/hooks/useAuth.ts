import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

export type User = {
  id: number;
  email: string;
  name: string | null;
  business_name: string | null;
  contact_name: string | null;
  is_selling: boolean;
  is_searching: boolean;
  location_country: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
};

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch auth status");
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    refetch,
  };
}
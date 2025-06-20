import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  name?: string;
  business_name?: string;
  contact_name?: string;
  email: string;
  is_searching: boolean;
  is_selling: boolean;
  profile?: any;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_end_date?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (userData: any, userType: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch the current user with improved error handling
  const { data, isLoading, isError } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const userData = await apiRequest('GET', '/api/auth/me');
        console.log("Auth user data:", userData);
        return userData;
      } catch (error: any) {
        console.log("Auth check failed:", error.message);
        if (error.message?.includes('401') || error.message?.includes('Not authenticated')) {
          return null;
        }
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Ensure user is either User object or null, never undefined
  const user = data === undefined ? null : data;
  
  // Debug log for auth state
  console.log("Auth state:", { isAuthenticated: !!user });

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log("Attempting login for:", { email });
      
      const userData = await apiRequest('POST', '/api/auth/login', { email, password });
      console.log("Login successful, user data:", userData);
      
      // Store JWT token if provided
      if (userData.token) {
        localStorage.setItem('authToken', userData.token);
      }
      
      // Update query cache with user data and force refetch to sync with server
      queryClient.setQueryData(['/api/auth/me'], userData);
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Return the user data so the calling function can check subscription status
      return userData;
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      
      // Clear query cache
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.removeQueries({ queryKey: ['/api/auth/me'] });
      
      // Navigate to login page
      navigate('/');
    } catch (error: any) {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local state
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.removeQueries({ queryKey: ['/api/auth/me'] });
      navigate('/');
    }
  };

  const register = async (userData: any, userType: string): Promise<void> => {
    try {
      const registerData = { ...userData, userType };
      const response = await apiRequest('POST', '/api/auth/register', registerData);
      
      // Update query cache with new user data
      queryClient.setQueryData(['/api/auth/me'], response);
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
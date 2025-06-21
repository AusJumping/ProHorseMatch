import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

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

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isError: false,
  isAuthenticated: false,
  login: async () => null,
  logout: async () => {},
  register: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Token-based authentication with cookie and header support
  const { data, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        // Get auth token from localStorage first, then fallback to cookie
        let authToken = localStorage.getItem('auth_token');
        if (!authToken) {
          authToken = document.cookie
            .split(';')
            .find(cookie => cookie.trim().startsWith('auth_token='))
            ?.split('=')[1];
        }
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }
        
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-cache',
          headers
        });
        
        if (res.status === 401) {
          return null;
        }
        
        const userData = await res.json();
        console.log("Auth user data from server:", userData);
        return userData;
      } catch (error) {
        console.error("Auth fetch error:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
  
  // Ensure user is either User object or null, never undefined
  const user = data === undefined ? null : data;
  
  // Debug log for auth state
  console.log("Auth state:", { isAuthenticated: !!user });

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log("Attempting login for:", { email });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const userData = await response.json() as User;
      console.log("Login successful, complete user data:", userData);
      
      // Extract and store auth token from response headers
      const authToken = response.headers.get('X-Auth-Token');
      if (authToken) {
        localStorage.setItem('auth_token', authToken);
        console.log("Stored auth token in localStorage");
      }
      
      // Update query cache with user data
      queryClient.setQueryData(['/api/auth/me'], userData);
      
      // Return the user data so the calling function can check subscription status
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear localStorage if any exists
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      
      // Clear the query cache
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Navigate to home page using client-side routing
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (userData: any, userType: string) => {
    try {
      const response = await fetch(`/api/auth/register/${userType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      // Force a full page reload to ensure auth state is properly updated
      window.location.href = userType === 'owner' ? '/add-horse' : '/';
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isError,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook separately to avoid Fast Refresh issues
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
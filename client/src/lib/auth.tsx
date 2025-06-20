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

  // localStorage-based authentication with server validation
  const { data, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        // First try to get user data from localStorage
        const storedUserData = localStorage.getItem('user_data');
        const storedAuthToken = localStorage.getItem('auth_token');
        
        if (storedUserData && storedAuthToken) {
          console.log("Using stored authentication data");
          return JSON.parse(storedUserData);
        }
        
        // Fallback to server validation with cookies
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (res.status === 401) {
          // Clear any stale localStorage data
          localStorage.removeItem('user_data');
          localStorage.removeItem('auth_token');
          return null;
        }
        
        const userData = await res.json();
        console.log("Auth user data from server:", userData);
        
        // Store for future use
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        return userData;
      } catch (error) {
        console.error("Auth fetch error:", error);
        
        // Try localStorage as last resort
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          console.log("Using localStorage fallback");
          return JSON.parse(storedUserData);
        }
        
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since we're using localStorage
    refetchOnWindowFocus: false, // Don't refetch to avoid clearing localStorage unnecessarily
    refetchInterval: false, // Disable since localStorage persists
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
      
      // Store auth token from response header if available
      const authToken = response.headers.get('X-Auth-Token');
      if (authToken) {
        localStorage.setItem('auth_token', authToken);
        console.log("Auth token stored in localStorage");
      }
      
      // Store user data for immediate access
      localStorage.setItem('user_data', JSON.stringify(userData));
      
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

      // Clear localStorage
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
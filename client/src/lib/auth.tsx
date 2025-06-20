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

  // Fetch the current user with improved caching and localStorage fallback
  const { data, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        // First check if we have a stored authentication state
        const isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
        const storedUser = localStorage.getItem('user');
        
        if (isAuthStored && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Using stored user data:", parsedUser);
            return parsedUser;
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }
        
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (res.status === 401) {
          // Clear localStorage if not authenticated
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          return null;
        }
        
        const userData = await res.json();
        console.log("Auth user data from server:", userData);
        
        // Store user data in localStorage for persistence
        if (userData && userData.id) {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
        }
        
        return userData;
      } catch (error) {
        console.error("Auth fetch error:", error);
        
        // Try to restore from localStorage if fetch fails but we're marked as authenticated
        const isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
        const storedUser = localStorage.getItem('user');
        
        if (isAuthStored && storedUser) {
          try {
            console.log("Using stored user due to fetch error");
            return JSON.parse(storedUser);
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }
        
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache auth data for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid loops
    refetchInterval: false, // Don't auto-refetch to avoid session issues
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
      console.log("Login successful, user data:", userData);
      
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Update query cache with user data
      queryClient.setQueryData(['/api/auth/me'], userData);
      
      // Force refetch to verify session works
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }, 100);
      
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
      localStorage.removeItem('user');
      
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
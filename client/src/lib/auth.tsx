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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any, userType: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isError: false,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch the current user with improved caching
  const { data, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-cache' // Ensure we don't get cached responses
        });
        if (res.status === 401) return null;
        const userData = await res.json();
        console.log("Auth user data:", userData); // Debug log
        
        // Store user data in localStorage for persistence
        if (userData && userData.id) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        return userData;
      } catch (error) {
        console.error("Auth fetch error:", error);
        
        // Try to restore from localStorage if fetch fails
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            return JSON.parse(storedUser);
          } catch (e) {
            return null;
          }
        }
        
        return null;
      }
    },
    staleTime: 60 * 1000, // Cache auth data for 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes to keep session fresh
  });
  
  // Ensure user is either User object or null, never undefined
  const user = data === undefined ? null : data;
  
  // Debug log for auth state
  console.log("Auth state:", { isAuthenticated: !!user });

  const login = async (email: string, password: string) => {
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

      const userData = await response.json();
      console.log("Login successful, user data:", userData);
      
      // Store user in localStorage for quick recovery if session issues occur
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update query cache with user data
      queryClient.setQueryData(['/api/auth/me'], userData);
      
      // Navigate to home page using client-side routing
      navigate('/');
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
};

// Export the hook separately to avoid Fast Refresh issues
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
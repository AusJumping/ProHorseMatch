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

  // Token-based authentication with server validation
  const { data, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (res.status === 401) {
          return null;
        }
        
        const userData = await res.json();
        console.log("Auth user data:", userData);
        return userData;
      } catch (error) {
        console.error("Auth fetch error:", error);
        return null;
      }
    },
    staleTime: 1 * 60 * 1000, // Cache auth data for 1 minute
    refetchOnWindowFocus: true, // Refetch on focus to check token validity
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes to keep token fresh
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
import { createContext, useState, useEffect, useContext, ReactNode } from "react";
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

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Fetch the current user with improved caching
  const { data, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        try {
          const userData = await apiRequest('GET', '/api/auth/me');
          console.log("Auth user data:", userData);
          
          // Store user data in localStorage for persistence
          if (userData && userData.id) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          return userData;
        } catch (error: any) {
          if (error.message?.includes('401')) {
            // Clear localStorage if server says not authenticated
            localStorage.removeItem('user');
            return null;
          }
          throw error;
        }
      } catch (authError) {
        // Network error or other issues - check localStorage for cached user
        try {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            
            // Only use cached data if it looks valid and recent
            if (parsedUser && parsedUser.id && parsedUser.email) {
              console.log("Using cached user data due to auth error");
              
              // Try to verify this user is still valid on next opportunity
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
              }, 1000);
              
              return parsedUser;
            }
          }
        } catch (e) {
          localStorage.removeItem('user');
          return null;
        }
        
        return null;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false,
    retry: 1,
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
      
      // Store user in localStorage for quick recovery if session issues occur
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update query cache with user data and force refetch to sync with server
      queryClient.setQueryData(['/api/auth/me'], userData);
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Return the user data so the calling function can check subscription status
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');

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

  const register = async (userData: any, userType: string): Promise<void> => {
    try {
      const registrationData = { ...userData, userType };
      const newUser = await apiRequest('POST', '/api/auth/register', registrationData);
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update query cache
      queryClient.setQueryData(['/api/auth/me'], newUser);
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
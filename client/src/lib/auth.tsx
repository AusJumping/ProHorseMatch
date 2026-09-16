import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { initNativePush } from "./nativePush";

interface User {
  id: number;
  username?: string;
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
  register: (userData: any, userType: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isError: false,
  isAuthenticated: false,
  login: async () => null,
  logout: async () => {},
  register: async () => null,
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
        let authToken = localStorage.getItem('authToken');
        console.log("=== AUTH CHECK ===");
        console.log("Token from localStorage:", authToken);
        
        if (!authToken) {
          authToken = document.cookie
            .split(';')
            .find(cookie => cookie.trim().startsWith('auth_token='))
            ?.split('=')[1] || null;
          console.log("Token from cookie:", authToken);
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
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  // Re-check auth immediately when the PWA comes back from background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refetch]);

  // Ensure user is either User object or null, never undefined
  const user = data === undefined ? null : data;

  // Debug log for auth state
  console.log("Auth state:", { isAuthenticated: !!user });

  // Set up native push notifications (no-op on the regular website) once logged in
  useEffect(() => {
    if (user) {
      initNativePush();
    }
  }, [!!user]);

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

      const userData = await response.json() as User & { auth_token?: string };
      console.log("Login successful, complete user data:", userData);
      
      // Extract and store auth token from response body
      const authToken = userData.auth_token;
      console.log("=== TOKEN EXTRACTION ===");
      console.log("Full userData object:", userData);
      console.log("Auth token from response body:", authToken);
      console.log("Auth token type:", typeof authToken);
      console.log("Auth token exists:", !!authToken);
      
      if (authToken) {
        try {
          localStorage.setItem('authToken', authToken);
          console.log("Stored auth token in localStorage:", authToken);
          
          // Verify storage immediately
          const storedToken = localStorage.getItem('authToken');
          console.log("Verification - token retrieved from localStorage:", storedToken);
          console.log("Storage successful:", storedToken === authToken);
        } catch (storageError) {
          console.error("LocalStorage error:", storageError);
        }
      } else {
        console.log("No auth token found in response body");
        console.log("Available userData keys:", Object.keys(userData));
      }
      
      // Update query cache with user data (excluding auth_token)
      const { auth_token, ...userDataForCache } = userData;
      queryClient.setQueryData(['/api/auth/me'], userDataForCache);
      console.log("Updated auth cache with user data:", userDataForCache);
      
      // Return the user data so the calling function can check subscription status
      return userDataForCache;
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', (error as Error).constructor.name);
      console.error('Error message:', (error as Error).message);
      console.error('Full error:', error);
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
      localStorage.removeItem('authToken');
      
      // Clear the query cache
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Navigate directly to login page
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (userData: any, userType: string): Promise<User | null> => {
    try {
      console.log("Attempting registration for:", { userType, email: userData.email });
      
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

      const responseData = await response.json();
      console.log("Registration successful, complete response data:", responseData);
      console.log("Response data keys:", Object.keys(responseData));
      console.log("requiresVerification value:", responseData.requiresVerification);
      console.log("requiresVerification type:", typeof responseData.requiresVerification);
      
      // Check if this is an email verification response (no auth_token)
      if (responseData.requiresVerification) {
        console.log("Registration requires email verification:", responseData.message);
        console.log("Returning verification response data");
        // Don't set auth token or cache user data for unverified users
        return {
          ...responseData,
          requiresVerification: true
        };
      }
      
      console.log("Registration did not require verification, proceeding with auth token");
      
      // For verified users, handle normally with auth token
      const authToken = responseData.auth_token;
      console.log("=== REGISTRATION TOKEN EXTRACTION ===");
      console.log("Full responseData object:", responseData);
      console.log("Auth token from response body:", authToken);
      console.log("Auth token type:", typeof authToken);
      console.log("Auth token exists:", !!authToken);
      
      if (authToken) {
        try {
          localStorage.setItem('authToken', authToken);
          console.log("Stored auth token in localStorage:", authToken);
          
          // Verify storage immediately
          const storedToken = localStorage.getItem('authToken');
          console.log("Verification - token retrieved from localStorage:", storedToken);
          console.log("Storage successful:", storedToken === authToken);
        } catch (storageError) {
          console.error("LocalStorage error:", storageError);
        }
      } else {
        console.log("No auth token found in response body");
        console.log("Available responseData keys:", Object.keys(responseData));
      }
      
      // Update query cache with user data (excluding auth_token)
      const { auth_token, ...userDataForCache } = responseData;
      queryClient.setQueryData(['/api/auth/me'], userDataForCache);
      console.log("Updated auth cache with user data:", userDataForCache);
      
      // Return the user data so the calling function can check subscription status
      return userDataForCache;
    } catch (error) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error type:', (error as Error).constructor.name);
      console.error('Error message:', (error as Error).message);
      console.error('Full error:', error);
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
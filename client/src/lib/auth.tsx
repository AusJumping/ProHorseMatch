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

  // Fetch the current user with improved caching and better fallback for deployed environments
  const { data, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        // First try to use stored credentials from localStorage if available
        const storedUser = localStorage.getItem('user');
        const storedAuth = localStorage.getItem('auth_credentials');
        
        // Try server authentication first
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-cache' // Ensure we don't get cached responses
        });
        
        if (res.status === 200) {
          // Server auth succeeded
          const userData = await res.json();
          console.log("Auth user data from server:", userData);
          
          // Store user data in localStorage for persistence
          if (userData && userData.id) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          return userData;
        } else if (storedAuth) {
          // Server auth failed but we have stored credentials - try to login again
          console.log("Session expired, attempting auto-login with stored credentials");
          try {
            const credentials = JSON.parse(storedAuth);
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(credentials),
              credentials: 'include',
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log("Auto-login successful");
              localStorage.setItem('user', JSON.stringify(userData));
              return userData;
            }
          } catch (loginError) {
            console.error("Auto-login failed:", loginError);
          }
        }
        
        // If all server attempts failed, fall back to stored user data
        if (storedUser) {
          try {
            console.log("Using locally stored user data as fallback");
            return JSON.parse(storedUser);
          } catch (e) {
            console.error("Failed to parse stored user data:", e);
            return null;
          }
        }
        
        return null;
      } catch (error) {
        console.error("Auth fetch error:", error);
        
        // Try to restore from localStorage if fetch fails
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            console.log("Using locally stored user data due to fetch error");
            return JSON.parse(storedUser);
          } catch (e) {
            return null;
          }
        }
        
        return null;
      }
    },
    staleTime: 30 * 1000, // Cache auth data for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Refetch every minute to keep session fresh
  });
  
  // Ensure user is either User object or null, never undefined
  const user = data === undefined ? null : data;
  
  // Debug log for auth state
  console.log("Auth state:", { isAuthenticated: !!user });

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log("Attempting login for:", { email });
      
      // Store credentials in localStorage for persistent access (used for auto-login)
      localStorage.setItem('auth_credentials', JSON.stringify({ email, password }));
      
      // Mobile-friendly approach: retry with exponential backoff
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            if (retries === maxRetries - 1) {
              throw new Error(error.message || 'Login failed');
            }
            // Continue to retry
          } else {
            const userData = await response.json() as User;
            console.log("Login successful, user data:", userData);
            
            // Store user in localStorage for quick recovery if session issues occur
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Also store email separately for direct access in critical functions
            localStorage.setItem('userEmail', email);
            sessionStorage.setItem('userEmail', email);
            
            // Update query cache with user data
            queryClient.setQueryData(['/api/auth/me'], userData);
            
            // Clear and immediately refetch authentication to ensure it's properly set
            setTimeout(() => {
              refetch();
            }, 500);
            
            // Return the user data so the calling function can check subscription status
            return userData;
          }
        } catch (innerError) {
          console.log(`Login attempt ${retries + 1} failed, retrying...`);
        }
        
        retries++;
        if (retries < maxRetries) {
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
        }
      }
      
      throw new Error('Login failed after multiple attempts');
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

      // Clear all stored authentication data
      localStorage.removeItem('user');
      localStorage.removeItem('auth_credentials');
      sessionStorage.removeItem('temp_auth');
      
      console.log("Logged out successfully, cleared all stored auth data");
      
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
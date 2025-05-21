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
        
        // If we have a user, fetch their subscription details to ensure 
        // subscription info is properly loaded (especially important on mobile)
        if (userData && userData.id) {
          try {
            const subRes = await fetch('/api/subscription', {
              credentials: 'include',
              cache: 'no-cache'
            });
            
            if (subRes.ok) {
              const subData = await subRes.json();
              console.log("Subscription data on user load:", subData);
              
              // Enhance user data with subscription information
              if (subData.hasSubscription) {
                userData.subscription_status = subData.status;
                userData.subscription_plan = subData.planId;
                userData.stripe_subscription_id = subData.subscriptionId;
                
                if (subData.currentPeriodEnd) {
                  userData.subscription_end_date = new Date(subData.currentPeriodEnd * 1000).toISOString();
                }
                
                console.log("Enhanced initial user load with subscription info:", userData);
              }
            }
          } catch (subError) {
            console.error("Error fetching subscription on initial load:", subError);
            // Continue with basic user data
          }
          
          // After all enhancements, store user data in localStorage for persistence
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
      
      // Make an additional request to get detailed subscription data
      // This is especially important for mobile where sessions sometimes have issues
      try {
        if (userData.id) {
          const subscriptionResponse = await fetch('/api/subscription', {
            credentials: 'include',
            cache: 'no-cache'
          });
          
          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            console.log("Fetched subscription data:", subscriptionData);
            
            // Enhance user data with subscription information from dedicated endpoint
            if (subscriptionData.hasSubscription) {
              userData.subscription_status = subscriptionData.status;
              userData.subscription_plan = subscriptionData.planId;
              userData.stripe_subscription_id = subscriptionData.subscriptionId;
              
              if (subscriptionData.currentPeriodEnd) {
                userData.subscription_end_date = new Date(subscriptionData.currentPeriodEnd * 1000).toISOString();
              }
              
              console.log("Enhanced user data with subscription info:", userData);
            }
          }
        }
      } catch (subError) {
        console.error("Failed to fetch subscription details, using basic user data:", subError);
        // Continue with basic user data from login endpoint
      }
      
      // Store user in localStorage for quick recovery if session issues occur
      localStorage.setItem('user', JSON.stringify(userData));
      
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
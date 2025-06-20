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

  // Direct localStorage authentication without React Query complications
  const [authState, setAuthState] = useState<{ user: User | null; isLoading: boolean }>(() => {
    try {
      const isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
      const storedUser = localStorage.getItem('user');
      
      console.log("Checking localStorage on init:", { isAuthStored, hasUser: !!storedUser });
      
      if (isAuthStored && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("Initial auth state from localStorage:", parsedUser);
        return { user: parsedUser, isLoading: false };
      }
    } catch (e) {
      console.error("Error parsing stored user on init:", e);
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    }
    
    console.log("No valid auth data in localStorage");
    return { user: null, isLoading: false };
  });

  // Add an effect to listen for localStorage changes (e.g., when user logs in from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
        const storedUser = localStorage.getItem('user');
        
        if (isAuthStored && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("Storage change detected, updating auth state:", parsedUser);
          setAuthState({ user: parsedUser, isLoading: false });
        } else {
          console.log("Storage change detected, clearing auth state");
          setAuthState({ user: null, isLoading: false });
        }
      } catch (e) {
        console.error("Error handling storage change:", e);
        setAuthState({ user: null, isLoading: false });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const data = authState.user;
  const isLoading = authState.isLoading;
  const isError = false;
  
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
      
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Update the auth state directly
      setAuthState({ user: userData, isLoading: false });
      
      // Return the user data so the calling function can check subscription status
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear localStorage first
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      // Update auth state
      setAuthState({ user: null, isLoading: false });
      
      // Make logout request to server
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
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
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userState, setUserState] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Check authentication status using session
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    console.log("Session auth state:", { isAuthenticated: !!user });
    setUserState(user || null);
  }, [user]);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log("Session login attempt:", { email, password });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Essential for session cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const userData = await response.json() as User;
      console.log("Session login successful:", userData);
      
      // Update state immediately
      setUserState(userData);
      queryClient.setQueryData(['/api/auth/me'], userData);
      
      // Force refetch to confirm session is established
      setTimeout(() => refetch(), 100);
      
      return userData;
    } catch (error) {
      console.error('Session login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUserState(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Session logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user: userState,
      login,
      logout,
      isAuthenticated: !!userState,
      isLoading,
      refetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
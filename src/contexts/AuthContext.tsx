import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/api/auth';
import apiClient from '@/api/client';
import type { UserProfile } from '@/types';

const PUBLIC_PATHS = ['/login', '/forbidden'];

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = useCallback(async () => {
    try {
      const profile = await authApi.fetchUserProfile();
      setUser(profile);

      if (!profile?.is_admin) {
        navigate('/forbidden', { replace: true });
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    console.log('[Auth] Logging out');
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.log('[Auth] Logout request failed:', err);
    }
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    // Don't check auth on public pages
    if (PUBLIC_PATHS.includes(location.pathname)) {
      setIsLoading(false);
      return;
    }
    checkAuth();
  }, [location.pathname, checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.is_admin ?? false,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

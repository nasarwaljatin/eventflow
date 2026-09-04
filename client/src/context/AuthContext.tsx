import { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as authApi from '../api/auth';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  googleLogin: (credential: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (accessToken) {
          const { user } = await authApi.getMe();
          setUser(user);
        }
      } catch (error) {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const register = async (email: string, password: string, fullName: string, role: string) => {
    const data = await authApi.register(email, password, fullName, role);
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const googleLogin = async (credential: string, role?: string) => {
    const data = await authApi.googleLogin(credential, role);
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        register,
        googleLogin,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

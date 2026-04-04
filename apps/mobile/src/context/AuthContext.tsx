import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../api/types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (res: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('fintrack_token');
        const savedUser = await AsyncStorage.getItem('fintrack_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Failed to load auth from storage', e);
      } finally {
        setLoading(false);
      }
    };
    loadStorage();
  }, []);

  const login = async (res: AuthResponse) => {
    setToken(res.token);
    setUser(res.user);
    await AsyncStorage.setItem('fintrack_token', res.token);
    await AsyncStorage.setItem('fintrack_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await authApi.logout();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

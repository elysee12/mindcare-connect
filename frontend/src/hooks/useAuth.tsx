import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { blink } from '@/lib/blink';
import { setAuthUserId } from '@/lib/api';

type Role = 'mhp' | 'chw' | 'family' | 'admin';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  catchment_area?: string;
  workplace?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, role: Role) => Promise<void>;
  signOut: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const STORAGE_KEY = '@mindcare_connect_user';

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUserState(parsed);
          setAuthUserId(parsed.id);
        }
      } catch (error) {
        console.warn('[auth] Failed to load user from storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, role: Role) => {
    setIsLoading(true);
    try {
      // Fetch user from DB based on email and role
      const users = await blink.db.users.list({
        where: { email, role },
        limit: 1
      });

      if (users.length > 0) {
        const found = users[0] as any;
        setUserState(found);
        setAuthUserId(found.id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      } else {
        throw new Error('User not found');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = (user: User | null) => {
    setUserState(user);
    setAuthUserId(user?.id ?? null);
    if (user) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, setUser }}>
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

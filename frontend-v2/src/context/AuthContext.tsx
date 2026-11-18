import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await apiRequest<User>('/users/me');
        return res.data;
      } catch {
        return null;
      }
    },
    retry: false
  });

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ user: User }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    queryClient.setQueryData(['auth', 'me'], res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await apiRequest('/logout', { method: 'POST' });
    queryClient.setQueryData(['auth', 'me'], null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
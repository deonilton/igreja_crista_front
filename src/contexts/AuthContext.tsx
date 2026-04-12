import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import type { User, AuthContextData, LoginResponse } from '../types';
import { hasMinistryAccess as canAccessMinistry, hasPermission as canAccessResource, PermissionResource } from '../permissions/accessControl';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async (): Promise<void> => {
      const token = sessionStorage.getItem('@igreja:token');
      const savedUser = sessionStorage.getItem('@igreja:user');

      if (!token || !savedUser) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser) as User;
        if (mounted) {
          setUser(parsedUser);
        }

        const response = await api.get<{ user: User }>('/auth/me');
        if (mounted) {
          setUser(response.data.user);
          sessionStorage.setItem('@igreja:user', JSON.stringify(response.data.user));
        }
      } catch {
        sessionStorage.removeItem('@igreja:token');
        sessionStorage.removeItem('@igreja:user');
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      sessionStorage.removeItem('@igreja:token');
      sessionStorage.removeItem('@igreja:user');
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    const { token, user: userData } = response.data;

    sessionStorage.setItem('@igreja:token', token);
    sessionStorage.setItem('@igreja:user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  function logout(): void {
    sessionStorage.removeItem('@igreja:token');
    sessionStorage.removeItem('@igreja:user');
    setUser(null);
  }

  // Validação centralizada: role + recurso + ministério (quando aplicável).
  function hasPermission(resource: PermissionResource, ministry?: string): boolean {
    if (!user) {
      return false;
    }

    const canAccess = canAccessResource(user.role, resource);
    if (!canAccess) {
      return false;
    }

    if (!ministry) {
      return true;
    }

    return canAccessMinistry(user.role, user.ministries || [], ministry);
  }

  function hasMinistryAccess(ministry: string): boolean {
    if (!user) {
      return false;
    }

    return canAccessMinistry(user.role, user.ministries || [], ministry);
  }

  async function refreshUser(): Promise<void> {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      setUser(response.data.user);
      sessionStorage.setItem('@igreja:user', JSON.stringify(response.data.user));
    } catch {
      // ignore silently
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signed: !!user, hasPermission, hasMinistryAccess, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

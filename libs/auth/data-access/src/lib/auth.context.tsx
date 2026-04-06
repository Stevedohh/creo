import {
  createContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@creo/shared';
import * as authApi from './auth.api';
import type { User, LoginRequest, RegisterRequest } from './auth.types';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!getAccessToken());
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const initRef = useRef(false);

  // On mount: if tokens exist in localStorage, fetch user profile
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!getAccessToken()) return;

    authApi
      .getMe()
      .then((me) => {
        setUser(me);
        i18n.changeLanguage(me.language);
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [i18n]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const result = await authApi.login(data);
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      i18n.changeLanguage(result.user.language);
      navigate('/');
    },
    [navigate, i18n],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const result = await authApi.register(data);
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      i18n.changeLanguage(result.user.language);
      navigate('/');
    },
    [navigate, i18n],
  );

  const logoutFn = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      clearTokens();
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const updateLanguageFn = useCallback(async (lang: string) => {
    const updated = await authApi.updateLanguage(lang);
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout: logoutFn,
        updateLanguage: updateLanguageFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

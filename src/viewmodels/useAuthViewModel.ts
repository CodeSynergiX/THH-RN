import { useCallback, useEffect, useState } from 'react';
import { authService, AuthUser } from '../services/authService';
import { defaultApiClient } from '../services/apiClient';

export function useAuthViewModel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await defaultApiClient.getAuthToken();
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const res = await authService.me();
        setUser(res.data ?? null);
      } catch {
        await defaultApiClient.clearAuthToken();
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (token: string, next: AuthUser) => {
    await defaultApiClient.setAuthToken(token);
    setUser(next);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authService.me();
    if (res.data) {
      setUser(res.data);
    }
    return res.data;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login(email, password);
      if (res.data?.token) {
        await persist(res.data.token, res.data.user);
      }
      return res;
    },
    [persist],
  );

  const verifyOtp = useCallback(
    async (payload: {
      email?: string;
      phone?: string;
      identifier?: string;
      code: string;
    }) => {
      const res = await authService.verifyOtp(payload);
      if (res.data?.token) {
        await persist(res.data.token, res.data.user);
      }
      return res;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const register = useCallback(
    async (payload: Parameters<typeof authService.register>[0]) => {
      const res = await authService.register(payload);
      if (res.data?.token) {
        await persist(res.data.token, res.data.user);
      }
      return res;
    },
    [persist],
  );

  const updateProfile = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await authService.updateProfile(payload);
      if (res.data) {
        setUser(res.data);
      }
      return res;
    },
    [],
  );

  const uploadAvatar = useCallback(
    async (payload: { avatar_base64?: string; avatar?: any }) => {
      const res = await authService.uploadAvatar(payload);
      if (res.data?.user) {
        setUser(res.data.user);
      }
      return res;
    },
    [],
  );

  return {
    user,
    ready,
    isLoggedIn: Boolean(user),
    login,
    register,
    verifyOtp,
    logout,
    refreshUser,
    updateProfile,
    uploadAvatar,
    requestOtp: authService.requestOtp,
    forgotPassword: authService.forgotPassword,
    resetPasswordWithOtp: authService.resetPasswordWithOtp,
  };
}

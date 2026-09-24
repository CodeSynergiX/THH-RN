import React, { createContext, useContext } from 'react';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';

type AuthContextValue = ReturnType<typeof useAuthViewModel>;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useAuthViewModel();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

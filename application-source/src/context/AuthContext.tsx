/**
 * AuthContext Module
 *
 * Responsibilities:
 * - Provide global authentication and account management state
 * - Handle site unlocking via passcode verification
 * - Manage and refresh linked cloud storage accounts
 *
 * Boundaries:
 * - Does not handle raw API calls (delegated to apiClient)
 * - Does not manage persistent user sessions (delegated to sessionStorage)
 */


import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext, type Account } from './AuthContext.types';
export type { Account };
export { AuthContext };

import { apiClient } from '../services/apiClient';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('site_unlocked') === 'true';
  });
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const EXPECTED_PASSCODE = import.meta.env.VITE_SITE_PASSCODE;

  const refreshAccounts = useCallback(async () => {
    if (!isUnlocked) return;
    setIsLoadingAccounts(true);
    try {
      const accounts = await apiClient.get<Account[]>('/accounts/');
      setConnectedAccounts(accounts);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [isUnlocked]);

  const logoutAccount = async (id: number) => {
    try {
      await apiClient.delete(`/accounts/${id}`);
      await refreshAccounts();
    } catch (err) {
      console.error('Failed to logout account:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      refreshAccounts();
    }
  }, [isUnlocked, refreshAccounts]);

  const unlock = (passcode: string) => {
    if (passcode === EXPECTED_PASSCODE) {
      setIsUnlocked(true);
      setError(null);
      sessionStorage.setItem('site_unlocked', 'true');
      return true;
    } else {
      setError('Incorrect passcode. Please try again.');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isUnlocked, 
      unlock, 
      error, 
      connectedAccounts, 
      isLoadingAccounts, 
      refreshAccounts, 
      logoutAccount 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

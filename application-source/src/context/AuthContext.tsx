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
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token');
  });
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const refreshAccounts = useCallback(async () => {
    if (!isUnlocked) return;
    setIsLoadingAccounts(true);
    try {
      const accounts = await apiClient.get<Account[]>('/accounts/');
      setConnectedAccounts(accounts);
    } catch (err: unknown) {
      console.error('Failed to fetch accounts:', err);
      // If unauthorized, reset unlock state
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('401')) {
        setIsUnlocked(false);
        setToken(null);
        sessionStorage.removeItem('site_unlocked');
        localStorage.removeItem('access_token');
      }
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

  const unlock = async (passcode: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: passcode }),
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setToken(data.access_token);
      
      setIsUnlocked(true);
      setError(null);
      sessionStorage.setItem('site_unlocked', 'true');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Incorrect passcode. Please try again.');
      return false;
    }
  };

  const login = async (username: string, passcode: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passcode }),
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setToken(data.access_token);
      
      setIsUnlocked(true);
      setError(null);
      sessionStorage.setItem('site_unlocked', 'true');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Incorrect username or passcode. Please try again.');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isUnlocked, 
      token,
      unlock, 
      login,
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

/**
 * Auth Context Types Module
 *
 * Responsibilities:
 * - Define TypeScript interfaces for authentication state
 * - Define payload structures for auth actions
 *
 * Boundaries:
 * - Does not contain implementation details
 */

import { createContext } from 'react';

export interface Account {
  id: number;
  email: string;
  provider: 'mega' | 'gdrive';
  is_active: boolean;
  storage_used: number;
  storage_total: number;
}

export interface AuthContextType {
  isUnlocked: boolean;
  unlock: (passcode: string) => Promise<boolean>;
  login: (username: string, passcode: string) => Promise<boolean>;
  error: string | null;
  connectedAccounts: Account[];
  isLoadingAccounts: boolean;
  refreshAccounts: () => Promise<void>;
  logoutAccount: (id: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

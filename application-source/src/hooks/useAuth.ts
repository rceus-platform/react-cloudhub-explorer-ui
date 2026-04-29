/**
 * Auth Hook Module
 *
 * Responsibilities:
 * - Provide a convenient hook for accessing authentication context
 * - Ensure the hook is used within the correct provider scope
 *
 * Boundaries:
 * - Does not manage the actual authentication state (delegated to AuthContext)
 */

import { useContext } from 'react';
import { AuthContext } from '../app/context/AuthContext';

/** Custom hook to access authentication state and actions */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

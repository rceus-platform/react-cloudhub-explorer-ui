/**
 * Account Manager Hook Module
 *
 * Responsibilities:
 * - Provide business logic for adding and removing accounts
 * - Handle state for MEGA login form and submission
 * - Manage storage formatting and quota calculations
 *
 * Boundaries:
 * - Does not render UI (delegated to components)
 * - Does not manage global auth state (delegated to AuthContext)
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';

/** Custom hook for orchestrating account management operations */
export const useAccountManager = () => {
  const { connectedAccounts, isLoadingAccounts, refreshAccounts, logoutAccount } = useAuth();
  const [isAddingMega, setIsAddingMega] = useState(false);
  const [megaEmail, setMegaEmail] = useState('');
  const [megaPassword, setMegaPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Convert raw byte counts into human-readable strings */
  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  /** Listen for Google login success message from child tab */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'google-login-success') {
        console.log('Google login successful, refreshing accounts...');
        refreshAccounts();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshAccounts]);

  /** Redirect user to Google OAuth2 flow */
  const handleAddGDrive = async () => {
    try {
      const response = await apiClient.get<{ auth_url: string }>('/accounts/google/login');
      window.open(response.auth_url, '_blank');
    } catch (err) {
      console.error('Failed to start Google login:', err);
      setError('Failed to start Google Drive login flow.');
    }
  };

  /** Submit MEGA credentials to the backend */
  const handleAddMega = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/accounts/add', {
        email: megaEmail,
        password: megaPassword,
        provider: 'mega'
      });
      await refreshAccounts();
      setIsAddingMega(false);
      setMegaEmail('');
      setMegaPassword('');
    } catch {
      setError('Failed to link MEGA account. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Toggle the visibility of the MEGA add form */
  const toggleMegaForm = () => setIsAddingMega(prev => !prev);

  return {
    connectedAccounts,
    isLoadingAccounts,
    refreshAccounts,
    logoutAccount,
    isAddingMega,
    megaEmail,
    setMegaEmail,
    megaPassword,
    setMegaPassword,
    isSubmitting,
    error,
    formatBytes,
    handleAddGDrive,
    handleAddMega,
    toggleMegaForm
  };
};

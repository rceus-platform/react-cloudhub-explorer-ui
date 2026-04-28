/**
 * AccountManager Module
 *
 * Responsibilities:
 * - Orchestrate the cloud account management dashboard
 * - Provide a centralized interface for adding and removing providers
 * - Manage modal visibility and layout
 *
 * Boundaries:
 * - Business logic is delegated to the useAccountManager hook
 * - Specific UI fragments are delegated to AccountCard and MegaAddForm
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Cloud, 
  Loader2, 
  RefreshCw
} from 'lucide-react';
import { SiGooglecloud, SiMega } from 'react-icons/si';
import { useAccountManager } from '../hooks/useAccountManager';
import { AccountCard } from './AccountCard';
import { MegaAddForm } from './MegaAddForm';

import './AccountManager.css';

interface AccountManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Dashboard modal for managing multiple cloud storage account connections */
export const AccountManager: React.FC<AccountManagerProps> = ({ isOpen, onClose }) => {
  const {
    connectedAccounts,
    isLoadingAccounts,
    refreshAccounts,
    logoutAccount,
    megaEmail,
    setMegaEmail,
    megaPassword,
    setMegaPassword,
    isAddingMega,
    isSubmitting,
    error,
    formatBytes,
    handleAddGDrive,
    handleAddMega,
    toggleMegaForm
  } = useAccountManager();

  if (!isOpen) return null;

  return (
    <div className="account-manager-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="account-manager-card"
      >
        <header className="manager-header">
          <div className="header-title">
            <Cloud className="title-icon" />
            <h2>Cloud Accounts</h2>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn" 
              onClick={refreshAccounts}
              disabled={isLoadingAccounts}
              title="Sync Accounts"
            >
              <RefreshCw className={isLoadingAccounts ? 'spin' : ''} size={18} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="manager-content">
          <div className="accounts-section">
            <div className="section-header">
              <h3>Connected Infrastructure</h3>
              <span className="account-count">{connectedAccounts.length} active</span>
            </div>
            
            {isLoadingAccounts && connectedAccounts.length === 0 ? (
              <div className="loading-state">
                <Loader2 className="spin" />
                <p>Retrieving cloud metadata...</p>
              </div>
            ) : connectedAccounts.length === 0 ? (
              <div className="empty-state">
                <p>No storage providers connected yet.</p>
              </div>
            ) : (
              <div className="accounts-list">
                {connectedAccounts.map((account) => (
                  <AccountCard 
                    key={account.id} 
                    account={account} 
                    formatBytes={formatBytes}
                    onDisconnect={logoutAccount}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="add-section">
            <div className="section-header">
              <h3>Expand Infrastructure</h3>
            </div>
            
            <div className="add-buttons">
              <button 
                className="add-btn" 
                onClick={handleAddGDrive}
                style={{ background: "rgba(66, 133, 244, 0.05)", borderColor: "rgba(66, 133, 244, 0.2)" }}
              >
                <SiGooglecloud size={24} color="#4285f4" />
                <span>Link Google Drive</span>
              </button>
              <button 
                className={`add-btn ${isAddingMega ? 'active' : ''}`} 
                onClick={toggleMegaForm}
                style={{ background: "rgba(255, 59, 48, 0.05)", borderColor: "rgba(255, 59, 48, 0.2)" }}
              >
                <SiMega size={24} color="#ff3b30" />
                <span>Link MEGA Cloud</span>
              </button>
            </div>

            <AnimatePresence>
              {isAddingMega && (
                <MegaAddForm 
                  email={megaEmail}
                  setEmail={setMegaEmail}
                  password={megaPassword}
                  setPassword={setMegaPassword}
                  isSubmitting={isSubmitting}
                  error={error}
                  onSubmit={handleAddMega}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

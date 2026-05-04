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

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Cloud,
  Loader2
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

  // Split accounts by provider
  const gdriveAccounts = useMemo(() => 
    connectedAccounts.filter(a => a.provider === 'gdrive'),
    [connectedAccounts]
  );
  
  const megaAccounts = useMemo(() => 
    connectedAccounts.filter(a => a.provider === 'mega'),
    [connectedAccounts]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="account-manager-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="account-manager-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="modal-header">
            <div className="title-group">
              <Cloud className="title-icon" />
              <div>
                <h2>Cloud Accounts</h2>
                <p>Manage your storage infrastructure</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="close-btn" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="modal-content">
            <div className="accounts-section">
              <div className="section-header">
                <h3>Connected Accounts</h3>
                <span className="account-count">{connectedAccounts.length} active</span>
              </div>

              {isLoadingAccounts && connectedAccounts.length === 0 ? (
                <div className="loading-state">
                  <Loader2 className="spin" size={32} />
                  <p style={{ marginTop: '16px', color: 'rgba(255,255,255,0.4)' }}>Retrieving cloud metadata...</p>
                </div>
              ) : connectedAccounts.length === 0 ? (
                <div className="empty-state">
                  <Cloud className="empty-icon" size={48} />
                  <p>No storage providers connected</p>
                  <p className="sub">Link an account to start browsing</p>
                </div>
              ) : (
                <div className="accounts-split-grid">
                  <div className="provider-column">
                    <div className="column-header">
                      <SiGooglecloud size={14} color="#4285F4" />
                      <h4>Google Drive</h4>
                    </div>
                    <div className="column-list">
                      {gdriveAccounts.length > 0 ? (
                        gdriveAccounts.map((account) => (
                          <AccountCard
                            key={account.id}
                            account={account}
                            formatBytes={formatBytes}
                            onDisconnect={logoutAccount}
                          />
                        ))
                      ) : (
                        <div className="column-empty">No Google accounts</div>
                      )}
                    </div>
                  </div>

                  <div className="column-divider" />

                  <div className="provider-column">
                    <div className="column-header">
                      <SiMega size={14} color="#ff3b30" />
                      <h4>MEGA.nz</h4>
                    </div>
                    <div className="column-list">
                      {megaAccounts.length > 0 ? (
                        megaAccounts.map((account) => (
                          <AccountCard
                            key={account.id}
                            account={account}
                            formatBytes={formatBytes}
                            onDisconnect={logoutAccount}
                          />
                        ))
                      ) : (
                        <div className="column-empty">No MEGA accounts</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="add-section">
              <div className="section-header">
                <h3>Add Provider</h3>
              </div>

              <div className="add-buttons">
                <button
                  className="add-btn gdrive"
                  onClick={handleAddGDrive}
                >
                  <SiGooglecloud size={20} />
                  <span>Link Google Drive</span>
                </button>
                <button
                  className={`add-btn mega ${isAddingMega ? 'active' : ''}`}
                  onClick={toggleMegaForm}
                >
                  <SiMega size={20} />
                  <span>Link MEGA Cloud</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <MegaAddForm
        isOpen={isAddingMega}
        onClose={toggleMegaForm}
        email={megaEmail}
        setEmail={setMegaEmail}
        password={megaPassword}
        setPassword={setMegaPassword}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleAddMega}
      />
    </>
  );
};

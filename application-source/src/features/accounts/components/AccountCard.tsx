/**
 * AccountCard Component
 *
 * Responsibilities:
 * - Render status and storage information for a single cloud account
 * - Handle disconnect actions
 *
 * Boundaries:
 * - Does not manage state (delegated to parent/hooks)
 * - Does not perform API calls directly
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  LogOut,
  CheckCircle2,
  XCircle,
  HardDrive
} from 'lucide-react';
import { SiGooglecloud, SiMega } from 'react-icons/si';
import type { Account } from '../../../app/context/AuthContext';

interface AccountCardProps {
  account: Account;
  formatBytes: (bytes: number) => string;
  onDisconnect: (id: number) => void;
}

/** Individual card displaying account health and storage metrics */
export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  formatBytes,
  onDisconnect
}) => {
  const usagePercentage = Math.round((account.storage_used / account.storage_total) * 100) || 0;

  return (
    <motion.div
      layout
      className={`account-card glass-premium ${!account.is_active ? 'inactive' : ''}`}
    >
      <div className="card-top">
        <div className="provider-info">
          <div className={`provider-icon ${account.provider}`}>
            {account.provider === 'gdrive' ? <SiGooglecloud size={18} /> : <SiMega size={18} />}
          </div>
          <div className="identity">
            <span className="email">{account.email}</span>
            <span className="provider-name">
              {account.provider === 'gdrive' ? 'Google Drive' : 'MEGA.nz'}
            </span>
          </div>
        </div>
        <div className={`status-badge ${account.is_active ? 'active' : 'error'}`}>
          {account.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {account.is_active ? 'Active' : 'Expired'}
        </div>
      </div>

      <div className="card-usage">
        <div className="usage-info">
          <span><HardDrive size={12} /> {formatBytes(account.storage_used)} / {formatBytes(account.storage_total)}</span>
          <span>{usagePercentage}%</span>
        </div>
        <div className="progress-bar-bg">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            className="progress-bar-fill"
          />
        </div>
      </div>

      <div className="card-actions">
        <button
          className="disconnect-btn"
          onClick={() => onDisconnect(account.id)}
        >
          <LogOut size={14} /> Disconnect
        </button>
      </div>
    </motion.div>
  );
};

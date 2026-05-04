/**
 * MegaAddForm Component
 *
 * Responsibilities:
 * - Render the credential entry form for MEGA accounts in a modal popup
 * - Manage local input state for email and password
 * - Handle form submission and modal visibility
 *
 * Boundaries:
 * - Does not perform API calls directly (delegated to onSubmit prop)
 * - Styles are managed in AccountManager.css
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Plus, X, Shield } from 'lucide-react';

interface MegaAddFormProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

/** Modal for capturing and submitting MEGA.nz credentials */
export const MegaAddForm: React.FC<MegaAddFormProps> = ({
  isOpen,
  onClose,
  email,
  setEmail,
  password,
  setPassword,
  isSubmitting,
  error,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="account-manager-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="account-manager-modal mega-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="modal-header">
            <div className="title-group">
              <Shield className="title-icon" style={{ color: '#ff3b30', background: 'rgba(255, 59, 48, 0.1)' }} />
              <div>
                <h2>Link MEGA Storage</h2>
                <p>Securely connect your account</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </header>

          <div className="mega-modal-content">
            <form onSubmit={onSubmit} className="mega-form-wrapper">
              <div className="input-fields">
                <div className="input-group">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <div className="btn-inner">
                    <Plus size={18} />
                    <span>Connect MEGA Account</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

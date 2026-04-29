/**
 * MegaAddForm Component
 *
 * Responsibilities:
 * - Render the credential entry form for MEGA accounts
 * - Manage local input state for email and password
 * - Handle form submission
 *
 * Boundaries:
 * - Does not perform API calls directly (delegated to onSubmit prop)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, LogOut, Loader2, Plus } from 'lucide-react';

interface MegaAddFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

/** Form for capturing and submitting MEGA.nz credentials */
export const MegaAddForm: React.FC<MegaAddFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  isSubmitting,
  error,
  onSubmit
}) => {
  return (
    <motion.form
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      onSubmit={onSubmit}
      className="mega-form glass-dark"
    >
      <div className="input-group">
        <Mail size={16} />
        <input
          type="email"
          placeholder="MEGA Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="input-group">
        <LogOut size={16} style={{ transform: 'rotate(90deg)' }} />
        <input
          type="password"
          placeholder="MEGA Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error-msg">{error}</div>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
        Connect MEGA Account
      </button>
    </motion.form>
  );
};

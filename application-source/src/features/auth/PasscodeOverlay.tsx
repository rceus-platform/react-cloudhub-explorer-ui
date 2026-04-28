/**
 * AuthOverlay Component
 * 
 * Responsibilities:
 * - Provide a secure entry point for the application
 * - Support both Quick PIN access and full Admin credentials
 * - Handle login flow with the backend API
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, User as UserIcon, Lock, Loader2, ChevronRight, Hash } from 'lucide-react';
import styles from './PasscodeOverlay.module.css';

interface AuthOverlayProps {
  onVerify: (pin: string) => Promise<boolean>;
  onLogin: (username: string, passcode: string) => Promise<boolean>;
  error?: string | null;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onVerify, onLogin, error: externalError }) => {
  const [mode, setMode] = useState<'pin' | 'login'>('pin');
  const [pin, setPin] = useState(['', '', '', '']);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const performPinSubmit = useCallback(async (pinString: string) => {
    if (pinString.length === 4) {
      setIsSubmitting(true);
      setLocalError(null);
      const success = await onVerify(pinString);
      if (!success) {
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      setIsSubmitting(false);
    }
  }, [onVerify]);

  const handlePinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    performPinSubmit(pin.join(''));
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    } else if (value && index === 3 && newPin.join('').length === 4) {
      performPinSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);
    await onLogin(username, password);
    setIsSubmitting(false);
  };

  const error = externalError || localError;

  return (
    <div className={styles.overlay}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <Shield className={styles.shieldIcon} size={32} />
          </div>
          <h2 className={styles.title}>CloudHub Explorer</h2>
          <p className={styles.subtitle}>
            {mode === 'pin' ? 'Enter quick access PIN' : 'Sign in with administrator credentials'}
          </p>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${mode === 'pin' ? styles.activeTab : ''}`}
            onClick={() => setMode('pin')}
          >
            <Hash size={14} /> Quick PIN
          </button>
          <button 
            className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => setMode('login')}
          >
            <UserIcon size={14} /> Admin Login
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'pin' ? (
            <motion.form 
              key="pin-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handlePinSubmit} 
              className={styles.form}
            >
              <div className={styles.pinInputs}>
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="password"
                    maxLength={1}
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={styles.pinDigit}
                    autoFocus={index === 0}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
              <button type="submit" className={styles.submitBtn} disabled={pin.join('').length < 4 || isSubmitting}>
                {isSubmitting ? <Loader2 className={styles.spin} /> : 'Unlock Now'}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="login-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleLoginSubmit} 
              className={styles.form}
            >
              <div className={styles.inputGroup}>
                <div className={styles.inputIcon}>
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.textInput}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.inputGroup}>
                <div className={styles.inputIcon}>
                  <Key size={18} />
                </div>
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.textInput}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className={styles.spin} /> : (
                  <>
                    Sign In <ChevronRight size={18} />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={styles.errorMsg}
          >
            {error}
          </motion.div>
        )}

        <div className={styles.footer}>
          <Lock size={12} /> Secure encrypted connection
        </div>
      </motion.div>
    </div>
  );
};

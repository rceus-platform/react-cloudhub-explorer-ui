/**
 * Vite Environment Types Module
 *
 * Responsibilities:
 * - Provide TypeScript definitions for Vite env variables
 * - Enhance import.meta.env typing
 *
 * Boundaries:
 * - Does not contain runtime logic
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_PASSCODE: string;
}

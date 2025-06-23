'use client';

import * as React from 'react';
import { TwoFactorDialog } from './two-factor-dialog';

export type Callback = () => Promise<void>;

interface TwoFactorContext {
  startVerification: (callback: Callback) => void;
}

const TwoFactorContext = React.createContext<TwoFactorContext | null>(null);

export function useTwoFactor() {
  const context = React.useContext(TwoFactorContext);
  if (!context) {
    throw new Error('useTwoFactor must be used within a TwoFactorProvider');
  }
  return context;
}

export function TwoFactorProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const callbackRef = React.useRef<Callback | null>(null);

  async function startVerification(callback: Callback) {
    callbackRef.current = callback;
    setOpen(true);
  }

  async function onVerify() {
    if (!callbackRef.current) return;
    await callbackRef.current();
    callbackRef.current = null;
  }

  return (
    <TwoFactorContext.Provider value={{ startVerification }}>
      {children}
      <TwoFactorDialog open={open} setOpen={setOpen} onVerify={onVerify} />
    </TwoFactorContext.Provider>
  );
}

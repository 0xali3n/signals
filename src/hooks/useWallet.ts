// React hook for embedded wallet management

import { useState, useEffect, useCallback } from 'react';
import { Wallet } from '../types';
import {
  generateKeypair,
  loadWallet,
  saveWallet,
  deleteWallet as deleteWalletStorage,
  getUsername,
  setUsername as setUsernameStorage,
} from '../utils/wallet';

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load wallet on mount
  useEffect(() => {
    async function load() {
      try {
        const loaded = await loadWallet();
        const storedUsername = getUsername();
        
        setWallet(loaded);
        setUsernameState(storedUsername);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wallet');
      } finally {
        setIsLoading(false);
      }
    }
    
    load();
  }, []);

  // Create new wallet
  const createWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { address, privateKey } = await generateKeypair();
      const newWallet: Wallet = {
        address,
        privateKey,
        balance: 0, // Will be fetched from chain
      };
      
      await saveWallet(newWallet);
      setWallet(newWallet);
      
      return newWallet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete wallet
  const deleteWallet = useCallback(async () => {
    try {
      await deleteWalletStorage();
      setWallet(null);
      setUsernameState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete wallet');
    }
  }, []);

  // Set username
  const setUsername = useCallback((name: string) => {
    setUsernameStorage(name);
    setUsernameState(name);
  }, []);

  // Update balance
  const updateBalance = useCallback((balance: number) => {
    if (wallet) {
      const updated = { ...wallet, balance };
      setWallet(updated);
      saveWallet(updated);
    }
  }, [wallet]);

  return {
    wallet,
    username,
    isLoading,
    error,
    createWallet,
    deleteWallet,
    setUsername,
    updateBalance,
    isConnected: wallet !== null,
  };
}


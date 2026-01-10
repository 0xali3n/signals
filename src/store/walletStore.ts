// Zustand store for wallet state management

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Wallet } from '../types';
import {
  generateKeypair,
  loadWallet,
  saveWallet,
  deleteWallet as deleteWalletStorage,
  getUsername,
  setUsername as setUsernameStorage,
} from '../utils/wallet';

interface WalletState {
  wallet: Wallet | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  createWallet: () => Promise<Wallet>;
  deleteWallet: () => Promise<void>;
  setUsername: (name: string) => void;
  updateBalance: (balance: number) => void;
  setWallet: (wallet: Wallet | null) => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      username: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      initialize: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        try {
          const loaded = await loadWallet();
          const storedUsername = getUsername();
          
          set({
            wallet: loaded,
            username: storedUsername,
            isInitialized: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load wallet',
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      createWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          const { address, privateKey } = await generateKeypair();
          const newWallet: Wallet = {
            address,
            privateKey,
            balance: 0,
          };
          
          await saveWallet(newWallet);
          set({ wallet: newWallet, isLoading: false });
          return newWallet;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to create wallet';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      setWallet: async (wallet: Wallet | null) => {
        if (wallet) {
          await saveWallet(wallet);
        } else {
          await deleteWalletStorage();
        }
        set({ wallet });
      },

      deleteWallet: async () => {
        await deleteWalletStorage();
        set({ wallet: null, username: null });
      },

      setUsername: (name: string) => {
        setUsernameStorage(name);
        set({ username: name });
      },

      updateBalance: (balance: number) => {
        const { wallet } = get();
        if (wallet) {
          const updated = { ...wallet, balance };
          set({ wallet: updated });
          saveWallet(updated);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'signals-wallet',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        wallet: state.wallet,
        username: state.username,
      }),
    }
  )
);


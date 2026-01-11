// Zustand store for wallet state management

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Wallet } from "../types";
import {
  loadWallet,
  saveWallet,
  deleteWallet as deleteWalletStorage,
  getUsername,
  setUsername as setUsernameStorage,
} from "../utils/wallet";

type CreationStep =
  | "idle"
  | "initializing"
  | "generating"
  | "connecting"
  | "claiming"
  | "finalizing"
  | "complete";

interface WalletState {
  wallet: Wallet | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  lineraWalletInstance: any | null; // Store Linera Wallet instance (not serialized)
  creationStep: CreationStep;
  creationMessage: string | null;
  // Actions
  initialize: () => Promise<void>;
  createWallet: () => Promise<Wallet>;
  deleteWallet: () => Promise<void>;
  setUsername: (name: string) => void;
  setWallet: (wallet: Wallet | null) => Promise<void>;
  clearError: () => void;
  setLineraWallet: (wallet: any) => void;
  setCreationStep: (step: CreationStep, message?: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      username: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      lineraWalletInstance: null,
      creationStep: "idle",
      creationMessage: null,

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

          // Don't fetch balance on init - user can refresh manually
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to load wallet",
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      createWallet: async () => {
        set({
          isLoading: true,
          error: null,
          creationStep: "initializing",
          creationMessage: "Initializing Linera Web Client...",
        });

        try {
          // Step 1: Initialize
          get().setCreationStep(
            "initializing",
            "Initializing Linera Web Client..."
          );
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Step 2: Generate keypair
          get().setCreationStep("generating", "Generating secure keypair...");
          const { generateKeypair } = await import("../utils/wallet");
          const { address, privateKey } = await generateKeypair();
          // Update wallet state with address for progress display
          set({ wallet: { address, privateKey, balance: 0 } as Wallet });
          get().setCreationStep(
            "generating",
            `Address: ${address.slice(0, 10)}...`
          );
          await new Promise((resolve) => setTimeout(resolve, 400));

          // Step 3: Connect to faucet
          get().setCreationStep(
            "connecting",
            "Connecting to Conway Testnet faucet..."
          );
          const { createWalletFromFaucet } = await import(
            "../utils/lineraClient"
          );
          const lineraWallet = await createWalletFromFaucet();
          get().setCreationStep("connecting", "Faucet connected successfully");
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Step 4: Claim chain
          get().setCreationStep(
            "claiming",
            "Claiming your microchain with test tokens..."
          );
          const { claimChainFromFaucet } = await import(
            "../utils/lineraClient"
          );
          const chainId = await claimChainFromFaucet(lineraWallet, address);
          // Update wallet state with chainId for progress display
          set({
            wallet: { address, privateKey, balance: 0, chainId } as Wallet,
          });
          get().setCreationStep(
            "claiming",
            `Microchain ID: ${chainId.slice(0, 16)}...`
          );
          await new Promise((resolve) => setTimeout(resolve, 400));

          // Step 5: Finalize
          get().setCreationStep("finalizing", "Saving wallet data...");
          const newWallet: Wallet = {
            address,
            privateKey,
            balance: 0,
            chainId,
          };

          await saveWallet(newWallet);

          set({
            wallet: newWallet,
            lineraWalletInstance: lineraWallet,
            isLoading: false,
            creationStep: "complete",
            creationMessage: "Wallet created successfully!",
          });

          return newWallet;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create wallet";
          set({
            error: message,
            isLoading: false,
            creationStep: "idle",
            creationMessage: null,
          });
          throw err;
        }
      },

      setCreationStep: (step: CreationStep, message?: string) => {
        set({ creationStep: step, creationMessage: message || null });
      },

      setLineraWallet: (wallet: any) => {
        set({ lineraWalletInstance: wallet });
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
        set({ wallet: null, username: null, lineraWalletInstance: null });
      },

      setUsername: (name: string) => {
        setUsernameStorage(name);
        set({ username: name });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "signals-wallet",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        wallet: state.wallet,
        username: state.username,
      }),
    }
  )
);

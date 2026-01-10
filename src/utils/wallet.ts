// Embedded wallet utilities for Linera microchain

import { signer } from '@linera/client';
import { Wallet } from '../types';

const { PrivateKey } = signer;

const WALLET_STORAGE_KEY = 'linera_wallet';
const USERNAME_STORAGE_KEY = 'linera_username';

/**
 * Generate a new keypair for Linera microchain using Linera Web Client
 */
export async function generateKeypair(): Promise<{ address: string; privateKey: string }> {
  try {
    // Use Linera's PrivateKey.createRandom() to generate a secure keypair
    const signer = PrivateKey.createRandom();
    const address = signer.address();
    
    // Get the private key from the signer's wallet
    // The PrivateKey uses ethers.Wallet internally
    const privateKey = (signer as any).wallet.privateKey;
    
    return { address, privateKey };
  } catch (error) {
    console.error('Failed to generate keypair:', error);
    throw new Error('Failed to generate wallet keypair');
  }
}

/**
 * Load wallet from IndexedDB
 */
export async function loadWallet(): Promise<Wallet | null> {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!stored) return null;
    
    const wallet = JSON.parse(stored) as Wallet;
    return wallet;
  } catch (error) {
    console.error('Failed to load wallet:', error);
    return null;
  }
}

/**
 * Save wallet to IndexedDB (localStorage for MVP)
 */
export async function saveWallet(wallet: Wallet): Promise<void> {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  } catch (error) {
    console.error('Failed to save wallet:', error);
    throw error;
  }
}

/**
 * Export wallet as encrypted JSON
 */
export async function exportWallet(wallet: Wallet, _password: string): Promise<string> {
  // TODO: Implement proper encryption
  // For MVP, we'll use a simple encoding (NOT secure for production)
  const encrypted = btoa(JSON.stringify(wallet));
  return JSON.stringify({
    version: '1.0',
    encrypted,
    timestamp: Date.now(),
  });
}

/**
 * Import wallet from encrypted JSON and verify using Linera client
 */
export async function importWallet(exportedData: string, _password: string): Promise<Wallet> {
  try {
    const data = JSON.parse(exportedData);
    const decrypted = JSON.parse(atob(data.encrypted)) as Wallet;
    
    // Verify the wallet using Linera client
    if (!decrypted.privateKey || !decrypted.address) {
      throw new Error('Invalid wallet format: missing private key or address');
    }
    
    // Verify the private key is valid by creating a signer
    try {
      const signer = new PrivateKey(decrypted.privateKey);
      const derivedAddress = signer.address();
      
      // Verify the address matches
      if (derivedAddress.toLowerCase() !== decrypted.address.toLowerCase()) {
        throw new Error('Wallet verification failed: address mismatch');
      }
      
      // Return verified wallet
      return {
        address: derivedAddress,
        privateKey: decrypted.privateKey,
        balance: decrypted.balance || 0,
      };
    } catch (verifyError) {
      console.error('Wallet verification error:', verifyError);
      throw new Error('Invalid private key or wallet format');
    }
  } catch (error) {
    console.error('Failed to import wallet:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid wallet file');
  }
}

/**
 * Delete wallet from storage
 */
export async function deleteWallet(): Promise<void> {
  localStorage.removeItem(WALLET_STORAGE_KEY);
  localStorage.removeItem(USERNAME_STORAGE_KEY);
}

/**
 * Get or set username
 */
export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_STORAGE_KEY);
}

export function setUsername(username: string): void {
  localStorage.setItem(USERNAME_STORAGE_KEY, username);
}


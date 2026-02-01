// Linera Web Client - Wallet creation only (simplified)

import { initialize, Wallet, Faucet } from '@linera/client';

// Conway Testnet endpoints
export const CONWAY_FAUCET_URL = 'https://faucet.testnet-conway.linera.net';

let isInitialized = false;

/**
 * Initialize Linera Web Client
 */
export async function initLineraClient(): Promise<void> {
  if (!isInitialized) {
    await initialize();
    isInitialized = true;
  }
}

/**
 * Create a wallet from the Conway Testnet faucet
 * This will create a new wallet with test tokens
 */
export async function createWalletFromFaucet(): Promise<Wallet> {
  try {
    await initLineraClient();
    
    // Create Faucet instance
    const faucet = new Faucet(CONWAY_FAUCET_URL);
    
    // Create wallet from faucet
    const wallet = await faucet.createWallet();
    return wallet;
  } catch (error) {
    console.error('Faucet error:', error);
    throw error;
  }
}

/**
 * Claim a new chain from the faucet with test tokens
 * This is how users get their initial microchain and tokens
 * 
 * @param wallet - Linera Wallet instance
 * @param owner - Account owner address (from PrivateKey.address())
 */
export async function claimChainFromFaucet(
  wallet: Wallet,
  owner: string
): Promise<string> {
  try {
    await initLineraClient();
    
    const faucet = new Faucet(CONWAY_FAUCET_URL);
  
    // Claim chain - returns chain ID
    const chainId = await faucet.claimChain(wallet, owner);
    return chainId;
  } catch (error) {
    console.error('Chain claim error:', error);
    throw error;
  }
}


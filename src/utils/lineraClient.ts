// Linera Web Client - Faucet, Transactions, and Explorer utilities

import { initialize, signer, Client, Wallet, Faucet } from '@linera/client';

const { PrivateKey } = signer;

// Conway Testnet endpoints
// Based on Linera docs: https://linera.dev/developers/getting_started/hello_linera.html
export const CONWAY_FAUCET_URL = 'https://faucet.testnet-conway.linera.net';
export const CONWAY_VALIDATOR_URL = 'https://validator.testnet-conway.linera.net';

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

/**
 * Create a Linera Client instance for transactions
 * 
 * @param wallet - Linera Wallet instance
 * @param privateKey - Private key string
 * @param options - Optional client options (skipProcessInbox, validatorUrl, etc.)
 */
export async function createClient(
  wallet: Wallet,
  privateKey: string,
  options?: { skipProcessInbox?: boolean; validatorUrl?: string }
): Promise<Client> {
  await initLineraClient();
  
  // Create signer from private key
  const lineraSigner = new PrivateKey(privateKey);
  
  // Create client with wallet and signer
  // Default to skipProcessInbox: true to avoid async processing issues
  // User can explicitly set skipProcessInbox: false if needed
  // Default validatorUrl to CONWAY_VALIDATOR_URL if not provided
  const clientOptions: any = {
    skipProcessInbox: options?.skipProcessInbox ?? true,
    validatorUrl: options?.validatorUrl ?? CONWAY_VALIDATOR_URL,
  };
  
  const client = new Client(
    wallet,
    lineraSigner,
    clientOptions
  );
  
  return client;
}

/**
 * Get balance from user's microchain
 * @param client - Linera Client instance
 * @param chainId - Chain ID to get balance from
 */
export async function getChainBalance(client: Client, chainId: string): Promise<string> {
  try {
    const chain = await client.chain(chainId);
    const balance = await chain.balance();
    return balance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}

/**
 * Transfer tokens between accounts
 * @param client - Linera Client instance
 * @param chainId - Source chain ID
 * @param recipient - Recipient account (chain_id + owner)
 * @param amount - Amount to transfer
 * @param donor - Optional donor account owner (string) or undefined for chain balance
 */
export async function transferTokens(
  client: Client,
  chainId: string,
  recipient: { chain_id: string; owner: string },
  amount: number,
  donor?: string
): Promise<void> {
  try {
    const chain = await client.chain(chainId);
    await chain.transfer({
      recipient,
      amount,
      donor: donor || undefined,
    });
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}

/**
 * Get chain identity (owner address)
 * @param client - Linera Client instance
 * @param chainId - Chain ID
 */
export async function getChainIdentity(client: Client, chainId: string): Promise<string> {
  try {
    const chain = await client.chain(chainId);
    const identity = await chain.identity();
    return identity;
  } catch (error) {
    console.error('Failed to get identity:', error);
    throw error;
  }
}

/**
 * Query an application
 * @param client - Linera Client instance
 * @param chainId - Chain ID where application is deployed
 * @param applicationId - Application ID
 * @param query - Query string
 * @param options - Optional query options
 */
export async function queryApplication(
  client: Client,
  chainId: string,
  applicationId: string,
  query: string,
  options?: { blockHash?: string; owner?: string }
): Promise<string> {
  try {
    const chain = await client.chain(chainId);
    const app = await chain.application(applicationId);
    const result = await app.query(query, options || null);
    return result;
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

/**
 * Get validator version info
 * @param client - Linera Client instance
 * @param chainId - Chain ID
 */
export async function getValidatorInfo(client: Client, chainId: string): Promise<any> {
  try {
    const chain = await client.chain(chainId);
    const info = await chain.validatorVersionInfo();
    return info;
  } catch (error) {
    console.error('Failed to get validator info:', error);
    throw error;
  }
}

/**
 * Explorer URLs (when available)
 */
export const EXPLORER_URLS = {
  conway: 'https://explorer.conway.linera.dev', // May not be available yet
  mainnet: 'https://explorer.linera.dev',
};

/**
 * Get explorer URL for a chain ID or transaction
 */
export function getExplorerUrl(chainId?: string, txHash?: string): string {
  const baseUrl = EXPLORER_URLS.conway;
  
  if (txHash) {
    return `${baseUrl}/tx/${txHash}`;
  }
  if (chainId) {
    return `${baseUrl}/chain/${chainId}`;
  }
  return baseUrl;
}


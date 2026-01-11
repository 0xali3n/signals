// Core types for the prediction game

export type BetDirection = 'above' | 'below';

export interface Market {
  id: string;
  endTime: number; // Unix timestamp
  targetPrice: number;
  finalPrice?: number;
  isClosed: boolean;
  totalPool: number;
  aboveBets: number;
  belowBets: number;
}

export interface Bet {
  id: string;
  marketId: string;
  direction: BetDirection;
  amount: number;
  timestamp: number;
  claimed: boolean;
}

export interface Wallet {
  address: string;
  privateKey: string; // Encrypted in storage
  balance: number;
  chainId?: string; // Linera microchain ID
  lineraWallet?: any; // Linera Wallet instance (not serialized)
}

export interface MarketState {
  market: Market;
  userBet?: Bet;
  canClaim: boolean;
}


// React hook for market state and betting

import { useState, useEffect, useCallback } from 'react';
import { Market, Bet, BetDirection, MarketState } from '../types';
// import { callApplication } from '../utils/linera'; // TODO: Implement Linera integration
import { useWalletStore } from '../store/walletStore';

const MOCK_MARKET: Market = {
  id: 'market-1',
  endTime: Date.now() + 60000, // 60 seconds from now
  targetPrice: 50000,
  isClosed: false,
  totalPool: 0,
  aboveBets: 0,
  belowBets: 0,
};

export function useMarket() {
  const { wallet } = useWalletStore();
  const [market, setMarket] = useState<Market>(MOCK_MARKET);
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load market state
  useEffect(() => {
    // TODO: Fetch actual market state from Linera chain
    // This will query the deployed contract
  }, []);

  // Place a bet
  const placeBet = useCallback(async (
    direction: BetDirection,
    amount: number
  ) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    if (market.isClosed) {
      throw new Error('Market is closed');
    }

    if (Date.now() >= market.endTime) {
      throw new Error('Market has ended');
    }

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Call actual Linera contract method
      // await callApplication(client, appId, 'place_bet', { direction, amount });
      
      // Placeholder - will be replaced with actual contract call
      const newBet: Bet = {
        id: 'bet-' + Date.now(),
        marketId: market.id,
        direction,
        amount,
        timestamp: Date.now(),
        claimed: false,
      };

      setUserBet(newBet);
      
      // Update market pool
      setMarket(prev => ({
        ...prev,
        totalPool: prev.totalPool + amount,
        aboveBets: direction === 'above' ? prev.aboveBets + amount : prev.aboveBets,
        belowBets: direction === 'below' ? prev.belowBets + amount : prev.belowBets,
      }));

      return newBet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place bet';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, market]);

  // Claim reward
  const claimReward = useCallback(async () => {
    if (!wallet || !userBet) {
      throw new Error('No bet to claim');
    }

    if (!market.isClosed) {
      throw new Error('Market is not closed yet');
    }

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Call actual Linera contract method
      // await callApplication(client, appId, 'claim_reward', { betId: userBet.id });
      
      // Placeholder
      setUserBet(prev => prev ? { ...prev, claimed: true } : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to claim reward';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, userBet, market]);

  const marketState: MarketState = {
    market,
    userBet: userBet || undefined,
    canClaim: market.isClosed && userBet !== null && !userBet.claimed,
  };

  return {
    marketState,
    isLoading,
    error,
    placeBet,
    claimReward,
  };
}


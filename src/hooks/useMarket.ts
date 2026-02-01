// React hook for market state and betting (local only, no blockchain)

import { useState, useCallback } from "react";
import { Market, Bet, MarketState } from "../types";
import { useWalletStore } from "../store/walletStore";

const MOCK_MARKET: Market = {
  id: "market-1",
  endTime: Date.now() + 86400000 * 365, // 1 year from now (always open)
  targetPrice: 50000,
  isClosed: false,
  totalPool: 0,
  aboveBets: 0,
  belowBets: 0,
};

export function useMarket() {
  const { wallet, updateBalance } = useWalletStore();
  const [market] = useState<Market>(MOCK_MARKET);
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Place a bet (local only)
  const placeBet = useCallback(
    async (priceLevel: number, timestamp: number, amount: number = 100) => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      // Market is always open for MVP

      try {
        setIsLoading(true);
        setError(null);

        // Create bet object for local state
        const betId = `bet-${wallet.address}-${priceLevel}-${timestamp}`;
        const newBet: Bet = {
          id: betId,
          marketId: market.id,
          direction: "above",
          amount,
          timestamp,
          claimed: false,
        };

        // Store bet locally
        setUserBet(newBet);

        // Update balance: subtract bet amount
        updateBalance(-amount);

        return newBet;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to place bet";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, market, updateBalance]
  );

  // Claim reward (local only) - simplified for MVP
  const claimReward = useCallback(async () => {
    if (!wallet || !userBet) {
      throw new Error("No bet to claim");
    }

    try {
      setIsLoading(true);
      setError(null);

      // Update local state
      setUserBet((prev) => (prev ? { ...prev, claimed: true } : null));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to claim reward";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, userBet]);

  const marketState: MarketState = {
    market,
    userBet: userBet || undefined,
    canClaim: false, // Simplified for MVP - no claim needed
  };

  return {
    marketState,
    isLoading,
    error,
    placeBet,
    claimReward,
  };
}

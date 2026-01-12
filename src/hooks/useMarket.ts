// React hook for market state and betting

import { useState, useEffect, useCallback } from "react";
import { Market, Bet, MarketState } from "../types";
import { useWalletStore } from "../store/walletStore";
import {
  createClient,
  callApplication,
  queryApplicationState,
} from "../utils/lineraClient";
import { CONTRACT_CONFIG } from "../config/contract";

const MOCK_MARKET: Market = {
  id: "market-1",
  endTime: Date.now() + 60000, // 60 seconds from now
  targetPrice: 50000,
  isClosed: false,
  totalPool: 0,
  aboveBets: 0,
  belowBets: 0,
};

export function useMarket() {
  const { wallet, lineraWalletInstance, updateBalance } = useWalletStore();
  const [market, setMarket] = useState<Market>(MOCK_MARKET);
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load market state from contract
  useEffect(() => {
    const loadMarket = async () => {
      if (
        !wallet ||
        !wallet.chainId ||
        !lineraWalletInstance ||
        CONTRACT_CONFIG.APPLICATION_ID === "YOUR_APPLICATION_ID_HERE"
      ) {
        // Use mock data if contract not deployed yet
        return;
      }

      try {
        const client = await createClient(
          lineraWalletInstance,
          wallet.privateKey
        );

        // Query market state using GraphQL
        const query = `
          query {
            marketId
            targetPrice
            endTime
            isClosed
            finalPrice
          }
        `;

        const data = await queryApplicationState(
          client,
          wallet.chainId,
          CONTRACT_CONFIG.APPLICATION_ID,
          query
        );

        if (data.data) {
          setMarket({
            id: data.data.marketId || "market-1",
            targetPrice: data.data.targetPrice || 50000,
            endTime: data.data.endTime || Date.now() + 60000,
            isClosed: data.data.isClosed || false,
            finalPrice: data.data.finalPrice,
            totalPool: 0, // TODO: Calculate from column pools
            aboveBets: 0,
            belowBets: 0,
          });
        }
      } catch (error) {
        console.error("Failed to load market:", error);
        // Fallback to mock data on error
      }
    };

    loadMarket();
  }, [wallet, lineraWalletInstance]);

  // Place a bet
  const placeBet = useCallback(
    async (priceLevel: number, timestamp: number, amount: number = 100) => {
      if (!wallet || !wallet.chainId) {
        throw new Error("Wallet not connected");
      }

      if (market.isClosed) {
        throw new Error("Market is closed");
      }

      if (Date.now() >= market.endTime) {
        throw new Error("Market has ended");
      }

      const isContractDeployed =
        CONTRACT_CONFIG.APPLICATION_ID !== "YOUR_APPLICATION_ID_HERE";

      try {
        setIsLoading(true);
        setError(null);

        // If contract is deployed, use on-chain betting
        if (isContractDeployed && lineraWalletInstance) {
          const client = await createClient(
            lineraWalletInstance,
            wallet.privateKey
          );

          // Call contract method - PlaceBet operation
          const operation = {
            PlaceBet: {
              price_level: priceLevel,
              timestamp: timestamp,
              amount: amount,
            },
          };

          await callApplication(
            client,
            wallet.chainId,
            CONTRACT_CONFIG.APPLICATION_ID,
            operation
          );
        }
        // Otherwise, use mock mode for MVP (bet stored locally)

        // Create bet object for local state
        const betId = `bet-${wallet.chainId}-${priceLevel}-${timestamp}`;
        const newBet: Bet = {
          id: betId,
          marketId: market.id,
          direction: "above", // Placeholder - actual direction based on price level
          amount,
          timestamp,
          claimed: false,
        };

        // Store bet locally (in MVP mode) or update from contract response
        setUserBet(newBet);

        // Update balance: subtract bet amount
        updateBalance(-amount);

        // Reload market state to get updated pools
        // TODO: Refresh market state from contract

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
    [wallet, lineraWalletInstance, market]
  );

  // Claim reward
  const claimReward = useCallback(async () => {
    if (!wallet || !wallet.chainId || !userBet) {
      throw new Error("No bet to claim");
    }

    if (!market.isClosed) {
      throw new Error("Market is not closed yet");
    }

    const isContractDeployed =
      CONTRACT_CONFIG.APPLICATION_ID !== "YOUR_APPLICATION_ID_HERE";

    try {
      setIsLoading(true);
      setError(null);

      // If contract is deployed, claim on-chain
      if (isContractDeployed && lineraWalletInstance) {
        const client = await createClient(
          lineraWalletInstance,
          wallet.privateKey
        );

        // Call contract method - ClaimReward operation
        const operation = {
          ClaimReward: {
            bet_id: userBet.id,
          },
        };

        await callApplication(
          client,
          wallet.chainId,
          CONTRACT_CONFIG.APPLICATION_ID,
          operation
        );
      }
      // Otherwise, mock claim for MVP

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
  }, [wallet, lineraWalletInstance, userBet, market]);

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

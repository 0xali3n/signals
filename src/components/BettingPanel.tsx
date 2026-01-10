// Betting interface component

import { useState } from 'react';
import { BetDirection } from '../types';
import { useMarket } from '../hooks/useMarket';
import { useWallet } from '../hooks/useWallet';

export function BettingPanel() {
  const { wallet } = useWallet();
  const { marketState, placeBet, claimReward, isLoading, error } = useMarket();
  const [direction, setDirection] = useState<BetDirection>('above');
  const [amount, setAmount] = useState<string>('10');

  const { market, userBet, canClaim } = marketState;

  const isActive = market.endTime > Date.now() && !market.isClosed;
  const hasBet = userBet !== undefined;

  const handleBet = async () => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (betAmount > wallet.balance) {
      alert('Insufficient balance');
      return;
    }

    try {
      await placeBet(direction, betAmount);
      setAmount('10'); // Reset
    } catch (err) {
      console.error('Bet failed:', err);
    }
  };

  const handleClaim = async () => {
    try {
      await claimReward();
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  if (!wallet) {
    return null;
  }

  if (!isActive && !canClaim) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-white/70 text-center">
          {market.isClosed ? 'Market is closed' : 'Market has ended'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {canClaim ? (
        <div className="text-center">
          <p className="text-white mb-4">You can claim your reward!</p>
          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'Claiming...' : 'Claim Reward'}
          </button>
        </div>
      ) : hasBet ? (
        <div className="text-center">
          <p className="text-white mb-2">You already placed a bet</p>
          <p className="text-white/70 text-sm">
            {userBet.direction.toUpperCase()} - {userBet.amount} tokens
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-white font-semibold mb-3">Choose Direction</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDirection('above')}
                className={`px-6 py-4 rounded-lg font-semibold transition ${
                  direction === 'above'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white/20 text-white/70 hover:bg-white/30'
                }`}
              >
                ABOVE
              </button>
              <button
                onClick={() => setDirection('below')}
                className={`px-6 py-4 rounded-lg font-semibold transition ${
                  direction === 'below'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white/20 text-white/70 hover:bg-white/30'
                }`}
              >
                BELOW
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Bet Amount (tokens)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={wallet.balance}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <p className="text-xs text-white/60 mt-1">
              Balance: {wallet.balance.toLocaleString()} tokens
            </p>
          </div>

          <button
            onClick={handleBet}
            disabled={isLoading || !isActive}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'Placing Bet...' : 'Place Bet'}
          </button>

          <p className="text-xs text-white/60 text-center">
            Transaction will be signed automatically. No popups!
          </p>
        </div>
      )}
    </div>
  );
}


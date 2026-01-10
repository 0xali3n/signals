// Betting interface component

import { useState } from 'react';
import { BetDirection } from '../types';
import { useMarket } from '../hooks/useMarket';
import { useWalletStore } from '../store/walletStore';

export function BettingPanel() {
  const { wallet } = useWalletStore();
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
      <div className="glass-strong rounded-lg p-6 max-w-md mx-auto border border-amber-200/60 shadow-md">
        <p className="text-slate-600 text-center">
          {market.isClosed ? 'Market is closed' : 'Market has ended'}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-lg p-6 max-w-md mx-auto border border-amber-200/60 shadow-md">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {canClaim ? (
        <div className="text-center">
          <p className="text-slate-800 mb-4 font-medium">You can claim your reward!</p>
          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-saffron hover:opacity-90 text-white font-medium rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Claiming...' : 'Claim Reward'}
          </button>
        </div>
      ) : hasBet ? (
        <div className="text-center p-4 glass rounded-lg border border-amber-200/50">
          <p className="text-slate-800 mb-1 font-medium">You already placed a bet</p>
          <p className="text-slate-600 text-sm">
            {userBet.direction.toUpperCase()} - {userBet.amount} tokens
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-slate-800 font-medium mb-3 text-sm">Choose Direction</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDirection('above')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  direction === 'above'
                    ? 'bg-emerald-500 text-white border border-emerald-600 shadow-sm'
                    : 'glass text-slate-700 hover:bg-white/80 border border-amber-200/50'
                }`}
              >
                ABOVE
              </button>
              <button
                onClick={() => setDirection('below')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  direction === 'below'
                    ? 'bg-red-500 text-white border border-red-600 shadow-sm'
                    : 'glass text-slate-700 hover:bg-white/80 border border-amber-200/50'
                }`}
              >
                BELOW
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bet Amount (tokens)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={wallet.balance}
              className="w-full px-4 py-2.5 rounded-lg glass border border-amber-200/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Balance: <span className="font-medium text-slate-700">{wallet.balance.toLocaleString()}</span> tokens
            </p>
          </div>

          <button
            onClick={handleBet}
            disabled={isLoading || !isActive}
            className="w-full px-6 py-3 bg-saffron hover:opacity-90 text-white font-medium rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Placing Bet...' : 'Place Bet'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Transaction will be signed automatically
          </p>
        </div>
      )}
    </div>
  );
}


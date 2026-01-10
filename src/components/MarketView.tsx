// Main market view component

import { Market, BetDirection } from '../types';

interface MarketViewProps {
  market: Market;
  userBet?: {
    direction: BetDirection;
    amount: number;
    claimed: boolean;
  };
}

export function MarketView({ market, userBet }: MarketViewProps) {
  const timeRemaining = market.endTime - Date.now();
  const isActive = timeRemaining > 0 && !market.isClosed;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">BTC Prediction Market</h1>
        <p className="text-white/70">Predict if BTC will be above or below target price</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-lg p-4">
          <p className="text-sm text-white/70 mb-1">Target Price</p>
          <p className="text-2xl font-bold text-white">${market.targetPrice.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4">
          <p className="text-sm text-white/70 mb-1">Time Remaining</p>
          <p className="text-2xl font-bold text-white">
            {isActive
              ? `${Math.floor(timeRemaining / 1000)}s`
              : market.isClosed
              ? 'Closed'
              : 'Ended'}
          </p>
        </div>
      </div>

      {market.isClosed && market.finalPrice !== undefined && (
        <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400/50 rounded-lg">
          <p className="text-sm text-white/70 mb-1">Final Price</p>
          <p className="text-3xl font-bold text-white">${market.finalPrice.toLocaleString()}</p>
          <p className="text-sm text-white/70 mt-2">
            Result: {market.finalPrice >= market.targetPrice ? 'ABOVE' : 'BELOW'} target
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
          <p className="text-sm text-white/70 mb-1">Above Pool</p>
          <p className="text-xl font-bold text-green-300">
            {market.aboveBets.toLocaleString()} tokens
          </p>
        </div>
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
          <p className="text-sm text-white/70 mb-1">Below Pool</p>
          <p className="text-xl font-bold text-red-300">
            {market.belowBets.toLocaleString()} tokens
          </p>
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-4 mb-6">
        <p className="text-sm text-white/70 mb-1">Total Pool</p>
        <p className="text-3xl font-bold text-white">{market.totalPool.toLocaleString()} tokens</p>
      </div>

      {userBet && (
        <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-4">
          <p className="text-sm text-white/70 mb-2">Your Bet</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-white">
                {userBet.direction.toUpperCase()} - {userBet.amount} tokens
              </p>
              {userBet.claimed && (
                <p className="text-sm text-green-300 mt-1">✓ Reward claimed</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


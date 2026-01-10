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
    <div className="glass-strong rounded-xl p-6 max-w-3xl mx-auto border border-amber-200/60 shadow-md">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-lg p-4 border border-amber-200/50">
          <p className="text-xs text-slate-500 mb-1.5">Target Price</p>
          <p className="text-2xl font-semibold text-slate-800">${market.targetPrice.toLocaleString()}</p>
        </div>
        <div className="glass rounded-lg p-4 border border-amber-200/50">
          <p className="text-xs text-slate-500 mb-1.5">Time Remaining</p>
          <p className="text-2xl font-semibold text-slate-800">
            {isActive
              ? `${Math.floor(timeRemaining / 1000)}s`
              : market.isClosed
              ? 'Closed'
              : 'Ended'}
          </p>
        </div>
      </div>

      {market.isClosed && market.finalPrice !== undefined && (
        <div className="mb-6 p-4 glass rounded-lg border border-amber-200/50">
          <p className="text-xs text-slate-500 mb-1.5">Final Price</p>
          <p className="text-3xl font-semibold text-slate-800 mb-2">${market.finalPrice.toLocaleString()}</p>
          <p className="text-sm text-slate-600">
            Result: <span className="font-medium text-slate-800">{market.finalPrice >= market.targetPrice ? 'ABOVE' : 'BELOW'}</span> target
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-lg p-4 border border-amber-200/50">
          <p className="text-xs text-slate-500 mb-1.5">Above Pool</p>
          <p className="text-xl font-semibold text-slate-800">
            {market.aboveBets.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">tokens</p>
        </div>
        <div className="glass rounded-lg p-4 border border-amber-200/50">
          <p className="text-xs text-slate-500 mb-1.5">Below Pool</p>
          <p className="text-xl font-semibold text-slate-800">
            {market.belowBets.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">tokens</p>
        </div>
      </div>

      <div className="glass rounded-lg p-4 mb-6 border border-amber-200/50">
        <p className="text-xs text-slate-500 mb-1.5">Total Pool</p>
        <p className="text-3xl font-semibold text-gradient">{market.totalPool.toLocaleString()}</p>
        <p className="text-xs text-slate-500 mt-0.5">tokens</p>
      </div>

      {userBet && (
        <div className="glass rounded-lg p-4 border border-amber-200/50">
          <p className="text-xs text-slate-500 mb-2">Your Bet</p>
          <div>
            <p className="text-lg font-semibold text-slate-800 mb-1">
              {userBet.direction.toUpperCase()} - {userBet.amount} tokens
            </p>
            {userBet.claimed && (
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <span>✓</span> Reward claimed
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


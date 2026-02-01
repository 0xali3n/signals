// Betting panel component for GameView
import { useState } from "react";
import { BetDirection } from "../types";
import { useMarket } from "../hooks/useMarket";

interface BettingPanelProps {
  market: {
    isClosed: boolean;
    endTime: number;
  };
  userBet?: {
    direction: BetDirection;
    amount: number;
    claimed: boolean;
  };
}

export function BettingPanel({ market, userBet }: BettingPanelProps) {
  const { claimReward, isLoading } = useMarket();
  const [betAmount, setBetAmount] = useState("10");

  if (market.isClosed && userBet && !userBet.claimed) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-orange-500/20 z-30">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center">
            <button
              onClick={claimReward}
              disabled={isLoading}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm sm:text-base font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? "Claiming..." : "Claim Reward"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!market.isClosed && Date.now() < market.endTime) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-orange-500/20 z-30">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {!userBet ? (
              <>
                <div className="flex-1 max-w-xs">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Bet amount"
                    min="1"
                    className="w-full px-3 sm:px-4 py-2 bg-black/40 border border-orange-500/20 rounded-lg text-orange-300 text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-orange-500/40"
                  />
                </div>
                <button
                  onClick={() => {
                    // Note: This panel is for legacy betting.
                    // New betting system uses box clicks in GameView.
                    // This button is disabled as it requires priceLevel and timestamp.
                    // Legacy betting panel - use box clicks in game view instead
                  }}
                  disabled={true}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500/50 to-amber-500/50 hover:from-orange-600/50 hover:to-amber-600/50 text-white/50 text-sm sm:text-base font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>⬆️</span>
                  <span>Use Box Clicks to Bet</span>
                </button>
              </>
            ) : (
              <div className="flex-1 text-center">
                <p className="text-slate-400 text-xs sm:text-sm">
                  You already placed a bet
                </p>
                <p className="text-orange-400 font-mono mt-1 text-xs sm:text-sm">
                  {userBet.direction.toUpperCase()} - {userBet.amount} tokens
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-orange-500/20 z-30">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="text-center text-slate-400 text-xs sm:text-sm">
          Market has ended
        </div>
      </div>
    </div>
  );
}

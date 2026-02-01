// Betting panel component for GameView
interface BettingPanelProps {
  market: {
    isClosed: boolean;
    endTime: number;
  };
  userBet?: {
    direction: string;
    amount: number;
    claimed: boolean;
  };
}

export function BettingPanel({}: BettingPanelProps) {
  // Simplified panel - market is always open for MVP
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-orange-500/20 z-30">
      <div className="container mx-auto px-6 py-4">
        <div className="text-center">
          <p className="text-sm text-slate-300 font-medium">
            Click boxes on the grid to place bets
          </p>
          <p className="text-xs text-slate-500 mt-1">
            100 tokens per block • Instant rewards
          </p>
        </div>
      </div>
    </div>
  );
}

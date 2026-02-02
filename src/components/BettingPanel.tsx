// Betting panel component for GameView
export function BettingPanel() {
  // Simplified panel - market is always open for MVP
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-orange-500/20 z-30">
      <div className="container mx-auto px-6 py-4">
        <div className="text-center">
          <p className="text-sm text-orange-300 font-semibold mb-1">
            Select a price block before the timer ends. If price hits your block, you win.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="text-orange-400 font-mono font-bold">100</span>
              <span>tokens per block</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="text-emerald-400 font-bold">5x</span>
              <span>win multiplier</span>
            </span>
            <span>•</span>
            <span>Instant rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
}

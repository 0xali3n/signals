// Betting panel component for GameView
interface BettingPanelProps {
  hasActiveBets?: boolean;
}

export function BettingPanel({ hasActiveBets = false }: BettingPanelProps) {
  // Professional info bar above timeline - moved even further down
  // Timeline is at bottom-8 (32px) with height h-32 (128px), so it occupies 32px-160px from bottom
  // BettingPanel moved down even more, closer to bottom
  return (
    <div className={`absolute left-0 right-0 bg-gradient-to-b from-black/98 via-black/95 to-black/90 backdrop-blur-xl border-t border-slate-800/40 z-30 shadow-xl rounded-t-lg border-b-0 transition-all duration-300 ${
      hasActiveBets ? 'bottom-[80px]' : 'bottom-[48px]'
    }`}>
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
      
      <div className="container mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Left: Quick stats */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-xs text-slate-300 font-medium">Live</span>
            </div>
            <div className="h-3 w-px bg-slate-700/50"></div>
            <div className="text-xs text-slate-400">
              <span className="text-slate-500">Round:</span>{" "}
              <span className="text-white font-mono font-semibold">Active</span>
            </div>
          </div>

          {/* Right: Instruction - brighter during betting */}
          <div className="flex items-center gap-2">
            <svg className={`w-3.5 h-3.5 transition-colors ${hasActiveBets ? 'text-orange-400' : 'text-orange-400/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-xs font-medium transition-colors ${hasActiveBets ? 'text-slate-200' : 'text-slate-400'}`}>
              Select a price block before the timer ends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

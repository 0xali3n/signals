// Main header component with wallet address display

import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { exportWallet } from '../utils/wallet';
import { getBettingHistory, type BettingHistoryEntry } from '../utils/bettingHistory';

export function Header() {
  const { wallet, username, balance, deleteWallet } = useWalletStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bettingHistory, setBettingHistory] = useState<BettingHistoryEntry[]>([]);

  // Load betting history when wallet changes or history modal opens (filtered by wallet address)
  useEffect(() => {
    if (wallet?.address) {
      // Always load history when wallet is available
      setBettingHistory(getBettingHistory(wallet.address));
      
      // If history modal is open, refresh more frequently
      if (showHistory) {
        const interval = setInterval(() => {
          if (wallet?.address) {
            setBettingHistory(getBettingHistory(wallet.address));
          }
        }, 1000); // Refresh every 1 second while modal is open
        return () => clearInterval(interval);
      }
    } else {
      setBettingHistory([]);
    }
  }, [showHistory, wallet?.address]);


  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect? You can import your wallet later.')) {
      deleteWallet();
    }
    setShowMenu(false);
  };

  const handleExport = async () => {
    if (!wallet) return;

    try {
      const exported = await exportWallet(wallet, '');
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-${wallet.address.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowMenu(false);
    } catch (err) {
      alert('Failed to export wallet');
    }
  };


  return (
    <header className="bg-black/98 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-800/50 shadow-lg">
      <div className="container mx-auto px-5 sm:px-6 py-2 max-w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Signals" 
                className="w-16 h-16 object-contain flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<span class="text-orange-400 font-bold text-4xl">S</span>';
                  }
                }}
              />
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-400 font-medium whitespace-nowrap">
                  Conway Testnet
                </span>
                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap italic">
                  Real-time Crypto Prediction
                </span>
              </div>
            </div>
            
            {/* Game Info Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowGameInfo(!showGameInfo);
                }}
                className="p-1.5 hover:bg-slate-800/50 rounded-md transition-colors group border border-transparent hover:border-slate-700/50"
                aria-label="How to Play"
                title="How to Play"
              >
                <svg 
                  className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {showGameInfo && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" 
                    onClick={() => {
                      setShowGameInfo(false);
                    }}
                  ></div>
                  <div 
                    className="absolute left-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-80 md:w-96 max-w-md bg-black backdrop-blur-md rounded-lg border border-slate-800/50 z-50 shadow-2xl transition-all duration-300 p-4 animate-fade-in"
                    style={{ 
                      maxHeight: 'calc(100vh - 6rem)',
                      overflow: 'hidden'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>How to Play</span>
                      </h3>
                      <button
                        onClick={() => {
                          setShowGameInfo(false);
                        }}
                        className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all p-1.5 rounded-md flex-shrink-0 border border-transparent hover:border-orange-500/30"
                        aria-label="Close"
                        title="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Step 1: What happens */}
                      <div className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800/50">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0 mt-0.5">1</div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1.5 text-sm">Click a Price Block</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                              Click any orange block in the grid. You bet <span className="text-orange-400 font-semibold">100 tokens</span>. You can select up to <span className="text-orange-400 font-semibold">5 blocks per column</span>.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: What happens */}
                      <div className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800/50">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0 mt-0.5">2</div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1.5 text-sm">Price Line Moves</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                              The yellow line shows live BTC price. It moves from <span className="text-yellow-400 font-semibold">right → left</span> as time passes. Watch it move toward your selected block.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: What happens */}
                      <div className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-800/50">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0 mt-0.5">3</div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1.5 text-sm">You Win or Lose</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                              <span className="text-emerald-400 font-semibold">If the line hits your block → You WIN!</span> You get <span className="text-emerald-400 font-semibold">500 tokens (5× your bet)</span> instantly. If it doesn't hit, you lose your 100 tokens.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {wallet && (
            <div className="flex items-center gap-4 relative">
              {/* History Button - Highlighted */}
              <div className="relative">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-all group border border-orange-500/40 hover:border-orange-500/60 shadow-md hover:shadow-lg hover:shadow-orange-500/20"
                  aria-label="Betting History"
                  title="View Betting History"
                >
                  <svg 
                    className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {showHistory && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" 
                      onClick={() => setShowHistory(false)}
                    ></div>
                    <div 
                      className="absolute right-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-96 md:w-[500px] max-w-md bg-black backdrop-blur-md rounded-lg border border-slate-800/50 z-50 p-4 animate-fade-in shadow-2xl"
                      style={{ 
                        maxHeight: 'calc(100vh - 6rem)',
                        overflow: 'hidden'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Betting History</span>
                        </h3>
                        <button
                          onClick={() => setShowHistory(false)}
                          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all p-1.5 rounded-md flex-shrink-0 border border-transparent hover:border-orange-500/30"
                          aria-label="Close"
                          title="Close"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                        {bettingHistory.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-slate-400 text-sm">No betting history yet</p>
                            <p className="text-slate-500 text-xs mt-1">Your betting activity will appear here</p>
                          </div>
                        ) : (
                          bettingHistory.map((entry) => {
                            const betDate = new Date(entry.betTime);
                            const timeStr = betDate.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              second: '2-digit'
                            });
                            const dateStr = betDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            });

                            return (
                              <div
                                key={entry.id}
                                className={`bg-slate-900/60 rounded-lg p-3 border ${
                                  entry.result === 'win'
                                    ? 'border-emerald-500/30'
                                    : entry.result === 'lose'
                                    ? 'border-red-500/30'
                                    : 'border-slate-800/50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-xs text-slate-400 font-mono">
                                        {dateStr} {timeStr}
                                      </span>
                                      {entry.result === 'win' && (
                                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded border border-emerald-500/30">
                                          WIN
                                        </span>
                                      )}
                                      {entry.result === 'lose' && (
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-semibold rounded border border-red-500/30">
                                          LOSE
                                        </span>
                                      )}
                                      {entry.result === 'pending' && (
                                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-semibold rounded border border-orange-500/30">
                                          PENDING
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400">Price Level:</span>
                                        <span className="text-white font-mono font-semibold">
                                          ${entry.priceLevel.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400">Bet Amount:</span>
                                        <span className="text-orange-400 font-mono font-semibold">
                                          {entry.betAmount} tokens
                                        </span>
                                      </div>
                                      {entry.actualPrice && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-400">Actual Price:</span>
                                          <span className="text-slate-300 font-mono">
                                            ${entry.actualPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                      {entry.payout !== undefined && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-400">Payout:</span>
                                          <span className="text-emerald-400 font-mono font-semibold">
                                            +{entry.payout} tokens
                                          </span>
                                        </div>
                                      )}
                                      {entry.netGain !== undefined && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-400">Net:</span>
                                          <span className={`font-mono font-semibold ${
                                            entry.netGain > 0 ? 'text-emerald-400' : 'text-red-400'
                                          }`}>
                                            {entry.netGain > 0 ? '+' : ''}{entry.netGain} tokens
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Balance Display */}
              <div className="text-right pr-4">
                <div className="flex items-center gap-3 justify-end mb-0.5">
                  <p className="text-lg font-mono font-bold text-white">
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Balance</span>
                </div>
                <div className="flex items-center gap-3 justify-end text-[9px] text-slate-500">
                  <span>1 bet = <span className="text-orange-400 font-semibold hover:text-orange-300 cursor-pointer transition-colors">100</span></span>
                  <span>•</span>
                  <span>Win = <span className="text-emerald-400 font-semibold hover:text-emerald-300 cursor-pointer transition-colors">5×</span> payout</span>
                </div>
              </div>

              <div className="text-right hidden sm:block pr-4">
                {username && (
                  <p className="text-sm font-semibold text-white mb-1 truncate max-w-[140px]">
                    {username}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                  <p className="text-xs font-mono text-slate-300 truncate">
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                  </p>
                </div>
                {wallet.chainId && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-orange-400 hover:text-orange-300 mt-1.5 transition-colors font-medium underline decoration-orange-400/50 hover:decoration-orange-300"
                  >
                    {showDetails ? 'Hide' : 'View'} Details
                  </button>
                )}
              </div>
              
              {showDetails && wallet.chainId && (
                <>
                  <div 
                    className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm" 
                    onClick={() => setShowDetails(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-black/98 backdrop-blur-xl rounded-lg border border-slate-800/50 z-30 p-4 sm:p-5 animate-fade-in shadow-2xl">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-400 mb-1.5 uppercase tracking-wide">Wallet Address</p>
                        <p className="text-[11px] sm:text-xs font-mono text-white break-all">{wallet.address}</p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs text-slate-400 mb-1.5 uppercase tracking-wide">Microchain ID</p>
                        <p className="text-[11px] sm:text-xs font-mono text-white break-all">{wallet.chainId}</p>
                        <p className="text-[11px] sm:text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Chain claimed from faucet
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/50">
                        <p className="text-[11px] sm:text-xs text-slate-400">
                          Network: <span className="text-white font-medium">Conway Testnet</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10 bg-black/40 backdrop-blur-sm" 
                      onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-black backdrop-blur-md rounded-lg border border-slate-800/50 z-20 overflow-hidden animate-fade-in shadow-2xl">
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="truncate">Export Wallet</span>
                      </button>
                      <div className="h-px bg-slate-800/50"></div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="truncate">Disconnect</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


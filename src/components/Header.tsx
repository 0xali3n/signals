// Main header component with wallet address display

import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { exportWallet } from '../utils/wallet';

export function Header() {
  const { wallet, username, balance, deleteWallet } = useWalletStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(false);


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
    <header className="bg-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-500/20">
      <div className="container mx-auto px-4 sm:px-6 py-3 max-w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="Signals" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-white font-bold text-lg">S</span>';
                      target.parentElement.className = 'w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0';
                    }
                  }}
                />
              </div>
            </div>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-md font-medium border border-orange-500/20 whitespace-nowrap">
              Conway Testnet
            </span>
            
            {/* Game Info Button */}
            <div className="relative">
              <button
                onClick={() => setShowGameInfo(!showGameInfo)}
                className="p-1.5 hover:bg-orange-500/10 rounded-md transition-all active:scale-95 border border-orange-500/20 group"
                aria-label="How to Play"
              >
                <svg 
                  className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {showGameInfo && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" 
                    onClick={() => setShowGameInfo(false)}
                  ></div>
                  <div 
                    className="absolute left-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-80 md:w-96 max-w-md bg-black/95 backdrop-blur-md rounded-xl border border-orange-500/30 z-50 shadow-2xl p-4 sm:p-5 md:p-6 animate-fade-in overflow-y-auto"
                    style={{ 
                      maxHeight: 'calc(100vh - 8rem)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-orange-300 flex items-center gap-2">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-base sm:text-xl">How to Play</span>
                      </h3>
                      <button
                        onClick={() => setShowGameInfo(false)}
                        className="text-slate-400 hover:text-orange-400 transition-colors p-1 flex-shrink-0"
                        aria-label="Close"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3.5">
                      <div className="bg-slate-900/50 rounded-lg p-2.5 sm:p-3 border border-orange-500/10">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-orange-400 flex-shrink-0">1</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-orange-400 font-semibold mb-1 text-xs sm:text-sm">Select Blocks</h4>
                            <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">
                              Click blocks to select. Max <strong className="text-orange-400">3 per column</strong>. Each block = one price level.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-2.5 sm:p-3 border border-orange-500/10">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-orange-400 flex-shrink-0">2</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-orange-400 font-semibold mb-1 text-xs sm:text-sm">Place Bet</h4>
                            <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">
                              <strong className="text-orange-400">100 tokens</strong> per block. Added to <strong className="text-orange-400">column pool</strong>. Multiple users can bet.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-2.5 sm:p-3 border border-orange-500/10">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-orange-400 flex-shrink-0">3</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-orange-400 font-semibold mb-1 text-xs sm:text-sm">Watch & Win</h4>
                            <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">
                              Live price line moves right to left. When it hits your block → <strong className="text-orange-400">You Win!</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-2.5 sm:p-3 border border-orange-500/10">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-orange-400 flex-shrink-0">4</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-orange-400 font-semibold mb-1 text-xs sm:text-sm">Rewards</h4>
                            <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed">
                              Winners get <strong className="text-orange-400">2x their bet amount</strong> instantly. Rewards are managed locally for fast gameplay.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 sm:mt-3 border-t border-orange-500/20">
                        <div className="flex items-start gap-2 sm:gap-2.5 bg-orange-500/10 rounded-lg p-2.5 sm:p-3 border border-orange-500/20">
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                            <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                            <strong className="text-orange-300">Local:</strong> All bets & rewards managed locally for fast, smooth gameplay.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {wallet && (
            <div className="flex items-center gap-2 sm:gap-3 relative">
              {/* Balance Display */}
              <div className="text-right pr-2 sm:pr-3 border-r border-orange-500/20">
                <div className="flex items-center gap-1.5 justify-end mb-0.5">
                  <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs sm:text-sm font-mono font-semibold text-orange-300">
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400">Balance</p>
              </div>

              <div className="text-right hidden sm:block pr-2 sm:pr-3 border-r border-orange-500/20">
                {username && (
                  <p className="text-xs sm:text-sm font-medium text-orange-300 mb-0.5 truncate max-w-[120px] sm:max-w-none">
                    {username}
                  </p>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse flex-shrink-0"></div>
                  <p className="text-[10px] sm:text-xs font-mono text-orange-400 truncate">
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                  </p>
                </div>
                {wallet.chainId && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-[10px] sm:text-xs text-orange-400 hover:text-orange-300 mt-1 underline transition-colors"
                  >
                    {showDetails ? 'Hide' : 'View'} Details
                  </button>
                )}
              </div>
              
              {showDetails && wallet.chainId && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowDetails(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-black/90 backdrop-blur-md rounded-lg border border-orange-500/20 z-30 shadow-xl p-3 sm:p-4 animate-fade-in">
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Wallet Address</p>
                        <p className="text-[10px] sm:text-xs font-mono text-orange-300 break-all">{wallet.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Microchain ID</p>
                        <p className="text-[10px] sm:text-xs font-mono text-orange-300 break-all">{wallet.chainId}</p>
                        <p className="text-[10px] sm:text-xs text-orange-400 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Chain claimed from faucet
                        </p>
                      </div>
                      <div className="pt-2 border-t border-orange-500/20">
                        <p className="text-[10px] sm:text-xs text-slate-400">
                          Network: <span className="text-orange-400">Conway Testnet</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-orange-500/10 rounded-md transition-all active:scale-95 border border-orange-500/20"
                >
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-black/90 backdrop-blur-md rounded-lg border border-orange-500/20 z-20 overflow-hidden shadow-xl animate-fade-in">
                      <button
                        onClick={handleExport}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-orange-300 hover:bg-orange-500/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="truncate">Export Wallet</span>
                      </button>
                      <div className="h-px bg-orange-500/20"></div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
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


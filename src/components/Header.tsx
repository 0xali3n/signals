// Main header component with wallet address display

import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { exportWallet } from '../utils/wallet';

export function Header() {
  const { wallet, username, deleteWallet } = useWalletStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
      <div className="container mx-auto px-6 py-3 max-w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-lg font-semibold text-orange-400 tracking-tight">
                Signals
              </h1>
            </div>
            <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-md font-medium border border-orange-500/20">
              Conway Testnet
            </span>
          </div>

          {wallet && (
            <div className="flex items-center gap-3 relative">
              <div className="text-right hidden sm:block pr-3 border-r border-orange-500/20">
                {username && (
                  <p className="text-sm font-medium text-orange-300 mb-0.5">{username}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
                  <p className="text-xs font-mono text-orange-400">
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                  </p>
                </div>
                {wallet.chainId && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-orange-400 hover:text-orange-300 mt-1 underline transition-colors"
                  >
                    {showDetails ? 'Hide' : 'View'} Details
                  </button>
                )}
              </div>
              
              {showDetails && wallet.chainId && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-black/90 backdrop-blur-md rounded-lg border border-orange-500/20 z-30 shadow-xl p-4 animate-fade-in">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
                      <p className="text-xs font-mono text-orange-300 break-all">{wallet.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Microchain ID</p>
                      <p className="text-xs font-mono text-orange-300 break-all">{wallet.chainId}</p>
                      <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Chain claimed from faucet
                      </p>
                    </div>
                    <div className="pt-2 border-t border-orange-500/20">
                      <p className="text-xs text-slate-400">
                        Network: <span className="text-orange-400">Conway Testnet</span>
                      </p>
                    </div>
                  </div>
                </div>
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
                    <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg border border-orange-500/20 z-20 overflow-hidden shadow-xl animate-fade-in">
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2.5 text-left text-sm text-orange-300 hover:bg-orange-500/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Wallet
                      </button>
                      <div className="h-px bg-orange-500/20"></div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Disconnect
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


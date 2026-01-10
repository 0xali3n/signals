// Main header component with wallet address display

import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { exportWallet } from '../utils/wallet';

export function Header() {
  const { wallet, username, deleteWallet } = useWalletStore();
  const [showMenu, setShowMenu] = useState(false);

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
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-amber-200/40 shadow-sm">
      <div className="container mx-auto px-6 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-saffron rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
                Signals
              </h1>
            </div>
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-medium border border-amber-200/60">
              Conway Testnet
            </span>
          </div>

          {wallet && (
            <div className="flex items-center gap-3 relative">
              <div className="text-right hidden sm:block pr-3 border-r border-amber-200/40">
                {username && (
                  <p className="text-sm font-medium text-slate-800 mb-0.5">{username}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <p className="text-xs font-mono text-slate-600">
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {wallet.balance.toLocaleString()} tokens
                </p>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-amber-50 rounded-md transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-amber-200/60 z-20 overflow-hidden shadow-lg">
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Wallet
                      </button>
                      <div className="h-px bg-amber-200/50"></div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
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


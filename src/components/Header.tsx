// Main header component with wallet address display

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { exportWallet } from '../utils/wallet';

export function Header() {
  const { wallet, username, deleteWallet } = useWallet();
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
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Signals
            </h1>
            <span className="text-xs px-2 py-1 bg-purple-500/30 rounded-full text-purple-200">
              Linera Conway
            </span>
          </div>

          {wallet && (
            <div className="flex items-center gap-3 relative">
              <div className="text-right">
                {username && (
                  <p className="text-sm font-semibold text-white">{username}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs font-mono text-white/80">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </p>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {wallet.balance.toLocaleString()} tokens
                </p>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/30 z-20">
                      <button
                        onClick={handleExport}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Wallet
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
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


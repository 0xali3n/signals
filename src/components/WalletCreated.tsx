// Success screen after wallet creation

import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';

interface WalletCreatedProps {
  onComplete: () => void;
}

export function WalletCreated({ onComplete }: WalletCreatedProps) {
  const { wallet, setUsername } = useWalletStore();
  const [inputUsername, setInputUsername] = useState('');

  const handleContinue = () => {
    if (inputUsername.trim()) {
      setUsername(inputUsername.trim());
    }
    onComplete();
  };

  if (!wallet) return null;

  return (
    <div className="bg-black/95 backdrop-blur-xl rounded-xl p-8 max-w-md mx-auto text-center border border-slate-800/50 shadow-2xl">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl ring-2 ring-emerald-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">Wallet Created!</h2>
        <p className="text-slate-400 text-sm">Your Linera microchain is ready</p>
      </div>

      <div className="bg-slate-900/60 rounded-lg p-4 mb-6 text-left border border-slate-800/50 space-y-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Your Address</p>
          <p className="text-sm font-mono text-slate-200 break-all">{wallet.address}</p>
        </div>
        {wallet.chainId && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Microchain ID</p>
            <p className="text-sm font-mono text-slate-200 break-all">{wallet.chainId}</p>
          </div>
        )}
        <div className="pt-2 border-t border-slate-800/50">
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Test tokens claimed from faucet
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2 text-left">
          Username (optional)
        </label>
        <input
          type="text"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          placeholder="Enter a username"
          className="w-full px-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
          onKeyPress={(e) => e.key === 'Enter' && handleContinue()}
        />
      </div>

      <button
        onClick={handleContinue}
        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
      >
        Continue to App
      </button>

      <p className="text-xs text-slate-500 mt-4">
        Make sure to export your wallet for backup
      </p>
    </div>
  );
}


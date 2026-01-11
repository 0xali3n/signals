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
    <div className="glass-strong rounded-xl p-8 max-w-md mx-auto text-center border border-amber-200/60 shadow-md">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-slate-800">Wallet Created!</h2>
        <p className="text-slate-600 text-sm">Your Linera microchain is ready</p>
      </div>

      <div className="glass rounded-lg p-4 mb-6 text-left border border-amber-200/50 space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Your Address</p>
          <p className="text-sm font-mono text-slate-700 break-all">{wallet.address}</p>
        </div>
        {wallet.chainId && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Microchain ID</p>
            <p className="text-sm font-mono text-slate-700 break-all">{wallet.chainId}</p>
          </div>
        )}
        <div className="pt-2 border-t border-amber-200/50">
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Test tokens claimed from faucet
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
          Username (optional)
        </label>
        <input
          type="text"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          placeholder="Enter a username"
          className="w-full px-4 py-2.5 rounded-lg glass border border-amber-200/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
          onKeyPress={(e) => e.key === 'Enter' && handleContinue()}
        />
      </div>

      <button
        onClick={handleContinue}
        className="w-full px-6 py-3 bg-saffron hover:opacity-90 text-white font-medium rounded-lg transition-all shadow-sm"
      >
        Continue to App
      </button>

      <p className="text-xs text-slate-500 mt-4">
        Make sure to export your wallet for backup
      </p>
    </div>
  );
}


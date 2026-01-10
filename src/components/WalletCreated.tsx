// Success screen after wallet creation

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

interface WalletCreatedProps {
  onComplete: () => void;
}

export function WalletCreated({ onComplete }: WalletCreatedProps) {
  const { wallet, setUsername } = useWallet();
  const [inputUsername, setInputUsername] = useState('');

  const handleContinue = () => {
    if (inputUsername.trim()) {
      setUsername(inputUsername.trim());
    }
    onComplete();
  };

  if (!wallet) return null;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md mx-auto text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Wallet Created!</h2>
        <p className="text-white/70 text-sm mb-4">Your Linera microchain is ready</p>
      </div>

      <div className="bg-white/10 rounded-lg p-4 mb-6 text-left">
        <p className="text-xs text-white/60 mb-1">Your Address</p>
        <p className="text-sm font-mono text-white break-all">{wallet.address}</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-white/80 mb-2 text-left">
          Username (optional)
        </label>
        <input
          type="text"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          placeholder="Enter a username"
          className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
          onKeyPress={(e) => e.key === 'Enter' && handleContinue()}
        />
      </div>

      <button
        onClick={handleContinue}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg"
      >
        Continue to App
      </button>

      <p className="text-xs text-yellow-300 mt-4">
        ⚠️ Make sure to export your wallet for backup!
      </p>
    </div>
  );
}


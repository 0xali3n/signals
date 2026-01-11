// Wallet setup and import/export component

import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { importWallet } from '../utils/wallet';
import { WalletCreated } from './WalletCreated';
import { WalletCreationProgress } from './WalletCreationProgress';

export function WalletSetup() {
  const { wallet, createWallet, setWallet, creationStep, creationMessage } = useWalletStore();
  const [showImport, setShowImport] = useState(false);
  const [showCreated, setShowCreated] = useState(false);
  const [importData, setImportData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setError(null);
      setIsCreating(true);
      await createWallet();
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Please upload a valid JSON file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          setError('Failed to read file');
          return;
        }
        setImportData(content);
        setError(null);
      } catch (err) {
        setError('Failed to read file');
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      setError(null);
      setIsImporting(true);
      
      if (!importData.trim()) {
        setError('Please upload a wallet file');
        return;
      }

      // Verify and import wallet
      const importedWallet = await importWallet(importData, '');
      
      // Verify wallet structure
      if (!importedWallet.address || !importedWallet.privateKey) {
        throw new Error('Invalid wallet format');
      }

             // Save and connect wallet
             await setWallet(importedWallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet. Please check your file and try again.');
      setIsImporting(false);
    }
  };

  if (wallet && !showCreated && creationStep === 'idle') {
    return null; // Wallet is connected, header will show it
  }

  // Show creation progress
  if (creationStep !== 'idle' && creationStep !== 'complete') {
    return (
      <WalletCreationProgress
        step={creationStep}
        message={creationMessage || undefined}
        address={wallet?.address}
        chainId={wallet?.chainId}
      />
    );
  }

  if (showCreated && wallet) {
    return <WalletCreated onComplete={() => setShowCreated(false)} />;
  }

  return (
    <div className="glass-strong rounded-xl p-8 max-w-md mx-auto border border-amber-200/60 shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-slate-800 text-center">Connect Your Microchain</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!showImport ? (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2 text-slate-800">Secure Your Microchain</h3>
            <p className="text-sm text-slate-600">
              Create a new wallet or import an existing one
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full px-6 py-3 bg-saffron hover:opacity-90 text-white font-medium rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Wallet...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Wallet</span>
              </>
            )}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/10 text-white/60">or</span>
            </div>
          </div>

          <button
            onClick={() => setShowImport(true)}
            className="w-full px-6 py-3 glass hover:bg-white/80 text-slate-700 font-medium rounded-lg transition-all border border-amber-200/50 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import Existing Wallet</span>
          </button>
          
          <div className="glass rounded-lg p-3 border border-amber-200/50">
            <p className="text-xs text-slate-600 text-center">
              Your private key is stored locally in your browser
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-1 text-slate-800">Import Wallet</h3>
            <p className="text-sm text-slate-600">Upload your exported wallet JSON file</p>
          </div>

          <div>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
              id="wallet-file-input"
            />
            <label
              htmlFor="wallet-file-input"
              className="flex flex-col items-center justify-center gap-3 w-full px-6 py-12 rounded-lg glass hover:bg-white/80 border-2 border-dashed border-amber-300/50 text-slate-700 cursor-pointer transition-all"
            >
              <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <p className="font-medium text-slate-700">{fileName || 'Click to upload wallet file'}</p>
                {!fileName && (
                  <p className="text-xs text-slate-500 mt-1">JSON file only</p>
                )}
              </div>
            </label>
            {fileName && (
              <p className="text-xs text-emerald-600 mt-2 text-center flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                File loaded: {fileName}
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || !importData.trim()}
            className="w-full px-6 py-3 bg-saffron hover:opacity-90 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Connect</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setShowImport(false);
              setImportData('');
              setError(null);
              setFileName(null);
            }}
            disabled={isImporting}
            className="w-full px-4 py-2.5 glass hover:bg-white/80 text-slate-700 rounded-lg transition-all border border-amber-200/50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}


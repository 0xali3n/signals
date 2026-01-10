// Wallet setup and import/export component

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { importWallet, saveWallet } from '../utils/wallet';
import { WalletCreated } from './WalletCreated';

export function WalletSetup() {
  const { wallet, createWallet } = useWallet();
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
      await saveWallet(importedWallet);
      
      // Reload to trigger wallet hook to pick up the new wallet
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet. Please check your file and try again.');
      setIsImporting(false);
    }
  };

  if (wallet && !showCreated) {
    return null; // Wallet is connected, header will show it
  }

  if (showCreated && wallet) {
    return <WalletCreated onComplete={() => setShowCreated(false)} />;
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Connect Your Microchain</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {!showImport ? (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Your Microchain</h3>
            <p className="text-sm text-white/70">
              Create a new wallet or import an existing one to start predicting
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            className="w-full px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition border border-white/30 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import Existing Wallet</span>
          </button>
          
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
            <p className="text-xs text-blue-200 text-center">
              🔒 Your private key is stored locally in your browser. Each wallet controls its own Linera microchain.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-1">Import Wallet</h3>
            <p className="text-sm text-white/70">Upload your exported wallet JSON file</p>
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
              className="flex flex-col items-center justify-center gap-3 w-full px-6 py-12 rounded-lg bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 text-white cursor-pointer transition"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <p className="font-medium">{fileName || 'Click to upload wallet file'}</p>
                {!fileName && (
                  <p className="text-xs text-white/60 mt-1">JSON file only</p>
                )}
              </div>
            </label>
            {fileName && (
              <p className="text-xs text-green-300 mt-2 text-center flex items-center justify-center gap-1">
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
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
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
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition border border-white/30 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}


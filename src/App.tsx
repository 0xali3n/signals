// Main App component for Signals - Real-time Crypto Prediction Game
import { useEffect } from 'react';
import { useWalletStore } from './store/walletStore';
import { useMarket } from './hooks/useMarket';
import { Header } from './components/Header';
import { WalletSetup } from './components/WalletSetup';
import { GameView } from './components/GameView';

function App() {
  const { wallet, isLoading, initialize, creationStep } = useWalletStore();
  const { marketState } = useMarket();

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Show loading only during initial app load, not during wallet creation
  if (isLoading && creationStep === 'idle' && !wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      <Header />
      
      {!wallet || (creationStep !== 'idle' && creationStep !== 'complete') ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <WalletSetup />
        </div>
        ) : (
          <div className="fixed inset-0 top-[72px] pb-20">
            <GameView 
              market={marketState.market} 
              userBet={marketState.userBet}
            />
          </div>
        )}
    </div>
  );
}

export default App;

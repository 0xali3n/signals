// Main App component for Signals - Real-time Crypto Prediction Game
import { useEffect } from 'react';
import { useWalletStore } from './store/walletStore';
import { useMarket } from './hooks/useMarket';
import { Header } from './components/Header';
import { WalletSetup } from './components/WalletSetup';
import { MarketView } from './components/MarketView';
import { BettingPanel } from './components/BettingPanel';

function App() {
  const { wallet, isLoading, initialize, creationStep } = useWalletStore();
  const { marketState } = useMarket();

  useEffect(() => {
    initialize();
  }, [initialize]);

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
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!wallet || (creationStep !== 'idle' && creationStep !== 'complete') ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
            <WalletSetup />
          </div>
        ) : (
          <div className="space-y-6">
            <MarketView 
              market={marketState.market} 
              userBet={marketState.userBet}
            />
            
            <BettingPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

// Main App component for Signals - Real-time Crypto Prediction Game
import { useWallet } from './hooks/useWallet';
import { useMarket } from './hooks/useMarket';
import { Header } from './components/Header';
import { WalletSetup } from './components/WalletSetup';
import { MarketView } from './components/MarketView';
import { BettingPanel } from './components/BettingPanel';

function App() {
  const { wallet, isLoading: walletLoading } = useWallet();
  const { marketState } = useMarket();

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {!wallet ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <WalletSetup />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center mb-8 pt-4">
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Prediction Market
              </h1>
              <p className="text-white/80">Real-time crypto prediction on Linera microchains</p>
            </div>
            
            <MarketView 
              market={marketState.market} 
              userBet={marketState.userBet}
            />
            
            <BettingPanel />
            
            <div className="max-w-2xl mx-auto mt-8 p-6 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How It Works
              </h3>
              <ul className="text-sm text-white/80 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-300 mt-1">•</span>
                  <span>Each user controls their own Linera microchain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-300 mt-1">•</span>
                  <span>Bets are stored on-chain with instant finality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-300 mt-1">•</span>
                  <span>No wallet popups - transactions sign automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-300 mt-1">•</span>
                  <span>Winners split the total pool based on their bet amounts</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

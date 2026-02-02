import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Background - Only ONE subtle background image */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Main Gameplay Background - Hero only */}
        <div className="absolute inset-0 opacity-[0.08]">
          <div 
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: 'url(/GamePlay.png)',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/98 to-black" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center max-w-5xl mx-auto">
          {/* Logo Only */}
          <div className="mb-8 flex justify-center">
            <img 
              src="/logo.png" 
              alt="Signals" 
              className="h-28 md:h-36 w-auto"
            />
          </div>

          {/* Product Mockup - Hero with vignette glow */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 blur-2xl -z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 rounded-xl -z-10" />
            <img
              src="/GamePlay.png"
              alt="Signals Game Interface"
              className="mx-auto rounded-xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 max-w-5xl w-full relative"
            />
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-400 mb-4 font-light tracking-wider uppercase">
            Real-time Crypto Prediction
          </p>
          
          <p className="text-sm md:text-base text-slate-500 mb-12 max-w-xl mx-auto font-light leading-relaxed">
            Predict Bitcoin price movements in real-time. Win 5x your bet when you're right.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/game')}
            className="group relative px-10 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm tracking-wide rounded-sm shadow-lg hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] border border-orange-400/20"
          >
            <span className="relative z-10 flex items-center gap-2.5">
              <span>Start Game</span>
              <span className="group-hover:translate-x-0.5 transition-transform text-lg">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
          </button>
        </div>
      </div>

      {/* Features Section - STEP 2 & 3: Remove background image, improve cards */}
      <div className="relative z-10 py-28">
        {/* Gradient background only */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: '⚡',
                title: 'Real-time Predictions',
                description: 'Live BTC price data from Binance',
              },
              {
                icon: '💰',
                title: '5x Payout',
                description: 'Win 500 tokens on 100 token bets',
              },
              {
                icon: '🔒',
                title: 'Secure Wallet',
                description: 'Linera blockchain microchain technology',
              },
              {
                icon: '🎯',
                title: 'Simple Interface',
                description: 'Click to bet, no trading knowledge needed',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-6 hover:border-orange-500/30 transition-all duration-300 relative"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent rounded-t-lg" />
                <h3 className="text-lg font-semibold mb-2 text-orange-400">
                  {feature.icon} {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screenshots Section - STEP 4: Hero screenshot layout */}
      <div className="relative z-10 py-28">
        {/* Gradient background only */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">
              Game Screenshots
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Hero Screenshot - spans 2 columns, 2 rows */}
            <div className="group relative bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-lg overflow-hidden hover:border-orange-500/40 transition-all duration-300 lg:col-span-2 lg:row-span-2">
              <div className="relative overflow-hidden bg-slate-950 h-full min-h-[500px]">
                <img
                  src="/GamePlay.png"
                  alt="Live Gameplay"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-sm font-medium text-white">Live Gameplay</h3>
              </div>
            </div>

            {/* Secondary Screenshots */}
            {[
              { src: '/HowToPlay.png', title: 'How to Play' },
              { src: '/Win.png', title: 'Win Screen' },
              { src: '/Lost.png', title: 'Lose Screen' },
              { src: '/BetHistory.png', title: 'Betting History' },
              { src: '/create account.png', title: 'Wallet Setup' },
            ].map((screenshot, index) => (
              <div
                key={index}
                className="group relative bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-lg overflow-hidden hover:border-orange-500/40 transition-all duration-300"
              >
                <div className="relative overflow-hidden bg-slate-950 aspect-video">
                  <img
                    src={screenshot.src}
                    alt={screenshot.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm font-medium text-white">{screenshot.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works - STEP 5: Simplify */}
      <div className="relative z-10 py-28">
        {/* Gradient background only */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">
              How It Works
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto" />
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Create or import your Linera wallet. Keys stored securely in your browser.',
              },
              {
                step: '02',
                title: 'Select Price Blocks',
                description: 'Click price blocks to place bets. Up to 5 blocks per column. 100 tokens per bet.',
              },
              {
                step: '03',
                title: 'Watch Price Line',
                description: 'Yellow line shows live BTC price. Moves right to left as time passes.',
              },
              {
                step: '04',
                title: 'Win or Lose',
                description: 'If price hits your block, win 500 tokens (5x). Otherwise, lose 100 tokens.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 bg-slate-900/80 backdrop-blur-none border border-slate-800/50 rounded-lg p-6 hover:border-orange-500/30 transition-all duration-300"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-lg font-semibold text-white">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-orange-400">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA - STEP 6: Make it feel final */}
      <div className="relative z-10 py-28">
        {/* Gradient background only */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-black" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="ring-1 ring-orange-500/20 shadow-xl shadow-orange-500/10 bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-lg p-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">
                Ready to Start?
              </h2>
              <p className="text-slate-400 mb-8 text-sm">
                Join the game and test your crypto prediction skills with real-time Bitcoin price predictions.
              </p>
              <button
                onClick={() => navigate('/game')}
                className="group relative px-10 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm tracking-wide rounded-sm shadow-lg hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] border border-orange-400/20"
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  <span>Start Playing Now</span>
                  <span className="group-hover:translate-x-0.5 transition-transform text-lg">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600 text-sm">
            <p>Built on Linera Conway Testnet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

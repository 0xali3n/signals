// Futuristic crypto prediction game interface
import { useEffect, useRef, useState } from 'react';
import { Market, BetDirection } from '../types';
import { useMarket } from '../hooks/useMarket';
import { useWalletStore } from '../store/walletStore';

interface GameViewProps {
  market: Market;
  userBet?: {
    direction: BetDirection;
    amount: number;
    claimed: boolean;
  };
}

export function GameView({ market, userBet }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPrice, setCurrentPrice] = useState(market.targetPrice);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const animationRef = useRef<number>();
  const [betAmount, setBetAmount] = useState('10');
  const [timelineOffset, setTimelineOffset] = useState(0);
  const { wallet } = useWalletStore();
  const { placeBet, claimReward, isLoading } = useMarket();

  // Simulate price movement (wave-like, up and down)
  useEffect(() => {
    let price = market.targetPrice;
    setCurrentPrice(price);
    setPriceHistory([price]);
    let time = 0;

    const simulatePrice = () => {
      // Wave-like movement with random variation
      const wave = Math.sin(time * 0.1) * 500; // Slow wave
      const random = (Math.random() - 0.5) * 150; // Random variation
      const bias = (market.targetPrice - price) * 0.01; // Slight bias to target
      
      price = Math.max(
        market.targetPrice * 0.9, 
        Math.min(market.targetPrice * 1.1, market.targetPrice + wave + random + bias)
      );
      
      time += 0.1;
      setCurrentPrice(price);
      setPriceHistory((prev) => {
        const newHistory = [...prev, price];
        return newHistory.slice(-50); // Keep last 50 points for tail
      });
    };

    const interval = setInterval(simulatePrice, 100);
    return () => clearInterval(interval);
  }, [market.targetPrice]);

  // Animate timeline scrolling from right to left
  useEffect(() => {
    const marketStart = market.endTime - 600000; // 10 minutes before end
    const marketDuration = 600000; // 10 minutes in ms
    
    const animateTimeline = () => {
      const now = Date.now();
      const elapsed = now - marketStart;
      const progress = Math.min(1, Math.max(0, elapsed / marketDuration));
      
      // Calculate offset: starts at 50% (right side), moves to -50% (left side)
      // This makes timeline scroll from right to left
      const offset = 50 - (progress * 100);
      setTimelineOffset(offset);
    };

    animateTimeline();
    const interval = setInterval(animateTimeline, 100); // Update every 100ms for smooth scrolling
    return () => clearInterval(interval);
  }, [market.endTime]);




  // Draw price line on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = (canvas.height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw center vertical line (stationary)
      const centerX = canvas.width / 2;
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw price tail line (history) and current price
      if (priceHistory.length > 1) {
        const minPrice = market.targetPrice * 0.9;
        const maxPrice = market.targetPrice * 1.1;
        const priceRange = maxPrice - minPrice;
        
        // Draw tail line (price history)
        ctx.strokeStyle = '#F4C430';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(244, 196, 48, 0.4)';
        
        ctx.beginPath();
        priceHistory.forEach((price, index) => {
          // Draw from left edge to center
          const availableWidth = centerX; // Width from left edge to center
          const x = (index / (priceHistory.length - 1)) * availableWidth; // Distribute evenly from 0 to centerX
          const y = canvas.height - ((price - minPrice) / priceRange) * canvas.height;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Draw current price dot at center
        const currentY = canvas.height - ((currentPrice - minPrice) / priceRange) * canvas.height;
        ctx.fillStyle = '#F4C430';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(244, 196, 48, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw horizontal line at current price
        ctx.strokeStyle = '#F4C430';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, currentY);
        ctx.lineTo(centerX + 15, currentY);
        ctx.stroke();
      }

      // Reset shadow
      ctx.shadowBlur = 0;
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [priceHistory, market.targetPrice]);

  const minPrice = market.targetPrice * 0.9;
  const maxPrice = market.targetPrice * 1.1;
  const priceRange = maxPrice - minPrice;

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden border-0">
      {/* Grid overlay - subtle */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Left price scale */}
      <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between py-6 z-10">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
          const price = maxPrice - (priceRange / 10) * i;
          return (
            <div
              key={i}
              className="text-xs font-mono text-orange-400 px-2"
            >
              ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          );
        })}
      </div>

      {/* Price line canvas */}
      <div className="absolute left-20 right-0 top-0 bottom-16">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Timeline at bottom - scrolling from right to left */}
      <div className="absolute bottom-16 left-20 right-0 h-12 border-t border-orange-500/20 bg-black/20 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Timeline markers container - scrolls from right to left */}
          <div 
            className="absolute top-0 h-full w-[200%]"
            style={{
              transform: `translateX(${timelineOffset}%)`,
              transition: 'transform 0.1s linear',
            }}
          >
            {(() => {
              const marketStart = market.endTime - 600000; // 10 minutes before end
              const marketDuration = 600000; // 10 minutes
              
              // Show more markers for smooth scrolling (24 markers)
              return [...Array(24)].map((_, i) => {
                const timePosition = i / 23; // 0 to 1 across the timeline
                const timeAtPosition = marketStart + (timePosition * marketDuration);
                const time = new Date(timeAtPosition);
                const now = Date.now();
                const isPast = timeAtPosition < now;
                const isNow = Math.abs(timeAtPosition - now) < 5000; // Within 5 seconds
                
                return (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex flex-col items-center"
                    style={{ left: `${(i / 23) * 100}%` }}
                  >
                    <div className={`h-2 w-px ${isNow ? 'bg-orange-400' : isPast ? 'bg-orange-500/40' : 'bg-orange-500/20'}`} />
                    <div className={`mt-1 text-xs font-mono ${isNow ? 'text-orange-400 font-semibold' : isPast ? 'text-orange-400/70' : 'text-orange-400/50'}`}>
                      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          
          {/* NOW indicator - fixed at center */}
          <div className="absolute top-0 left-1/2 h-full flex flex-col items-center -translate-x-1/2 z-10 pointer-events-none">
            <div className="h-full w-0.5 bg-orange-400" />
            <div className="mt-1 text-xs font-mono text-orange-400 font-semibold bg-black/60 px-1 rounded">
              NOW
            </div>
          </div>
        </div>
      </div>

      {/* HUD Elements */}
      <div className="absolute top-4 left-24 right-4 flex items-center justify-start z-20">
        <div className="px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg border border-orange-500/20">
          <div className="text-xs text-slate-400 mb-1">Current Price</div>
          <div className="text-xl font-mono font-semibold text-orange-400">
            ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* User Bet Status */}
      {userBet && (
        <div className="absolute top-20 left-24 z-20">
          <div className="px-4 py-2 bg-orange-500/10 rounded border border-orange-500/20">
            <div className="text-xs text-orange-400 mb-1">Your Bet</div>
            <div className="text-sm font-mono text-orange-300">
              {userBet.direction.toUpperCase()} - {userBet.amount} tokens
            </div>
          </div>
        </div>
      )}

      {/* Betting Panel - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-orange-500/20 z-30">
        <div className="container mx-auto px-6 py-4">
          {market.isClosed && userBet && !userBet.claimed ? (
            <div className="flex items-center justify-center">
              <button
                onClick={claimReward}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {isLoading ? 'Claiming...' : 'Claim Reward'}
              </button>
            </div>
          ) : !market.isClosed && Date.now() < market.endTime ? (
            <div className="flex items-center gap-4">
              {!userBet ? (
                <>
                  <div className="flex-1 max-w-xs">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Bet amount"
                      min="1"
                      className="w-full px-4 py-2 bg-black/40 border border-orange-500/20 rounded-lg text-orange-300 placeholder-slate-500 focus:outline-none focus:border-orange-500/40"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const direction: BetDirection = 'above';
                      placeBet(direction, parseFloat(betAmount) || 10);
                    }}
                    disabled={isLoading || !wallet}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>⬆️</span>
                    <span>{isLoading ? 'Placing...' : 'BET UP'}</span>
                  </button>
                </>
              ) : (
                <div className="flex-1 text-center">
                  <p className="text-slate-400 text-sm">You already placed a bet</p>
                  <p className="text-orange-400 font-mono mt-1">
                    {userBet.direction.toUpperCase()} - {userBet.amount} tokens
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              Market has ended
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


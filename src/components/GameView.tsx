// Futuristic crypto prediction game interface
import { useEffect, useRef, useState } from "react";
import { Market, BetDirection } from "../types";
import { useMarket } from "../hooks/useMarket";
import { useWalletStore } from "../store/walletStore";
import { subscribeToBTCPrice } from "../utils/btcPrice";
import { Timeline } from "./Timeline";

interface GameViewProps {
  market: Market;
  userBet?: {
    direction: BetDirection;
    amount: number;
    claimed: boolean;
  };
}

interface PricePoint {
  price: number;
  timestamp: number;
}

export function GameView({ market, userBet }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPrice, setCurrentPrice] = useState(market.targetPrice);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [priceScale, setPriceScale] = useState({
    minPrice: market.targetPrice * 0.995,
    maxPrice: market.targetPrice * 1.005,
    priceRange: market.targetPrice * 0.01,
  });
  const animationRef = useRef<number>();
  const [betAmount, setBetAmount] = useState("10");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { wallet } = useWalletStore();
  const { placeBet, claimReward, isLoading } = useMarket();

  // Subscribe to real-time BTC price - continuous updates with memory management
  useEffect(() => {
    // Initialize with current price (not target price)
    const initialPrice = market.targetPrice;
    setCurrentPrice(initialPrice);
    const now = Date.now();
    setPriceHistory([{ price: initialPrice, timestamp: now }]);

    // Subscribe to real-time BTC price updates
    const unsubscribe = subscribeToBTCPrice((price) => {
      const timestamp = Date.now();
      setCurrentPrice(price);
      setPriceHistory((prev) => {
        // Keep only last 10 minutes of history to prevent memory issues
        const tenMinutesAgo = timestamp - 10 * 60 * 1000;
        const filtered = prev.filter((p) => p.timestamp >= tenMinutesAgo);
        return [...filtered, { price, timestamp }];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [market.targetPrice]);

  // Update current time continuously for smooth timeline scrolling
  useEffect(() => {
    let animationFrameId: number;

    const updateTime = () => {
      // Update every frame for smooth scrolling animation
      setCurrentTime(Date.now());
      animationFrameId = requestAnimationFrame(updateTime);
    };

    animationFrameId = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Calculate price scale when price history or current price changes
  // Always centers around current price with reasonable zoom to show movements clearly
  useEffect(() => {
    const now = Date.now();
    const timeWindow = 2 * 60 * 1000; // 2 minutes
    const windowStart = now - timeWindow;

    // Filter to only prices within the visible time window
    const visiblePrices = priceHistory
      .filter((p) => p.timestamp >= windowStart)
      .map((p) => p.price);

    let minPrice: number;
    let maxPrice: number;
    let priceRange: number;

    // Always center around current price
    if (visiblePrices.length > 1) {
      const historyMin = Math.min(...visiblePrices);
      const historyMax = Math.max(...visiblePrices);
      const historyRange = historyMax - historyMin;

      const maxZoomRange = currentPrice * 0.006; // 0.6% max
      const minZoomRange = currentPrice * 0.002; // 0.2% min

      const targetRange =
        historyRange > 0
          ? Math.max(Math.min(historyRange * 1.2, maxZoomRange), minZoomRange)
          : minZoomRange;

      minPrice = currentPrice - targetRange / 2;
      maxPrice = currentPrice + targetRange / 2;
      priceRange = targetRange;
    } else {
      // Fallback: tight zoom around current price
      const padding = currentPrice * 0.003;
      minPrice = currentPrice - padding;
      maxPrice = currentPrice + padding;
      priceRange = maxPrice - minPrice;
    }

    setPriceScale({ minPrice, maxPrice, priceRange });
  }, [priceHistory, currentPrice, market.targetPrice]);

  // Draw price line on canvas - optimized with memoized drawing function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines - 15 sections for better spacing
      ctx.strokeStyle = "rgba(251, 146, 60, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 15; i++) {
        const y = (canvas.height / 15) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw center vertical line - slightly offset to the left
      const centerX = canvas.width / 2 - canvas.width * 0.05; // 5% offset to the left
      ctx.strokeStyle = "rgba(251, 146, 60, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Calculate price scale for canvas drawing - match the $10 increment scale
      const roundedCurrentPrice = Math.round(currentPrice / 10) * 10;
      const numIncrements = 7; // 7 increments above and below = 15 total sections
      const canvasMinPrice = roundedCurrentPrice - numIncrements * 10;
      const canvasMaxPrice = roundedCurrentPrice + numIncrements * 10;
      const canvasPriceRange = canvasMaxPrice - canvasMinPrice;

      const now = currentTime;
      const timeWindow = 2 * 60 * 1000;
      const startTime = now - timeWindow;

      // Draw price line if we have history
      if (priceHistory.length > 0) {
        const pointsToDraw = priceHistory
          .filter((p) => p.timestamp >= startTime)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (pointsToDraw.length > 1) {
          ctx.strokeStyle = "#F4C430";
          ctx.lineWidth = 2;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(244, 196, 48, 0.4)";
          ctx.beginPath();

          pointsToDraw.forEach((point, index) => {
            const timeOffset = point.timestamp - now;
            const timeRatio = Math.max(
              0,
              Math.min(1, (timeOffset + timeWindow) / timeWindow)
            );
            const x = timeRatio * centerX;
            const y =
              canvas.height -
              ((point.price - canvasMinPrice) / canvasPriceRange) *
                canvas.height;

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              const prevPoint = pointsToDraw[index - 1];
              const prevTimeOffset = prevPoint.timestamp - now;
              const prevTimeRatio = Math.max(
                0,
                Math.min(1, (prevTimeOffset + timeWindow) / timeWindow)
              );
              const prevX = prevTimeRatio * centerX;
              const prevY =
                canvas.height -
                ((prevPoint.price - canvasMinPrice) / canvasPriceRange) *
                  canvas.height;
              const controlX = (prevX + x) / 2;
              const controlY = (prevY + y) / 2;
              ctx.quadraticCurveTo(controlX, controlY, x, y);
            }
          });
          ctx.stroke();
        }

        // Draw current price indicator
        const currentY =
          canvas.height -
          ((currentPrice - canvasMinPrice) / canvasPriceRange) * canvas.height;
        ctx.fillStyle = "#F4C430";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(244, 196, 48, 0.6)";
        ctx.beginPath();
        ctx.arc(centerX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#F4C430";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, currentY);
        ctx.lineTo(centerX + 15, currentY);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [priceHistory, currentPrice, priceScale, currentTime]);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden border-0">
      {/* Grid overlay - subtle */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
          linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px)
        `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Left price scale - $20 increments, rounded to nearest 10, with proper spacing */}
      <div className="absolute left-0 top-0 bottom-36 w-28 flex flex-col justify-between py-10 z-10 pl-3">
        {(() => {
          // Calculate price scale with $10 increments
          // Round current price to nearest multiple of 10
          const roundedCurrentPrice = Math.round(currentPrice / 10) * 10;

          // Calculate how many $10 increments we need (7 increments = $70 range per side, $140 total)
          // We want to show prices around current price with $10 gaps
          const numIncrements = 7; // 7 increments above and below = 15 total sections
          const startPrice = roundedCurrentPrice - numIncrements * 10;

          // Generate prices with $10 gaps, all rounded to nearest 10
          const prices: number[] = [];
          for (let i = 0; i <= numIncrements * 2; i++) {
            const price = startPrice + i * 10;
            // Round to nearest 10 to ensure whole numbers
            const roundedPrice = Math.round(price / 10) * 10;
            prices.push(roundedPrice);
          }

          // Reverse to show highest at top
          prices.reverse();

          return prices.map((price, i) => (
            <div
              key={i}
              className="text-[10px] font-mono text-orange-400/90 tracking-tight mb-1"
              style={{ lineHeight: "1.2" }}
            >
              ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          ));
        })()}
      </div>

      {/* Price line canvas - full width edge to edge with spacing */}
      <div className="absolute left-28 right-0 top-0 bottom-36">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: "crisp-edges" }}
        />
      </div>

      {/* Timeline component */}
      <Timeline currentTime={currentTime} />

      {/* HUD Elements */}
      <div className="absolute top-6 left-28 right-6 flex items-center justify-start z-20">
        <div className="px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg border border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-xs text-slate-400">Current Price</div>
            <div className="text-[10px] font-semibold text-orange-400/80 bg-orange-500/20 px-2 py-0.5 rounded">
              BINANCE
            </div>
          </div>
          <div className="text-xl font-mono font-semibold text-orange-400">
            $
            {currentPrice.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* User Bet Status */}
      {userBet && (
        <div className="absolute top-24 left-28 z-20">
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
                {isLoading ? "Claiming..." : "Claim Reward"}
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
                      const direction: BetDirection = "above";
                      placeBet(direction, parseFloat(betAmount) || 10);
                    }}
                    disabled={isLoading || !wallet}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>⬆️</span>
                    <span>{isLoading ? "Placing..." : "BET UP"}</span>
                  </button>
                </>
              ) : (
                <div className="flex-1 text-center">
                  <p className="text-slate-400 text-sm">
                    You already placed a bet
                  </p>
                  <p className="text-orange-400 font-mono mt-1">
                    {userBet.direction.toUpperCase()} - {userBet.amount} tokens
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400">Market has ended</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Futuristic crypto prediction game interface
import { useEffect, useRef, useState } from "react";
import { Market, BetDirection } from "../types";
import { useMarket } from "../hooks/useMarket";
import { useWalletStore } from "../store/walletStore";
import { subscribeToBTCPrice } from "../utils/btcPrice";

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

  // Update current time - faster updates for smooth movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 16); // Update every 16ms for smooth 60fps timeline movement

    return () => clearInterval(interval);
  }, []);

  // Calculate price scale when price history or current price changes
  // Always centers around current price with reasonable zoom to show movements clearly
  useEffect(() => {
    let minPrice: number;
    let maxPrice: number;
    let priceRange: number;

    const now = Date.now();
    const timeWindow = 2 * 60 * 1000; // 2 minutes - shorter window for faster movement
    const windowStart = now - timeWindow;

    // Filter to only prices within the visible time window
    const visiblePrices = priceHistory
      .filter((p) => p.timestamp >= windowStart)
      .map((p) => p.price);

    // Always center around current price
    // Use a reasonable zoom level that shows price movements but doesn't zoom too much
    if (visiblePrices.length > 1) {
      const historyMin = Math.min(...visiblePrices);
      const historyMax = Math.max(...visiblePrices);
      const historyRange = historyMax - historyMin;

      // Very tight zoom for more visible movement - smaller gaps in price scale
      // Maximum zoom: 0.6% of current price (shows $90k ± $270)
      // Minimum zoom: 0.2% of current price (shows $90k ± $180)
      const maxZoomRange = currentPrice * 0.006; // 0.6% max - very tight zoom
      const minZoomRange = currentPrice * 0.002; // 0.2% min - extremely tight zoom

      let targetRange: number;
      if (historyRange > 0) {
        // Use actual range with 20% padding, but cap to max zoom
        targetRange = Math.min(historyRange * 1.2, maxZoomRange);
        // Ensure minimum zoom for visibility
        targetRange = Math.max(targetRange, minZoomRange);
      } else {
        // No movement, use tight default zoom
        targetRange = minZoomRange;
      }

      // Center around current price
      minPrice = currentPrice - targetRange / 2;
      maxPrice = currentPrice + targetRange / 2;
      priceRange = targetRange;
    } else {
      // Fallback: very tight zoom around current price (0.3% range)
      const padding = currentPrice * 0.003;
      minPrice = currentPrice - padding;
      maxPrice = currentPrice + padding;
      priceRange = maxPrice - minPrice;
    }

    setPriceScale({ minPrice, maxPrice, priceRange });
  }, [priceHistory, currentPrice, market.targetPrice, currentTime]);

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
    window.addEventListener("resize", updateCanvasSize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines - 20 lines for $50 gaps
      ctx.strokeStyle = "rgba(251, 146, 60, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 20; i++) {
        const y = (canvas.height / 20) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw center vertical line (stationary)
      const centerX = canvas.width / 2;
      ctx.strokeStyle = "rgba(251, 146, 60, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Use price scale from state (calculated in separate effect)
      const { minPrice, priceRange } = priceScale;

      // Draw price tail line (history) and current price
      if (priceHistory.length > 1) {
        // Draw tail line (price history) - from left edge to center based on time
        ctx.strokeStyle = "#F4C430";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(244, 196, 48, 0.4)";

        ctx.beginPath();
        const now = currentTime;
        // Show last 2 minutes of history (matches timeline window)
        const timeWindow = 2 * 60 * 1000; // 2 minutes in milliseconds
        const startTime = now - timeWindow;

        // Filter and sort price points within time window
        const pointsToDraw = priceHistory
          .filter((p) => p.timestamp >= startTime)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (pointsToDraw.length > 1) {
          // Draw smooth wave-like curve using quadratic bezier
          pointsToDraw.forEach((point, index) => {
            // Calculate x position based on time (left edge = past, center = now)
            const timeOffset = point.timestamp - now; // negative for past
            const timeRatio = Math.max(
              0,
              Math.min(1, (timeOffset + timeWindow) / timeWindow)
            );
            const x = timeRatio * centerX; // 0 at left edge, centerX at center (now)
            const y =
              canvas.height -
              ((point.price - minPrice) / priceRange) * canvas.height;

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              // Use quadratic bezier for smooth wave-like curves
              const prevPoint = pointsToDraw[index - 1];
              const prevTimeOffset = prevPoint.timestamp - now;
              const prevTimeRatio = Math.max(
                0,
                Math.min(1, (prevTimeOffset + timeWindow) / timeWindow)
              );
              const prevX = prevTimeRatio * centerX;
              const prevY =
                canvas.height -
                ((prevPoint.price - minPrice) / priceRange) * canvas.height;

              // Control point for smooth curve (midpoint)
              const controlX = (prevX + x) / 2;
              const controlY = (prevY + y) / 2;

              // Draw smooth wave curve
              ctx.quadraticCurveTo(controlX, controlY, x, y);
            }
          });
        } else if (pointsToDraw.length === 1) {
          // Single point - just move to it
          const point = pointsToDraw[0];
          const timeOffset = point.timestamp - now;
          const timeRatio = Math.max(
            0,
            Math.min(1, (timeOffset + timeWindow) / timeWindow)
          );
          const x = timeRatio * centerX;
          const y =
            canvas.height -
            ((point.price - minPrice) / priceRange) * canvas.height;
          ctx.moveTo(x, y);
        }
        ctx.stroke();

        // Draw current price dot at center
        const currentY =
          canvas.height -
          ((currentPrice - minPrice) / priceRange) * canvas.height;
        ctx.fillStyle = "#F4C430";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(244, 196, 48, 0.6)";
        ctx.beginPath();
        ctx.arc(centerX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw horizontal line at current price
        ctx.strokeStyle = "#F4C430";
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
      window.removeEventListener("resize", updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [priceHistory, currentPrice, market.targetPrice, currentTime, priceScale]);

  const { maxPrice, priceRange } = priceScale;

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

      {/* Left price scale - matches canvas scale exactly, $50 gaps with spacing */}
      <div className="absolute left-0 top-0 bottom-24 w-24 flex flex-col justify-between py-6 z-10">
        {[
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20,
        ].map((i) => {
          const price = maxPrice - (priceRange / 20) * i;
          return (
            <div
              key={i}
              className="text-[10px] font-mono text-orange-400 px-2 py-0.5"
            >
              $
              {price.toLocaleString(undefined, {
                maximumFractionDigits:
                  priceRange < 50 ? 2 : priceRange < 200 ? 1 : 0,
              })}
            </div>
          );
        })}
      </div>

      {/* Price line canvas */}
      <div className="absolute left-24 right-0 top-0 bottom-28">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: "crisp-edges" }}
        />
      </div>

      {/* Timeline at bottom - scrolling from LEFT TO RIGHT continuously with spacing */}
      <div className="absolute bottom-0 left-24 right-0 h-28 border-t border-orange-500/30 bg-black/70 overflow-visible">
        <div className="relative w-full h-full">
          {/* Timeline markers container - stable markers with smooth transitions */}
          <div className="absolute top-0 left-0 right-0 h-full pb-8">
            {(() => {
              const now = currentTime;

              // Generate stable markers - fixed intervals that don't change
              const markers: Array<{
                id: string;
                secondsOffset: number;
                position: number;
              }> = [];

              // Past markers (from 2 minutes ago to now) - fixed intervals
              for (let secondsAgo = 120; secondsAgo >= 0; secondsAgo -= 10) {
                markers.push({
                  id: `past-${secondsAgo}`,
                  secondsOffset: -secondsAgo,
                  position: (secondsAgo / 120) * 50, // 0% to 50%
                });
              }

              // Future markers (from now to 2 minutes ahead) - fixed intervals
              for (
                let secondsAhead = 10;
                secondsAhead <= 120;
                secondsAhead += 10
              ) {
                markers.push({
                  id: `future-${secondsAhead}`,
                  secondsOffset: secondsAhead,
                  position: 50 + (secondsAhead / 120) * 50, // 50% to 100%
                });
              }

              return markers.map((marker) => {
                const timeAtPosition = now + marker.secondsOffset * 1000;
                const time = new Date(timeAtPosition);
                const seconds = time.getSeconds();
                const minutes = time.getMinutes();
                const hours = time.getHours();
                const isNow = Math.abs(marker.secondsOffset) < 5; // Within 5 seconds
                const isMinuteMarker = seconds === 0; // Every minute
                const isMajorMarker = seconds % 30 === 0; // Every 30 seconds
                const isMinorMarker = seconds % 10 === 0; // Every 10 seconds
                const isPast = marker.secondsOffset < 0;

                // Always show labels - no blinking
                const timeString = isMinuteMarker
                  ? `${hours.toString().padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`
                  : `${hours.toString().padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}:${seconds
                      .toString()
                      .padStart(2, "0")}`;

                return (
                  <div
                    key={marker.id}
                    className="absolute top-0 h-full flex flex-col items-center justify-start transition-all duration-100"
                    style={{
                      left: `${marker.position}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div
                      className={`${
                        isMinuteMarker
                          ? "h-6"
                          : isMajorMarker
                          ? "h-4"
                          : isMinorMarker
                          ? "h-3"
                          : "h-2"
                      } w-0.5 ${
                        isNow
                          ? "bg-orange-400"
                          : isPast
                          ? "bg-orange-500/70"
                          : "bg-orange-500/40"
                      }`}
                    />
                    <div
                      className={`mt-1 text-[10px] font-mono whitespace-nowrap px-1 ${
                        isNow
                          ? "text-orange-400 font-bold"
                          : isMinuteMarker
                          ? "text-orange-400/95 font-semibold"
                          : isPast
                          ? "text-orange-400/85"
                          : "text-orange-400/70"
                      }`}
                    >
                      {timeString}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* NOW indicator - fixed at center */}
          <div className="absolute top-0 left-1/2 h-full flex flex-col items-center -translate-x-1/2 z-20 pointer-events-none">
            <div className="h-full w-1 bg-orange-400 shadow-lg shadow-orange-400/50" />
            <div className="mt-1 text-[10px] font-mono text-orange-400 font-bold bg-black/80 px-2 py-0.5 rounded border border-orange-400/50">
              NOW
            </div>
          </div>

          {/* Grid lines for timeline */}
          <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-orange-500/10"
                style={{ left: `${(i * 100) / 10}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* HUD Elements */}
      <div className="absolute top-4 left-24 right-4 flex items-center justify-start z-20">
        <div className="px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg border border-orange-500/20">
          <div className="text-xs text-slate-400 mb-1">Current Price</div>
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

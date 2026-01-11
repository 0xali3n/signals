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
  const [liveTime, setLiveTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  });
  const { wallet } = useWalletStore();
  const { placeBet, claimReward, isLoading } = useMarket();

  // Animation state for floating/bouncing effects
  const animationTimeRef = useRef<number>(0);
  const previousPriceRef = useRef<number>(currentPrice);
  const priceChangeAnimationRef = useRef<number>(0);

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

  // Update live time display every second with real system time (matching Timeline component)
  useEffect(() => {
    // Update immediately on mount
    const updateTime = () => {
      const now = new Date(); // Fetches time from user's local system
      setLiveTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    // Update immediately
    updateTime();

    // Then update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []); // Empty deps - runs once on mount

  // Calculate price scale when price history or current price changes
  // Always centers around current price with reasonable zoom to show movements clearly
  useEffect(() => {
    const now = Date.now();
    const timeWindow = 240 * 1000; // 4 minutes (matching timeline and price line)
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

      // Update animation time for floating effect (continuous)
      animationTimeRef.current += 0.016; // ~60fps

      // Detect price change and trigger wave animation
      if (Math.abs(currentPrice - previousPriceRef.current) > 0.01) {
        priceChangeAnimationRef.current = 0;
        previousPriceRef.current = currentPrice;
      }

      // Update price change animation (wave effect when price changes)
      if (priceChangeAnimationRef.current < 1) {
        priceChangeAnimationRef.current += 0.05; // Smooth wave transition
        if (priceChangeAnimationRef.current > 1)
          priceChangeAnimationRef.current = 1;
      }

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

      // Center X position - positioned at 30% from left to leave 70% space on right
      const centerX = canvas.width * 0.23; // 30% from left
      // Price line X position - 22% from left (moved 3% to the left from 25%)
      const priceLineX = canvas.width * 0.23; // 22% from left

      // Calculate price scale for canvas drawing - match the $10 increment scale
      const roundedCurrentPrice = Math.round(currentPrice / 10) * 10;
      const numIncrements = 7; // 7 increments above and below = 15 total sections
      const canvasMinPrice = roundedCurrentPrice - numIncrements * 10;
      const canvasMaxPrice = roundedCurrentPrice + numIncrements * 10;
      const canvasPriceRange = canvasMaxPrice - canvasMinPrice;

      const now = currentTime;
      const timeWindow = 240 * 1000; // 4 minutes in milliseconds (matching timeline)
      const startTime = now - timeWindow;

      // Floating/bouncing animation values (continuous small movement)
      const floatOffset = Math.sin(animationTimeRef.current * 2) * 1.5; // Small vertical bounce
      const floatOffsetX = Math.cos(animationTimeRef.current * 1.5) * 0.8; // Small horizontal drift

      // Wave animation when price changes (smooth wave transition)
      const waveOffset =
        priceChangeAnimationRef.current < 1
          ? Math.sin(priceChangeAnimationRef.current * Math.PI * 2) *
            3 *
            (1 - priceChangeAnimationRef.current)
          : 0;

      // Calculate current price Y position with floating animation
      const baseY =
        canvas.height -
        ((currentPrice - canvasMinPrice) / canvasPriceRange) * canvas.height;
      const currentY = baseY + floatOffset + waveOffset;

      // Draw price line if we have history
      if (priceHistory.length > 0) {
        const pointsToDraw = priceHistory
          .filter((p) => p.timestamp >= startTime)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (pointsToDraw.length > 0) {
          // Calculate wave animation for the entire line
          const lineWavePhase = animationTimeRef.current * 0.8; // Slower wave for line
          const lineWaveAmplitude = 1.2; // Small wave amplitude

          // Draw thick yellow price line (horizontal price history) starting from first historical point
          ctx.strokeStyle = "#F4C430";
          ctx.lineWidth = 2;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(244, 196, 48, 0.4)";
          ctx.beginPath();

          // Start from first historical point instead of current price dot
          const firstPoint = pointsToDraw[0];
          const firstTimeDiff = (firstPoint.timestamp - now) / 1000;
          const firstX =
            priceLineX +
            (firstTimeDiff / 240) * (canvas.width - priceLineX) +
            floatOffsetX;
          const firstBaseY =
            canvas.height -
            ((firstPoint.price - canvasMinPrice) / canvasPriceRange) *
              canvas.height;
          // Add floating wave to first point
          const firstWave = Math.sin(lineWavePhase) * lineWaveAmplitude;
          const firstY = firstBaseY + firstWave;
          ctx.moveTo(firstX, firstY);

          // Draw from first point onwards with wave animation
          pointsToDraw.forEach((point, index) => {
            // Calculate time difference in seconds (matching timeline calculation exactly)
            const timeDiff = (point.timestamp - now) / 1000;
            // Map time to x position: when timeDiff = 0, x = priceLineX (20% of canvas)
            // When timeDiff = -240: x = 0 (left edge)
            // When timeDiff = +240: x = canvas.width (right edge)
            const baseX =
              priceLineX + (timeDiff / 240) * (canvas.width - priceLineX);
            const x = baseX + floatOffsetX * (1 - Math.abs(timeDiff) / 240); // Less drift at edges

            const baseY =
              canvas.height -
              ((point.price - canvasMinPrice) / canvasPriceRange) *
                canvas.height;

            // Add wave animation that flows along the line
            const waveProgress = index / Math.max(pointsToDraw.length - 1, 1);
            const wavePhase = lineWavePhase + waveProgress * 2;
            const wave = Math.sin(wavePhase) * lineWaveAmplitude;
            const y = baseY + wave;

            if (index === 0) {
              // Already moved to first point, just continue
              // No need to draw curve from starting dot
            } else {
              const prevPoint = pointsToDraw[index - 1];
              const prevTimeDiff = (prevPoint.timestamp - now) / 1000;
              const prevBaseX =
                priceLineX + (prevTimeDiff / 240) * (canvas.width - priceLineX);
              const prevX =
                prevBaseX + floatOffsetX * (1 - Math.abs(prevTimeDiff) / 240);

              const prevBaseY =
                canvas.height -
                ((prevPoint.price - canvasMinPrice) / canvasPriceRange) *
                  canvas.height;
              const prevWaveProgress =
                (index - 1) / Math.max(pointsToDraw.length - 1, 1);
              const prevWavePhase = lineWavePhase + prevWaveProgress * 2;
              const prevWave = Math.sin(prevWavePhase) * lineWaveAmplitude;
              const prevY = prevBaseY + prevWave;

              const controlX = (prevX + x) / 2;
              const controlY = (prevY + y) / 2;
              ctx.quadraticCurveTo(controlX, controlY, x, y);
            }
          });
          ctx.stroke();
          ctx.setLineDash([]); // Reset dash pattern

          // Draw yellow dot at starting point (current price position) with floating animation
          const startDotX = priceLineX + floatOffsetX;
          const startDotY = currentY;
          ctx.fillStyle = "#F4C430";
          ctx.shadowBlur = 10 + Math.sin(animationTimeRef.current * 3) * 2; // Pulsing glow
          ctx.shadowColor = "rgba(244, 196, 48, 0.7)";
          ctx.beginPath();
          ctx.arc(
            startDotX,
            startDotY,
            5 + Math.sin(animationTimeRef.current * 4) * 0.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw yellow dot at tail edge (leftmost/oldest point) with floating animation
          const tailPoint = pointsToDraw[0]; // First point is the oldest (tail edge)
          const tailTimeDiff = (tailPoint.timestamp - now) / 1000;
          const tailBaseX =
            priceLineX + (tailTimeDiff / 240) * (canvas.width - priceLineX);
          const tailX =
            tailBaseX + floatOffsetX * (1 - Math.abs(tailTimeDiff) / 240);

          const tailBaseY =
            canvas.height -
            ((tailPoint.price - canvasMinPrice) / canvasPriceRange) *
              canvas.height;
          const tailWave = Math.sin(lineWavePhase) * lineWaveAmplitude;
          const tailY = tailBaseY + tailWave;

          ctx.fillStyle = "#F4C430";
          ctx.shadowBlur = 8 + Math.sin(animationTimeRef.current * 2.5) * 1.5;
          ctx.shadowColor = "rgba(244, 196, 48, 0.6)";
          ctx.beginPath();
          ctx.arc(
            tailX,
            tailY,
            5 + Math.sin(animationTimeRef.current * 3.5) * 0.4,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw vertical reference line from top to bottom at price position - premium dotted orange with subtle float
        const referenceLineX = priceLineX + floatOffsetX * 0.3; // Subtle horizontal drift
        ctx.strokeStyle = "rgba(251, 146, 60, 0.4)"; // Subtle orange
        ctx.lineWidth = 1; // Thin line
        ctx.setLineDash([3, 3]); // Dotted pattern
        ctx.beginPath();
        ctx.moveTo(referenceLineX, 0);
        ctx.lineTo(referenceLineX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash pattern

        // Draw current price indicator with floating animation
        const indicatorX = centerX + floatOffsetX;
        const indicatorY = currentY;

        // Pulsing glow effect
        const pulseGlow = 8 + Math.sin(animationTimeRef.current * 3.5) * 3;
        const pulseSize = 5 + Math.sin(animationTimeRef.current * 4) * 0.6;

        ctx.fillStyle = "#F4C430";
        ctx.shadowBlur = pulseGlow;
        ctx.shadowColor = "rgba(244, 196, 48, 0.7)";
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Horizontal line with slight wave
        const lineWave = Math.sin(animationTimeRef.current * 2.5) * 0.5;
        ctx.strokeStyle = "#F4C430";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.moveTo(indicatorX - 15, indicatorY + lineWave);
        ctx.lineTo(indicatorX + 15, indicatorY + lineWave);
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
        {/* Live time box at price line intersection with timeline */}
        <div
          className="absolute bottom-0 z-30"
          style={{
            left: "23%",
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-[9px] font-mono text-orange-400 font-bold bg-black/95 px-2 py-1 rounded border border-orange-400/50 shadow-[0_0_8px_rgba(251,146,60,0.4)] backdrop-blur-sm whitespace-nowrap">
            {liveTime}
          </div>
        </div>
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

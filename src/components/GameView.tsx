// Futuristic crypto prediction game interface
import { useEffect, useState } from "react";
import { Market, BetDirection } from "../types";
import { subscribeToBTCPrice } from "../utils/btcPrice";
import { Timeline } from "./Timeline";
import { PriceCanvas } from "./PriceCanvas";
import { PriceScale } from "./PriceScale";
import { BettingPanel } from "./BettingPanel";
import { usePriceScale } from "../hooks/usePriceScale";

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
  const [currentPrice, setCurrentPrice] = useState(market.targetPrice);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const priceScale = usePriceScale(
    priceHistory,
    currentPrice,
    market.targetPrice
  );

  // Subscribe to real-time BTC price
  useEffect(() => {
    const initialPrice = market.targetPrice;
    setCurrentPrice(initialPrice);
    const now = Date.now();
    setPriceHistory([{ price: initialPrice, timestamp: now }]);

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

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden border-0">
      {/* Grid overlay */}
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

      {/* Left price scale */}
      <PriceScale currentPrice={currentPrice} />

      {/* Price line canvas */}
      <div className="absolute left-28 right-0 top-0 bottom-36">
        <PriceCanvas
          priceHistory={priceHistory}
          currentPrice={currentPrice}
          currentTime={currentTime}
          priceScale={priceScale}
        />
      </div>

      {/* Timeline component */}
      <Timeline currentTime={currentTime} />

      {/* HUD Elements */}
      <div className="absolute top-4 sm:top-6 left-28 right-4 sm:right-6 flex items-center justify-start z-20">
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black/30 backdrop-blur-sm rounded-lg border border-orange-500/20">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <div className="text-[10px] sm:text-xs text-slate-400">
              Current Price
            </div>
            <div className="text-[9px] sm:text-[10px] font-semibold text-orange-400/80 bg-orange-500/20 px-1.5 sm:px-2 py-0.5 rounded">
              BINANCE
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono font-semibold text-orange-400">
            $
            {currentPrice.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* User Bet Status */}
      {userBet && (
        <div className="absolute top-20 sm:top-24 left-28 right-4 sm:right-6 z-20">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500/10 rounded border border-orange-500/20">
            <div className="text-[10px] sm:text-xs text-orange-400 mb-0.5 sm:mb-1">
              Your Bet
            </div>
            <div className="text-xs sm:text-sm font-mono text-orange-300">
              {userBet.direction.toUpperCase()} - {userBet.amount} tokens
            </div>
          </div>
        </div>
      )}

      {/* Betting Panel */}
      <BettingPanel market={market} userBet={userBet} />
    </div>
  );
}

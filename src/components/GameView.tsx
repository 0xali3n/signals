// Futuristic crypto prediction game interface
import { useEffect, useState, useRef, useMemo } from "react";
import { Market, BetDirection } from "../types";
import { subscribeToBTCPrice, fetchInitialBTCPrice } from "../utils/btcPrice";
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
  const [containerWidth, setContainerWidth] = useState(1920);
  const [containerHeight, setContainerHeight] = useState(1080);
  const [viewOffset, setViewOffset] = useState(0); // Timeline navigation offset
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  // Store initial live price for fixed price scale (centered on this price)
  const [initialLivePrice, setInitialLivePrice] = useState<number | null>(null);

  const priceScale = usePriceScale(
    priceHistory,
    currentPrice,
    initialLivePrice ?? market.targetPrice
  );

  // Timeline constants (matching Timeline component)
  const CURRENT_TIME_POSITION = 30; // Percentage from left
  const GRID_INTERVAL_SECONDS = 60; // Grid marks every 60 seconds
  const TIMELINE_SCROLL_SPEED = 2; // Pixels per second
  const TIMELINE_POSITION_OFFSET = 0;
  const TIMELINE_MIN_SPACING = 110; // Pixels

  // Fetch initial live price from Binance on mount/refresh and set up price scale
  useEffect(() => {
    let isMounted = true;

    const initializePrice = async () => {
      try {
        // Fetch live price from Binance REST API
        const livePrice = await fetchInitialBTCPrice();

        if (isMounted) {
          // Store initial live price for fixed price scale (centered on this)
          setInitialLivePrice(livePrice);
          setCurrentPrice(livePrice);
          const now = Date.now();
          setPriceHistory([{ price: livePrice, timestamp: now }]);
        }
      } catch (error) {
        // Fallback to market.targetPrice if fetch fails
        console.warn(
          "Failed to fetch initial price, using target price:",
          error
        );
        if (isMounted) {
          setInitialLivePrice(market.targetPrice);
          setCurrentPrice(market.targetPrice);
          const now = Date.now();
          setPriceHistory([{ price: market.targetPrice, timestamp: now }]);
        }
      }
    };

    initializePrice();

    // Subscribe to real-time BTC price updates
    const unsubscribe = subscribeToBTCPrice((price) => {
      if (isMounted) {
        const timestamp = Date.now();
        setCurrentPrice(price);
        setPriceHistory((prev) => {
          // Keep only last 10 minutes of history to prevent memory issues
          const tenMinutesAgo = timestamp - 10 * 60 * 1000;
          const filtered = prev.filter((p) => p.timestamp >= tenMinutesAgo);
          return [...filtered, { price, timestamp }];
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [market.targetPrice]);

  // Update container width and height on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Calculate vertical line positions (matching PriceCanvas logic)
  const verticalLinePositions = useMemo(() => {
    const priceCanvasOffset = 112; // 7rem (left-28) in pixels
    const availableWidth = containerWidth - priceCanvasOffset;
    const priceLineX = availableWidth * 0.3; // 30% from left of canvas area
    const referenceLineX = priceCanvasOffset + priceLineX;

    const timeWindow = 240; // 4 minutes in seconds
    const oneMinuteInSeconds = 60;
    const oneMinuteLineX =
      priceLineX +
      (oneMinuteInSeconds / timeWindow) * (availableWidth - priceLineX);
    const oneMinuteLineXAbsolute = priceCanvasOffset + oneMinuteLineX;

    return { referenceLineX, oneMinuteLineX: oneMinuteLineXAbsolute };
  }, [containerWidth]);

  // Calculate horizontal grid line positions (matching PriceCanvas grid)
  const horizontalLinePositions = useMemo(() => {
    const timelineHeight = 144; // 9rem (bottom-36) in pixels
    const canvasHeight = containerHeight - timelineHeight;

    // Calculate 15 horizontal lines (matching PriceCanvas grid)
    const lines: number[] = [];
    for (let i = 0; i <= 15; i++) {
      const y = (canvasHeight / 15) * i;
      lines.push(y);
    }

    return lines;
  }, [containerHeight]);

  // Calculate price level for each row (for betting blocks)
  // Each row represents a $10 price increment
  // Use initial live price (or target price as fallback) for fixed scale
  const priceLevelsPerRow = useMemo(() => {
    const basePrice = initialLivePrice ?? market.targetPrice;
    const roundedBasePrice = Math.round(basePrice / 10) * 10;
    const numIncrements = 7; // 7 increments above and below = 15 total levels
    const priceIncrement = 10;

    // Calculate price for each row (15 rows, highest at top)
    const prices: number[] = [];
    for (let i = 0; i < 15; i++) {
      // Row 0 = highest price, Row 14 = lowest price
      const price = roundedBasePrice + (numIncrements - i) * priceIncrement;
      prices.push(price);
    }

    return prices;
  }, [market.targetPrice, initialLivePrice]);

  // Calculate NOW position for timeline markers (matching Timeline component)
  const nowPixelPosition = useMemo(() => {
    const priceCanvasOffset = 112; // 7rem in pixels
    const availableWidth = containerWidth - priceCanvasOffset;
    return (
      priceCanvasOffset +
      (CURRENT_TIME_POSITION / 100) * availableWidth +
      TIMELINE_POSITION_OFFSET
    );
  }, [containerWidth]);

  // Calculate scroll offset for timeline markers (matching Timeline component)
  const timelineScrollOffset = useMemo(() => {
    const now = currentTime + viewOffset * 1000;
    const timeSinceStart = (now - startTimeRef.current) / 1000;
    return -timeSinceStart * TIMELINE_SCROLL_SPEED;
  }, [currentTime, viewOffset]);

  // Generate time markers at 60-second intervals (matching Timeline component)
  const timelineMarkers = useMemo(() => {
    const markers: Array<{ time: number; xPosition: number }> = [];
    const now = currentTime + viewOffset * 1000;
    const timeRangeMinutes =
      Math.ceil(containerWidth / (TIMELINE_SCROLL_SPEED * 60)) + 15;
    const rangeStart = now - timeRangeMinutes * 60 * 1000;
    const rangeEnd = now + timeRangeMinutes * 60 * 1000;

    let markerTime =
      Math.floor(rangeStart / (GRID_INTERVAL_SECONDS * 1000)) *
      (GRID_INTERVAL_SECONDS * 1000);
    let lastVisiblePosition = -Infinity;

    while (markerTime <= rangeEnd) {
      const timeDiff = (markerTime - now) / 1000;
      const xPosition = nowPixelPosition + timeDiff * TIMELINE_SCROLL_SPEED;
      const adjustedPosition = xPosition + timelineScrollOffset;

      const isInVisibleRange =
        adjustedPosition >= -20 && adjustedPosition <= containerWidth + 20;
      const hasEnoughSpacing =
        markers.length === 0 ||
        Math.abs(adjustedPosition - lastVisiblePosition) >=
          TIMELINE_MIN_SPACING;

      if (isInVisibleRange && hasEnoughSpacing) {
        markers.push({ time: markerTime, xPosition });
        lastVisiblePosition = adjustedPosition;
      }

      markerTime += GRID_INTERVAL_SECONDS * 1000;
    }

    return markers;
  }, [
    currentTime,
    viewOffset,
    containerWidth,
    timelineScrollOffset,
    nowPixelPosition,
  ]);

  // Initialize and update start time for timeline (matching Timeline component)
  useEffect(() => {
    if (viewOffset === 0) {
      startTimeRef.current = currentTime;
    }
  }, [viewOffset, currentTime]);

  // Initialize start time on mount
  useEffect(() => {
    startTimeRef.current = currentTime;
  }, [currentTime]);

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
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden border-0"
    >
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

      {/* Full-screen vertical and horizontal reference lines */}
      <div className="absolute inset-0 pointer-events-none z-[5]">
        {/* Horizontal grid lines - extending full screen width */}
        {horizontalLinePositions.map((y, index) => (
          <div
            key={`horizontal-${index}`}
            className="absolute left-0 right-0 h-[1px]"
            style={{
              top: `${y}px`,
              backgroundColor: "rgba(251, 146, 60, 0.08)",
            }}
          />
        ))}

        {/* Box grid - rows of boxes moving right to left */}
        <div
          className="absolute top-0 bottom-0 left-0 right-0 pointer-events-auto"
          style={{
            transform: `translateX(${timelineScrollOffset}px)`,
            willChange: "transform",
          }}
        >
          {horizontalLinePositions.slice(0, -1).map((y, rowIndex) => {
            const rowHeight = horizontalLinePositions[rowIndex + 1] - y;
            // Box height should fit within row height with padding
            const boxHeight = rowHeight - 4;
            // Box width should be smaller than spacing to prevent overlap
            // Use 85% of spacing to ensure proper gaps between boxes
            const maxBoxWidth = TIMELINE_MIN_SPACING * 0.85;
            const boxWidth = Math.min(boxHeight * 1.8, maxBoxWidth);

            return (
              <div
                key={`box-row-${rowIndex}`}
                className="absolute left-0 right-0"
                style={{
                  top: `${y + 2}px`,
                  height: `${rowHeight - 4}px`,
                }}
              >
                {timelineMarkers
                  .filter((marker) => {
                    const adjustedPosition =
                      marker.xPosition + timelineScrollOffset;
                    // Box disappears when its left edge touches the live price line
                    // adjustedPosition is center of box, left edge is at adjustedPosition - boxWidth/2
                    // We want to show boxes whose left edge hasn't reached the line yet
                    // Show when: left edge > nowPixelPosition
                    const leftEdge = adjustedPosition - boxWidth / 2;
                    return leftEdge > nowPixelPosition;
                  })
                  .map((marker) => {
                    const adjustedPosition =
                      marker.xPosition + timelineScrollOffset;

                    // Calculate gradient opacity based on distance from live price line
                    // Closer to live price = brighter, further = darker
                    const distanceFromLivePrice =
                      adjustedPosition - nowPixelPosition;
                    const maxDistance = containerWidth - nowPixelPosition;
                    const opacityFactor = Math.max(
                      0,
                      1 - (distanceFromLivePrice / maxDistance) * 0.7
                    );
                    const borderOpacity = 0.5 + opacityFactor * 0.3; // 0.5 to 0.8 (more visible)
                    const bgOpacity = 0.05 + opacityFactor * 0.1; // Subtle background glow

                    const priceLevel = priceLevelsPerRow[rowIndex];

                    return (
                      <div
                        key={`box-${rowIndex}-${marker.time}`}
                        className="absolute rounded-md border cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                        data-price-level={priceLevel}
                        data-timestamp={marker.time}
                        style={{
                          left: `${marker.xPosition}px`,
                          top: `${(rowHeight - boxHeight) / 2 - 2}px`,
                          width: `${boxWidth}px`,
                          height: `${boxHeight}px`,
                          transform: "translateX(-50%)",
                          borderColor: `rgba(251, 146, 60, ${borderOpacity})`,
                          borderWidth: "1.5px",
                          backgroundColor: `rgba(251, 146, 60, ${bgOpacity})`,
                          boxShadow: `0 0 ${
                            8 + opacityFactor * 4
                          }px rgba(251, 146, 60, ${0.2 + opacityFactor * 0.2})`,
                          transition:
                            "transform 0.15s ease-out, box-shadow 0.15s ease-out",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(251, 146, 60, 1)";
                          e.currentTarget.style.backgroundColor =
                            "rgba(251, 146, 60, 0.15)";
                          e.currentTarget.style.boxShadow =
                            "0 0 12px rgba(251, 146, 60, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `rgba(251, 146, 60, ${borderOpacity})`;
                          e.currentTarget.style.backgroundColor = `rgba(251, 146, 60, ${bgOpacity})`;
                          e.currentTarget.style.boxShadow = `0 0 ${
                            8 + opacityFactor * 4
                          }px rgba(251, 146, 60, ${0.2 + opacityFactor * 0.2})`;
                        }}
                      />
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* First vertical reference line */}
        <div
          className="absolute top-0 bottom-0 w-[2.5px]"
          style={{
            left: `${verticalLinePositions.referenceLineX}px`,
            transform: "translateX(-50%)",
            background:
              "repeating-linear-gradient(to bottom, rgba(251, 146, 60, 0.4) 0px, rgba(251, 146, 60, 0.4) 3px, transparent 3px, transparent 6px)",
          }}
        />
        {/* Second vertical reference line */}
        <div
          className="absolute top-0 bottom-0 w-[2.5px]"
          style={{
            left: `${verticalLinePositions.oneMinuteLineX}px`,
            transform: "translateX(-50%)",
            background:
              "repeating-linear-gradient(to bottom, rgba(251, 146, 60, 0.4) 0px, rgba(251, 146, 60, 0.4) 3px, transparent 3px, transparent 6px)",
          }}
        />
      </div>

      {/* Left price scale */}
      <PriceScale
        currentPrice={currentPrice}
        targetPrice={initialLivePrice ?? market.targetPrice}
      />

      {/* Price line canvas */}
      <div className="absolute left-28 right-0 top-0 bottom-36">
        <PriceCanvas
          priceHistory={priceHistory}
          currentPrice={currentPrice}
          currentTime={currentTime}
          priceScale={priceScale}
        />
        {/* Live time at orange line intersection - professional styling */}
        <div
          className="absolute bottom-0 z-30"
          style={{
            left: "30%",
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-black/95 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-orange-500/50 shadow-lg">
            <div className="text-[10px] font-mono text-orange-300 font-bold whitespace-nowrap">
              {(() => {
                const date = new Date(currentTime);
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const seconds = String(date.getSeconds()).padStart(2, "0");
                return `${hours}:${minutes}:${seconds}`;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline component */}
      <Timeline
        currentTime={currentTime}
        viewOffset={viewOffset}
        onViewOffsetChange={setViewOffset}
      />

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

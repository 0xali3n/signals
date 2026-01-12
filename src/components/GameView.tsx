// Futuristic crypto prediction game interface
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
  // Track selected betting blocks (array to support multiple selections)
  const [selectedBlocks, setSelectedBlocks] = useState<
    Array<{
      priceLevel: number;
      timestamp: number;
    }>
  >([]);
  // Error message for max selections
  const [maxSelectionError, setMaxSelectionError] = useState<string | null>(
    null
  );
  // Track boxes being blasted (hit by live price line) - per individual box
  const [blastedBoxes, setBlastedBoxes] = useState<
    Map<
      string,
      {
        startTime: number;
        priceLevel: number;
        timestamp: number;
        isSelected: boolean;
      }
    >
  >(new Map());
  // Track price line animation when hitting boxes
  const [priceLinePulse, setPriceLinePulse] = useState(0);
  // Track win/lose notifications
  const [gameResult, setGameResult] = useState<{
    type: "win" | "lose";
    message: string;
    timestamp: number;
  } | null>(null);

  // Memoized click handler
  const handleBoxClick = useCallback(
    (
      priceLevel: number,
      timestamp: number,
      isSelected: boolean,
      isInNoBetsZone: boolean,
      selectedInColumn: number
    ) => {
      if (isInNoBetsZone) return;

      if (isSelected) {
        // Unselect: remove from array
        setSelectedBlocks((prev) =>
          prev.filter(
            (block) =>
              !(
                block.priceLevel === priceLevel && block.timestamp === timestamp
              )
          )
        );
        setMaxSelectionError(null);
      } else {
        // Select: check if column already has 3 selections
        if (selectedInColumn < 3) {
          setSelectedBlocks((prev) => [...prev, { priceLevel, timestamp }]);
          setMaxSelectionError(null);
        } else {
          // Show error message
          setMaxSelectionError(
            `Maximum 3 boxes can be selected per column in one game`
          );
          // Auto-hide after 3 seconds
          setTimeout(() => setMaxSelectionError(null), 3000);
        }
      }
    },
    []
  );

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

  // Memoize selected blocks lookups for performance
  const selectedBlocksMap = useMemo(() => {
    const map = new Map<string, boolean>();
    selectedBlocks.forEach((block) => {
      map.set(`${block.priceLevel}-${block.timestamp}`, true);
    });
    return map;
  }, [selectedBlocks]);

  const selectedCountByTimestamp = useMemo(() => {
    const count = new Map<number, number>();
    selectedBlocks.forEach((block) => {
      count.set(block.timestamp, (count.get(block.timestamp) || 0) + 1);
    });
    return count;
  }, [selectedBlocks]);

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
  // Throttle to ~60fps for better performance
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const targetFPS = 60;
    const interval = 1000 / targetFPS;

    const updateTime = (currentFrameTime: number) => {
      if (currentFrameTime - lastTime >= interval) {
        setCurrentTime(Date.now());
        lastTime = currentFrameTime;
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };

    animationFrameId = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Calculate which row the current price is at (for detecting box hits)
  const currentPriceRowIndex = useMemo(() => {
    if (!initialLivePrice) return -1;
    const basePrice = initialLivePrice;
    const roundedBasePrice = Math.round(basePrice / 10) * 10;
    const numIncrements = 7;

    // Find which row the current price corresponds to
    for (let i = 0; i < 15; i++) {
      const rowPrice = roundedBasePrice + (numIncrements - i) * 10;
      // Check if current price is within $5 of this row's price (half the increment)
      if (Math.abs(currentPrice - rowPrice) <= 5) {
        return i;
      }
    }
    return -1;
  }, [currentPrice, initialLivePrice]);

  // Detect individual boxes being hit and trigger blast animation
  useEffect(() => {
    const hitThreshold = 8; // Pixels - when box left edge is this close, trigger blast
    const blastDuration = 120; // ms - how long the blast animation lasts (fast and snappy)

    // Only check if we have a valid current price row
    if (currentPriceRowIndex < 0) return;

    timelineMarkers.forEach((marker) => {
      const adjustedPosition = marker.xPosition + timelineScrollOffset;
      // Calculate left edge of box (assuming average box width)
      const avgBoxWidth = TIMELINE_MIN_SPACING * 0.85 * 0.85;
      const leftEdge = adjustedPosition - avgBoxWidth / 2;
      const distanceFromLine = leftEdge - nowPixelPosition;

      // Check if box left edge is about to touch the line (within threshold)
      if (
        distanceFromLine <= hitThreshold &&
        distanceFromLine >= -hitThreshold
      ) {
        // Get the price level for the row that the current price is at
        const priceLevel = priceLevelsPerRow[currentPriceRowIndex];
        const boxKey = `${priceLevel}-${marker.time}`;

        // Check if this specific box hasn't been blasted yet
        if (!blastedBoxes.has(boxKey)) {
          // Check if this box is selected
          const isSelected = selectedBlocksMap.has(boxKey);

          // Check if user has selected any boxes in this column (has played)
          const hasPlayedInColumn =
            (selectedCountByTimestamp.get(marker.time) ?? 0) > 0;

          // Trigger blast animation for this specific box only
          setBlastedBoxes((prev) => {
            const newMap = new Map(prev);
            newMap.set(boxKey, {
              startTime: Date.now(),
              priceLevel,
              timestamp: marker.time,
              isSelected,
            });
            return newMap;
          });

          // Only show win/lose notification if user has played in this column
          if (hasPlayedInColumn) {
            if (isSelected) {
              setGameResult({
                type: "win",
                message: "You Win!",
                timestamp: Date.now(),
              });
            } else {
              setGameResult({
                type: "lose",
                message: "You Lose",
                timestamp: Date.now(),
              });
            }

            // Auto-hide notification after 2.5 seconds
            setTimeout(() => {
              setGameResult(null);
            }, 2500);
          }

          // Trigger price line pulse animation
          setPriceLinePulse(1);
          setTimeout(() => setPriceLinePulse(0), 200);

          // Remove blasted box after animation completes
          setTimeout(() => {
            setBlastedBoxes((prev) => {
              const newMap = new Map(prev);
              newMap.delete(boxKey);
              return newMap;
            });
          }, blastDuration);
        }
      }
    });
  }, [
    timelineMarkers,
    timelineScrollOffset,
    nowPixelPosition,
    blastedBoxes,
    currentPriceRowIndex,
    priceLevelsPerRow,
    selectedBlocksMap,
    selectedCountByTimestamp,
  ]);

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
            transform: `translate3d(${timelineScrollOffset}px, 0, 0)`,
            willChange: "transform",
            backfaceVisibility: "hidden",
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

                    // Get price level for this row
                    const priceLevel = priceLevelsPerRow[rowIndex];
                    // Check if this specific box is being blasted - keep it visible during animation
                    const boxKey = `${priceLevel}-${marker.time}`;
                    const isBlasted = blastedBoxes.has(boxKey);

                    return leftEdge > nowPixelPosition || isBlasted;
                  })
                  .map((marker) => {
                    const adjustedPosition =
                      marker.xPosition + timelineScrollOffset;

                    // Get price level for this row
                    const priceLevel = priceLevelsPerRow[rowIndex];

                    // Check if this specific box is being blasted
                    const boxKey = `${priceLevel}-${marker.time}`;
                    const blastData = blastedBoxes.get(boxKey);
                    const isBlasted = !!blastData;
                    const blastProgress = blastData
                      ? Math.min((Date.now() - blastData.startTime) / 120, 1)
                      : 0; // 120ms animation duration

                    // Check if box is in "no bets allowed" zone (between referenceLineX and oneMinuteLineX)
                    const leftEdge = adjustedPosition - boxWidth / 2;
                    const rightEdge = adjustedPosition + boxWidth / 2;
                    const noBetsZoneStart =
                      verticalLinePositions.referenceLineX;
                    const noBetsZoneEnd = verticalLinePositions.oneMinuteLineX;
                    const isInNoBetsZone =
                      (leftEdge >= noBetsZoneStart &&
                        leftEdge <= noBetsZoneEnd) ||
                      (rightEdge >= noBetsZoneStart &&
                        rightEdge <= noBetsZoneEnd) ||
                      (leftEdge <= noBetsZoneStart &&
                        rightEdge >= noBetsZoneEnd);

                    // Check if this box is selected (optimized lookup)
                    const isSelected = selectedBlocksMap.has(
                      `${priceLevel}-${marker.time}`
                    );

                    // Count how many boxes are selected in this column (optimized lookup)
                    const selectedInColumn =
                      selectedCountByTimestamp.get(marker.time) || 0;

                    // Calculate gradient opacity based on distance from live price line
                    // Closer to live price = brighter, further = darker
                    const distanceFromLivePrice =
                      adjustedPosition - nowPixelPosition;
                    const maxDistance = containerWidth - nowPixelPosition;
                    const opacityFactor = Math.max(
                      0,
                      1 - (distanceFromLivePrice / maxDistance) * 0.7
                    );

                    // Style calculations
                    let borderOpacity,
                      bgOpacity,
                      boxShadow,
                      transform,
                      cursor,
                      opacity;

                    if (isBlasted) {
                      // Blast animation state - cracked and exploding
                      // Color depends on whether box was selected (win = green, lose = red)
                      const isWin = blastData?.isSelected ?? false;
                      const hasPlayed =
                        (selectedCountByTimestamp.get(marker.time) ?? 0) > 0;

                      // More intense, faster animation
                      const shake =
                        Math.sin(blastProgress * Math.PI * 15) *
                        (1 - blastProgress) *
                        4;
                      const scale =
                        1 + (1 - blastProgress) * 0.15 - blastProgress * 0.4;
                      const rotation =
                        (1 - blastProgress) *
                        Math.sin(blastProgress * Math.PI * 8) *
                        8;

                      transform = `translateX(calc(-50% + ${shake}px)) scale(${scale}) rotate(${rotation}deg)`;
                      borderOpacity = 0.95 - blastProgress * 0.8;
                      bgOpacity = 0.25 - blastProgress * 0.25;

                      // Green glow for win, red glow for lose, orange for neutral (no play)
                      if (hasPlayed) {
                        if (isWin) {
                          boxShadow = `0 0 ${
                            25 + blastProgress * 35
                          }px rgba(34, 197, 94, ${0.8 - blastProgress * 0.6}), 
                                   0 0 ${
                                     50 + blastProgress * 60
                                   }px rgba(22, 163, 74, ${
                            0.6 - blastProgress * 0.5
                          }), 0 0 ${
                            80 + blastProgress * 100
                          }px rgba(16, 185, 129, ${0.3 - blastProgress * 0.3})`;
                        } else {
                          boxShadow = `0 0 ${
                            25 + blastProgress * 35
                          }px rgba(239, 68, 68, ${0.8 - blastProgress * 0.6}), 
                                   0 0 ${
                                     50 + blastProgress * 60
                                   }px rgba(220, 38, 38, ${
                            0.6 - blastProgress * 0.5
                          }), 0 0 ${
                            80 + blastProgress * 100
                          }px rgba(185, 28, 28, ${0.3 - blastProgress * 0.3})`;
                        }
                      } else {
                        // Neutral orange glow if user hasn't played
                        boxShadow = `0 0 ${
                          20 + blastProgress * 30
                        }px rgba(251, 146, 60, ${0.6 - blastProgress * 0.5}), 
                                 0 0 ${
                                   40 + blastProgress * 50
                                 }px rgba(255, 100, 0, ${
                          0.4 - blastProgress * 0.4
                        })`;
                      }
                      opacity = 1 - blastProgress;
                      cursor = "default";
                    } else if (isInNoBetsZone) {
                      // "No bets allowed" state: greyed out but with subtle glow
                      borderOpacity = 0.35;
                      bgOpacity = 0.05;
                      boxShadow = "0 0 8px rgba(251, 146, 60, 0.15)";
                      transform = "translateX(-50%)";
                      cursor = "not-allowed";
                      opacity = 1;
                    } else if (isSelected) {
                      // Selected state: professional, clean, minimal
                      borderOpacity = 0.9;
                      bgOpacity = 0.12;
                      boxShadow = "0 0 8px rgba(251, 146, 60, 0.3)";
                      transform = "translateX(-50%)";
                      cursor = "pointer";
                      opacity = 1;
                    } else {
                      // Normal state
                      // If column is at max selections, make it slightly dimmer
                      const isColumnAtMax = selectedInColumn >= 3;
                      borderOpacity = isColumnAtMax
                        ? 0.3 + opacityFactor * 0.2
                        : 0.5 + opacityFactor * 0.3; // 0.5 to 0.8
                      bgOpacity = isColumnAtMax
                        ? 0.03 + opacityFactor * 0.05
                        : 0.05 + opacityFactor * 0.1;
                      boxShadow = `0 0 ${
                        8 + opacityFactor * 4
                      }px rgba(251, 146, 60, ${0.2 + opacityFactor * 0.2})`;
                      transform = "translateX(-50%)";
                      cursor = isColumnAtMax ? "not-allowed" : "pointer";
                      opacity = 1;
                    }

                    return (
                      <div
                        key={`box-${rowIndex}-${marker.time}`}
                        className={`absolute rounded-md border ${
                          isInNoBetsZone
                            ? ""
                            : isSelected
                            ? ""
                            : "hover:scale-[1.02] hover:shadow-md hover:shadow-orange-500/20"
                        }`}
                        data-price-level={priceLevel}
                        data-timestamp={marker.time}
                        style={{
                          left: `${marker.xPosition}px`,
                          top: `${(rowHeight - boxHeight) / 2 - 2}px`,
                          width: `${boxWidth}px`,
                          height: `${boxHeight}px`,
                          transform,
                          borderColor: isBlasted
                            ? (() => {
                                const hasPlayed =
                                  (selectedCountByTimestamp.get(marker.time) ??
                                    0) > 0;
                                if (!hasPlayed)
                                  return `rgba(251, 146, 60, ${borderOpacity})`;
                                return blastData?.isSelected
                                  ? `rgba(34, 197, 94, ${borderOpacity})`
                                  : `rgba(239, 68, 68, ${borderOpacity})`;
                              })()
                            : `rgba(251, 146, 60, ${borderOpacity})`,
                          borderWidth: "1.5px",
                          backgroundColor: isBlasted
                            ? (() => {
                                const hasPlayed =
                                  (selectedCountByTimestamp.get(marker.time) ??
                                    0) > 0;
                                if (!hasPlayed)
                                  return `rgba(251, 146, 60, ${bgOpacity})`;
                                return blastData?.isSelected
                                  ? `rgba(34, 197, 94, ${bgOpacity})`
                                  : `rgba(239, 68, 68, ${bgOpacity})`;
                              })()
                            : `rgba(251, 146, 60, ${bgOpacity})`,
                          boxShadow,
                          cursor,
                          transition: isBlasted
                            ? "none"
                            : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                          opacity: isBlasted
                            ? opacity
                            : isInNoBetsZone
                            ? 0.5
                            : 1,
                          willChange:
                            "transform, box-shadow, border-color, background-color, opacity",
                        }}
                        onClick={() =>
                          handleBoxClick(
                            priceLevel,
                            marker.time,
                            isSelected,
                            isInNoBetsZone,
                            selectedInColumn
                          )
                        }
                        onMouseEnter={(e) => {
                          if (
                            !isInNoBetsZone &&
                            !isSelected &&
                            selectedInColumn < 3
                          ) {
                            e.currentTarget.style.borderColor =
                              "rgba(251, 146, 60, 0.8)";
                            e.currentTarget.style.backgroundColor =
                              "rgba(251, 146, 60, 0.08)";
                            e.currentTarget.style.boxShadow =
                              "0 0 6px rgba(251, 146, 60, 0.25)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isInNoBetsZone && !isSelected) {
                            e.currentTarget.style.borderColor = `rgba(251, 146, 60, ${borderOpacity})`;
                            e.currentTarget.style.backgroundColor = `rgba(251, 146, 60, ${bgOpacity})`;
                            e.currentTarget.style.boxShadow = boxShadow;
                          }
                        }}
                      >
                        {/* Crack lines overlay for blasted boxes */}
                        {isBlasted && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              opacity: Math.min(blastProgress * 2, 1),
                            }}
                          >
                            {/* Crack pattern SVG - color based on win/lose/neutral */}
                            {(() => {
                              const hasPlayed =
                                (selectedCountByTimestamp.get(marker.time) ??
                                  0) > 0;
                              const isWin = blastData?.isSelected ?? false;

                              let crackColor, crackColorSecondary;
                              if (!hasPlayed) {
                                // Neutral orange if user hasn't played
                                crackColor = "rgba(251, 146, 60, 0.7)";
                                crackColorSecondary = "rgba(255, 100, 0, 0.5)";
                              } else if (isWin) {
                                crackColor = "rgba(34, 197, 94, 0.9)";
                                crackColorSecondary = "rgba(22, 163, 74, 0.7)";
                              } else {
                                crackColor = "rgba(239, 68, 68, 0.9)";
                                crackColorSecondary = "rgba(220, 38, 38, 0.7)";
                              }

                              return (
                                <svg
                                  className="absolute inset-0 w-full h-full"
                                  viewBox="0 0 100 100"
                                  preserveAspectRatio="none"
                                >
                                  <path
                                    d="M20,20 L30,25 L25,40 L15,35 Z M50,10 L55,20 L45,30 L40,15 Z M70,15 L75,30 L65,35 L60,20 Z M30,60 L40,65 L35,80 L25,75 Z M60,70 L70,75 L65,90 L55,85 Z"
                                    stroke={crackColor}
                                    strokeWidth="1.8"
                                    fill="none"
                                    strokeLinecap="round"
                                  />
                                  <path
                                    d="M10,50 L90,50 M50,10 L50,90"
                                    stroke={crackColorSecondary}
                                    strokeWidth="1.2"
                                    strokeDasharray="2,2"
                                  />
                                </svg>
                              );
                            })()}
                          </div>
                        )}
                        {/* Price level text inside box */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span
                            className={`text-[10px] font-semibold ${
                              isBlasted
                                ? "text-orange-300"
                                : isSelected
                                ? "text-orange-200"
                                : isInNoBetsZone
                                ? "text-orange-500/40"
                                : "text-orange-400/70"
                            }`}
                            style={{
                              textShadow: isBlasted
                                ? "0 0 4px rgba(255, 100, 0, 0.8)"
                                : isSelected
                                ? "0 0 2px rgba(251, 146, 60, 0.4)"
                                : "0 0 1px rgba(0, 0, 0, 0.3)",
                              transform: isBlasted
                                ? `scale(${1 + (1 - blastProgress) * 0.2})`
                                : "none",
                            }}
                          >
                            ${priceLevel.toLocaleString()}
                          </span>
                        </div>
                        {/* Minimal check icon for selected state - positioned at top-right */}
                        {isSelected && !isBlasted && (
                          <div className="absolute top-1 right-1 pointer-events-none">
                            <div className="bg-orange-500/80 rounded-full p-0.5">
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* First vertical reference line (live price line) - with pulse animation */}
        <div
          className="absolute top-0 bottom-0 w-[2.5px]"
          style={{
            left: `${verticalLinePositions.referenceLineX}px`,
            transform:
              priceLinePulse > 0
                ? `translateX(calc(-50% + ${
                    priceLinePulse * Math.sin(Date.now() / 50) * 2
                  }px))`
                : "translateX(-50%)",
            background:
              "repeating-linear-gradient(to bottom, rgba(251, 146, 60, 0.4) 0px, rgba(251, 146, 60, 0.4) 3px, transparent 3px, transparent 6px)",
            boxShadow:
              priceLinePulse > 0
                ? `0 0 ${10 + priceLinePulse * 10}px rgba(251, 146, 60, ${
                    0.5 + priceLinePulse * 0.3
                  }), 
                 0 0 ${20 + priceLinePulse * 20}px rgba(255, 100, 0, ${
                    0.3 + priceLinePulse * 0.2
                  })`
                : "none",
            transition: "transform 0.1s ease-out, box-shadow 0.2s ease-out",
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

      {/* Error message for max selections */}
      {maxSelectionError && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in">
          <div className="px-4 py-2.5 bg-red-500/90 backdrop-blur-sm rounded-lg border border-red-400/50 shadow-lg">
            <p className="text-sm font-medium text-white text-center">
              {maxSelectionError}
            </p>
          </div>
        </div>
      )}

      {/* Info note in footer */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded border border-orange-500/10">
          <p className="text-[10px] text-slate-400 text-center">
            Maximum 3 boxes per column in one game • Click to select/unselect
          </p>
        </div>
      </div>

      {/* Win/Lose Notification Popup - Professional & Gamified */}
      {gameResult && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div
            className={`px-8 py-5 rounded-xl border-2 shadow-2xl backdrop-blur-lg ${
              gameResult.type === "win"
                ? "bg-gradient-to-br from-green-500/25 via-green-500/15 to-green-600/25 border-green-400/70 shadow-green-500/30"
                : "bg-gradient-to-br from-red-500/25 via-red-500/15 to-red-600/25 border-red-400/70 shadow-red-500/30"
            }`}
            style={{
              animation:
                "fadeInScaleBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              {gameResult.type === "win" ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse"></div>
                  <svg
                    className="w-10 h-10 text-green-300 relative z-10"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-400/30 rounded-full blur-xl animate-pulse"></div>
                  <svg
                    className="w-10 h-10 text-red-300 relative z-10"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <div className="text-center">
                <p
                  className={`text-2xl font-extrabold tracking-tight ${
                    gameResult.type === "win"
                      ? "text-green-200 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                      : "text-red-200 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  }`}
                >
                  {gameResult.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

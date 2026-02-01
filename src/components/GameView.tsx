// Futuristic crypto prediction game interface
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Market, BetDirection } from "../types";
import { subscribeToBTCPrice, fetchInitialBTCPrice } from "../utils/btcPrice";
import { Timeline } from "./Timeline";
import { PriceCanvas } from "./PriceCanvas";
import { PriceScale } from "./PriceScale";
import { BettingPanel } from "./BettingPanel";
import { usePriceScale } from "../hooks/usePriceScale";
import { useMarket } from "../hooks/useMarket";
import { useWalletStore } from "../store/walletStore";

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
  const { placeBet } = useMarket();
  const { updateBalance } = useWalletStore();
  const processedWinsRef = useRef<Set<string>>(new Set()); // Track processed wins to avoid duplicate rewards
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
  // Pan controls
  const [panY, setPanY] = useState(0); // Vertical pan offset for price
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPanYRef = useRef(0);
  // Track selected betting blocks (array to support multiple selections)
  const [selectedBlocks, setSelectedBlocks] = useState<
    Array<{
      priceLevel: number;
      timestamp: number;
      betId?: string; // Track bet ID if placed on-chain
    }>
  >([]);
  // Error message for max selections
  const [maxSelectionError, setMaxSelectionError] = useState<string | null>(
    null
  );
  // Track pending bets (being placed)
  const [pendingBets, setPendingBets] = useState<Set<string>>(new Set());
  // Track boxes being blasted (hit by live price line) - per individual box
  // Using performance.now() for startTime for smoother animation timing
  const [blastedBoxes, setBlastedBoxes] = useState<
    Map<
      string,
      {
        startTime: number; // performance.now() timestamp
        priceLevel: number;
        timestamp: number;
        isSelected: boolean;
      }
    >
  >(new Map());
  // Track which columns (timestamps) have been hit - only one hit per column
  // Map: timestamp -> hitTime (when it was hit)
  const [hitColumns, setHitColumns] = useState<Map<number, number>>(new Map());
  // Track price line animation when hitting boxes
  const [priceLinePulse, setPriceLinePulse] = useState(0);
  // Track win/lose notifications
  const [gameResult, setGameResult] = useState<{
    type: "win" | "lose";
    message: string;
    timestamp: number;
  } | null>(null);

  // Memoized click handler - now places bets when selecting boxes
  const handleBoxClick = useCallback(
    async (
      priceLevel: number,
      timestamp: number,
      isSelected: boolean,
      isInNoBetsZone: boolean,
      selectedInColumn: number
    ) => {
      if (isInNoBetsZone) return;

      if (isSelected) {
        // Unselect: remove from array (and cancel bet if placed)
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
          const betKey = `${priceLevel}-${timestamp}`;

          // Add to pending bets
          setPendingBets((prev) => new Set(prev).add(betKey));

          try {
            // Place bet locally
            const betAmount = 100; // Fixed 100 tokens per block
            const bet = await placeBet(priceLevel, timestamp, betAmount);

            // Add to selected blocks with bet ID
            setSelectedBlocks((prev) => [
              ...prev,
              { priceLevel, timestamp, betId: bet.id },
            ]);
            setMaxSelectionError(null);
          } catch (error) {
            // Failed to place bet - error handled by UI
            setMaxSelectionError(
              error instanceof Error
                ? error.message
                : "Failed to place bet. Please try again."
            );
            setTimeout(() => setMaxSelectionError(null), 5000);
          } finally {
            setPendingBets((prev) => {
              const next = new Set(prev);
              next.delete(betKey);
              return next;
            });
          }
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
    [placeBet]
  );

  // Calculate price scale with pan support
  const basePriceScale = usePriceScale(
    priceHistory,
    currentPrice,
    initialLivePrice ?? market.targetPrice
  );
  
  // Apply pan to price scale
  const priceScale = useMemo(() => {
    const centerPrice = initialLivePrice ?? market.targetPrice;
    const baseRange = basePriceScale.priceRange;
    // panY: positive = drag down shows lower prices, negative = drag up shows higher prices
    const minPrice = centerPrice - baseRange / 2 + panY;
    const maxPrice = centerPrice + baseRange / 2 + panY;
    return {
      minPrice,
      maxPrice,
      priceRange: baseRange,
    };
  }, [basePriceScale, panY, initialLivePrice, market.targetPrice]);

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
        // Failed to fetch initial price, using target price as fallback
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


  // TradingView-style pan: click and drag to move price view
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow pan on canvas area, not on boxes, buttons, or interactive elements
    const target = e.target as HTMLElement;
    // Check if clicking on a box or interactive element
    const isBox = target.closest('[data-price-level]');
    const isButton = target.closest('button');
    const isInput = target.closest('input');
    const isSelectable = target.closest('.selectable');
    const isCanvas = target.tagName === 'CANVAS';
    
    // Allow pan if clicking on canvas area (not on boxes/buttons/inputs)
    // Works on canvas element or empty space
    if (
      e.button === 0 && 
      !isBox &&
      !isButton &&
      !isInput &&
      !isSelectable &&
      (isCanvas || target === e.currentTarget)
    ) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastPanYRef.current = panY;
      e.preventDefault();
      e.stopPropagation();
    }
  }, [panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      const deltaY = e.clientY - dragStartRef.current.y;
      // Drag down = see higher prices (increase panY), drag up = see lower prices (decrease panY)
      // deltaY positive = dragging down, deltaY negative = dragging up
      const newPanY = lastPanYRef.current + deltaY * 0.3; // Reduced sensitivity for smoother, more controlled panning
      setPanY(newPanY);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastPanYRef.current = newPanY; // Update ref immediately for smooth tracking
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse handlers for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const deltaY = e.clientY - dragStartRef.current.y;
        // Drag up = see higher prices (increase panY), drag down = see lower prices (decrease panY)
        const newPanY = lastPanYRef.current + deltaY * 0.8; // Smooth pan speed
        setPanY(newPanY);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        lastPanYRef.current = newPanY; // Update ref immediately for smooth tracking
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        // Sync ref with current state
        lastPanYRef.current = panY;
      }
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      window.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection
      document.body.style.cursor = 'grabbing';
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, panY]);

  // Reset pan (double-click to reset)
  const handleDoubleClick = useCallback(() => {
    setPanY(0);
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
  const priceLevelsPerRow = useMemo(() => {
    const centerPrice = (initialLivePrice ?? market.targetPrice) + panY;
    const priceIncrement = 10; // Fixed increment
    const numIncrements = 7; // Fixed number of increments
    
    // Calculate price for each row (15 rows, highest at top)
    const prices: number[] = [];
    for (let i = 0; i < 15; i++) {
      // Row 0 = highest price, Row 14 = lowest price
      const price = centerPrice + (numIncrements - i) * priceIncrement;
      prices.push(Math.round(price / priceIncrement) * priceIncrement);
    }

    return prices;
  }, [market.targetPrice, initialLivePrice, panY]);

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

  // Check if a box is pending (bet being placed)
  const isPendingBet = useCallback(
    (priceLevel: number, timestamp: number) => {
      return pendingBets.has(`${priceLevel}-${timestamp}`);
    },
    [pendingBets]
  );

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
  // Throttle to ~20fps for better performance
  useEffect(() => {
    let intervalId: number;
    const targetFPS = 20; // Reduced for better performance
    const interval = 1000 / targetFPS;

    const updateTime = () => {
      setCurrentTime(Date.now());
    };

    intervalId = setInterval(updateTime, interval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Calculate which row the current price is at (for detecting box hits)
  // Must match priceLevelsPerRow calculation to account for panY
  const currentPriceRowIndex = useMemo(() => {
    if (!initialLivePrice) return -1;
    // Use same calculation as priceLevelsPerRow to account for panY
    const centerPrice = (initialLivePrice ?? market.targetPrice) + panY;
    const priceIncrement = 10;
    const numIncrements = 7;

    // Find which row the current price corresponds to (matching priceLevelsPerRow logic)
    for (let i = 0; i < 15; i++) {
      const rowPrice = centerPrice + (numIncrements - i) * priceIncrement;
      const roundedRowPrice = Math.round(rowPrice / priceIncrement) * priceIncrement;
      // Check if current price is within $5 of this row's price (half the increment)
      if (Math.abs(currentPrice - roundedRowPrice) <= 5) {
        return i;
      }
    }
    return -1;
  }, [currentPrice, initialLivePrice, panY, market.targetPrice]);

  // Use refs to avoid dependency issues and reduce re-renders
  const blastedBoxesRef = useRef(blastedBoxes);
  const selectedBlocksMapRef = useRef(selectedBlocksMap);
  const selectedCountByTimestampRef = useRef(selectedCountByTimestamp);

  useEffect(() => {
    blastedBoxesRef.current = blastedBoxes;
  }, [blastedBoxes]);

  useEffect(() => {
    selectedBlocksMapRef.current = selectedBlocksMap;
  }, [selectedBlocksMap]);

  useEffect(() => {
    selectedCountByTimestampRef.current = selectedCountByTimestamp;
  }, [selectedCountByTimestamp]);

  // Detect individual boxes being hit and trigger blast animation
  // Optimized: Throttled check to reduce performance impact
  useEffect(() => {
    const hitThreshold = 8; // Pixels - when box left edge is this close, trigger blast
    const blastDuration = 2500; // ms - 2.5 seconds for full anime-style slash and destroy animation visibility

    // Only check if we have a valid current price row
    if (currentPriceRowIndex < 0) return;

    // Early exit if no markers
    if (timelineMarkers.length === 0) return;

    // Throttle checks to reduce CPU usage
    const checkInterval = setInterval(() => {
      const avgBoxWidth = TIMELINE_MIN_SPACING * 0.85 * 0.85;
      const priceLevel = priceLevelsPerRow[currentPriceRowIndex];

      // Only check markers near the live price line (optimization)
      const checkRange = hitThreshold + avgBoxWidth;
      const markersToCheck = timelineMarkers.filter((marker) => {
        const adjustedPosition = marker.xPosition + timelineScrollOffset;
        const leftEdge = adjustedPosition - avgBoxWidth / 2;
        return Math.abs(leftEdge - nowPixelPosition) < checkRange;
      });

      markersToCheck.forEach((marker) => {
        const adjustedPosition = marker.xPosition + timelineScrollOffset;
        const leftEdge = adjustedPosition - avgBoxWidth / 2;
        const distanceFromLine = leftEdge - nowPixelPosition;

        // Check if box left edge is about to touch the line (within threshold)
        if (
          distanceFromLine <= hitThreshold &&
          distanceFromLine >= -hitThreshold
        ) {
          const boxKey = `${priceLevel}-${marker.time}`;

          // CRITICAL: Only allow one hit per column (timestamp)
          // If this column has already been hit, skip it
          if (hitColumns.has(marker.time)) {
            return; // Column already hit, skip
          }

          // Check if this specific box hasn't been blasted yet
          if (!blastedBoxesRef.current.has(boxKey)) {
            // Mark this column as hit with current time - prevents other blocks in same column from being hit
            // This allows us to delay hiding blocks for 1-2 seconds
            setHitColumns((prev) => {
              const newMap = new Map(prev);
              newMap.set(marker.time, performance.now());
              return newMap;
            });

            // Check if this box is selected
            const isSelected = selectedBlocksMapRef.current.has(boxKey);

            // Check if user has selected any boxes in this column (has played)
            const hasPlayedInColumn =
              (selectedCountByTimestampRef.current.get(marker.time) ?? 0) > 0;

            // Trigger blast animation for this specific box only
            setBlastedBoxes((prev) => {
              const newMap = new Map(prev);
              newMap.set(boxKey, {
                startTime: performance.now(),
                priceLevel,
                timestamp: marker.time,
                isSelected,
              });
              return newMap;
            });

            // Only show win/lose notification if user has played in this column
            if (hasPlayedInColumn) {
              // Process win/lose only once per box
              if (!processedWinsRef.current.has(boxKey)) {
                processedWinsRef.current.add(boxKey);

                const betAmount = 100; // Fixed bet amount per block

                if (isSelected) {
                  // WIN: Add double the bet amount (2x return)
                  const winReward = betAmount * 2;
                  updateBalance(winReward);
                  setGameResult({
                    type: "win",
                    message: `You Win! +${winReward} tokens`,
                    timestamp: performance.now(),
                  });
                } else {
                  // LOSE: Do nothing (balance already deducted when bet was placed)
                  setGameResult({
                    type: "lose",
                    message: `You Lose -${betAmount} tokens`,
                    timestamp: performance.now(),
                  });
                }
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
            // Keep the hit block visible for full 2.5 seconds so users can see the animation
            setTimeout(() => {
              setBlastedBoxes((prev) => {
                const newMap = new Map(prev);
                newMap.delete(boxKey);
                return newMap;
              });
            }, blastDuration); // 2.5 seconds total for full animation visibility
          }
        }
      });
    }, 50); // Check every 50ms instead of every render

    return () => clearInterval(checkInterval);
  }, [
    timelineMarkers,
    timelineScrollOffset,
    nowPixelPosition,
    currentPriceRowIndex,
    priceLevelsPerRow,
    updateBalance,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
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
          className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none select-none"
          style={{
            transform: `translate3d(${timelineScrollOffset}px, 0, 0)`,
            willChange: "transform",
            backfaceVisibility: "hidden",
            userSelect: 'none',
            WebkitUserSelect: 'none',
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
                    const leftEdge = adjustedPosition - boxWidth / 2;

                    // Early exit optimization: skip if way past the line
                    if (leftEdge < nowPixelPosition - 50) return false;

                    // Get price level for this row
                    const priceLevel = priceLevelsPerRow[rowIndex];
                    const boxKey = `${priceLevel}-${marker.time}`;
                    const isBlasted = blastedBoxes.has(boxKey);

                    // Hide all other blocks in this column if column has been hit
                    // Wait 2.5 seconds (2500ms) before hiding blocks to let user see the full animation
                    const columnHitTime = hitColumns.get(marker.time);
                    if (columnHitTime && !isBlasted) {
                      const timeSinceHit = performance.now() - columnHitTime;
                      const hideDelay = 2500; // 2.5 seconds delay - matches animation duration
                      if (timeSinceHit >= hideDelay) {
                        return false; // Hide other blocks in hit column after delay
                      }
                      // Keep blocks visible during the delay period so users can see the animation
                    }

                    return leftEdge > nowPixelPosition || isBlasted;
                  })
                  .map((marker) => {
                    const adjustedPosition =
                      marker.xPosition + timelineScrollOffset;

                    // Get price level for this row
                    const priceLevel = priceLevelsPerRow[rowIndex];
                    const boxKey = `${priceLevel}-${marker.time}`;
                    const blastData = blastedBoxes.get(boxKey);
                    const isBlasted = !!blastData;
                    // Use requestAnimationFrame time for smoother progress calculation
                    const blastProgress = blastData
                      ? Math.min(
                          (performance.now() - blastData.startTime) / 2500,
                          1
                        )
                      : 0; // 2.5 seconds (2500ms) animation duration for full anime-style slash and destroy visibility

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
                    const isSelected = selectedBlocksMap.has(boxKey);

                    // Check if bet is pending
                    const isPending = isPendingBet(priceLevel, marker.time);

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

                    if (isPending) {
                      // Pending bet state: pulsing animation
                      const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9;
                      borderOpacity = 0.7 * pulse;
                      bgOpacity = 0.15 * pulse;
                      boxShadow = `0 0 ${6 * pulse}px rgba(251, 146, 60, ${
                        0.3 * pulse
                      })`;
                      transform = "translateX(-50%)";
                      cursor = "wait";
                      opacity = pulse;
                    } else if (isBlasted) {
                      // Anime-style dramatic slash and destruction animation
                      // Color depends on whether box was selected (win = green, lose = red)
                      const isWin = blastData?.isSelected ?? false;
                      const hasPlayed =
                        (selectedCountByTimestamp.get(marker.time) ?? 0) > 0;

                      // Anime-style animation phases:
                      // Enlarge phase (0-15%): Block enlarges dramatically to show it's hit
                      // Slash phase (15-30%): Sword slash appears and cuts through
                      // Split phase (30-50%): Block splits in half along slash line
                      // Break phase (50-75%): Block breaks into pieces with dramatic effect
                      // Fade phase (75-100%): Pieces scatter and fade away
                      const enlargePhase = Math.min(blastProgress / 0.15, 1);
                      const slashPhase = Math.min(Math.max((blastProgress - 0.15) / 0.15, 0), 1);
                      const splitPhase = Math.min(Math.max((blastProgress - 0.3) / 0.2, 0), 1);
                      const breakPhase = Math.min(Math.max((blastProgress - 0.5) / 0.25, 0), 1);
                      const fadePhase = Math.max((blastProgress - 0.75) / 0.25, 0);
                      
                      // ENLARGE EFFECT: Dramatic zoom-in when hit to show which block was hit
                      const enlargeScale = enlargePhase < 1
                        ? 1 + enlargePhase * 0.5 // Enlarge to 1.5x size
                        : 1.5 - (slashPhase * 0.2); // Slight shrink during slash
                      
                      // Dramatic shake during slash impact
                      const impactShake = slashPhase < 1 && enlargePhase >= 1
                        ? Math.sin(slashPhase * Math.PI * 20) * (1 - slashPhase) * 5
                        : 0;
                      
                      // Block splits in half during split phase
                      const splitOffset = splitPhase * 8; // Horizontal separation
                      const splitRotation = splitPhase * 8; // Rotation as it splits
                      
                      // Final scale: start with enlarge, then apply break shrink
                      const scale = enlargePhase < 1
                        ? enlargeScale
                        : breakPhase < 1
                        ? (enlargeScale * (1 - breakPhase * 0.4)) // Combine enlarge with break shrink
                        : ((enlargeScale * 0.6) - fadePhase * 0.3); // Continue shrinking during fade
                      
                      // Rotation: dramatic spin during break
                      const rotation = splitPhase < 1
                        ? splitRotation
                        : breakPhase * Math.sin(breakPhase * Math.PI * 6) * 25 + fadePhase * 30;

                      // Z-index boost to ensure hit block appears on top
                      transform = `translateX(calc(-50% + ${impactShake}px + ${splitOffset}px)) scale(${scale}) rotate(${rotation}deg) translateZ(0)`;
                      
                      // Opacity: fade during break and fade phases
                      borderOpacity = breakPhase < 1
                        ? 0.95 - breakPhase * 0.5
                        : 0.45 - fadePhase * 0.45;
                      bgOpacity = breakPhase < 1
                        ? 0.25 - breakPhase * 0.2
                        : 0.05 - fadePhase * 0.05;

                      // Anime-style intense glow: bright flash during slash, then fade
                      if (hasPlayed) {
                        if (isWin) {
                          boxShadow = slashPhase < 1
                            ? `0 0 ${30 + slashPhase * 40}px rgba(34, 197, 94, ${0.9 - slashPhase * 0.4}), 0 0 ${60 + slashPhase * 80}px rgba(34, 197, 94, ${0.5 - slashPhase * 0.3})`
                            : breakPhase < 1
                            ? `0 0 ${70 - breakPhase * 50}px rgba(34, 197, 94, ${0.5 - breakPhase * 0.4})`
                            : `0 0 ${20 - fadePhase * 20}px rgba(34, 197, 94, ${0.1 - fadePhase * 0.1})`;
                        } else {
                          boxShadow = slashPhase < 1
                            ? `0 0 ${30 + slashPhase * 40}px rgba(239, 68, 68, ${0.9 - slashPhase * 0.4}), 0 0 ${60 + slashPhase * 80}px rgba(239, 68, 68, ${0.5 - slashPhase * 0.3})`
                            : breakPhase < 1
                            ? `0 0 ${70 - breakPhase * 50}px rgba(239, 68, 68, ${0.5 - breakPhase * 0.4})`
                            : `0 0 ${20 - fadePhase * 20}px rgba(239, 68, 68, ${0.1 - fadePhase * 0.1})`;
                        }
                      } else {
                        // Neutral orange glow if user hasn't played
                        boxShadow = slashPhase < 1
                          ? `0 0 ${25 + slashPhase * 35}px rgba(251, 146, 60, ${0.7 - slashPhase * 0.3}), 0 0 ${50 + slashPhase * 60}px rgba(251, 146, 60, ${0.4 - slashPhase * 0.2})`
                          : breakPhase < 1
                          ? `0 0 ${60 - breakPhase * 40}px rgba(251, 146, 60, ${0.4 - breakPhase * 0.3})`
                          : `0 0 ${20 - fadePhase * 20}px rgba(251, 146, 60, ${0.1 - fadePhase * 0.1})`;
                      }
                      
                      opacity = breakPhase < 1 ? 1 : 1 - fadePhase;
                      cursor = "default";
                    } else if (isInNoBetsZone) {
                      // "No bets allowed" state: greyed out but with subtle glow
                      borderOpacity = 0.35;
                      bgOpacity = 0.05;
                      boxShadow = "0 0 4px rgba(251, 146, 60, 0.2)";
                      transform = "translateX(-50%)";
                      cursor = "not-allowed";
                      opacity = 1;
                    } else if (isSelected) {
                      // Selected state: professional, clean, minimal
                      borderOpacity = 0.9;
                      bgOpacity = 0.12;
                      boxShadow = "0 0 6px rgba(251, 146, 60, 0.4)";
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
                        4 + opacityFactor * 2
                      }px rgba(251, 146, 60, ${0.2 + opacityFactor * 0.15})`;
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
                            : "hover:scale-[1.01]"
                        }`}
                        data-price-level={priceLevel}
                        data-timestamp={marker.time}
                        style={{
                          left: `${marker.xPosition}px`,
                          top: `${(rowHeight - boxHeight) / 2 - 2}px`,
                          width: `${boxWidth}px`,
                          height: `${boxHeight}px`,
                          transform,
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          WebkitTouchCallout: 'none',
                          pointerEvents: 'auto', // Boxes need to receive clicks
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
                            : "transform 0.12s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.12s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.12s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.12s cubic-bezier(0.4, 0, 0.2, 1)",
                          opacity: isBlasted
                            ? opacity
                            : isInNoBetsZone
                            ? 0.5
                            : 1,
                          willChange: isBlasted
                            ? "transform, opacity"
                            : "transform, box-shadow",
                          zIndex: isBlasted ? 100 : 1, // Enlarged hit block appears on top
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation(); // Prevent pan when clicking boxes
                        }}
                        onClick={async (e) => {
                          e.stopPropagation(); // Prevent pan when clicking boxes
                          if (!isPending) {
                            await handleBoxClick(
                              priceLevel,
                              marker.time,
                              isSelected,
                              isInNoBetsZone,
                              selectedInColumn
                            );
                          }
                        }}
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

                              // Professional crack pattern - more realistic and detailed
                              // Calculate phases for crack pattern
                              const destroyPhase = Math.max((blastProgress - 0.4) / 0.6, 0);
                              const crackOpacity = Math.min(blastProgress * 2.5, 1);
                              const pieceOpacity = Math.max((blastProgress - 0.4) * 1.67, 0);
                              
                              return (
                                <>
                                  {/* Main crack lines - appear first */}
                                  <svg
                                    className="absolute inset-0 w-full h-full"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                    style={{ opacity: crackOpacity }}
                                  >
                                    {/* Central crack from impact point */}
                                    <path
                                      d="M50,20 Q45,40 40,60 Q35,75 30,90"
                                      stroke={crackColor}
                                      strokeWidth="2"
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M50,20 Q55,40 60,60 Q65,75 70,90"
                                      stroke={crackColor}
                                      strokeWidth="2"
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                    {/* Branching cracks */}
                                    <path
                                      d="M40,50 L35,45 L30,40 M60,50 L65,45 L70,40"
                                      stroke={crackColor}
                                      strokeWidth="1.5"
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M35,70 L30,75 L25,80 M65,70 L70,75 L75,80"
                                      stroke={crackColor}
                                      strokeWidth="1.5"
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                    {/* Secondary cracks */}
                                    <path
                                      d="M20,30 L25,35 L20,40 M80,30 L75,35 L80,40"
                                      stroke={crackColorSecondary}
                                      strokeWidth="1.2"
                                      fill="none"
                                      strokeLinecap="round"
                                      opacity="0.7"
                                    />
                                  </svg>
                                  {/* Destruction pieces - appear during destruction phase */}
                                  {pieceOpacity > 0 && (
                                    <div
                                      className="absolute inset-0 pointer-events-none"
                                      style={{ opacity: pieceOpacity }}
                                    >
                                      {/* Floating pieces effect */}
                                      <div
                                        className="absolute"
                                        style={{
                                          left: '20%',
                                          top: '20%',
                                          width: '8px',
                                          height: '8px',
                                          background: crackColor,
                                          borderRadius: '2px',
                                          transform: `translate(${destroyPhase * 15}px, ${destroyPhase * 20}px) rotate(${destroyPhase * 45}deg)`,
                                        }}
                                      />
                                      <div
                                        className="absolute"
                                        style={{
                                          left: '70%',
                                          top: '30%',
                                          width: '6px',
                                          height: '6px',
                                          background: crackColorSecondary,
                                          borderRadius: '2px',
                                          transform: `translate(${-destroyPhase * 12}px, ${destroyPhase * 18}px) rotate(${-destroyPhase * 30}deg)`,
                                        }}
                                      />
                                      <div
                                        className="absolute"
                                        style={{
                                          left: '40%',
                                          top: '60%',
                                          width: '7px',
                                          height: '7px',
                                          background: crackColor,
                                          borderRadius: '2px',
                                          transform: `translate(${destroyPhase * 10}px, ${-destroyPhase * 15}px) rotate(${destroyPhase * 60}deg)`,
                                        }}
                                      />
                                      <div
                                        className="absolute"
                                        style={{
                                          left: '60%',
                                          top: '70%',
                                          width: '5px',
                                          height: '5px',
                                          background: crackColorSecondary,
                                          borderRadius: '2px',
                                          transform: `translate(${-destroyPhase * 8}px, ${-destroyPhase * 12}px) rotate(${-destroyPhase * 40}deg)`,
                                        }}
                                      />
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        {/* Price level text inside box - optimized rendering */}
                        {!isBlasted && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {isPending ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[9px] text-orange-400/80">
                                  Placing...
                                </span>
                              </div>
                            ) : (
                              <span
                                className={`text-[10px] font-semibold ${
                                  isSelected
                                    ? "text-orange-200"
                                    : isInNoBetsZone
                                    ? "text-orange-500/40"
                                    : "text-orange-400/70"
                                }`}
                                style={{
                                  textShadow: isSelected
                                    ? "0 0 2px rgba(251, 146, 60, 0.4)"
                                    : "0 0 1px rgba(0, 0, 0, 0.3)",
                                }}
                              >
                                ${priceLevel.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Blasted box text - only render during blast */}
                        {isBlasted && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span
                              className="text-[10px] font-semibold text-orange-300"
                              style={{
                                textShadow: "0 0 4px rgba(255, 100, 0, 0.8)",
                                transform: `scale(${
                                  1 + (1 - blastProgress) * 0.2
                                })`,
                              }}
                            >
                              ${priceLevel.toLocaleString()}
                            </span>
                          </div>
                        )}
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
                    priceLinePulse * Math.sin(performance.now() / 50) * 2
                  }px))`
                : "translateX(-50%)",
            background:
              "repeating-linear-gradient(to bottom, rgba(251, 146, 60, 0.4) 0px, rgba(251, 146, 60, 0.4) 3px, transparent 3px, transparent 6px)",
            boxShadow:
              priceLinePulse > 0
                ? `0 0 ${6 + priceLinePulse * 4}px rgba(251, 146, 60, ${
                    0.4 + priceLinePulse * 0.2
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
        panY={panY}
      />


      {/* Price line canvas - TradingView-style controls */}
      <div 
        className="absolute left-28 right-0 top-0 bottom-36 select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
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
          <div className="bg-black/90 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-orange-500/30">
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
      <div className="absolute top-6 left-28 right-6 flex items-center justify-start z-20">
        <div className="px-5 py-3 bg-black/70 backdrop-blur-xl rounded-xl border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-slate-300 font-medium">
              Current Price
            </div>
            <div className="text-[10px] font-bold text-orange-400 bg-orange-500/25 px-2.5 py-1 rounded-md border border-orange-500/30">
              BTC/USDT
            </div>
            <div className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50">
              BINANCE
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-orange-300 tracking-tight">
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
          <div className="px-4 py-2.5 bg-red-500/90 backdrop-blur-sm rounded-lg border border-red-400/50">
            <p className="text-sm font-medium text-white text-center">
              {maxSelectionError}
            </p>
          </div>
        </div>
      )}

      {/* Info note in footer */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-lg border border-orange-500/20">
          <p className="text-xs text-slate-300 text-center font-medium">
            Maximum 3 boxes per column • Click to select • Drag to pan • Double-click to reset
          </p>
        </div>
      </div>

      {/* Win/Lose Notification Popup - Professional & Gamified */}
      {gameResult && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div
            className={`px-8 py-5 rounded-xl border-2 backdrop-blur-lg ${
              gameResult.type === "win"
                ? "bg-green-500/20 border-green-400/50"
                : "bg-red-500/20 border-red-400/50"
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
                      ? "text-green-200"
                      : "text-red-200"
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

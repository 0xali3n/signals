// Timeline component for displaying time markers
import { useMemo, useState, useRef, useEffect } from "react";

interface TimelineProps {
  currentTime: number;
  viewOffset?: number;
  onViewOffsetChange?: (offset: number) => void;
}

// Constants
const CURRENT_TIME_POSITION = 30; // Percentage from left (fixed NOW position)
const GRID_INTERVAL_SECONDS = 20; // Grid marks every 20 seconds (reduced for faster block hits)

// ============================================
// TIMELINE CONFIGURATION
// ============================================
// 1. TIMELINE_SCROLL_SPEED: Controls how fast the timeline scrolls
//    - 1 minute = 120 pixels (2 pixels/second × 60 seconds)
//    - This ensures proper spacing and smooth scrolling
const TIMELINE_SCROLL_SPEED = 3.5; // Pixels per second (increased for faster movement)

// 2. TIMELINE_POSITION_OFFSET: Fine-tune alignment with NOW indicator
//    - Adjusts horizontal position to match PriceCanvas NOW line exactly
const TIMELINE_POSITION_OFFSET = 0; // Pixels (aligned with canvas)

// 3. TIMELINE_MIN_SPACING: Minimum pixel spacing between visible time markers
//    - 60 seconds = 120 pixels, so we use 110px to show all markers with slight buffer
const TIMELINE_MIN_SPACING = 50; // Pixels (reduced to match 20-second intervals: 20s × 2px/s = 40px)

export function Timeline({
  currentTime,
  viewOffset: externalViewOffset,
  onViewOffsetChange,
}: TimelineProps) {
  const [internalViewOffset, setInternalViewOffset] = useState(0);
  const viewOffset =
    externalViewOffset !== undefined ? externalViewOffset : internalViewOffset;
  const setViewOffset = onViewOffsetChange || setInternalViewOffset;
  const [containerWidth, setContainerWidth] = useState(1920);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(currentTime);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate NOW position (reused in multiple places)
  const nowPixelPosition = useMemo(() => {
    const priceCanvasOffset = 112; // 7rem in pixels
    const availableWidth = containerWidth - priceCanvasOffset;
    return (
      priceCanvasOffset +
      (CURRENT_TIME_POSITION / 100) * availableWidth +
      TIMELINE_POSITION_OFFSET
    );
  }, [containerWidth]);

  // Calculate scroll offset based on time progression
  const scrollOffset = useMemo(() => {
    const now = currentTime + viewOffset * 1000;
    const timeSinceStart = (now - startTimeRef.current) / 1000;
    return -timeSinceStart * TIMELINE_SCROLL_SPEED;
  }, [currentTime, viewOffset]);

  // Generate time markers at 20-second intervals
  const timeMarkers = useMemo(() => {
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
      const adjustedPosition = xPosition + scrollOffset;

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
  }, [currentTime, viewOffset, containerWidth, scrollOffset, nowPixelPosition]);

  // Initialize and update start time
  useEffect(() => {
    if (viewOffset === 0) {
      startTimeRef.current = currentTime;
    }
  }, [viewOffset, currentTime]);

  // Initialize start time on mount
  useEffect(() => {
    startTimeRef.current = currentTime;
  }, [currentTime]);

  // Navigation handlers
  const handleForward = () => {
    const newOffset = viewOffset + 60;
    setViewOffset(newOffset); // Move forward 1 minute
    startTimeRef.current = currentTime + newOffset * 1000;
  };

  const handleBack = () => {
    const newOffset = viewOffset - 60;
    setViewOffset(newOffset); // Move back 1 minute
    startTimeRef.current = currentTime + newOffset * 1000;
  };

  const handleReset = () => {
    setViewOffset(0); // Reset to live time
    startTimeRef.current = currentTime;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-36 border-t border-orange-500/30 bg-gradient-to-t from-black/95 via-black/80 to-black/40 z-30 overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        {/* Background grid lines removed - only show timeline markers */}

        {/* Scrolling time markers container */}
        <div
          className="absolute top-0 left-0 right-0 h-full pointer-events-none z-20"
          style={{
            transform: `translateX(${scrollOffset}px)`,
            willChange: "transform",
          }}
        >
          {timeMarkers.map((marker) => {
            const adjustedPosition = marker.xPosition + scrollOffset;
            const isAtCurrentPosition =
              Math.abs(adjustedPosition - nowPixelPosition) < 60;

            return (
              <div
                key={`marker-${marker.time}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${marker.xPosition}px`,
                  top: 0,
                  bottom: 0,
                  transform: "translateX(-50%)",
                  width: "1px",
                }}
              >
                <div
                  className={`absolute top-0 bottom-0 ${
                    isAtCurrentPosition
                      ? "w-[0.5px] bg-orange-500/40"
                      : "w-[0.5px] bg-orange-500/15"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation controls - professional styling */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-40 pointer-events-auto">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-orange-500/40 hover:border-orange-500/60 rounded-md text-orange-400 text-[10px] font-mono font-semibold transition-all duration-200"
            title="Go back 1 minute"
          >
            ← BACK
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-orange-500/40 hover:border-orange-500/60 rounded-md text-orange-400 text-[10px] font-mono font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset to live time"
            disabled={viewOffset === 0}
          >
            LIVE
          </button>
          <button
            onClick={handleForward}
            className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-orange-500/40 hover:border-orange-500/60 rounded-md text-orange-400 text-[10px] font-mono font-semibold transition-all duration-200"
            title="Go forward 1 minute"
          >
            FORWARD →
          </button>
        </div>
      </div>
    </div>
  );
}

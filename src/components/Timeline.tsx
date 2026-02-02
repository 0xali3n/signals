// Timeline component for displaying time markers
import { useMemo, useState, useRef, useEffect, useCallback, memo } from "react";

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
//    - Reduced for tighter spacing between blocks
const TIMELINE_MIN_SPACING = 30; // Pixels (reduced from 50 to 30 for tighter gaps)

// Memoized marker component to prevent unnecessary re-renders
interface TimeMarkerProps {
  time: number;
  xPosition: number;
  showLabel: boolean;
  timeLabel: string;
  lineWidth: string;
  lineClass: string;
  labelClass: string;
}

const TimeMarker = memo(function TimeMarker({
  xPosition,
  showLabel,
  timeLabel,
  lineWidth,
  lineClass,
  labelClass,
}: TimeMarkerProps) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `${xPosition}px`,
        top: 0,
        bottom: 0,
        transform: "translate3d(-50%, 0, 0)",
        width: "1px",
      }}
    >
      <div className={`absolute top-0 bottom-0 ${lineWidth} ${lineClass}`} />
      {showLabel && (
        <div
          className={`absolute bottom-8 text-[9px] font-mono whitespace-nowrap ${labelClass}`}
          style={{
            transform: "translate3d(-50%, 0, 0)",
          }}
        >
          {timeLabel}
        </div>
      )}
    </div>
  );
});

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

  // Generate time markers at 20-second intervals with pre-calculated data
  const timeMarkers = useMemo(() => {
    const markers: Array<{ 
      time: number; 
      xPosition: number;
      adjustedPosition: number;
      isAtCurrentPosition: boolean;
      showLabel: boolean;
      timeLabel: string;
      lineWidth: string;
      lineClass: string;
      labelClass: string;
    }> = [];
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
        // Pre-calculate all marker properties to avoid doing it in render
        const isAtCurrentPosition = Math.abs(adjustedPosition - nowPixelPosition) < 60;
        
        // Pre-calculate label data
        const markerDate = new Date(markerTime);
        const seconds = markerDate.getSeconds();
        const minutes = markerDate.getMinutes();
        const showLabel = seconds === 0 || isAtCurrentPosition;
        const timeLabel = showLabel 
          ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          : '';

        // Pre-calculate classes
        const lineWidth = isAtCurrentPosition ? 'w-[1px]' : 'w-[0.5px]';
        const lineClass = isAtCurrentPosition
          ? 'bg-orange-500/60 shadow-[0_0_4px_rgba(251,146,60,0.5)]'
          : 'bg-orange-500/20';
        const labelClass = isAtCurrentPosition
          ? 'text-orange-400 font-semibold'
          : 'text-orange-500/60';

        markers.push({ 
          time: markerTime, 
          xPosition,
          adjustedPosition,
          isAtCurrentPosition,
          showLabel,
          timeLabel,
          lineWidth,
          lineClass,
          labelClass,
        });
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

  // Navigation handlers - memoized to prevent re-renders
  const handleForward = useCallback(() => {
    const newOffset = viewOffset + 60;
    setViewOffset(newOffset); // Move forward 1 minute
    startTimeRef.current = currentTime + newOffset * 1000;
  }, [viewOffset, currentTime, setViewOffset]);

  const handleBack = useCallback(() => {
    const newOffset = viewOffset - 60;
    setViewOffset(newOffset); // Move back 1 minute
    startTimeRef.current = currentTime + newOffset * 1000;
  }, [viewOffset, currentTime, setViewOffset]);

  const handleReset = useCallback(() => {
    setViewOffset(0); // Reset to live time
    startTimeRef.current = currentTime;
  }, [currentTime, setViewOffset]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-36 border-t border-orange-500/30 bg-gradient-to-t from-black/95 via-black/80 to-black/40 z-30 overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        {/* Subtle grid background for better depth perception */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-orange-500/20" />
        </div>
        {/* Background grid lines removed - only show timeline markers */}

        {/* NOW indicator - fixed position */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
          style={{
            left: `${nowPixelPosition}px`,
            transform: "translate3d(-50%, 0, 0)",
            width: "2px",
          }}
        >
          <div className="absolute top-0 bottom-0 w-[2px] bg-orange-500 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
          <div className="absolute top-2 bg-orange-500/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-lg border border-orange-400/50">
            NOW
          </div>
        </div>

        {/* Scrolling time markers container */}
        <div
          className="absolute top-0 left-0 right-0 h-full pointer-events-none z-20"
          style={{
            transform: `translate3d(${scrollOffset}px, 0, 0)`,
            willChange: "transform",
          }}
        >
          {timeMarkers.map((marker) => (
            <TimeMarker
              key={`marker-${marker.time}`}
              time={marker.time}
              xPosition={marker.xPosition}
              showLabel={marker.showLabel}
              timeLabel={marker.timeLabel}
              lineWidth={marker.lineWidth}
              lineClass={marker.lineClass}
              labelClass={marker.labelClass}
            />
          ))}
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

// Timeline component for displaying time markers and labels
import { useMemo, useState, useEffect } from "react";

interface TimelineProps {
  currentTime: number;
}

interface TimelineMarker {
  id: string;
  timestamp: number; // Absolute timestamp
  secondsOffset: number; // Offset from current time in seconds
}

export function Timeline({ currentTime }: TimelineProps) {
  // Stable time display to prevent blinking - update only once per second
  // Time is fetched from browser's local system time (user's timezone)
  // Uses JavaScript Date object which gets time from user's device
  const [displayTime, setDisplayTime] = useState(() => {
    const now = new Date(); // Gets current time from user's browser/system
    // toLocaleTimeString uses browser's local timezone automatically
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      // timeZone: 'UTC' // Uncomment to force UTC timezone
    });
  });

  useEffect(() => {
    // Update display time independently, not tied to currentTime prop
    const interval = setInterval(() => {
      const now = new Date(); // Fetches time from user's local system
      setDisplayTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          // timeZone: 'UTC' // Uncomment to force UTC timezone
        })
      );
    }, 1000); // Update once per second to prevent blinking

    return () => clearInterval(interval);
  }, []); // Empty deps - runs once on mount

  // Generate markers based on fixed 10-second intervals
  // Markers are stable - only their positions change as time scrolls
  const timelineMarkers = useMemo<TimelineMarker[]>(() => {
    const markers: TimelineMarker[] = [];
    
    // Round to nearest 10 seconds for stable marker generation
    const baseTime = Math.floor(currentTime / 10000) * 10000;
    
    // Generate markers for a wider range (4 minutes each side = 8 minutes total) to ensure smooth scrolling
    // This gives us buffer markers that scroll in/out smoothly and extends fully to edges
    for (let offset = -240; offset <= 240; offset += 10) {
      const timestamp = baseTime + offset * 1000;
      markers.push({
        id: `marker-${timestamp}`,
        timestamp,
        secondsOffset: offset, // Will be recalculated in render
      });
    }

    return markers;
  }, [Math.floor(currentTime / 10000)]); // Only regenerate when we cross a 10-second boundary

  // Calculate position for each marker based on actual time difference
  // Timeline scrolls: past times on left, future times on right, current time at 30% (moved left)
  // Position formula: 30% + (timeDiff / 240s) × 70% (to use 70% of space on right)

  // Calculate positions for all markers - no filtering, all markers shown
  // This ensures consistent spacing and sizing without position jumps
  const visibleMarkers = useMemo(() => {
    return timelineMarkers
      .map((marker) => {
        const timeDiff = (marker.timestamp - currentTime) / 1000;
        const timeWindow = 240;
        // Center at 30%, use 70% of space on right side, extend fully to edges
        const position = 30 + (timeDiff / timeWindow) * 70;
        return { marker, position };
      })
      .filter(({ position }) => position >= -10 && position <= 110); // Extended range to show full timeline to edges
  }, [timelineMarkers, Math.floor(currentTime / 100)]); // Update every 100ms for smooth animation with second-by-second accuracy

  return (
    <div className="absolute bottom-0 left-0 right-0 h-36 border-t border-orange-500/30 bg-gradient-to-t from-black/95 via-black/80 to-black/40 overflow-hidden">
      <div className="relative w-full h-full px-0">
        {/* Grid lines for timeline - edge to edge with subtle styling */}
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[0.5px] bg-orange-500/8"
              style={{ left: `${i * 10}%` }}
            />
          ))}
        </div>

        {/* Timeline markers container - scrolls from right to left with proper spacing */}
        <div className="absolute top-0 left-0 right-0 h-full pb-16">
          {visibleMarkers.map(({ marker, position }) => {
            const time = new Date(marker.timestamp);
            const seconds = time.getSeconds();
            const minutes = time.getMinutes();
            const hours = time.getHours();
            
            // Calculate actual offset from current time
            const secondsOffset = Math.round((marker.timestamp - currentTime) / 1000);
            
            const isNow = Math.abs(secondsOffset) < 5;
            const isMinuteMarker = seconds === 0;
            const isPast = secondsOffset < 0;
            
            // Format label: full time for minutes, just seconds for 10-second intervals
            let timeString: string;
            if (isMinuteMarker) {
              // Full time format for minute markers: HH:MM:SS
              timeString = `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            } else {
              // Just seconds for 10-second interval markers: 10, 20, 30, 40, 50
              timeString = seconds.toString();
            }
            
            return (
              <div
                key={marker.id}
                className="absolute top-0 h-full flex flex-col items-center justify-start z-10"
                style={{
                  left: `${position}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {/* Marker line - extends with proper height and premium styling */}
                <div
                  className={`w-[1px] ${
                    isMinuteMarker
                      ? "h-12"
                      : "h-6"
                  } ${
                    isNow
                      ? "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.7)]"
                      : isPast
                      ? "bg-orange-500/75"
                      : "bg-orange-500/45"
                  } transition-all duration-75`}
                />
                {/* Time label with premium styling - always show, no orange box for current time */}
                <div
                  className={`mt-4 font-mono whitespace-nowrap z-20 tracking-wide ${
                    isMinuteMarker
                      ? "text-[9px] text-orange-400/96 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      : isNow
                      ? "text-[10px] text-orange-400 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      : isPast
                      ? "text-[8px] text-orange-400/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      : "text-[8px] text-orange-400/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  {timeString}
                </div>
              </div>
            );
          })}
        </div>

        {/* NOW indicator - aligned with center line position (30% from left) - no vertical line, just labels */}
        <div 
          className="absolute top-0 h-full flex flex-col items-center justify-end z-30 pointer-events-none pb-2"
          style={{
            // Matches canvas centerX: 7rem (price scale) + 30% of canvas width
            // Canvas width = 100% - 7rem, centerX = (100% - 7rem) * 0.30
            left: 'calc(7rem + (100% - 7rem) * 0.30)',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="mt-2.5 text-[10px] font-mono text-orange-400 font-bold bg-black/97 px-3 py-1.5 rounded-lg border border-orange-400/50 shadow-[0_0_16px_rgba(251,146,60,0.5)] whitespace-nowrap backdrop-blur-sm">
            NOW
          </div>
          {/* Current time display - positioned at bottom, stays on screen */}
          <div className="text-[9px] font-mono text-orange-400/92 bg-black/88 px-2.5 py-1 rounded-md border border-orange-400/25 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.3)] mb-1">
            {displayTime}
          </div>
        </div>
      </div>
    </div>
  );
}


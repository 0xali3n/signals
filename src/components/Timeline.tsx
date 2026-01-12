// Timeline component for displaying time markers
import { useMemo, useState } from "react";

interface TimelineProps {
  currentTime: number;
}

// Constants
const CURRENT_TIME_POSITION = 30; // Percentage from left
const TIME_WINDOW_SECONDS = 240; // 4 minutes
const GRID_INTERVAL_SECONDS = 30; // Grid marks every 30 seconds

// Helper functions
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function Timeline({ currentTime }: TimelineProps) {
  const [viewOffset, setViewOffset] = useState(0); // Offset in seconds for navigation

  // Display time formatted from currentTime
  const displayTime = useMemo(
    () => formatTime(currentTime),
    [Math.floor(currentTime / 1000)]
  );

  // Calculate time markers that flow from right to left
  const timeMarkers = useMemo(() => {
    const markers: Array<{ time: number; position: number }> = [];
    const now = currentTime + viewOffset * 1000;

    // Show 4 minutes of history before current time (0% to 30%)
    // Show 4 minutes of future after current time (30% to 100%)
    const pastSeconds = (CURRENT_TIME_POSITION / 100) * TIME_WINDOW_SECONDS; // ~72 seconds
    const futureSeconds =
      ((100 - CURRENT_TIME_POSITION) / 100) * TIME_WINDOW_SECONDS; // ~168 seconds

    const startTime = now - pastSeconds * 1000;
    const endTime = now + futureSeconds * 1000;

    // Generate markers every 30 seconds
    let markerTime = startTime;
    while (markerTime <= endTime) {
      const timeDiff = (markerTime - now) / 1000; // seconds from now
      let position: number;

      if (timeDiff <= 0) {
        // Past: 0% to 30%
        position =
          CURRENT_TIME_POSITION +
          (timeDiff / pastSeconds) * CURRENT_TIME_POSITION;
      } else {
        // Future: 30% to 100%
        position =
          CURRENT_TIME_POSITION +
          (timeDiff / futureSeconds) * (100 - CURRENT_TIME_POSITION);
      }

      position = Math.max(0, Math.min(100, position));
      markers.push({ time: markerTime, position });

      markerTime += GRID_INTERVAL_SECONDS * 1000;
    }

    return markers;
  }, [currentTime, viewOffset]);

  // Navigation handlers
  const handleForward = () => {
    setViewOffset((prev) => prev + 30); // Move forward 30 seconds
  };

  const handleBack = () => {
    setViewOffset((prev) => prev - 30); // Move back 30 seconds
  };

  const handleReset = () => {
    setViewOffset(0); // Reset to live time
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-36 border-t border-orange-500/30 bg-gradient-to-t from-black/95 via-black/80 to-black/40 z-30 overflow-hidden">
      <div className="relative w-full h-full">
        {/* Background grid lines */}
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[0.5px] bg-orange-500/8"
              style={{ left: `${i * 10}%` }}
            />
          ))}
        </div>

        {/* Time markers flowing from right to left */}
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none z-20">
          {timeMarkers.map((marker, index) => {
            const isCurrentTime = Math.abs(marker.time - currentTime) < 1000;
            const isAtCurrentPosition =
              Math.abs(marker.position - CURRENT_TIME_POSITION) < 2;

            return (
              <div
                key={`marker-${index}-${marker.position}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${marker.position}%`,
                  top: 0,
                  bottom: 0,
                  transform: "translateX(-50%)",
                  width: "1px",
                }}
              >
                {/* Vertical grid line below live time */}
                <div
                  className={`absolute top-0 bottom-0 w-[0.5px] ${
                    isAtCurrentPosition
                      ? "bg-orange-500/40"
                      : "bg-orange-500/15"
                  }`}
                />
                {/* Time label - positioned in upper-middle area of timeline */}
                <div
                  className={`absolute text-[10px] font-mono ${
                    isCurrentTime
                      ? "text-orange-400 font-bold"
                      : "text-orange-400/90"
                  } bg-black/95 px-2 py-1 rounded border border-orange-500/40 whitespace-nowrap z-30`}
                  style={{
                    top: "20px",
                    textShadow:
                      "0 0 6px rgba(0, 0, 0, 1), 0 0 3px rgba(251, 146, 60, 0.5)",
                    minWidth: "65px",
                    textAlign: "center",
                    opacity: 1,
                  }}
                >
                  {formatTime(marker.time)}
                </div>
              </div>
            );
          })}
        </div>

        {/* NOW indicator with live time - aligned with price line at 30% of canvas */}
        <div
          className="absolute flex flex-col items-center z-50 pointer-events-none"
          style={{
            left: `calc(7rem + ${CURRENT_TIME_POSITION}% * (100% - 7rem))`,
            top: 0,
            transform: "translateX(-50%)",
          }}
        >
          {/* NOW text above the time line */}
          <div
            className="text-[10px] font-mono text-orange-400 font-bold bg-black/97 px-3 py-1.5 rounded-lg whitespace-nowrap mb-1"
            style={{ marginTop: "4px" }}
          >
            NOW
          </div>
          {/* Live time label - aligned with other time markers */}
          <div
            className="text-[10px] font-mono text-orange-400 font-bold bg-black/95 px-2 py-1 rounded border border-orange-500/40 whitespace-nowrap"
            style={{
              top: "20px",
              position: "absolute",
              textShadow:
                "0 0 6px rgba(0, 0, 0, 1), 0 0 3px rgba(251, 146, 60, 0.5)",
              minWidth: "65px",
              textAlign: "center",
            }}
          >
            {displayTime}
          </div>
        </div>

        {/* Navigation controls */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-40 pointer-events-auto">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 rounded-lg text-orange-400 text-[10px] font-mono font-semibold transition-colors"
            title="Go back 30 seconds"
          >
            ← BACK
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 rounded-lg text-orange-400 text-[10px] font-mono font-semibold transition-colors"
            title="Reset to live time"
            disabled={viewOffset === 0}
          >
            LIVE
          </button>
          <button
            onClick={handleForward}
            className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 rounded-lg text-orange-400 text-[10px] font-mono font-semibold transition-colors"
            title="Go forward 30 seconds"
          >
            FORWARD →
          </button>
        </div>
      </div>
    </div>
  );
}

// Timeline component for displaying time markers and labels
import { useMemo } from "react";

interface TimelineProps {
  currentTime: number;
}

interface TimelineMarker {
  id: string;
  timestamp: number;
}

// Constants
const TIME_WINDOW_SECONDS = 240; // 4 minutes
const MARKER_INTERVAL_SECONDS = 10;
const CURRENT_TIME_POSITION = 30; // Percentage from left
const AVAILABLE_SPACE = 70; // Percentage (30% to 100%)

// Helper functions
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function roundTo10Seconds(timestamp: number): number {
  const seconds = Math.floor(timestamp / 1000);
  return Math.floor(seconds / 10) * 10 * 1000;
}

function calculateMarkerPosition(
  markerTimestamp: number,
  currentTime: number
): number {
  const timeDiffSeconds = (markerTimestamp - currentTime) / 1000;
  return (
    CURRENT_TIME_POSITION +
    (timeDiffSeconds / TIME_WINDOW_SECONDS) * AVAILABLE_SPACE
  );
}

function generateMarkers(currentTime: number): TimelineMarker[] {
  const markers: TimelineMarker[] = [];
  const seen = new Set<number>();
  const baseTime = roundTo10Seconds(currentTime);

  // Generate markers at 10-second intervals
  for (
    let offset = -TIME_WINDOW_SECONDS;
    offset <= TIME_WINDOW_SECONDS;
    offset += MARKER_INTERVAL_SECONDS
  ) {
    const timestamp = baseTime + offset * 1000;
    if (!seen.has(timestamp)) {
      seen.add(timestamp);
      markers.push({
        id: `marker-${timestamp}`,
        timestamp,
      });
    }
  }

  return markers.sort((a, b) => a.timestamp - b.timestamp);
}

export function Timeline({ currentTime }: TimelineProps) {
  // Display time formatted from currentTime
  const displayTime = useMemo(
    () => formatTime(currentTime),
    [Math.floor(currentTime / 1000)]
  );

  // Generate timeline markers
  const markers = useMemo(
    () => generateMarkers(currentTime),
    [Math.floor(currentTime / 10000)]
  );

  // Calculate positions for visible markers
  const visibleMarkers = useMemo(() => {
    return markers
      .map((marker) => ({
        marker,
        position: calculateMarkerPosition(marker.timestamp, currentTime),
      }))
      .filter(({ position }) => position >= -10 && position <= 110);
  }, [markers, Math.floor(currentTime / 100)]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-36 border-t border-orange-500/30 bg-gradient-to-t from-black/95 via-black/80 to-black/40 overflow-hidden">
      <div className="relative w-full h-full px-0">
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

        {/* Timeline markers */}
        <div className="absolute top-0 left-0 right-0 h-full pb-16">
          {visibleMarkers.map(({ marker, position }) => (
            <div
              key={marker.id}
              className="absolute top-0 h-full flex flex-col items-center justify-start z-10"
              style={{
                left: `${position}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="w-[1px] h-6 bg-orange-500/60 transition-all duration-75" />
              <div className="mt-4 font-mono whitespace-nowrap z-20 tracking-wide text-[8px] text-orange-400/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                {formatTime(marker.timestamp)}
              </div>
            </div>
          ))}
        </div>

        {/* NOW indicator */}
        <div
          className="absolute top-0 h-full flex flex-col items-center justify-end z-30 pointer-events-none pb-2"
          style={{
            left: `${CURRENT_TIME_POSITION}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="mt-2.5 text-[10px] font-mono text-orange-400 font-bold bg-black/97 px-3 py-1.5 rounded-lg border border-orange-400/50 shadow-[0_0_16px_rgba(251,146,60,0.5)] whitespace-nowrap backdrop-blur-sm">
            NOW
          </div>
          <div className="text-[9px] font-mono text-orange-400/92 bg-black/88 px-2.5 py-1 rounded-md border border-orange-400/25 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.3)] mb-1">
            {displayTime}
          </div>
        </div>
      </div>
    </div>
  );
}

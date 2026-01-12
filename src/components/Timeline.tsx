// Timeline component for displaying time markers
import { useMemo } from "react";

interface TimelineProps {
  currentTime: number;
}

// Constants
const CURRENT_TIME_POSITION = 30; // Percentage from left

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

export function Timeline({ currentTime }: TimelineProps) {
  // Display time formatted from currentTime
  const displayTime = useMemo(
    () => formatTime(currentTime),
    [Math.floor(currentTime / 1000)]
  );


  return (
    <div className="absolute bottom-0 left-0 right-0 h-36 border-t border-orange-500/30 bg-gradient-to-t from-black/95 via-black/80 to-black/40 overflow-hidden">
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

        {/* NOW indicator */}
        <div
          className="absolute top-0 h-full flex flex-col items-center justify-end z-30 pointer-events-none pb-2"
          style={{
            left: `${CURRENT_TIME_POSITION}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="mt-2.5 text-[10px] font-mono text-orange-400 font-bold bg-black/97 px-3 py-1.5 rounded-lg whitespace-nowrap">
            NOW
          </div>
          <div className="text-[9px] font-mono text-orange-400/92 bg-black/88 px-2.5 py-1 rounded-md mb-1">
            {displayTime}
          </div>
        </div>
      </div>
    </div>
  );
}

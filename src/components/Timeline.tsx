// Timeline component for displaying time markers
import { useMemo, useState, useRef, useEffect } from "react";

interface TimelineProps {
  currentTime: number;
}

// Constants
const CURRENT_TIME_POSITION = 30; // Percentage from left (fixed NOW position)

// ============================================
// TIMELINE CONFIGURATION
// ============================================
// TIMELINE_POSITION_OFFSET: Fine-tune alignment with NOW indicator
//    - Adjusts horizontal position to match PriceCanvas NOW line exactly
const TIMELINE_POSITION_OFFSET = 0; // Pixels (aligned with canvas)

export function Timeline({
  currentTime: _currentTime,
}: TimelineProps) {
  const [containerWidth, setContainerWidth] = useState(1920);
  const containerRef = useRef<HTMLDivElement>(null);

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





  return (
    <div className="absolute bottom-8 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/98 to-black/95 backdrop-blur-xl border-t border-slate-800/40 z-30 overflow-hidden shadow-2xl rounded-t-lg border-b-0">
      <div ref={containerRef} className="relative w-full h-full">

        {/* NOW indicator - positioned higher up */}
        <div
          className="absolute bottom-0 pointer-events-none z-30 flex flex-col items-center"
          style={{
            left: `${nowPixelPosition}px`,
            transform: "translate3d(-50%, 0, 0)",
            width: "2px",
          }}
        >
          <div className="absolute bottom-0 w-[2px] h-full bg-orange-500 shadow-[0_0_8px_rgba(251,146,60,0.5)]" style={{ height: 'calc(100% - 40px)' }} />
          <div className="absolute bottom-[96px] bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-md text-[11px] font-mono font-bold text-orange-400 shadow-xl border border-orange-500/20">
            NOW
          </div>
        </div>
      </div>
    </div>
  );
}

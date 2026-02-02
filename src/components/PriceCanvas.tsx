// Canvas component for drawing price line
import { useEffect, useRef } from "react";

interface PricePoint {
  price: number;
  timestamp: number;
}

interface PriceCanvasProps {
  priceHistory: PricePoint[];
  currentPrice: number;
  currentTime: number;
  priceScale: {
    minPrice: number;
    maxPrice: number;
    priceRange: number;
  };
}

export function PriceCanvas({
  priceHistory,
  currentPrice,
  currentTime,
  priceScale,
}: PriceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationTimeRef = useRef<number>(0);
  const previousPriceRef = useRef<number>(currentPrice);
  const priceChangeAnimationRef = useRef<number>(0);
  // Smooth position interpolation for head point
  const smoothedXRef = useRef<number | null>(null);
  const smoothedYRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update animation time for smooth professional motion
      // Use consistent frame timing for smooth animation
      animationTimeRef.current += 0.016; // ~60fps - consistent timing

      // Detect price change and trigger wave animation
      if (Math.abs(currentPrice - previousPriceRef.current) > 0.01) {
        priceChangeAnimationRef.current = 0;
        previousPriceRef.current = currentPrice;
      }

      // Update price change animation - professional smooth transition
      if (priceChangeAnimationRef.current < 1) {
        priceChangeAnimationRef.current += 0.025; // Slower, more professional transition
        if (priceChangeAnimationRef.current > 1)
          priceChangeAnimationRef.current = 1;
      }

      // Draw grid lines
      ctx.strokeStyle = "rgba(251, 146, 60, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 15; i++) {
        const y = (canvas.height / 15) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center X position - 30% from left (matches Timeline CURRENT_TIME_POSITION)
      const priceLineX = canvas.width * 0.3;

      // Use fixed price scale from props (no auto-centering for betting blocks)
      const canvasMinPrice = priceScale.minPrice;
      const canvasPriceRange = priceScale.priceRange;

      const now = currentTime;
      const timeWindow = 240 * 1000; // 4 minutes
      const startTime = now - timeWindow;

      // Professional smooth movement - minimal floating for premium feel
      // Very subtle movement for professional appearance
      const floatOffset = Math.sin(animationTimeRef.current * 0.5) * 0.3; // Very subtle vertical float
      const floatOffsetX = Math.cos(animationTimeRef.current * 0.4) * 0.15; // Very subtle horizontal float

      // Smooth wave animation when price changes - professional easing
      const waveOffset =
        priceChangeAnimationRef.current < 1
          ? Math.sin(priceChangeAnimationRef.current * Math.PI) *
            0.8 * // Subtle wave effect
            (1 - priceChangeAnimationRef.current)
          : 0;

      // Calculate current price Y position
      const baseY =
        canvas.height -
        ((currentPrice - canvasMinPrice) / canvasPriceRange) * canvas.height;

      // Target position with animations
      const targetY = baseY + floatOffset + waveOffset;
      const targetX = priceLineX + floatOffsetX;

      // Initialize smoothed positions on first frame
      if (smoothedYRef.current === null || smoothedXRef.current === null) {
        smoothedYRef.current = targetY;
        smoothedXRef.current = targetX;
      }

      // Professional smooth interpolation for head point position (eliminates jitter)
      // Higher smoothing factor for ultra-smooth, professional movement
      const smoothingFactor = 0.15; // Lower = smoother, more professional (0.12-0.18 is optimal)
      smoothedYRef.current +=
        (targetY - smoothedYRef.current) * smoothingFactor;
      smoothedXRef.current +=
        (targetX - smoothedXRef.current) * smoothingFactor;

      const currentY = smoothedYRef.current;

      // Draw price line if we have history
      if (priceHistory.length > 0) {
        const pointsToDraw = priceHistory
          .filter((p) => p.timestamp >= startTime)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (pointsToDraw.length > 0) {
          // Draw price line - premium smooth and professional
          ctx.strokeStyle = "#F4C430";
          ctx.lineWidth = 2.5; // Slightly thicker for better visibility
          ctx.lineCap = "round"; // Smooth line caps
          ctx.lineJoin = "round"; // Smooth line joins
          ctx.shadowBlur = 0;
          ctx.beginPath();

          const firstPoint = pointsToDraw[0];
          const firstTimeDiff = (firstPoint.timestamp - now) / 1000;
          // Right-to-left flow: past points (negative timeDiff) go left, future points go right
          // Current time (0) stays at priceLineX (30% from left)
          // Older data flows from right (100%) to left (0%), passing through current position
          const firstX =
            priceLineX + (firstTimeDiff / 240) * (canvas.width - priceLineX);
          // Stable Y position - no wave
          const firstY =
            canvas.height -
            ((firstPoint.price - canvasMinPrice) / canvasPriceRange) *
              canvas.height;
          ctx.moveTo(firstX, firstY);

          // Draw smooth curve through all points - completely stable
          // Data flows from right to left: newer timestamps appear on right, older on left
          pointsToDraw.forEach((point, index) => {
            const timeDiff = (point.timestamp - now) / 1000;
            // Right-to-left positioning:
            // - Future points (positive timeDiff) appear to the right of current position
            // - Past points (negative timeDiff) appear to the left of current position
            // - As time progresses, all points shift left
            const x =
              priceLineX + (timeDiff / 240) * (canvas.width - priceLineX);

            // Stable Y position - no wave animations
            const y =
              canvas.height -
              ((point.price - canvasMinPrice) / canvasPriceRange) *
                canvas.height;

            if (index > 0) {
              const prevPoint = pointsToDraw[index - 1];
              const prevTimeDiff = (prevPoint.timestamp - now) / 1000;
              // Stable previous position
              const prevX =
                priceLineX + (prevTimeDiff / 240) * (canvas.width - priceLineX);
              const prevY =
                canvas.height -
                ((prevPoint.price - canvasMinPrice) / canvasPriceRange) *
                  canvas.height;

              // Professional smooth curve with better interpolation
              // Use weighted control points for smoother curves
              const t = 0.5; // Control point position (0.5 = midpoint)
              const controlX = prevX + (x - prevX) * t;
              const controlY = prevY + (y - prevY) * t;
              ctx.quadraticCurveTo(controlX, controlY, x, y);
            }
          });
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw yellow dot at starting point (head point) - smooth animations
          const startDotX = smoothedXRef.current;
          const startDotY = currentY;

          // Professional subtle pulsing glow - minimal and elegant
          const glowPulse = Math.sin(animationTimeRef.current * 1.0) * 1.0; // Very subtle pulse
          const shadowBlur = 6 + glowPulse; // Professional subtle glow

          // Professional subtle size pulse - minimal variation
          const sizePulse = Math.sin(animationTimeRef.current * 1.2) * 0.2; // Very subtle size variation
          const dotSize = 5.5 + sizePulse; // Slightly larger base size

          ctx.fillStyle = "#F4C430";
          ctx.shadowBlur = shadowBlur;
          ctx.shadowColor = "rgba(244, 196, 48, 0.7)";
          ctx.beginPath();
          ctx.arc(startDotX, startDotY, dotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw yellow dot at tail edge - STABLE, no animations
          const tailPoint = pointsToDraw[0];
          const tailTimeDiff = (tailPoint.timestamp - now) / 1000;
          // Stable tail position - no animations
          const tailX =
            priceLineX + (tailTimeDiff / 240) * (canvas.width - priceLineX);
          const tailY =
            canvas.height -
            ((tailPoint.price - canvasMinPrice) / canvasPriceRange) *
              canvas.height;

          // Static tail dot
          ctx.fillStyle = "#F4C430";
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(
            tailX,
            tailY,
            5, // Fixed size
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw reference lines - STABLE, no animations
        const referenceLineX = priceLineX; // No floatOffsetX
        const timeWindow = 240;
        const oneMinuteInSeconds = 60;
        // Reduce betting closed zone width by 20% (make it 80% of original)
        const originalOneMinuteLineX =
          priceLineX +
          (oneMinuteInSeconds / timeWindow) * (canvas.width - priceLineX);
        const zoneWidth = originalOneMinuteLineX - referenceLineX;
        const oneMinuteLineX = referenceLineX + zoneWidth * 0.8;

        // Draw fill between lines
        const leftLineX = Math.min(referenceLineX, oneMinuteLineX);
        const rightLineX = Math.max(referenceLineX, oneMinuteLineX);
        const fillWidth = rightLineX - leftLineX;
        ctx.fillStyle = "rgba(255, 165, 0, 0.05)";
        ctx.fillRect(leftLineX, 0, fillWidth, canvas.height);

        // Draw "betting closed" text - friendlier message
        const textX = leftLineX + fillWidth / 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.strokeText("Betting closed for this round", textX, 12);
        ctx.fillStyle = "rgba(255, 165, 0, 0.75)";
        ctx.fillText("Betting closed for this round", textX, 12);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";

        // Draw first vertical reference line
        ctx.strokeStyle = "rgba(251, 146, 60, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(referenceLineX, 0);
        ctx.lineTo(referenceLineX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw second vertical reference line
        ctx.strokeStyle = "rgba(251, 146, 60, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(oneMinuteLineX, 0);
        ctx.lineTo(oneMinuteLineX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw current price indicator - smooth animations
        const indicatorX = smoothedXRef.current;
        const indicatorY = currentY;

        // Clean indicator without excessive glow
        const pulseSize = 5;

        ctx.fillStyle = "#F4C430";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, pulseSize, 0, Math.PI * 2);
        ctx.fill();

          // Horizontal line - clean
          const lineWave = 0;
        ctx.strokeStyle = "#F4C430";
        ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(indicatorX - 15, indicatorY + lineWave);
        ctx.lineTo(indicatorX + 15, indicatorY + lineWave);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    };

    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [priceHistory, currentPrice, priceScale, currentTime]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ 
        imageRendering: "crisp-edges",
        pointerEvents: "none" // Allow mouse events to pass through to parent
      }}
    />
  );
}

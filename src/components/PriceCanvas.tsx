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

      // Update animation time for floating effect - slower for smoother motion
      animationTimeRef.current += 0.016; // ~60fps

      // Detect price change and trigger wave animation
      if (Math.abs(currentPrice - previousPriceRef.current) > 0.01) {
        priceChangeAnimationRef.current = 0;
        previousPriceRef.current = currentPrice;
      }

      // Update price change animation - smoother transition
      if (priceChangeAnimationRef.current < 1) {
        priceChangeAnimationRef.current += 0.03; // Slower transition
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

      // Center X position - 35% from left
      const priceLineX = canvas.width * 0.35;

      // Calculate price scale for canvas drawing
      const roundedCurrentPrice = Math.round(currentPrice / 10) * 10;
      const numIncrements = 7;
      const canvasMinPrice = roundedCurrentPrice - numIncrements * 10;
      const canvasMaxPrice = roundedCurrentPrice + numIncrements * 10;
      const canvasPriceRange = canvasMaxPrice - canvasMinPrice;

      const now = currentTime;
      const timeWindow = 240 * 1000; // 4 minutes
      const startTime = now - timeWindow;

      // Smooth floating animation - slower and gentler
      // Use slower frequencies and smaller amplitudes for smooth flow
      const floatOffset = Math.sin(animationTimeRef.current * 0.8) * 0.6; // Reduced from 2*1.5 to 0.8*0.6
      const floatOffsetX = Math.cos(animationTimeRef.current * 0.6) * 0.3; // Reduced from 1.5*0.8 to 0.6*0.3

      // Wave animation when price changes - smoother easing
      const waveOffset =
        priceChangeAnimationRef.current < 1
          ? Math.sin(priceChangeAnimationRef.current * Math.PI) *
            1.5 * // Reduced from 3 to 1.5
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

      // Smooth interpolation for head point position (reduces jitter)
      const smoothingFactor = 0.2; // Lower = smoother but slower response (0.15-0.25 is good)
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
          // Draw price line - STABLE, no wave or shake animations
          ctx.strokeStyle = "#F4C430";
          ctx.lineWidth = 2;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(244, 196, 48, 0.4)";
          ctx.beginPath();

          const firstPoint = pointsToDraw[0];
          const firstTimeDiff = (firstPoint.timestamp - now) / 1000;
          // Stable X position - no floatOffsetX
          const firstX =
            priceLineX + (firstTimeDiff / 240) * (canvas.width - priceLineX);
          // Stable Y position - no wave
          const firstY =
            canvas.height -
            ((firstPoint.price - canvasMinPrice) / canvasPriceRange) *
              canvas.height;
          ctx.moveTo(firstX, firstY);

          // Draw smooth curve through all points - completely stable
          pointsToDraw.forEach((point, index) => {
            const timeDiff = (point.timestamp - now) / 1000;
            // Stable X position - no animations
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

              // Smooth curve control point
              const controlX = (prevX + x) / 2;
              const controlY = (prevY + y) / 2;
              ctx.quadraticCurveTo(controlX, controlY, x, y);
            }
          });
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw yellow dot at starting point (head point) - smooth animations
          const startDotX = smoothedXRef.current;
          const startDotY = currentY;

          // Smooth pulsing glow - slower and gentler
          const glowPulse = Math.sin(animationTimeRef.current * 1.2) * 1.5; // Reduced from 3*2 to 1.2*1.5
          const shadowBlur = 8 + glowPulse; // Reduced base from 10 to 8

          // Smooth size pulse - slower and smaller
          const sizePulse = Math.sin(animationTimeRef.current * 1.5) * 0.3; // Reduced from 4*0.5 to 1.5*0.3
          const dotSize = 5 + sizePulse;

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

          // Static tail dot - no pulsing
          ctx.fillStyle = "#F4C430";
          ctx.shadowBlur = 6;
          ctx.shadowColor = "rgba(244, 196, 48, 0.6)";
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
        const oneMinuteLineX =
          priceLineX +
          (oneMinuteInSeconds / timeWindow) * (canvas.width - priceLineX);

        // Draw fill between lines
        const leftLineX = Math.min(referenceLineX, oneMinuteLineX);
        const rightLineX = Math.max(referenceLineX, oneMinuteLineX);
        const fillWidth = rightLineX - leftLineX;
        ctx.fillStyle = "rgba(255, 165, 0, 0.05)";
        ctx.fillRect(leftLineX, 0, fillWidth, canvas.height);

        // Draw "no bets allowed" text
        const textX = leftLineX + fillWidth / 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.strokeText("no bets allowed", textX, 12);
        ctx.fillStyle = "rgba(255, 165, 0, 0.95)";
        ctx.fillText("no bets allowed", textX, 12);
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

        // Smooth pulsing glow - slower frequency
        const pulseGlow = 7 + Math.sin(animationTimeRef.current * 1.0) * 2; // Reduced from 3.5*3 to 1.0*2
        const pulseSize = 5 + Math.sin(animationTimeRef.current * 1.2) * 0.4; // Reduced from 4*0.6 to 1.2*0.4

        ctx.fillStyle = "#F4C430";
        ctx.shadowBlur = pulseGlow;
        ctx.shadowColor = "rgba(244, 196, 48, 0.7)";
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Horizontal line - smooth wave
        const lineWave = Math.sin(animationTimeRef.current * 1.0) * 0.3; // Reduced from 2.5*0.5 to 1.0*0.3
        ctx.strokeStyle = "#F4C430";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 2;
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
      style={{ imageRendering: "crisp-edges" }}
    />
  );
}

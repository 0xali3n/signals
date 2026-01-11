// Hook for calculating price scale based on price history
import { useState, useEffect } from 'react';

interface PricePoint {
  price: number;
  timestamp: number;
}

interface PriceScale {
  minPrice: number;
  maxPrice: number;
  priceRange: number;
}

export function usePriceScale(
  priceHistory: PricePoint[],
  currentPrice: number,
  targetPrice: number
): PriceScale {
  const [priceScale, setPriceScale] = useState<PriceScale>({
    minPrice: targetPrice * 0.995,
    maxPrice: targetPrice * 1.005,
    priceRange: targetPrice * 0.01,
  });

  useEffect(() => {
    const now = Date.now();
    const timeWindow = 240 * 1000; // 4 minutes
    const windowStart = now - timeWindow;

    // Filter to only prices within the visible time window
    const visiblePrices = priceHistory
      .filter((p) => p.timestamp >= windowStart)
      .map((p) => p.price);

    let minPrice: number;
    let maxPrice: number;
    let priceRange: number;

    // Always center around current price
    if (visiblePrices.length > 1) {
      const historyMin = Math.min(...visiblePrices);
      const historyMax = Math.max(...visiblePrices);
      const historyRange = historyMax - historyMin;

      const maxZoomRange = currentPrice * 0.006; // 0.6% max
      const minZoomRange = currentPrice * 0.002; // 0.2% min

      const targetRange =
        historyRange > 0
          ? Math.max(Math.min(historyRange * 1.2, maxZoomRange), minZoomRange)
          : minZoomRange;

      minPrice = currentPrice - targetRange / 2;
      maxPrice = currentPrice + targetRange / 2;
      priceRange = targetRange;
    } else {
      // Fallback: tight zoom around current price
      const padding = currentPrice * 0.003;
      minPrice = currentPrice - padding;
      maxPrice = currentPrice + padding;
      priceRange = maxPrice - minPrice;
    }

    setPriceScale({ minPrice, maxPrice, priceRange });
  }, [priceHistory, currentPrice, targetPrice]);

  return priceScale;
}


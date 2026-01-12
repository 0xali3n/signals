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
  _priceHistory: PricePoint[],
  _currentPrice: number,
  targetPrice: number
): PriceScale {
  const [priceScale, setPriceScale] = useState<PriceScale>({
    minPrice: targetPrice * 0.995,
    maxPrice: targetPrice * 1.005,
    priceRange: targetPrice * 0.01,
  });

  useEffect(() => {
    // Fixed price range - no auto-rebalancing for betting blocks
    // Use $10 increments with 7 levels above and below (15 total levels)
    // This ensures boxes stay aligned with price levels
    const roundedTargetPrice = Math.round(targetPrice / 10) * 10;
    const numIncrements = 7;
    const priceIncrement = 10;
    
    // Fixed range based on target price (initial price)
    const minPrice = roundedTargetPrice - numIncrements * priceIncrement;
    const maxPrice = roundedTargetPrice + numIncrements * priceIncrement;
    const priceRange = maxPrice - minPrice;

    setPriceScale({ minPrice, maxPrice, priceRange });
  }, [targetPrice]); // Only depend on targetPrice, not currentPrice

  return priceScale;
}


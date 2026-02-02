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
    // Optimized price range - increased buffer to prevent price line going out of bounds
    // Display 15 rows but use larger range for calculations
    // Use $10 increments with 15 levels above and below (30 total levels for buffer)
    // This gives a $300 range which is better for BTC volatility while keeping display clean
    const roundedTargetPrice = Math.round(targetPrice / 10) * 10;
    const numIncrements = 15; // 15 increments = $300 range (better than $140, but not too large)
    const priceIncrement = 10;
    
    // Fixed range based on target price (initial price)
    // Range: $300 (15 levels × $10 × 2 = $300) - good balance
    const minPrice = roundedTargetPrice - numIncrements * priceIncrement;
    const maxPrice = roundedTargetPrice + numIncrements * priceIncrement;
    const priceRange = maxPrice - minPrice;

    setPriceScale({ minPrice, maxPrice, priceRange });
  }, [targetPrice]); // Only depend on targetPrice, not currentPrice

  return priceScale;
}


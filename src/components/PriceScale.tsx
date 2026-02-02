// Price scale component for left side display
interface PriceScaleProps {
  currentPrice: number;
  targetPrice?: number;
  panY?: number;
}

export function PriceScale({ currentPrice, targetPrice, panY = 0 }: PriceScaleProps) {
  const basePrice = (targetPrice ?? currentPrice) + panY;
  const priceIncrement = 10;
  const numIncrements = 7; // 7 increments = 15 visible price levels
  const startPrice = basePrice - numIncrements * priceIncrement;

  // Generate prices
  const prices: number[] = [];
  for (let i = 0; i <= numIncrements * 2; i++) {
    const price = startPrice + i * priceIncrement;
    const roundedPrice = Math.round(price / priceIncrement) * priceIncrement;
    prices.push(roundedPrice);
  }

  // Reverse to show highest at top
  prices.reverse();

  return (
    <div className="absolute left-0 top-0 bottom-36 w-28 flex flex-col justify-between py-10 z-10 pl-3">
      {prices.map((price, i) => (
        <div
          key={i}
          className="text-[10px] font-mono text-orange-400/80 tracking-tight mb-1"
          style={{ lineHeight: '1.2' }}
        >
          ${price.toLocaleString(undefined, { maximumFractionDigits: priceIncrement < 1 ? 1 : 0 })}
        </div>
      ))}
    </div>
  );
}


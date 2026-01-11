// Price scale component for left side display
interface PriceScaleProps {
  currentPrice: number;
}

export function PriceScale({ currentPrice }: PriceScaleProps) {
  // Calculate price scale with $10 increments
  const roundedCurrentPrice = Math.round(currentPrice / 10) * 10;
  const numIncrements = 7; // 7 increments above and below = 15 total sections
  const startPrice = roundedCurrentPrice - numIncrements * 10;

  // Generate prices with $10 gaps
  const prices: number[] = [];
  for (let i = 0; i <= numIncrements * 2; i++) {
    const price = startPrice + i * 10;
    const roundedPrice = Math.round(price / 10) * 10;
    prices.push(roundedPrice);
  }

  // Reverse to show highest at top
  prices.reverse();

  return (
    <div className="absolute left-0 top-0 bottom-36 w-28 flex flex-col justify-between py-10 z-10 pl-3">
      {prices.map((price, i) => (
        <div
          key={i}
          className="text-[10px] font-mono text-orange-400/90 tracking-tight mb-1"
          style={{ lineHeight: '1.2' }}
        >
          ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      ))}
    </div>
  );
}


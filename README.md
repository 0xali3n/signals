# Signals - Real-Time Crypto Prediction Game

A real-time crypto prediction game built on **Linera Conway Testnet** for the Akindo Wave Hacks (Wave-5 MVP).

## 🎯 Product

Users predict whether BTC price will be **ABOVE** or **BELOW** a target price at a fixed time. Users stake test tokens, and the total pooled amount is distributed to winners.

## 🚀 Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Blockchain**: Linera Conway Testnet
- **Wallet**: Embedded wallet using Linera Web Client
- **Client**: `@linera/client` v0.15.8
- **State Management**: Zustand
- **Real-time Data**: Binance WebSocket API for BTC price

## ✅ Completed Features

### Wallet System

- ✅ **Embedded Wallet**: Keypair generated using `PrivateKey.createRandom()` from Linera Web Client
- ✅ **Faucet Integration**: Automatic wallet creation and chain claiming from Conway Testnet faucet
- ✅ **Microchain Claiming**: Each user gets their own microchain with test tokens
- ✅ **Wallet Storage**: Private keys stored in localStorage (browser-only)
- ✅ **Wallet Import/Export**: Full wallet backup with chainId preservation
- ✅ **Progress UI**: Step-by-step wallet creation progress display

### Game Interface

- ✅ **Real-time Price Chart**: Live BTC price visualization with smooth animations
- ✅ **Price Canvas**: Interactive canvas showing price history with stable, smooth line rendering
- ✅ **Timeline Component**: Scrolling timeline with time markers and "NOW" indicator
- ✅ **Price Scale**: Left-side price scale with $10 increments, fixed range based on initial live price
- ✅ **Betting Blocks**: Interactive rectangular boxes (betting blocks) that move right to left
  - ✅ **Box Grid**: 15 rows of betting blocks aligned with price levels ($10 increments)
  - ✅ **Movement**: Smooth right-to-left scrolling synchronized with timeline
  - ✅ **Vanishing Logic**: Boxes disappear instantly when left edge touches live price line
  - ✅ **Spacing**: Proper spacing maintained (85% of timeline spacing) to prevent overlap
  - ✅ **Interactive**: Clickable boxes with hover effects (scale, glow, border highlight)
  - ✅ **Price Mapping**: Each box row mapped to specific price level for betting logic
- ✅ **Fixed Price Scale**: Price scale centered on initial live price from Binance (no auto-rebalancing)
  - ✅ **Initial Price Fetch**: Fetches live BTC price from Binance REST API on page load/refresh
  - ✅ **Fixed Range**: ±$70 range ($10 increments, 7 levels above/below) centered on initial price
  - ✅ **Alignment**: Ensures betting blocks align correctly with price levels
- ✅ **Betting Panel**: Integrated betting interface with claim rewards functionality
- ✅ **HUD Elements**: Current price display with Binance badge, user bet status
- ✅ **Live Price Line**: Vertical dashed line at 30% from left showing current time/price position

### UI Components

- ✅ **Header**: Displays wallet address, chainId, and quick actions (export/disconnect) with responsive design
- ✅ **Wallet Setup**: Creation and import interface with file upload
- ✅ **Wallet Created**: Success screen after wallet creation
- ✅ **Wallet Creation Progress**: Step-by-step progress UI with real-time status
- ✅ **GameView**: Main game interface with modular components

### Code Quality & Performance

- ✅ **Modular Architecture**: Separated concerns with dedicated hooks and components
- ✅ **Optimized Animations**: Smooth, stable price line with animated head point only
- ✅ **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- ✅ **Performance**: Optimized canvas rendering, memoized calculations, efficient state management
- ✅ **Clean Code**: Removed unused code, fixed bugs, consistent styling

### Integration

- ✅ **Linera Web Client**: Using `@linera/client` v0.15.8
- ✅ **Faucet Connection**: Connected to `https://faucet.testnet-conway.linera.net`
- ✅ **Chain Management**: Microchain ID stored and displayed
- ✅ **State Management**: Zustand for persistent wallet state
- ✅ **Real-time Price**: Binance WebSocket for live BTC/USDT price updates
- ✅ **Initial Price Fetch**: Binance REST API (`/api/v3/ticker/price?symbol=BTCUSDT`) for initial price on load

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 🧱 Project Structure

```
src/
├── components/
│   ├── Header.tsx                  # Wallet display & actions
│   ├── WalletSetup.tsx             # Wallet creation/import
│   ├── WalletCreated.tsx           # Success screen
│   ├── WalletCreationProgress.tsx   # Creation progress UI
│   ├── GameView.tsx                # Main game interface
│   ├── PriceCanvas.tsx              # Canvas for price line rendering
│   ├── PriceScale.tsx               # Left-side price scale
│   ├── Timeline.tsx                 # Time markers and scrolling timeline
│   └── BettingPanel.tsx             # Betting interface
├── hooks/
│   ├── useMarket.ts                 # Market state and betting logic
│   ├── usePriceScale.ts             # Price scale calculations
│   ├── useLiveTime.ts               # Live time display
│   └── useAnimationFrame.ts        # Animation frame utilities
├── store/
│   └── walletStore.ts               # Zustand wallet state
├── utils/
│   ├── wallet.ts                    # Wallet operations
│   ├── lineraClient.ts              # Linera client utilities
│   └── btcPrice.ts                  # Binance WebSocket price feed
└── types/
    └── index.ts                      # TypeScript types
```

## 🔐 Wallet Features

- **Generation**: `PrivateKey.createRandom()` from Linera Web Client
- **Faucet**: Automatic chain claiming with test tokens
- **Storage**: localStorage (browser-only, no server)
- **Import/Export**: Full wallet backup including microchain ID
- **Verification**: Address validated against private key
- **Progress UI**: Real-time step-by-step wallet creation feedback

## 🎮 Game Mechanics

### Betting Blocks System

- **Box Grid**: 15 horizontal rows of betting blocks, each row representing a $10 price increment
- **Price Levels**: Each box is mapped to a specific price level (stored in `data-price-level` attribute)
- **Movement**: Boxes scroll smoothly from right to left at 2 pixels/second
- **Vanishing**: Boxes disappear instantly when their left edge touches the live price line
- **Spacing**: Boxes maintain proper spacing (85% of 110px = ~93.5px width) to prevent overlap
- **Interactivity**: 
  - Hover effects: Scale up, brighter border, enhanced glow
  - Clickable: Ready for betting logic integration
  - Visual feedback: Gradient opacity based on distance from live price line

### Price Scale System

- **Fixed Range**: Price scale is fixed based on initial live price from Binance
- **No Auto-rebalancing**: Scale stays centered on initial price to ensure betting blocks align correctly
- **Price Levels**: 15 levels total (±$70 from center, $10 increments)
- **Initialization**: Fetches live price on page load/refresh and centers scale on that price
- **Alignment**: Betting blocks perfectly align with price scale levels

### Timeline & Movement

- **Smooth Scrolling**: Uses `requestAnimationFrame` for 60fps smooth movement
- **Time Markers**: Generated at 60-second intervals
- **Live Price Line**: Vertical dashed line at 30% from left showing current time position
- **No Bets Zone**: Area between live price line and 1-minute future line (no betting allowed)
- **Synchronization**: All boxes move in sync with timeline scroll offset

## ⚠️ Known Limitations

- **Balance Display**: Temporarily removed due to validator URL configuration issues in the Linera client library. The Wallet instance from the faucet appears to have a hardcoded validator URL that overrides client options. Balance functionality will be re-enabled once the library issue is resolved or a workaround is found.
- **Contract Integration**: Currently using mock market data. Linera contract integration is pending.

## 🚧 Next Steps

- Build Linera Rust contract for prediction market
- Deploy contract to Conway Testnet
- Connect frontend to contract for on-chain betting
- Implement transaction signing with Linera client
- Re-enable balance display (once validator URL issue is resolved)

## 🔗 Resources

- [Linera Documentation](https://linera.dev/docs/)
- [Conway Testnet](https://linera.dev/networks/conway.html)

## 📄 License

MIT

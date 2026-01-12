# Signals - Real-Time Crypto Prediction Game

A real-time crypto prediction game built on **Linera Conway Testnet** for the Akindo Wave Hacks (Wave-5 MVP).

## 🎯 Product

Users select betting blocks representing specific price levels. Each block requires **100 tokens** to bet. When the live price line hits a selected block, users win and share the **column pool** equally. All bets and rewards are managed on-chain via Linera smart contracts.

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
- ✅ **Betting Blocks System**: Interactive betting blocks with selection, movement, and visual feedback
  - ✅ **Box Grid**: 15 rows aligned with price levels ($10 increments)
  - ✅ **Selection**: Up to 3 boxes per column, click to toggle
  - ✅ **Visual States**: Normal, Selected (check icon + glow), No Bets Zone (greyed out), Max Selections (dimmed)
  - ✅ **Price Display**: Each box shows its price level
  - ✅ **Movement**: Smooth right-to-left scrolling (hardware-accelerated)
  - ✅ **Vanishing**: Disappears instantly when left edge touches live price line
  - ✅ **Error Handling**: Error message when exceeding 3 selections per column
- ✅ **Blast Animation System**: Professional hit detection and visual feedback
  - ✅ **Individual Box Blasting**: Only the specific box hit by live price line blasts (not entire column)
  - ✅ **Color-Coded Blasts**:
    - 🟢 **Green Blast**: Selected box hit (win)
    - 🔴 **Red Blast**: Non-selected box hit in column where user played (lose)
    - 🟠 **Orange Blast**: Box hit in column where user hasn't played (neutral)
  - ✅ **Animation Effects**: Shake, scale, rotation, crack patterns, multi-layer glow
  - ✅ **Smooth Animation**: 120ms duration with cubic ease-out easing for smooth feel
  - ✅ **Crack Patterns**: SVG crack overlays with color matching win/lose state
- ✅ **Win/Lose Detection**: Conditional notifications (only if user has selected boxes in that column)
  - ✅ **Popups**: Bounce animation, gradient backgrounds, pulsing icons, auto-dismiss (2.5s)
  - ✅ **Visual Feedback**: Color-coded borders, backgrounds, and glows
- ✅ **Fixed Price Scale**: Centered on initial live price from Binance (no auto-rebalancing)
  - ✅ **Initial Price Fetch**: Fetches live BTC price from Binance REST API on load/refresh
  - ✅ **Fixed Range**: ±$70 range ($10 increments, 15 levels total)
- ✅ **Betting Panel**: Integrated betting interface with claim rewards functionality
- ✅ **HUD Elements**: Current price display with BTC/USDT and Binance badges, user bet status
- ✅ **Live Price Line**: Vertical dashed line at 30% from left showing current time/price position
  - ✅ **Pulse Animation**: Price line pulses/shakes when hitting boxes
  - ✅ **Enhanced Glow**: Dynamic glow effects on impact
- ✅ **Game Info Popup**: "How to Play" information accessible via info button in header
  - ✅ **Responsive Design**: Mobile-optimized with proper sizing and spacing
  - ✅ **Professional Layout**: Card-based step-by-step guide explaining game mechanics

### UI Components

- ✅ **Header**:
  - Displays wallet address, chainId, and quick actions (export/disconnect)
  - Game info button with "How to Play" popup
  - View Details popup with click-outside-to-close functionality
  - Fully responsive design
- ✅ **Wallet Setup**: Creation and import interface with file upload
- ✅ **Wallet Created**: Success screen after wallet creation
- ✅ **Wallet Creation Progress**: Step-by-step progress UI with real-time status
- ✅ **GameView**: Main game interface with modular components

### Code Quality & Performance

- ✅ **Modular Architecture**: Separated concerns with dedicated hooks and components
- ✅ **Optimized Animations**: Smooth, stable price line with animated head point only
- ✅ **Performance Optimizations**:
  - ✅ **Memoized Lookups**: O(1) Map-based selection checks instead of O(n) array searches
  - ✅ **Hardware Acceleration**: GPU-accelerated transforms using `translate3d`
  - ✅ **Throttled Updates**: 30fps throttled time updates for optimal performance
  - ✅ **Optimized Blast Detection**: Only checks markers near live price line (filtered before loop)
  - ✅ **Early Exit Optimization**: Boxes way past the line are filtered out early
  - ✅ **Optimized Event Handlers**: `useCallback` and refs to avoid dependency issues
  - ✅ **Efficient State Management**: Minimal re-renders with proper memoization
  - ✅ **Smooth Transitions**: Cubic-bezier easing with reduced durations (0.12s)
  - ✅ **Performance.now()**: Used for smoother animation timing
- ✅ **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- ✅ **Clean Code**: Removed unused code, fixed bugs, consistent styling
- ✅ **Professional UI**: Clean, minimal, aesthetic design with smooth animations

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

### How to Play

1. **Select Blocks**: Click betting blocks to select (max 3 per column). Each block = one price level.
2. **Place Bet**: 100 tokens per block. Added to column pool. Multiple users can bet.
3. **Watch & Win**: Live price line moves right to left. When it hits your block → You Win!
4. **Rewards**: Winners share the column pool equally. Distributed via Linera smart contract.

### Key Features

- **Betting Blocks**: 15 rows, each row = $10 price increment. Up to 3 selections per column.
- **Blast Animation**: 120ms smooth animation when live price hits a box. Color-coded: 🟢 Green (win), 🔴 Red (lose), 🟠 Orange (neutral).
- **Win/Lose System**: Conditional notifications (only if user has selected boxes). Professional popups with bounce animation.
- **Price Scale**: Fixed range centered on initial Binance price (±$70, $10 increments). No auto-rebalancing.
- **Timeline**: Smooth scrolling with 30fps throttled updates. Live price line at 30% from left with pulse animation.

## 🎨 UI/UX Features

- ✅ **Professional Design**: Clean, minimal, aesthetic interface
- ✅ **Smooth Animations**: Hardware-accelerated transforms, optimized transitions
- ✅ **Visual Feedback**: Clear selection states, hover effects, loading states
- ✅ **Error Handling**: User-friendly error messages with auto-dismiss
- ✅ **Info System**:
  - Footer notes explaining game rules
  - "How to Play" popup in header with step-by-step guide
  - Responsive popup positioning and sizing
- ✅ **Gamified Elements**:
  - Bounce animations for win/lose popups
  - Pulsing icon effects
  - Multi-layer glow effects
  - Color-coded feedback system
- ✅ **Performance**: Optimized for smooth gameplay (30fps throttling, optimized blast detection, early exit filters)

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

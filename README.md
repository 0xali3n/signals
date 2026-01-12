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
- ✅ **Betting Blocks System**: Advanced interactive betting block system
  - ✅ **Box Grid**: 15 rows of betting blocks aligned with price levels ($10 increments)
  - ✅ **Movement**: Smooth right-to-left scrolling synchronized with timeline (hardware-accelerated)
  - ✅ **Box Selection**: Users can select up to 3 boxes per column (same timestamp)
  - ✅ **Toggle Selection**: Click to select/unselect boxes with visual feedback
  - ✅ **Selection State**: Clear visual indicators (check icon, glow, scale-up) for selected boxes
  - ✅ **Price Display**: Each box displays its price level inside
  - ✅ **Vanishing Logic**: Boxes disappear instantly when left edge touches live price line
  - ✅ **Spacing**: Proper spacing maintained (85% of timeline spacing) to prevent overlap
  - ✅ **Interactive**: Clickable boxes with professional hover effects
  - ✅ **No Bets Zone**: Visual distinction for boxes in "no bets allowed" zone (greyed out, disabled)
  - ✅ **Max Selection Limit**: Visual feedback when column reaches 3 selections (dimmed, not-allowed cursor)
  - ✅ **Error Handling**: Error message when trying to select more than 3 boxes per column
- ✅ **Blast Animation System**: Professional hit detection and visual feedback
  - ✅ **Individual Box Blasting**: Only the specific box hit by live price line blasts (not entire column)
  - ✅ **Color-Coded Blasts**: 
    - 🟢 **Green Blast**: Selected box hit (win)
    - 🔴 **Red Blast**: Non-selected box hit in column where user played (lose)
    - 🟠 **Orange Blast**: Box hit in column where user hasn't played (neutral)
  - ✅ **Animation Effects**: Shake, scale, rotation, crack patterns, multi-layer glow
  - ✅ **Fast Duration**: 120ms blast animation for snappy feel
  - ✅ **Crack Patterns**: SVG crack overlays with color matching win/lose state
- ✅ **Win/Lose Detection**: Intelligent game result system
  - ✅ **Conditional Notifications**: Only shows win/lose popup if user has selected boxes in that column
  - ✅ **Professional Popups**: 
    - Bounce animation with rotation
    - Gradient backgrounds with glow effects
    - Pulsing icon animations
    - Auto-dismiss after 2.5 seconds
  - ✅ **Visual Feedback**: Color-coded borders, backgrounds, and glows based on result
- ✅ **Fixed Price Scale**: Price scale centered on initial live price from Binance (no auto-rebalancing)
  - ✅ **Initial Price Fetch**: Fetches live BTC price from Binance REST API on page load/refresh
  - ✅ **Fixed Range**: ±$70 range ($10 increments, 7 levels above/below) centered on initial price
  - ✅ **Alignment**: Ensures betting blocks align correctly with price levels
- ✅ **Betting Panel**: Integrated betting interface with claim rewards functionality
- ✅ **HUD Elements**: Current price display with Binance badge, user bet status
- ✅ **Live Price Line**: Vertical dashed line at 30% from left showing current time/price position
  - ✅ **Pulse Animation**: Price line pulses/shakes when hitting boxes
  - ✅ **Enhanced Glow**: Dynamic glow effects on impact

### UI Components

- ✅ **Header**: Displays wallet address, chainId, and quick actions (export/disconnect) with responsive design
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
  - ✅ **Throttled Updates**: 60fps throttled time updates to prevent excessive re-renders
  - ✅ **Optimized Event Handlers**: `useCallback` for stable function references
  - ✅ **Efficient State Management**: Minimal re-renders with proper memoization
  - ✅ **Smooth Transitions**: Cubic-bezier easing for professional feel
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

### Betting Blocks System

- **Box Grid**: 15 horizontal rows of betting blocks, each row representing a $10 price increment
- **Price Levels**: Each box is mapped to a specific price level (stored in `data-price-level` attribute)
- **Price Display**: Each box displays its price level inside (e.g., "$90,730")
- **Movement**: Boxes scroll smoothly from right to left at 2 pixels/second (hardware-accelerated)
- **Selection System**:
  - Users can select up to **3 boxes per column** (same timestamp)
  - Click to toggle selection (select/unselect)
  - Clear visual feedback: check icon, glow, subtle scale-up
  - Error message when trying to exceed limit
  - Footer note explaining the limit
- **Vanishing**: Boxes disappear instantly when their left edge touches the live price line
- **Spacing**: Boxes maintain proper spacing (85% of 110px = ~93.5px width) to prevent overlap
- **Interactivity**: 
  - Professional hover effects: subtle scale, enhanced glow
  - Clickable with smooth transitions
  - Visual feedback: Gradient opacity based on distance from live price line
  - Disabled state for "no bets allowed" zone (greyed out, not-allowed cursor)
- **Visual States**:
  - **Normal**: Standard orange glow with distance-based opacity
  - **Selected**: Enhanced glow, check icon, "SELECTED" label, ring border
  - **No Bets Zone**: Greyed out (40% opacity), subtle glow, disabled
  - **Max Selections**: Dimmed when column has 3 selections

### Blast Animation System

- **Hit Detection**: Detects when live price line touches a box (8px threshold)
- **Individual Box Blasting**: Only the specific box that gets hit blasts (not entire column)
- **Fast Animation**: 120ms duration for snappy, responsive feel
- **Color-Coded Feedback**:
  - 🟢 **Green Blast** (Win): When a selected box is hit
    - Green glow, green crack patterns, green borders
    - Multi-layer green shadow effects
  - 🔴 **Red Blast** (Lose): When a non-selected box is hit in a column where user played
    - Red glow, red crack patterns, red borders
    - Multi-layer red shadow effects
  - 🟠 **Orange Blast** (Neutral): When a box is hit in a column where user hasn't played
    - Orange glow, orange crack patterns
    - No win/lose notification shown
- **Animation Effects**:
  - Shake effect (horizontal movement)
  - Scale animation (slight grow then shrink)
  - Rotation effect (subtle spin)
  - Crack pattern overlay (SVG-based)
  - Multi-layer glow effects
  - Opacity fade-out
- **Price Line Pulse**: Live price line pulses/shakes with enhanced glow when hitting boxes

### Win/Lose Detection

- **Conditional Logic**: Only shows notifications if user has selected boxes in that column
- **Win Condition**: Selected box gets hit by live price line → Green blast + "You Win!" popup
- **Lose Condition**: Non-selected box gets hit in column where user played → Red blast + "You Lose" popup
- **Neutral**: Box hit in column where user hasn't played → Orange blast only (no popup)
- **Professional Popups**:
  - Bounce animation with rotation effect
  - Gradient backgrounds (green/red)
  - Pulsing icon glow
  - Enhanced shadows and backdrop blur
  - Large, bold text with glow effects
  - Auto-dismiss after 2.5 seconds

### Price Scale System

- **Fixed Range**: Price scale is fixed based on initial live price from Binance
- **No Auto-rebalancing**: Scale stays centered on initial price to ensure betting blocks align correctly
- **Price Levels**: 15 levels total (±$70 from center, $10 increments)
- **Initialization**: Fetches live price on page load/refresh and centers scale on that price
- **Alignment**: Betting blocks perfectly align with price scale levels

### Timeline & Movement

- **Smooth Scrolling**: Uses `requestAnimationFrame` for 60fps smooth movement
- **Throttled Updates**: Time updates throttled to ~60fps for optimal performance
- **Time Markers**: Generated at 60-second intervals
- **Live Price Line**: Vertical dashed line at 30% from left showing current time position
  - Pulse animation on box hits
  - Enhanced glow effects
- **No Bets Zone**: Area between live price line and 1-minute future line (no betting allowed)
  - Visual overlay with "no bets allowed" text
  - Greyed out boxes with subtle glow
- **Synchronization**: All boxes move in sync with timeline scroll offset

## 🎨 UI/UX Features

- ✅ **Professional Design**: Clean, minimal, aesthetic interface
- ✅ **Smooth Animations**: Hardware-accelerated transforms, optimized transitions
- ✅ **Visual Feedback**: Clear selection states, hover effects, loading states
- ✅ **Error Handling**: User-friendly error messages with auto-dismiss
- ✅ **Info Notifications**: Footer notes explaining game rules
- ✅ **Gamified Elements**: 
  - Bounce animations for win/lose popups
  - Pulsing icon effects
  - Multi-layer glow effects
  - Color-coded feedback system
- ✅ **Performance**: Optimized for 60fps smooth gameplay

## ⚠️ Known Limitations

- **Balance Display**: Temporarily removed due to validator URL configuration issues in the Linera client library. The Wallet instance from the faucet appears to have a hardcoded validator URL that overrides client options. Balance functionality will be re-enabled once the library issue is resolved or a workaround is found.
- **Contract Integration**: Currently using mock market data. Linera contract integration is pending.

## 🚧 Next Steps

- Build Linera Rust contract for prediction market
- Deploy contract to Conway Testnet
- Connect frontend to contract for on-chain betting
- Implement transaction signing with Linera client
- Re-enable balance display (once validator URL issue is resolved)
- Add sound effects for win/lose events (optional)
- Implement betting amount selection per box
- Add statistics/history tracking

## 🔗 Resources

- [Linera Documentation](https://linera.dev/docs/)
- [Conway Testnet](https://linera.dev/networks/conway.html)

## 📄 License

MIT

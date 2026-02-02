# Signals - Real-Time Crypto Prediction Game

A real-time crypto prediction game built on **Linera Conway Testnet**. Predict Bitcoin price movements and win 5x your bet.

## 🎯 Product Overview

Users select betting blocks representing specific price levels. Each block requires **100 tokens** to bet. When the live price line hits a selected block, users win **500 tokens (5x payout)**. All bets and rewards are managed locally for fast, smooth gameplay.

## 🚀 Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Routing**: React Router DOM v7
- **Wallet**: Linera Web Client (`@linera/client` v0.15.8)
- **State Management**: Zustand
- **Real-time Data**: Binance WebSocket API for live BTC/USDT price
- **Styling**: Tailwind CSS with custom animations

## ✅ Completed Features

### Landing Page

- ✅ **Professional Landing Page**: Modern, clean design with hero section
- ✅ **Product Showcase**: Hero screenshot with subtle vignette glow
- ✅ **Features Section**: 4 key features with icons and clean cards
- ✅ **Screenshots Gallery**: Marketing-style layout with hero screenshot (2x2 grid)
- ✅ **How It Works**: Step-by-step guide with numbered cards
- ✅ **Routing**: React Router with `/` (landing) and `/game` routes
- ✅ **Responsive Design**: Mobile-first, works on all screen sizes
- ✅ **CTA Buttons**: "Start Game" and "Start Playing Now" with hover effects

### Wallet System

- ✅ **Embedded Wallet**: Keypair generated using Linera Web Client
- ✅ **Faucet Integration**: Automatic wallet creation and chain claiming from Conway Testnet
- ✅ **Microchain Claiming**: Each user gets their own microchain with test tokens
- ✅ **Wallet Storage**: Private keys stored in localStorage (browser-only)
- ✅ **Wallet Import/Export**: Full wallet backup with chainId preservation
- ✅ **Progress UI**: Step-by-step wallet creation progress display

### Game Interface

- ✅ **Real-time Price Chart**: Live BTC price visualization with smooth animations
- ✅ **Price Canvas**: Interactive canvas showing price history with stable line rendering
- ✅ **Timeline Component**: Scrolling timeline with time markers and "NOW" indicator
- ✅ **Price Scale**: Left-side price scale with $10 increments, fixed range based on initial live price
- ✅ **Betting Blocks System**: 
  - 15 rows aligned with price levels ($10 increments)
  - Up to 5 selections per column
  - Visual states: Normal, Selected (check icon + glow), No Bets Zone, Max Selections
  - Smooth right-to-left scrolling (hardware-accelerated)
  - Disappears when left edge touches live price line
- ✅ **Blast Animation System**: 
  - Individual box blasting (only hit box animates)
  - Color-coded: 🟢 Green (win), 🔴 Red (lose), 🟠 Orange (neutral)
  - Smooth 120ms animations with crack patterns
- ✅ **Win/Lose Detection**: 
  - Conditional notifications (only if user has selected boxes)
  - Professional popups with bounce animation, auto-dismiss (2.5s)
- ✅ **Live Price Line**: Vertical dashed line at 30% from left with pulse animation
- ✅ **Betting Panel**: Integrated betting interface
- ✅ **Game Info Popup**: "How to Play" accessible via header button

### UI Components

- ✅ **Header**: Wallet address, chainId, quick actions (export/disconnect), game info button
- ✅ **Wallet Setup**: Creation and import interface with file upload
- ✅ **Wallet Created**: Success screen after wallet creation
- ✅ **Wallet Creation Progress**: Step-by-step progress UI
- ✅ **GameView**: Main game interface with modular components
- ✅ **LandingPage**: Professional landing page with routing

### Performance & Code Quality

- ✅ **Modular Architecture**: Separated concerns with dedicated hooks and components
- ✅ **Optimized Animations**: Hardware-accelerated transforms, GPU-accelerated rendering
- ✅ **Performance Optimizations**:
  - Memoized lookups (O(1) Map-based checks)
  - Throttled updates (30fps)
  - Optimized blast detection
  - Efficient state management
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **TypeScript**: Full type safety

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
│   ├── LandingPage.tsx              # Landing page with hero section
│   ├── Game.tsx                     # Game route wrapper
│   ├── Header.tsx                   # Wallet display & actions
│   ├── WalletSetup.tsx               # Wallet creation/import
│   ├── WalletCreated.tsx             # Success screen
│   ├── WalletCreationProgress.tsx   # Creation progress UI
│   ├── GameView.tsx                 # Main game interface
│   ├── PriceCanvas.tsx              # Canvas for price line rendering
│   ├── PriceScale.tsx               # Left-side price scale
│   ├── Timeline.tsx                 # Time markers and scrolling timeline
│   └── BettingPanel.tsx             # Betting interface
├── hooks/
│   ├── useMarket.ts                 # Market state and betting logic
│   └── usePriceScale.ts             # Price scale calculations
├── store/
│   └── walletStore.ts               # Zustand wallet state
├── utils/
│   ├── wallet.ts                    # Wallet operations
│   ├── lineraClient.ts              # Linera client utilities
│   └── btcPrice.ts                  # Binance WebSocket price feed
└── types/
    └── index.ts                      # TypeScript types
```

## 🎮 How to Play

1. **Connect Wallet**: Create or import your Linera wallet
2. **Select Price Blocks**: Click betting blocks to place bets (up to 5 per column, 100 tokens each)
3. **Watch Price Line**: Yellow line shows live BTC price, moves right to left
4. **Win or Lose**: If price hits your block → Win 500 tokens (5x). Otherwise, lose 100 tokens

## 🔐 Wallet Features

- **Generation**: `PrivateKey.createRandom()` from Linera Web Client
- **Faucet**: Automatic chain claiming with test tokens
- **Storage**: localStorage (browser-only)
- **Import/Export**: Full wallet backup including microchain ID
- **Progress UI**: Real-time step-by-step wallet creation feedback

## 🎨 UI/UX Features

- ✅ **Professional Design**: Clean, minimal, aesthetic interface
- ✅ **Smooth Animations**: Hardware-accelerated transforms
- ✅ **Visual Feedback**: Clear selection states, hover effects
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Landing Page**: Professional marketing-style landing page

## 🔗 Resources

- [Linera Documentation](https://linera.dev/docs/)
- [Conway Testnet](https://linera.dev/networks/conway.html)

## 📄 License

MIT

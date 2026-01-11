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
- ✅ **Price Scale**: Left-side price scale with $10 increments
- ✅ **Betting Panel**: Integrated betting interface with claim rewards functionality
- ✅ **HUD Elements**: Current price display with Binance badge, user bet status

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

# Signals - Real-Time Crypto Prediction Game

A real-time crypto prediction game built on **Linera Conway Testnet** for the Akindo Wave Hacks (Wave-5 MVP).

## 🎯 Product

Users predict whether BTC price will be **ABOVE** or **BELOW** a target price at a fixed time. Users stake test tokens, and the total pooled amount is distributed to winners.

## 🚀 Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Blockchain**: Linera Conway Testnet
- **Wallet**: Embedded wallet using Linera Web Client
- **Client**: `@linera/client` v0.15.8

## ✅ Completed Features

### Wallet System

- ✅ **Embedded Wallet**: Keypair generated using `PrivateKey.createRandom()` from Linera Web Client
- ✅ **Faucet Integration**: Automatic wallet creation and chain claiming from Conway Testnet faucet
- ✅ **Microchain Claiming**: Each user gets their own microchain with test tokens
- ✅ **Wallet Storage**: Private keys stored in localStorage (browser-only)
- ✅ **Wallet Import/Export**: Full wallet backup with chainId preservation
- ✅ **Progress UI**: Step-by-step wallet creation progress display

### UI Components

- ✅ **Header**: Displays wallet address, balance, chainId, and quick actions
- ✅ **Wallet Setup**: Creation and import interface
- ✅ **Wallet Details**: View full address, microchain ID, and network info
- ✅ **Market View**: Market information display
- ✅ **Betting Panel**: Betting interface (UI ready)

### Integration

- ✅ **Linera Web Client**: Using `@linera/client` v0.15.8
- ✅ **Faucet Connection**: Connected to `https://faucet.testnet-conway.linera.net`
- ✅ **Chain Management**: Microchain ID stored and displayed
- ✅ **State Management**: Zustand for wallet state

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
│   ├── Header.tsx              # Wallet display & actions
│   ├── WalletSetup.tsx          # Wallet creation/import
│   ├── WalletCreated.tsx        # Success screen
│   ├── WalletCreationProgress.tsx # Creation progress UI
│   ├── MarketView.tsx           # Market display
│   └── BettingPanel.tsx         # Betting interface
├── store/
│   └── walletStore.ts           # Zustand wallet state
├── utils/
│   ├── wallet.ts                # Wallet operations
│   └── lineraClient.ts          # Linera client utilities
├── hooks/
│   └── useMarket.ts             # Market state
└── types/
    └── index.ts                 # TypeScript types
```

## 🔐 Wallet Features

- **Generation**: `PrivateKey.createRandom()` from Linera Web Client
- **Faucet**: Automatic chain claiming with test tokens
- **Storage**: localStorage (browser-only, no server)
- **Import/Export**: Full wallet backup including microchain ID
- **Verification**: Address validated against private key

## 🚧 Next Steps

- Build Linera Rust contract for prediction market
- Deploy contract to Conway Testnet
- Connect frontend to contract for on-chain betting
- Implement transaction signing with Linera client

## 🔗 Resources

- [Linera Documentation](https://linera.dev/docs/)
- [Conway Testnet](https://linera.dev/networks/conway.html)

## 📄 License

MIT

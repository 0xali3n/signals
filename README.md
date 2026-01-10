# Signals - Real-Time Crypto Prediction Game

A real-time crypto prediction game built on **Linera Conway Testnet** for the Akindo Wave Hacks (Wave-5 MVP).

## 🎯 Product

Users predict whether BTC price will be **ABOVE** or **BELOW** a target price at a fixed time (e.g., 60 seconds). Users stake test tokens, and the total pooled amount is distributed to winners.

## 🚀 Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Blockchain**: Linera Conway Testnet
- **Wallet**: Embedded wallet using Linera Web Client
- **Client**: `@linera/client` v0.15.8

## 🏗️ Architecture

```
React + Vite Frontend
        |
 Linera Web Client (@linera/client)
        |
 Linera Application (Rust) - In Progress
        |
 Conway Testnet
```

## ✅ Completed Features

- **Embedded Wallet**: Keypair generated using `PrivateKey.createRandom()` from Linera Web Client
- **Wallet Storage**: Private keys stored in localStorage (browser-only)
- **Wallet Import**: File upload with automatic verification using Linera client
- **Wallet Export**: Download wallet as encrypted JSON
- **Header Component**: Displays wallet address, balance, and quick actions
- **UI Components**: Wallet setup, market view, betting interface
- **Real Linera Integration**: Using actual `@linera/client` package for wallet operations

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
├── components/         # React UI components
│   ├── Header.tsx      # Main header with wallet display
│   ├── WalletSetup.tsx # Wallet creation/import
│   ├── WalletCreated.tsx # Success screen after creation
│   ├── MarketView.tsx  # Market information display
│   └── BettingPanel.tsx # Betting interface
├── hooks/              # React hooks
│   ├── useWallet.ts    # Wallet state management
│   └── useMarket.ts    # Market state and betting
├── utils/              # Utility functions
│   ├── wallet.ts       # Wallet operations (uses Linera client)
│   └── linera.ts       # Linera client initialization
├── types/              # TypeScript types
│   └── index.ts
└── App.tsx             # Main app component
```

## 🔐 Wallet Implementation

- **Generation**: Uses `PrivateKey.createRandom()` from `@linera/client/signer`
- **Storage**: Private key stored in localStorage (browser-only, no server)
- **Import**: File upload with verification using Linera `PrivateKey` constructor
- **Export**: Download wallet as encrypted JSON file
- **Verification**: Wallet address validated against private key using Linera client

## 🚧 In Progress

- **Linera Contract**: Rust application for prediction market (to be implemented)
- **On-chain Betting**: Connect frontend to deployed contract
- **Balance Fetching**: Query actual balance from Linera microchain
- **Transaction Signing**: Implement silent transaction signing with Linera client

## 🚨 Constraints

- ❌ NO MetaMask
- ❌ NO WalletConnect
- ❌ NO Next.js/SSR
- ❌ NO server-side private key storage
- ✅ Embedded wallet only
- ✅ React + Vite + TypeScript
- ✅ Linera Web Client
- ✅ Conway Testnet

## 🔗 Resources

- [Linera Documentation](https://linera.dev/docs/)
- [Linera Developers Guide](https://linera.dev/developers/)
- [Conway Testnet](https://linera.dev/networks/conway.html)
- [Hackathon Link](https://app.akindo.io/wave-hacks/X4ZV12Z6GSMEkmOkX)

## 🎮 Current Status

### ✅ Working Now

1. **Wallet Creation**: Generate new wallet using Linera Web Client
2. **Wallet Import**: Upload JSON file, verify and connect
3. **Wallet Export**: Download wallet backup
4. **UI Components**: All interface components built and styled

### 🚧 Next Steps

1. Build Linera Rust contract for prediction market
2. Deploy contract to Conway Testnet
3. Connect frontend to contract for on-chain betting
4. Implement real-time balance updates
5. Add transaction signing with Linera client

## 🧑‍⚖️ Judge Explanation

> "We use Linera's microchain model to enable real-time prediction markets with instant interactions and no wallet popups. Each user controls their own microchain, allowing seamless gameplay. The embedded wallet uses Linera Web Client for secure keypair generation and verification."

## 📦 Dependencies

- `@linera/client` v0.15.8 - Linera Web Client
- `react` v18.3.1
- `vite` v6.0.3
- `tailwindcss` v3.4.17
- `date-fns` v3.6.0

## 📄 License

MIT

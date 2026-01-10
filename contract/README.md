# Linera Contract

This directory will contain the Linera application (Rust contract) for the prediction market.

## Planned Structure

```
contract/
├── src/
│   └── lib.rs          # Main contract logic
├── Cargo.toml          # Rust dependencies
└── README.md
```

## Contract Methods

- `create_market(end_time: u64, target_price: u64)` - Create market
- `place_bet(direction: BetDirection, amount: u64)` - Place bet
- `close_market(final_price: u64)` - Close and settle market
- `claim_reward()` - Claim winnings

## Deployment

To be deployed to Conway Testnet using Linera CLI.


//! Application state helper functions
//!
//! Note: Most state access is now done directly through the view system.
//! This module provides convenience functions if needed.

use crate::lib::{BetInfo, SignalsState};
use linera_sdk::base::Owner;
use linera_sdk::views::View;

/// Get bet by ID (helper function)
pub async fn get_bet_by_id(state: &SignalsState, bet_id: &str) -> Option<BetInfo> {
    state.bets.get(bet_id).await.ok().flatten()
}

/// Get column pool for a timestamp (helper function)
pub async fn get_column_pool(state: &SignalsState, timestamp: u64) -> u64 {
    state.column_pools.get(&timestamp).await.ok().flatten().unwrap_or(0)
}

/// Count winners for a price level at a timestamp
pub async fn count_winners(state: &SignalsState, price_level: u64, timestamp: u64) -> u64 {
    let mut count = 0u64;
    if let Ok(mut iter) = state.bets.iter().await {
        while let Ok(Some((_, bet))) = iter.next().await {
            if bet.price_level == price_level
                && bet.timestamp == timestamp
                && !bet.claimed {
                count += 1;
            }
        }
    }
    count
}

/// Calculate reward amount for a winner
pub async fn calculate_reward(
    state: &SignalsState,
    price_level: u64,
    timestamp: u64,
) -> Option<u64> {
    let column_pool = get_column_pool(state, timestamp).await;
    let winners_count = count_winners(state, price_level, timestamp).await;
    
    if winners_count == 0 || column_pool == 0 {
        return None;
    }
    
    // Divide pool equally among winners
    Some(column_pool / winners_count)
}

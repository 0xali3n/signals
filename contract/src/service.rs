//! Signals Service Implementation
//!
//! This module contains the service logic for querying application state via GraphQL.

use linera_sdk::{
    base::WithServiceAbi,
    views::View,
    QueryContext, Service,
};
use serde_json;

use crate::lib::{SignalsApp, SignalsState};

linera_sdk::service!(SignalsApp);

impl WithServiceAbi for SignalsApp {
    type Abi = signals::SignalsAbi;
}

impl Service for SignalsApp {
    type Query = String;
    type QueryResponse = String;

    async fn handle_query(&self, _context: &QueryContext, query: Self::Query) -> Self::QueryResponse {
        let state = self.state();
        
        // Parse GraphQL query (simplified for MVP)
        if query.contains("marketId") {
            if let Ok(market_id) = state.market_id.get().await {
                return serde_json::to_string(&market_id).unwrap_or_default();
            }
        }
        
        if query.contains("targetPrice") {
            if let Ok(price) = state.target_price.get().await {
                return serde_json::to_string(&price).unwrap_or_default();
            }
        }
        
        if query.contains("endTime") {
            if let Ok(time) = state.end_time.get().await {
                return serde_json::to_string(&time).unwrap_or_default();
            }
        }
        
        if query.contains("isClosed") {
            if let Ok(closed) = state.is_closed.get().await {
                return serde_json::to_string(&closed).unwrap_or_default();
            }
        }
        
        if query.contains("finalPrice") {
            if let Ok(price) = state.final_price.get().await {
                return serde_json::to_string(&price).unwrap_or_default();
            }
        }
        
        if query.contains("columnPools") {
            let mut pools = std::collections::BTreeMap::new();
            let mut iter = state.column_pools.iter().await.unwrap_or_default();
            while let Ok(Some((k, v))) = iter.next().await {
                pools.insert(k, v);
            }
            return serde_json::to_string(&pools).unwrap_or_default();
        }
        
        if query.contains("userBets") {
            let mut bets = Vec::new();
            let mut iter = state.bets.iter().await.unwrap_or_default();
            while let Ok(Some((_, bet))) = iter.next().await {
                bets.push(bet);
            }
            return serde_json::to_string(&bets).unwrap_or_default();
        }
        
        // Return empty JSON for unknown queries
        "{}".to_string()
    }
}

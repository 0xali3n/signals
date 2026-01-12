//! Signals - Betting Contract ABI
//!
//! This module defines the Application Binary Interface (ABI) for the Signals betting contract.

pub mod state;

use linera_sdk::{
    base::{ApplicationId, ChainId, Owner},
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

/// The Signals application.
pub struct SignalsApp;

/// Operations that can be sent to the application.
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    /// Place a bet on a price level at a specific timestamp
    PlaceBet {
        price_level: u64,
        timestamp: u64,
        amount: u64,
    },
    /// Claim reward for a winning bet
    ClaimReward {
        bet_id: String,
    },
}

/// Messages that can be sent between chains.
#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    // For future cross-chain functionality
}

/// Parameters for initializing the application.
#[derive(Debug, Deserialize, Serialize)]
pub struct Parameters {
    pub market_id: String,
    pub target_price: u64,
    pub end_time: u64,
}

/// Initialization argument for the application.
#[derive(Debug, Deserialize, Serialize)]
pub struct InitializationArgument {
    pub market_id: String,
    pub target_price: u64,
    pub end_time: u64,
}

/// Bet information stored in the contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BetInfo {
    pub bet_id: String,
    pub owner: Owner,
    pub price_level: u64,
    pub timestamp: u64,
    pub amount: u64,
    pub claimed: bool,
}

/// Application state using Linera views
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct SignalsState {
    pub market_id: RegisterView<String>,
    pub target_price: RegisterView<u64>,
    pub end_time: RegisterView<u64>,
    pub is_closed: RegisterView<bool>,
    pub final_price: RegisterView<Option<u64>>,
    pub bets: MapView<String, BetInfo>, // bet_id -> BetInfo
    pub column_pools: MapView<u64, u64>, // timestamp -> total amount
}

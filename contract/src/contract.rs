//! Signals Contract Implementation
//!
//! This module contains the contract logic for placing bets and claiming rewards.

use linera_sdk::{
    base::{Amount, Owner, WithContractAbi},
    contract::system_api,
    views::View,
    ApplicationCallResult, CalleeContext, Contract, ExecutionResult, MessageContext,
    OperationContext, SessionCallResult,
};
use serde_json;

use crate::lib::{BetInfo, InitializationArgument, Message, Operation, SignalsApp, SignalsState};

linera_sdk::contract!(SignalsApp);

impl WithContractAbi for SignalsApp {
    type Abi = signals::SignalsAbi;
}

impl Contract for SignalsApp {
    type Message = Message;
    type Parameters = ();
    type InitializationArgument = InitializationArgument;

    async fn initialize(
        &mut self,
        _context: &OperationContext,
        argument: Self::InitializationArgument,
    ) -> Result<ExecutionResult<Self::Message>, linera_sdk::base::AbiError> {
        let mut state = self.state();
        
        state.market_id.set(argument.market_id);
        state.target_price.set(argument.target_price);
        state.end_time.set(argument.end_time);
        state.is_closed.set(false);
        state.final_price.set(None);
        
        Ok(ExecutionResult::default())
    }

    async fn execute_operation(
        &mut self,
        context: &OperationContext,
        operation: Self::Operation,
    ) -> Result<ExecutionResult<Self::Message>, linera_sdk::base::AbiError> {
        match operation {
            Operation::PlaceBet {
                price_level,
                timestamp,
                amount,
            } => {
                self.place_bet(context, price_level, timestamp, amount).await
            }
            Operation::ClaimReward { bet_id } => {
                self.claim_reward(context, &bet_id).await
            }
        }
    }

    async fn execute_message(
        &mut self,
        _context: &MessageContext,
        _message: Self::Message,
    ) -> Result<ExecutionResult<Self::Message>, linera_sdk::base::AbiError> {
        // No cross-chain messages for MVP
        Ok(ExecutionResult::default())
    }

    async fn handle_application_call(
        &mut self,
        _context: &CalleeContext,
        _argument: (),
        _forwarded_sessions: Vec<linera_sdk::base::SessionId>,
    ) -> Result<
        ApplicationCallResult<Self::Message, Self::Response, Self::SessionState>,
        linera_sdk::base::AbiError,
    > {
        Err(linera_sdk::base::AbiError::InvalidApplicationCall)
    }

    async fn handle_session_call(
        &mut self,
        _context: &CalleeContext,
        _session: Self::SessionState,
        _argument: (),
        _forwarded_sessions: Vec<linera_sdk::base::SessionId>,
    ) -> Result<SessionCallResult<Self::Message>, linera_sdk::base::AbiError> {
        Err(linera_sdk::base::AbiError::InvalidSessionCall)
    }
}

impl SignalsApp {
    /// Place a bet on a price level at a specific timestamp
    async fn place_bet(
        &mut self,
        context: &OperationContext,
        price_level: u64,
        timestamp: u64,
        amount: u64,
    ) -> Result<ExecutionResult<Message>, linera_sdk::base::AbiError> {
        let mut state = self.state();
        
        // Check if market is closed
        let is_closed = state.is_closed.get().await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        if is_closed {
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Check if market has ended
        let end_time = state.end_time.get().await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        let current_time = system_api::current_system_time()
            .as_millis()
            .try_into()
            .unwrap_or(0);
        if current_time >= end_time {
            state.is_closed.set(true);
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Get owner from context
        let owner = context.authenticated_signer.unwrap_or(context.chain_id.into());
        
        // Create bet ID
        let bet_id = format!("bet-{:?}-{}-{}", owner, price_level, timestamp);
        
        // Check if bet already exists
        if state.bets.contains_key(&bet_id).await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)? {
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Transfer tokens from owner to contract
        let amount = Amount::from_attos(amount);
        system_api::transfer(owner, &system_api::current_application_id().into(), amount)
            .await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        
        // Create bet info
        let bet = BetInfo {
            bet_id: bet_id.clone(),
            owner,
            price_level,
            timestamp,
            amount: amount.as_attos(),
            claimed: false,
        };
        
        // Store bet
        state.bets.insert(bet_id, bet)
            .await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        
        // Update column pool
        let current_pool = state.column_pools.get(&timestamp).await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?
            .unwrap_or(0);
        state.column_pools.insert(timestamp, current_pool + amount.as_attos())
            .await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        
        Ok(ExecutionResult::default())
    }
    
    /// Claim reward for a winning bet
    async fn claim_reward(
        &mut self,
        context: &OperationContext,
        bet_id: &str,
    ) -> Result<ExecutionResult<Message>, linera_sdk::base::AbiError> {
        let mut state = self.state();
        
        // Find bet
        let mut bet = state.bets.get(bet_id).await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?
            .ok_or(linera_sdk::base::AbiError::InvalidApplicationCall)?
            .clone();
        
        // Check if already claimed
        if bet.claimed {
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Verify owner
        let owner = context.authenticated_signer.unwrap_or(context.chain_id.into());
        if bet.owner != owner {
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Check if market is closed
        let is_closed = state.is_closed.get().await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        if !is_closed {
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Get winners for this price level and timestamp
        let mut winners_count = 0u64;
        let mut iter = state.bets.iter().await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        while let Some((_, b)) = iter.next().await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)? {
            if b.price_level == bet.price_level
                && b.timestamp == bet.timestamp
                && !b.claimed {
                winners_count += 1;
            }
        }
        
        if winners_count == 0 {
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Calculate reward: column pool divided by number of winners
        let column_pool = state.column_pools.get(&bet.timestamp).await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?
            .unwrap_or(0);
        let reward_amount = column_pool / winners_count;
        
        if reward_amount == 0 {
            return Err(linera_sdk::base::AbiError::InvalidApplicationCall);
        }
        
        // Transfer reward to owner
        let reward = Amount::from_attos(reward_amount);
        system_api::transfer(
            &system_api::current_application_id().into(),
            &owner,
            reward,
        )
        .await
        .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        
        // Mark bet as claimed
        bet.claimed = true;
        state.bets.insert(bet_id.to_string(), bet)
            .await
            .map_err(|_| linera_sdk::base::AbiError::InvalidApplicationCall)?;
        
        Ok(ExecutionResult::default())
    }
}

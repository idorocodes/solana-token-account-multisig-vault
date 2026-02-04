use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub use error::*;
pub mod handlers;
pub use handlers::*;
pub mod state;
pub use state::*;
declare_id!("3pATzzBN6dWuYxyPg3GvFqNDXgoTnegXkVmjBQy1WPNB");

#[program]
pub mod solana_token_account_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, owners: Vec<Pubkey>) -> Result<()> {
        ctx.accounts.initialize(owners, &ctx.bumps)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }
    
    pub fn withdraw(ctx:Context<Withdraw>,amount:u64) -> Result<()>{
        ctx.accounts.withdraw(amount)
    }
    
    pub fn sign(ctx:Context<Sign>) ->Result<()>{
      ctx.accounts.sign()   
    }
    
    pub fn switch_vault_lock(ctx:Context<SwitchLock>) -> Result<()>{
        ctx.accounts.switch_vault_lock()
    }
}

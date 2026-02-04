use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VaultConfig {
    pub authority: Pubkey,
    #[max_len(10)]
    pub owners: Vec<Pubkey>,
    pub balance: u64,
    pub locked: bool,
    pub signed: bool,
    pub signed_owners:Vec<Pubkey>,
    pub num_of_owners: u64,
    pub bump: u8,
}

use anchor_lang::prelude::*;



#[error_code]
pub enum VaultError{
   #[msg("Invalid amount supplied!")]
    InvalidAmount,
    #[msg("Vault is locked! needs to be unlocked!")]
    VaultIsLocked,
    #[msg("all owners have not yet signed")]
    VaultNotFullySigned,
    #[msg("invalid authority, cannot withdraw from vault!")]
    InvalidAuthority,
}

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
    #[msg("Owner has already signed")]
    HasAlreadySigned,
    #[msg("vault fully signed")]
    VaultAlreadyFullySigned,
    #[msg("unauthorized to sign this vault")]
    InvalidSigner,
    #[msg("invalid authority, only authority can switch vault lock")]
    NonAuthorityCannotSwitchLock,
}

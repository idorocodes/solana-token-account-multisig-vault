use crate::constants::*;
use crate::error::VaultError;
use crate::state::VaultConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
#[derive(Accounts)]
pub struct SwitchLock<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mint::token_program = token_program
    )]
    pub vault_mint: InterfaceAccount<'info, Mint>,

    #[account(mut,
     associated_token::authority = signer,
     associated_token::mint = vault_mint,
     associated_token::token_program = token_program,
    )]
    pub signer_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut,
    seeds = [VAULT_SEED,vault_config.authority.as_ref()],
    bump
    )]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(
        mut,
        associated_token::mint = vault_mint,
        associated_token::authority = vault_config,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> SwitchLock<'info> {
    pub fn switch_vault_lock(&mut self) -> Result<()> {
        let vault_config = &mut self.vault_config;

        let signer = self.signer.key();

        require!(
            vault_config.authority == signer,
            VaultError::NonAuthorityCannotSwitchLock
        );

        let current_state = self.vault_config.locked;

        if current_state == true {
            self.vault_config.locked = false
        } else {
            self.vault_config.locked = true
        }

        Ok(())
    }
}

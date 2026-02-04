use crate::constants::*;
use crate::error::VaultError;
use crate::state::VaultConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
#[derive(Accounts)]
pub struct Sign<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mint::token_program = token_program
    )]
    pub vault_mint: InterfaceAccount<'info, Mint>,

    #[account(mut,
    seeds = [VAULT_SEED,vault_config.authority.key().as_ref()],
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

impl<'info> Sign<'info> {
    pub fn sign(&mut self) -> Result<()> {
        let vault_config = &mut self.vault_config;
        require!(
            vault_config.owners.contains(&self.signer.key()),
            VaultError::InvalidSigner
        );
        
        require!(
            vault_config.num_of_owners != vault_config.signed_owners.len() as u64,
            VaultError::VaultAlreadyFullySigned
        );

        let signer = self.signer.key();

        require!(
            vault_config.owners.contains(&signer),
            VaultError::InvalidSigner
        );

        let is_signed = self.vault_config.signed_owners.contains(&signer);

        if !is_signed {
            self.vault_config.signed_owners.push(signer);
        } 

        if self.vault_config.num_of_owners == self.vault_config.signed_owners.len() as u64 {
            self.vault_config.signed = true
        }
        Ok(())
    }
}

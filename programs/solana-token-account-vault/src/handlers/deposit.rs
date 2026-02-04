use crate::constants::*;
use crate::error::VaultError;
use crate::state::VaultConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
#[derive(Accounts)]
pub struct Deposit<'info> {
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
    seeds = [VAULT_SEED,signer.key().as_ref()],
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

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);

        let vault_config = &mut self.vault_config;
        require!(vault_config.locked == false, VaultError::VaultIsLocked);
        vault_config.balance = vault_config.balance + amount;

        let cpi_accounts = TransferChecked {
            from: self.signer_ata.to_account_info(),
            mint: self.vault_mint.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.signer.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, amount, self.vault_mint.decimals)?;

        self.vault_config.balance += amount;
        Ok(())
    }
}

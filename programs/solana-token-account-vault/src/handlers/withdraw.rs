use crate::constants::*;
use crate::error::VaultError;
use crate::state::VaultConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::close_account,
    token_interface::{
        transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mint::token_program = token_program
    )]
    pub vault_mint: InterfaceAccount<'info, Mint>,

    #[account(mut,
     associated_token::authority = authority,
     associated_token::mint = vault_mint,
     associated_token::token_program = token_program,
    )]
    pub signer_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut,
        close = authority,
        has_one = authority,
    seeds = [VAULT_SEED,authority.key().as_ref()],
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

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);
        require!(
            self.authority.key() == self.vault_config.authority,
            VaultError::InvalidAuthority
        );

        let vault_config = &mut self.vault_config;
        require!(vault_config.locked == false, VaultError::VaultIsLocked);
        require!(
            vault_config.signed_owners.len() == vault_config.owners.len(),
            VaultError::VaultNotFullySigned
        );
        vault_config.balance = vault_config.balance - amount;
        let authority_key = self.authority.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"idorosolvaut",
            authority_key.as_ref(),
            &[self.vault_config.bump],
        ]];

        let transfer_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.vault_mint.to_account_info(),
            to: self.signer_ata.to_account_info(),
            authority: self.vault_config.to_account_info(),
        };

        let transfer_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_accounts,
            signer_seeds,
        );

        transfer_checked(transfer_ctx, amount, self.vault_mint.decimals)?;

        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.authority.to_account_info(),
            authority: self.vault_config.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();

        let close_ctx = CpiContext::new_with_signer(cpi_program, close_accounts, signer_seeds);

        close_account(close_ctx)?;
        self.vault_config.balance += amount;
        Ok(())
    }
}


use crate::constants::*;
use crate::state::VaultConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct Initialize<'info> {
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

    #[account(init,
    payer = signer,
    space = ANCHOR_DISCRIMINATOR + VaultConfig::INIT_SPACE,
    seeds = [VAULT_SEED,signer.key().as_ref()],
    bump
    )]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(
        init,
        payer  = signer,
        associated_token::mint = vault_mint,
        associated_token::authority = vault_config,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, owners: Vec<Pubkey>, bump: &InitializeBumps) -> Result<()> {
        
        let number_of_owners = owners.len();
        self.vault_config.set_inner(VaultConfig {
            authority: self.signer.key(),
            owners: owners,
            balance: 0,
            locked: false,
            signed: false,
            num_of_signatures:0,
            num_of_owners: number_of_owners as u64 + 1,
            bump: bump.vault_config,
        });
        Ok(())
    }
}

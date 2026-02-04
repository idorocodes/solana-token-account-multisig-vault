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
       
        let mut vault_owners = owners;       
        let number_of_owners = vault_owners.len() as u64 + 1;
        vault_owners.push(self.signer.key());
        
        self.vault_config.set_inner(VaultConfig {
            authority: self.signer.key(),
            owners: vault_owners,
            balance: 0,
            locked: false,
            signed: false,
            signed_owners: Vec::new(),
            num_of_owners: number_of_owners,
            bump: bump.vault_config,
        });
        Ok(())
    }
}

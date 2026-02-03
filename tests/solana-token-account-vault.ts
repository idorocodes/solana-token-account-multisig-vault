import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTokenAccountVault } from "../target/types/solana_token_account_vault";
import { expect } from "chai";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMint,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"; 

describe("solana-token-account-vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaTokenAccountVault as Program<SolanaTokenAccountVault>;

    
    const authority = provider.wallet.publicKey;
    const ownerOne = anchor.web3.Keypair.generate();
    const ownerTwo = anchor.web3.Keypair.generate();
    const ownerThree = anchor.web3.Keypair.generate();
    
    
    let vaultMint: anchor.we`b3.PublicKey;
    let authorityAta: anchor.web3.PublicKey;
    
    let vaultPda: anchor.web3.PublicKey;
    
    const amount = 4000;
    
  
    
  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});

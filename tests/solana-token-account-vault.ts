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

  const program = anchor.workspace
    .SolanaTokenAccountVault as Program<SolanaTokenAccountVault>;

  const authority = provider.wallet.publicKey;
  const ownerOne = anchor.web3.Keypair.generate();
  const ownerTwo = anchor.web3.Keypair.generate();
  const ownerThree = anchor.web3.Keypair.generate();

  let vaultMint: anchor.web3.PublicKey;
  let authorityAta: anchor.web3.PublicKey;
  let vaultBump: number;

  let vaultPda: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;

  const amount = 4000;

  before(async () => {
    await provider.connection.requestAirdrop(
      authority,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      ownerOne.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      ownerTwo.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      ownerThree.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
    //Create mints
    vaultMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      authority,
      null,
      0
    );

    //Create ATAs and mint tokens
    authorityAta = getAssociatedTokenAddressSync(vaultMint, authority);
    const authorityAtaTx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        authorityAta,
        authority,
        vaultMint
      )
    );
    await provider.sendAndConfirm(authorityAtaTx);
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      vaultMint,
      authorityAta,
      authority,
      amount * 2
    );
  });

  it("Initialize Vault !", async () => {
    let owners = [ownerOne.publicKey, ownerTwo.publicKey, ownerThree.publicKey];

    [vaultPda, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("idorosolvaut"), authority.toBuffer()],
      program.programId
    );

    vault = getAssociatedTokenAddressSync(vaultMint, vaultPda, true);

    const tx = await program.methods
      .initialize(owners)
      .accountsStrict({
        signer: authority,
        vaultMint: vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const vaultBalance = (
      await provider.connection.getTokenAccountBalance(vault)
    ).value.uiAmount;


      const vaultConfigVault = await program.account.vaultConfig.fetch(vaultPda);
      console.log("vault authority")
    expect(vaultBalance).to.equal(0);
  });
});

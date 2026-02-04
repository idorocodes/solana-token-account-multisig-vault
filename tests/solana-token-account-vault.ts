import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTokenAccountVault } from "../target/types/solana_token_account_vault";
import { expect, assert } from "chai";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMint,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("solana-token-account-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .SolanaTokenAccountVault as Program<SolanaTokenAccountVault>;
  const connection = provider.connection;

  const authority = provider.wallet.publicKey;
  const ownerOne = anchor.web3.Keypair.generate();
  const ownerTwo = anchor.web3.Keypair.generate();
  const ownerThree = anchor.web3.Keypair.generate();
  const depositor = anchor.web3.Keypair.generate();

  let vaultMint: anchor.web3.PublicKey;
  let authorityAta: anchor.web3.PublicKey;
  let depositorAta: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let vaultAta: anchor.web3.PublicKey;

  const amount = 4000;

  before(async () => {
    // Airdrops
    const signature = await connection.requestAirdrop(
      authority,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);

    for (const user of [ownerOne, ownerTwo, ownerThree, depositor]) {
      const sig = await connection.requestAirdrop(
        user.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig);
    }

    // Create Mint
    vaultMint = await createMint(
      connection,
      (provider.wallet as any).payer,
      authority,
      null,
      0
    );

    // Create ATAs
    authorityAta = getAssociatedTokenAddressSync(vaultMint, authority);
    depositorAta = getAssociatedTokenAddressSync(
      vaultMint,
      depositor.publicKey
    );

    const tx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority,
        authorityAta,
        authority,
        vaultMint
      ),
      createAssociatedTokenAccountInstruction(
        authority,
        depositorAta,
        depositor.publicKey,
        vaultMint
      )
    );
    await provider.sendAndConfirm(tx);

    // Mint tokens
    await mintTo(
      connection,
      (provider.wallet as any).payer,
      vaultMint,
      authorityAta,
      authority,
      amount * 2
    );
    await mintTo(
      connection,
      (provider.wallet as any).payer,
      vaultMint,
      depositorAta,
      authority,
      amount * 2
    );

    // PDA Derivation
    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("idorosolvaut"), authority.toBuffer()],
      program.programId
    );
    vaultAta = getAssociatedTokenAddressSync(vaultMint, vaultPda, true);
  });

  it("Initialize Vault !", async () => {
    let owners = [ownerOne.publicKey, ownerTwo.publicKey, ownerThree.publicKey];
    await program.methods
      .initialize(owners)
      .accountsStrict({
        signer: authority,
        vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vaultAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const vaultBalance = (await connection.getTokenAccountBalance(vaultAta))
      .value.uiAmount;
    expect(vaultBalance).to.equal(0);
  });

  it("Cannot Deposit into Vault if amount is less than 0 or 0 !", async () => {
    try {
      await program.methods
        .deposit(new anchor.BN(0))
        .accountsStrict({
          signer: authority,
          vaultMint,
          signerAta: authorityAta,
          vaultConfig: vaultPda,
          vault: vaultAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "InvalidAmount");
    }
  });

  it("Cannot Deposit into Vault if locked ", async () => {
    // First, lock the vault
    await program.methods
      .switchVaultLock()
      .accountsStrict({
        signer: authority,
        vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vaultAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    try {
      await program.methods
        .deposit(new anchor.BN(10))
        .accountsStrict({
          signer: authority,
          vaultMint,
          signerAta: authorityAta,
          vaultConfig: vaultPda,
          vault: vaultAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "VaultIsLocked");
    }
  });

  it("Deposit Vault !", async () => {
    // Unlock first
    await program.methods
      .switchVaultLock()
      .accountsStrict({
        signer: authority,
        vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vaultAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const depositAmount = 10;
    await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accountsStrict({
        signer: authority,
        vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vaultAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const vaultBalance = (await connection.getTokenAccountBalance(vaultAta))
      .value.uiAmount;
    expect(vaultBalance).to.equal(depositAmount);
  });

  it("Cannot Switch Vault if not owner !", async () => {
    try {
      await program.methods
        .switchVaultLock()
        .accountsStrict({
          signer: depositor.publicKey,
          vaultMint,
          signerAta: depositorAta,
          vaultConfig: vaultPda,
          vault: vaultAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Should have failed");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "NonAuthorityCannotSwitchLock");
    }
  });

  it("Switch Vault Lock !", async () => {
    await program.methods
      .switchVaultLock()
      .accountsStrict({
        signer: authority,
        vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vaultAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.vaultConfig.fetch(vaultPda);
    expect(config.locked).to.equal(true);
  });

  it("Cannot sign Vault if not an owner !", async () => {
    try {
      await program.methods
        .switchVaultLock()
        .accountsStrict({
          signer: authority,
          vaultMint,
          signerAta: authorityAta,
          vaultConfig: vaultPda,
          vault: vaultAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .sign()
        .accountsStrict({
          signer: depositor.publicKey,
          vaultMint,
          vaultConfig: vaultPda,
          vault: vaultAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Should have failed");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "InvalidSigner");
    }
  });

  it("All owners sign the vault !", async () => {
    const common = {
      vaultMint,
      vaultConfig: vaultPda,
      vault: vaultAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    };

    await program.methods
      .sign()
      .accountsStrict({ signer: authority, ...common })
      .rpc();
    await program.methods
      .sign()
      .accountsStrict({ signer: ownerOne.publicKey, ...common })
      .signers([ownerOne])
      .rpc();
    await program.methods
      .sign()
      .accountsStrict({ signer: ownerTwo.publicKey, ...common })
      .signers([ownerTwo])
      .rpc();
    await program.methods
      .sign()
      .accountsStrict({ signer: ownerThree.publicKey, ...common })
      .signers([ownerThree])
      .rpc();

    const config = await program.account.vaultConfig.fetch(vaultPda);
    expect(config.signed).to.equal(true);
  });

  it("Cannot re-sign Vault that has been signed !", async () => {
    try {
      await program.methods
        .sign()
        .accountsStrict({
          signer: authority,
          vaultMint,
          vaultConfig: vaultPda,
          vault: vaultAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "VaultAlreadyFullySigned");
    }
  });

  it("Cannot withdraw if amount is 0 !", async () => {
    try {
      await program.methods
        .withdraw(new anchor.BN(0))
        .accountsStrict({
          authority,
          vaultMint,
          signerAta: authorityAta,
          vaultConfig: vaultPda,
          vault: vaultAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "InvalidAmount");
    }
  });

  it("Withdraw from Vault", async () => {
    const withdrawAmount = new anchor.BN(5);
    const beforeBalance = (
      await connection.getTokenAccountBalance(authorityAta)
    ).value.uiAmount;

    await program.methods
      .switchVaultLock()
      .accountsStrict({
        signer: authority,
        vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vaultAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .withdraw(withdrawAmount)
      .accountsStrict({
        authority,
        vaultMint,
        signerAta: authorityAta,
        vaultConfig: vaultPda,
        vault: vaultAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const afterBalance = (await connection.getTokenAccountBalance(authorityAta))
      .value.uiAmount;
    expect(afterBalance).to.equal(beforeBalance + 5);
  });
});

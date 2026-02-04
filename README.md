## Solana Token Account Multisig Vault

A **stylish on-chain SPL token vault** with **multiple owners**, a **single authority**, and a **hard multisig constraint**:
**every owner must sign before any withdrawal is allowed**.




##  Core Idea

This project implements a vault as:

* One **SPL Token Account** (the vault)
* One **Program-Derived Address (PDA)** as authority
* One **state account** that:

  * Stores owners
  * Tracks approvals
  * Enforces *N-of-N* signing for withdrawals

Logically: a multisig vault
Physically: accounts + constraints

---

##  Security Model

* **N-of-N multisig**
  Every registered owner must approve before funds move.

* **Single authority (PDA)**
  Prevents rogue transfers and external control.

* **On-chain enforcement**
  No off-chain coordination assumptions.

* **Explicit constraints (Anchor)**
  Ownership, signer checks, and token account validation are enforced at runtime.

---

##  Features

* Initialize vault with multiple owners
* Deposit SPL tokens into the vault
* Withdrawal locked behind unanimous approval
* TypeScript tests for instruction validation
* Swap vault lock
* Each owner must sign before withdrawal
* Withdrawal instruction 
* Full multisig approval flow

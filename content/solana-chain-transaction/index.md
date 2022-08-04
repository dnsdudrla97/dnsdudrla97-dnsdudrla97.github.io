---
emoji: 🌞
title: Solana Chain analysis Transactions
author: Zer0Luck
date: '2022-07-31'
categories: Solana
tags: Blockchain Web3 Solana Rust
---
![sol.png](../solana-chain-accounts/sol.png)

## Transactions
- A client can call a program by submitting a transaction to the cluster.
- A single transaction can contain multiple instructions, each targeting its own program.
- Can contain multiple commands, each targeting its own program.
- When a transaction is submitted, Solana Runtime commands are processed atomically in sequence.
- If any part of the command fails, the entire transaction fails.
``` text
- program_id of the target program
- all arrays of read and write accounts
- an instruction_data byte array specific to the target program
```
- Multiple commands can be bundled into a single transaction.
``` text
- any array accounts you want to read or write to
- one or more instructions
- recently updated blockhash
- One or more signatures
```
- Commands are processed atomically in order
- If any part of the command fails, the entire transaction fails.
- Transactions are limited to 1232 bytes
- solana runtime needs both instruction and transaction to specify a list of all accounts to read or write.
- By requiring these accounts in advance, the runtime can parallelize execution across all transactions.
- When a transaction is submitted to the cluster, the runtime processes the commands atomically in sequence.
- For each command, the receiving program interprets the data array and operates on the specified account.
- The program returns successfully or returns with an error code.
- If an error is returned, the entire transaction fails immediately
- All transactions that attempt to withdraw from the account or modify data require the signature of the account holder.
- All accounts to be modified are marked as writable.
- Deposits may be made to the account without the owner's permission as long as the transaction fee payer covers the necessary rent and transaction fees.
- All transactions must refer to the latest block hash before submission.
- Blockhash is used to prevent duplication and remove outdated transactions
- Maximum duration of transaction block hash is 150 blocks


## Fee
- The solana network collects two types of fees.
    1. Transaction fees (gas fee)
    2. Rent fees
- In solana, transaction fees are decisive.
- There is no concept of a fee market where users can pay higher fees to increase their chances of being included in the next block.
- Because it is only determined by the number of signatures required and there is currently a hard cap of 1232 bytes for every transaction
- Every transaction requires at least one writable account to sign the transaction
- Once submitted, the first serialized writable signer account becomes the fee payer.
- This account pays for the transaction regardless of whether the transaction is successful or not
- If the fee payer does not have enough balance to pay the transaction fee, the transaction will be stopped.

## Other Resources
- [Solana Docs: transactions](https://docs.solana.com/developing/programming-model/transactions)
- [Solana-transaction-in-depth](https://medium.com/@asmiller1989/solana-transactions-in-depth-1f7f7fe06ac2)

```toc
```
---
emoji: 🌞
title: Solana Chain analysis Program && Web3 API
author: Zer0Luck
date: '2022-08-01'
categories: Solana
tags: Blockchain Web3 Solana Rust
---
![sol.png](../solana-chain-accounts/sol.png)

# Solana analysis: Program && Web3 API
``` tsx
import type {NextApiRequest, NextApiResponse} from 'next';
import {getNodeURL} from '@figment-solana/lib';
import {Connection} from '@solana/web3.js';

export default async function connect(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  try {
    const {network} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url);
    const version = await connection.getVersion();
    res.status(200).json(version['solana-core']);
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
```

- 3party JSON RPC connections (web3 provider)
    - → netowkr object instance to getNodeURL ⇒ url parser
- @figment-solana/lib
    - → Connection input url  ← solana-core
- @solana/web3.js

## generate key pair
``` tsx
import type {NextApiRequest, NextApiResponse} from 'next';
import {Keypair} from '@solana/web3.js';

type ResponseT = {
  secret: string;
  address: string;
};
export default function keypair(
  _req: NextApiRequest,
  res: NextApiResponse<string | ResponseT>,
) {
  try {
    const keypair = new Keypair();
    const address = keypair.publicKey.toString();
    const secret = JSON.stringify(Array.from(keypair.secretKey));
    res.status(200).json({
      secret,
      address,
    });
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}

```
- Ed25519 Crypto Alg use
- pubKey, PrivKey
## SOL balance (mainnet, testnet)
- network provider name ⇒ token name diffirent
## Air Drop
- Account Provider to Balance ⇒ Air drop
``` text
1 SOL = 1,000,000,000 lamports
```
- Arid Drop reques
``` tsx
import {Connection, PublicKey, LAMPORTS_PER_SOL} from '@solana/web3.js';
import type {NextApiRequest, NextApiResponse} from 'next';
import {getNodeURL} from '@figment-solana/lib';

export default async function fund(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  try {
    const {network, address} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url, 'confirmed');
    const publicKey = new PublicKey(address);
    const hash = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(hash);
    res.status(200).json(hash);
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
```
- PublicKey(secretkey) ⇒ pub key generate
- Connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL)
- LAMPORTS_PER_SOL is 1 SOL == 1,000,000,000
- and… confirmTransaction await timming

## User Balance Check
``` tsx
import type {NextApiRequest, NextApiResponse} from 'next';
import {Connection, PublicKey} from '@solana/web3.js';
import {getNodeURL} from '@figment-solana/lib';

export default async function balance(
  req: NextApiRequest,
  res: NextApiResponse<string | number>,
) {
  try {
    const {network, address} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url, 'confirmed');
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    if (balance === 0 || balance === undefined) {
      throw new Error('Account not funded');
    }
    res.status(200).json(balance);
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
```
- account address ⇒ publickey
- getBaalnce(pub key) check

## SOL Transfer
- Balance ⇒ Other Sigined Account (Cluster)
- Transaction Cluster, Solana Runtime
- lamport ? 0 check
``` tsx
import type {NextApiRequest, NextApiResponse} from 'next';
import {getNodeURL} from '@figment-solana/lib';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

export default async function transfer(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  try {
    const {address, secret, recipient, lamports, network} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url, 'confirmed');

    const fromPubkey = new PublicKey(address);
    const toPubkey = new PublicKey(recipient);
    const secretKey = Uint8Array.from(JSON.parse(secret as string));
    const instructions = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    });
    const signers = [
      {
        publicKey: fromPubkey,
        secretKey,
      },
    ];
    const transaction = new Transaction().add(instructions);
    const hash = await sendAndConfirmTransaction(
      connection,
      transaction,
      signers,
    );

    res.status(200).json(hash);
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
```
## SystemProgram
- solana-web3.js
- Factory class for transaxtions to interact with the system program
## SystemProgram.transfer
- generate a transaction instruction
``` tsx
const instructions = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    });
```
generate signers object (array’s in pub key, priv key)
``` tsx
    const signers = [
      {
        publicKey: fromPubkey,
        secretKey,
      },
    ];

```
transaction instance (generate, add, …)
``` tsx
const transaction = new Transaction().add(instructions);
```
- add in transaction factory instance
## send
``` tsx
const hash = await sendAndConfirmTransaction(
      connection,
      transaction,
      signers,
    );
```
[Solana TX](https://explorer.solana.com/tx/Zy6ziQodp85pr12pYV9e8fAKdc9jc76j7oENMujR8XHpoycH7FJ55jkngFqb38gzBC73yq7tgK83wGqDETDXrAp?cluster=devnet)

## program deploy (with simple Contract lib.rs)
``` Rust
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
```
- borsh
- Binary Object Representation Serializer for Hashing
- crate, solana_program
- account_info
- entrypoint
- ProgramResult
- msg
- logging
- program_error
- ProgramError
- On-Chain Program Specifiy Error return (Solana Runtime)
- pubkey
- Pubkey

## GreetingAccount Struct
``` Rust
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    pub counter: u32,
}
```
- derive macro is Compile-time useful BorshSerialze, BorshDeserialize, Debug
- Struct Member
- counter : u32
## Program EntryPointer Settings
``` text
// Declare and export the program's entrypoint
entrypoint!(process_instruction);
```
- program run-time entrypoiter settings ⇒ fuction pointer call
## process_instruction
``` Rust
// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    msg!("Hello World Rust program entrypoint");

    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Increment and store the number of times the account has been greeted
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
    greeting_account.counter += 1;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Greeted {} time(s)!", greeting_account.counter);

    Ok(())
}
```
- entrypoint’s implementation
- retrun value ⇒ process_instruction entrypoint (ProgramResult {})
- parms
## program_id: &Pubkey,
- refrence ← Account Pubkey
## accounts: &[AccountInfo],
- Iterator Refrence (accoutns_iter)
- next_account_info(account_iter)? ⇒ AccountInfo or NotEnoughAccountKeys error
``` Rust
// Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;
```
instructiondata: &[u8],
- iterator Refrence
``` Rust
// The account must be owned by the program in order to modify its data
if account.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
 }
```
- accounts.owner check
- public key does not equal the program_id

``` Rust
// Increment and store the number of times the account has been greeted
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
    greeting_account.counter += 1;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Greeted {} time(s)!", greeting_account.counter);

    Ok(())
```
- GreetingAccount Struct ⇒ Field : counter: u32\
- &account.data.borrow() ⇒ Ref ⇒ try_from_slice
- Deserialized and slice (byte)
- BorshDeserialize ⇒ try_from_slice() ⇒ account.data (mut Ref)
- serialize(&mut &mut account.data.borrow_mut()[..])?
- mutable borrow ⇒ account.data ⇒ all data
- &mut
- &mut ⇒ Serialize

## Solana cli (air drop, pub keypair)
``` sh
☁  app [main] ⚡  solana-keygen new --outfile solana-wallet/keypair.json
Generating a new keypair

For added security, enter a BIP39 passphrase

NOTE! This passphrase improves security of the recovery seed phrase NOT the
keypair file itself, which is stored as insecure plain text

BIP39 Passphrase (empty for none):

Wrote new keypair to solana-wallet/keypair.json
=====================================================================
pubkey: <PUB-KEY>
=====================================================================
Save this seed phrase and your BIP39 passphrase to recover your new keypair:
jelly panel immense gadget task cat ship paper knock gap prevent just
=====================================================================
☁  app [main] ⚡  solana airdrop 1 $(solana-keygen pubkey solana-wallet/keypair.json)
Requesting airdrop of 1 SOL

Signature: <Signature>
```
## Deploy a Solana Program
### Building the program
``` sh
yarn run solana:build:program
"solana:build:program": "cargo build-bpf --manifest-path=contracts/solana/program/Cargo.toml --bpf-out-dir=dist/solana/program",
```
- `.so` file is shared object file
``` sh
$ solana program deploy /Users/zer0luck/project/app/dist/solana/program/helloworld.so
```
## Deploying the program
``` sh
☁  Contract [main] ⚡  solana deploy -v --keypair solana-wallet/keypair.json dist/solana/program/helloworld.so
RPC URL: <https://api.devnet.solana.com>
Default Signer Path: solana-wallet/keypair.json
Commitment: confirmed
Program Id: <ProgramID>
```
``` tsx
import type {NextApiRequest, NextApiResponse} from 'next';
import {Connection, PublicKey} from '@solana/web3.js';
import {getNodeURL} from '@figment-solana/lib';
import path from 'path';
import fs from 'mz/fs';

const PROGRAM_PATH = path.resolve('dist/solana/program');
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'helloworld.so');

export default async function deploy(
  req: NextApiRequest,
  res: NextApiResponse<string | boolean>,
) {
  try {
    const {network, programId} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url, 'confirmed');
    // Re-create publicKeys from params
    const publicKey = new PublicKey(programId);
    const programInfo = await connection.getAccountInfo(publicKey);

    if (programInfo === null) {
      if (fs.existsSync(PROGRAM_SO_PATH)) {
        throw new Error(
          'Program needs to be deployed with `solana program deploy`',
        );
      } else {
        throw new Error('Program needs to be built and deployed');
      }
    } else if (!programInfo.executable) {
      throw new Error(`Program is not executable`);
    }

    res.status(200).json(true);
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
```
- Deploy Contract  ⇒ programId ⇒ PublicKey address
- Connection.getAccountInfo(pubkey) ⇒ programInfo ⇒

## Progmra Storage Create
- Solana Program non-storage state

``` tsx
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import type {NextApiRequest, NextApiResponse} from 'next';
import {getNodeURL} from '@figment-solana/lib';
import * as borsh from 'borsh';

// The state of a greeting account managed by the hello world program
class GreetingAccount {
  counter = 0;
  constructor(fields: {counter: number} | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

// Borsh schema definition for greeting accounts
const GreetingSchema = new Map([
  [GreetingAccount, {kind: 'struct', fields: [['counter', 'u32']]}],
]);

// The expected size of each greeting account.
const GREETING_SIZE = borsh.serialize(
  GreetingSchema,
  new GreetingAccount(),
).length;

type ResponseT = {
  hash: string;
  greeter: string;
};
export default async function greeter(
  req: NextApiRequest,
  res: NextApiResponse<string | ResponseT>,
) {
  try {
    const {network, secret, programId: programAddress} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url, 'confirmed');

    const programId = new PublicKey(programAddress);
    const payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(secret)));
    const GREETING_SEED = 'hello';

    // Are there any methods from PublicKey to derive a public key from a seed?
    const greetedPubkey = await PublicKey.createWithSeed(
      payer.publicKey,
      GREETING_SEED,
      programId,
    );

    // This function calculates the fees we have to pay to keep the newly
    // created account alive on the blockchain. We're naming it lamports because
    // that is the denomination of the amount being returned by the function.
    const lamports = await connection.getMinimumBalanceForRentExemption(
      GREETING_SIZE,
    );

    // Find which instructions are expected and complete SystemProgram with
    // the required arguments.
    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: payer.publicKey,
        basePubkey: payer.publicKey,
        seed: GREETING_SEED,
        newAccountPubkey: greetedPubkey,
        lamports: lamports,
        space: GREETING_SIZE,
        programId,
      }),
    );

    // Complete this function call with the expected arguments.
    const hash = await sendAndConfirmTransaction(connection, transaction, [
      payer,
    ]);
    res.status(200).json({
      hash: hash,
      greeter: greetedPubkey.toBase58(),
    });
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
```
## PublicKey Generate
``` tsx
const programId = new PublicKey(programAddress);
const payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(secret)));
const GREETING_SEED = 'hello';

// Are there any methods from PublicKey to derive a public key from a seed?
const greetedPubkey = await PublicKey.createWithSeed(
  payer.publicKey,
  GREETING_SEED,
  programId,
);
```
- ProgramId, payer publickey, random Seed ⇒ PublicKey

``` tsx
const lamports = await connection.getMinimumBalanceForRentExemption(
  GREETING_SIZE,
);

// Find which instructions are expected and complete SystemProgram with
// the required arguments.
const transaction = new Transaction().add(
  SystemProgram.createAccountWithSeed({
    fromPubkey: payer.publicKey,
    basePubkey: payer.publicKey,
    seed: GREETING_SEED,
    newAccountPubkey: greetedPubkey,
    lamports: lamports,
    space: GREETING_SIZE,
    programId,
  }),
);
```
- createAccountWithSeed call
- fromPubKey ⇒ Create Account ⇒ lamports Transaction
- basePubKey ⇒ Create Account Address (newAccountPubKey create use basekey)
- seed: Created Account Address use sedd
- lamports : Created Account deposit lamport Quantity (GREETING_SIZE latest balance)
- space: Create Account Alloc Space(Byte), storage
- programID : Created Account Owner Program Pub Key
- newAccountPubKey : Created Pub key ← PublicKey.createWithSeed()

## Program getter data
- buffer in data storage
- Data Access ⇒ Data extract ⇒ Well-Defination Struct
``` tsx
import type {NextApiRequest, NextApiResponse} from 'next';
import {Connection, PublicKey} from '@solana/web3.js';
import {getNodeURL} from '@figment-solana/lib';
import * as borsh from 'borsh';

// The state of a greeting account managed by the hello world program
class GreetingAccount {
  counter = 0;
  constructor(fields: {counter: number} | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

// Borsh schema definition for greeting accounts
const GreetingSchema = new Map([
  [GreetingAccount, {kind: 'struct', fields: [['counter', 'u32']]}],
]);

export default async function getter(
  req: NextApiRequest,
  res: NextApiResponse<string | number>,
) {
  try {
    const {network, greeter} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url, 'confirmed');
    const greeterPublicKey = new PublicKey(greeter);

    const accountInfo = await connection.getAccountInfo(greeterPublicKey);

    if (accountInfo === null) {
      throw new Error('Error: cannot find the greeted account');
    }

    // Find the expected parameters.
    // const value = new Test({ x: 255, y: 20, z: '123', q: [1, 2, 3] });
    const greeting = borsh.deserialize(
      GreetingSchema,
      GreetingAccount,
      accountInfo.data,
    );

    // A little helper
    console.log(greeting);

    // Pass the counter to the client-side as JSON
    res.status(200).json(greeting.counter);
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    console.log(errorMessage);
    res.status(500).json(errorMessage);
  }
}
```
- on-chain data(serialize) ⇒ borsh.deserialize(schema, class, buffer) ⇒ data
## Program send data
``` tsx
import {
  Connection,
  PublicKey,
  Keypair,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import type {NextApiRequest, NextApiResponse} from 'next';
import {getNodeURL} from '@figment-solana/lib';

export default async function setter(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  try {
    const {greeter, secret, programId, network} = req.body;
    const url = getNodeURL(network);
    const connection = new Connection(url, 'confirmed');

    const greeterPublicKey = new PublicKey(greeter);
    const programKey = new PublicKey(programId);

    const payerSecretKey = new Uint8Array(JSON.parse(secret));
    const payerKeypair = Keypair.fromSecretKey(payerSecretKey);

    // this your turn to figure out
    // how to create this instruction
    const instruction = new TransactionInstruction({
      keys: [{pubkey: greeterPublicKey, isSigner: false, isWritable: true}],
      programId: programKey,
      data: Buffer.alloc(0), // All instructions are hellos
    });
    const hash = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [payerKeypair],
    );

    res.status(200).json(hash);
  } catch (error) {
    console.error(error);
    res.status(500).json('Get balance failed');
  }
}
```

``` tsx
const instruction = new TransactionInstruction({
  keys: [{pubkey: greeterPublicKey, isSigner: false, isWritable: true}],
  programId: programKey,
  data: Buffer.alloc(0), // All instructions are hellos
});
const hash = await sendAndConfirmTransaction(
  connection,
  new Transaction().add(instruction),
  [payerKeypair],
);
```
- new TransactionInstruction instance
- recepient pub key , isWritable : true
- programId

## Other Resources
- [🏗 The Solana dapp-scaffold](https://github.com/solana-labs/dapp-scaffold)
- [⚓️ Project Serum's Anchor framework](https://github.com/project-serum/anchor)
- [📚 A complete guide to full-stack Solana development](https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291)

```toc
```
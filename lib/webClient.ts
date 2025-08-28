"use client";

import {
  WebClient,
  OutputNote,
  TransactionFilter,
  NoteFilter,
  NoteFilterTypes
} from "@demox-labs/miden-sdk";
import { buildP2IDNote } from "./utils";
import { nodeEndpoint } from "./constants";
import { resolve } from "path";
import toast from "react-hot-toast";

export interface Asset {
  tokenAddress: string;
  amount: string;
}

export interface TransferRequest {
  recipient: any;
  amount: number;
  faucet: any;
}

export interface PrivateTransactionInfo {
    txId: string;
    noteIds: string[];
    noteBytes: string[];
}

export let noteIdCache:string[] = [] 
export let noteCache:string[] = [] 
let importing = false;

export async function importNotes():Promise<string[]> {
    if (importing) return [];
    importing = true;
    try {
      const client = await getClient();

      const noteIds = [...noteIdCache]
      noteIdCache = []
      const noteBytes = [...noteCache]
      noteCache = []

      await client.syncState();

      const importedNoteIDs = [];
      
      const notes = await client.getInputNotes(new NoteFilter(NoteFilterTypes.All));
      for (let i = 0; i < noteBytes.length; i++){
        if (notes.find((n) => n.id().toString() === noteIds[i])) {
          console.log(`Note ${noteIds[i]} already imported, skipping`);
          continue;
        }
        const importedNoteID = await client.importNote(noteBytes[i]);
        importedNoteIDs.push(importedNoteID);
        console.log(`Note ${importedNoteID} imported successfully`);
        toast.success(`Note ${importedNoteID} imported successfully`, {duration: 3000});
      }
      return importedNoteIDs;
    } catch (error) {
      console.error("Error importing notes:", error);
      return [];
    } finally {
      importing = false;
    }

    return [];

}



let clientPromise: Promise<WebClient>;
let client: WebClient | null = null;


export async function getClient(): Promise<WebClient> {
  if (!client && !clientPromise) {
    clientPromise = new Promise(async (resolve) => {
      const { WebClient } = await import("@demox-labs/miden-sdk");
      client = await WebClient.createClient(nodeEndpoint);
      await client.syncState();
      setInterval(async () => importNotes(), 5000)
      resolve(client);
    });
  }
  return clientPromise;
}

export async function getAccountAssets(accountId: any): Promise<Asset[]> {
  const client = await getClient();

  let account = await client.getAccount(accountId);

  if (!account) {
    await client.importAccountById(accountId);
    await client.syncState();
    account = await client.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found after import: ${accountId}`);
    }
  }

  // read account assets
  const assets: any[] = account.vault().fungibleAssets();
  return assets.map((asset: any) => ({
    tokenAddress: asset.faucetId().toString(),
    amount: asset.amount().toString(),
  }));
}

export async function batchTransfer(
  sender: any,
  request: TransferRequest[],
  isPrivate: boolean = false
) {
  const client = await getClient();
  const { OutputNotesArray, TransactionRequestBuilder, NoteType } =
    await import("@demox-labs/miden-sdk");

    const outputNotesTmp:OutputNote[] = await Promise.all(
      request.map(async (r) => {
        return await buildP2IDNote(
          sender,
          r.recipient,
          r.faucet,
          r.amount,
          isPrivate ? NoteType.Private : NoteType.Public
        );
      })
    )
    console.log(outputNotesTmp)
  
    const outputNotesArray = new OutputNotesArray(null);
    for (const note of outputNotesTmp) {
      outputNotesArray.append(note);
    }
  
    const transactionRequest = new TransactionRequestBuilder()
      .withOwnOutputNotes(outputNotesArray)
      .build();
  
    console.log("Transactions:", outputNotesTmp, transactionRequest);

  const txResult = await client.newTransaction(sender, transactionRequest);

  await client.submitTransaction(txResult);
  let txId = null;
  while (!txId) {
    try {
      txId = txResult.executedTransaction().id().toHex();
    } catch (e) {
      console.log(e)
      // Transaction not yet executed, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      await client.syncState();
    }
  }
  console.log("Transaction ID:", txId);
  
  // Wait for transaction to be committed
  let isCommitted = false;
  while (!isCommitted) {
    await client.syncState();
    const uncommittedTransactions = await client.getTransactions(
      TransactionFilter.uncommitted()
    );
    isCommitted = !uncommittedTransactions.some((tx: any) => tx.id().toHex() === txId);
    
    if (!isCommitted) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  await client.syncState();

  const noteIds = []
  const noteBytes = []
  for (const note of outputNotesTmp) {
    const fullNote = note.intoFull();
    if (!fullNote) {
      console.warn("Note is not a full note:", note);
      continue
    }
    const fullNoteId = fullNote.id().toString()
    console.log(fullNoteId)

    const fullNoteBytes = await client.exportNote(fullNoteId, "Full");
    console.log(fullNoteBytes)
    noteIds.push(fullNoteId)
    noteBytes.push(fullNoteBytes)
  }

  return [txId, noteIds, noteBytes];
}

export async function consumeAllNotes(noteIds: string[], accountId: string) {
  const client = await getClient();

  const consumeTxRequest = client.newConsumeTransactionRequest(noteIds);

  const txResult = await client.newTransaction(
    await getAccountId(accountId),
    consumeTxRequest
  );
  await client.submitTransaction(txResult);

  const txId = txResult.executedTransaction().id().toHex();
  return txId;
}

export async function mintToken(
  accountId: string,
  faucetId: string,
  amount: number
) {
  const client = await getClient();
  const res = await client.syncState();
  console.log(res)
  const { AccountId, NoteType } = await import("@demox-labs/miden-sdk");

  // Create mint transaction request
  const mintTxRequest = client.newMintTransactionRequest(
    AccountId.fromHex(accountId),
    AccountId.fromHex(faucetId),
    NoteType.Public,
    BigInt(amount)
  );

  // Submit the transaction
  const txResult = await client.newTransaction(
    AccountId.fromHex(faucetId),
    mintTxRequest
  );
  await client.submitTransaction(txResult);
  const txId = txResult.executedTransaction().id().toHex();
  return txId;
}

export async function deployAccount(isPublic: boolean) {
  const client = await getClient();
  const { AccountStorageMode } = await import("@demox-labs/miden-sdk");

  const account = await client.newWallet(
    isPublic ? AccountStorageMode.public() : AccountStorageMode.private(),
    true
  );

  return account;
}

export async function deployFaucet(
  symbol: string,
  decimals: number,
  maxSupply: number
) {
  const client = await getClient();
  const { AccountStorageMode } = await import("@demox-labs/miden-sdk");

  const faucet = await client.newFaucet(
    AccountStorageMode.public(),
    false,
    symbol,
    decimals,
    BigInt(maxSupply)
  );

  return faucet.id().toString();
}

async function getAccountId(accountId: string) {
  const { AccountId } = await import("@demox-labs/miden-sdk");
  return AccountId.fromHex(accountId);
}

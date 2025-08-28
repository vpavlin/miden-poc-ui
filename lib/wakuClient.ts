import getDispatcher, { Dispatcher, KeyType, Store } from "waku-dispatcher"
import { PrivateTransactionInfo } from "@/app/types/index";
import { getClient, importNotes, noteCache, noteIdCache } from "./webClient";
import toast from "react-hot-toast";

let initialized = false;
let dispatcher: Dispatcher | null = null;

export const MessageType = "note"
export const initializeDispatcher = async (key: Uint8Array) => {
    if (!initialized) {
        initialized = true;
        dispatcher = await getDispatcher(undefined, "/miden-poc-ui/1/accounts/json", "waku-miden", false, true)

        if (!dispatcher) {
            throw new Error("Failed to initialize dispatcher");
        }
        dispatcher.registerKey(key, KeyType.Asymetric)
        console.log("Dispatcher initialized with key:", key);

        const client = await getClient();
        dispatcher.on(MessageType, (async (message: PrivateTransactionInfo) => {
            console.log("New private transaction received:", message);
            try {
                noteCache.push(...message.noteBytes);
                noteIdCache.push(...message.noteIds);
            } catch (error) {
                console.error("Error importing notes:", error);
            }
        }).bind(client), false, true
        )

        dispatcher.dispatchQuery();
    }

    return dispatcher;
}

export const getDisp = () => {
    if (!dispatcher) {
        throw new Error("Dispatcher not initialized. Call initializeDispatcher first.");
    }
    return dispatcher;
}


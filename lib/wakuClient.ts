import getDispatcher, { Dispatcher, KeyType, Store } from "waku-dispatcher"

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
        dispatcher.on(MessageType, async (note: any) => {
            console.log("New note received:", note);
        }, false, true
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


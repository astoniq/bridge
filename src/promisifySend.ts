import {
    AnyReceiveMethodName,
    AnyRequestMethodName,
    ReceivePayload,
    RequestMessage,
    SubscribeHandler
} from "./types";

function createCounter() {
    return {
        current: 0,
        next() {
            return ++this.current
        }
    }
}

function createRequestResolver(instanceId: string) {

    type PromiseController = {
        resolve: (value: any) => any;
        reject: (reason: any) => any;
    }

    const counter = createCounter();
    const promiseControllers: Record<string, PromiseController | null> = {};

    return {
        add(controller: PromiseController, customId?: string): string {
            const id = customId != null ? customId : `${counter.next()}_${instanceId}`
            promiseControllers[id] = controller;
            return id;
        },
        resolve<T>(requestId: string, data: T, isSuccess: boolean) {
            const requestPromise = promiseControllers[requestId];
            if (requestPromise) {
                if (isSuccess) {
                    requestPromise.resolve(data)
                } else {
                    requestPromise.reject(data)
                }
            }
            promiseControllers[requestId] = null;
        }
    }
}

export function promisifySend(
    send: <K extends AnyRequestMethodName>(message: RequestMessage<K>) => void,
    subscribe: (listener: SubscribeHandler) => void,
    instanceId: string
) {
    const requestResolver = createRequestResolver(instanceId);

    subscribe((message) => {
        if (message.id) {
            requestResolver.resolve(message.id, message.payload, message.success)
        }
    })

    return function promisifiedSend<K extends AnyRequestMethodName>(
        message: RequestMessage<K>
    ): Promise<K extends AnyReceiveMethodName ? ReceivePayload<K> : void> {
        return new Promise((resolve, reject) => {
            const id = requestResolver.add({resolve, reject}, message.id)
            send({...message, id});
        })
    }
}
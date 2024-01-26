import {ReceiveMap, RequestMap} from "./data";

export type AnyRequestMethodName = keyof RequestMap;

export type AnyReceiveMethodName = keyof ReceiveMap;

export type ReceivePayload<M extends AnyReceiveMethodName> = ReceiveMap[M];

export type RequestPayload<M extends AnyRequestMethodName = AnyRequestMethodName> =
    RequestMap[M];

export type BaseMessage<M> = {
    method: M,
    id?: string,
};

export type RequestMessageWithPayload<M extends AnyRequestMethodName = AnyRequestMethodName>
    = BaseMessage<M> & { payload: RequestPayload<M> };

export type RequestMessage<M extends AnyRequestMethodName = AnyRequestMethodName>
    = RequestMap[M] extends void ? BaseMessage<M> : RequestMessageWithPayload<M>;

export type ReceiveMessageWithPayload<M extends AnyReceiveMethodName>
    = BaseMessage<M> & {
    payload: ReceivePayload<M>
};

export type ReceiveMessage<M extends AnyReceiveMethodName = AnyReceiveMethodName>
    = ReceiveMap[M] extends void ? BaseMessage<M> : ReceiveMessageWithPayload<M> & {
    success: boolean
};

export type BridgeSend = <K extends AnyRequestMethodName>(message: RequestMessage<K>)
    => Promise<K extends AnyReceiveMethodName ? ReceivePayload<K> : void>

export type SubscribeHandler<K extends AnyReceiveMethodName = AnyReceiveMethodName>
    = (message: ReceiveMessage<K>) => void;

export interface Bridge {

    /** Отправляет событие в среду выполнения и возвращает объект Promise.
     * В случае приложения Android/iOS env — это само приложение.
     */
    send: BridgeSend;

    /**
     * Добавить слушателя сообщений которые приходят из среды выполнения
     */
    subscribe: (listener: SubscribeHandler) => void;

    /**
     * Удалить слушателя сообщений
     */
    unsubscribe: (listener: SubscribeHandler) => void;

    /**
     * Проверяет поддержку метода в среде выполнения
     */
    supports: <K extends AnyRequestMethodName>(method: K) => boolean;
}

export interface BridgeHandler {
    /**
     * Отправить событие из среды выполнения в приложение
     */
    postMessage: (json: string) => void;
}

interface Window {
    // iOS
    webkit?: {
        messageHandlers?: {
            IOSBridge?: {
                postMessage?: BridgeHandler;
            };
        };
    };

    // Android
    AndroidBridge?: {
        postMessage?: BridgeHandler;
    };

    // Web
    WebBridge?: {
        postMessage: BridgeHandler;
    };
}
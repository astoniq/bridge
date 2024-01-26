import {
    AnyRequestMethodName,
    Bridge,
    BridgeHandler,
    RequestMessage,
    SubscribeHandler
} from "./types";
import {promisifySend} from "./promisifySend";
import {createInstanceId} from "./utils";

export function createWebViewBridge(): Bridge {

    const IS_CLIENT_SIDE = typeof window !== 'undefined';

    const bridge = "WebBridge";

    /**
     * Инициирует функцию postMessage WebApp, которая будет вызываться собственными приложениями.
     */
    if (IS_CLIENT_SIDE) {
        (window as any)[bridge] = (window as any)[bridge] || {
            postMessage: (message: any) => {
                subscribers.forEach((f) => f(message));
            },
        };
    }

    const IS_WEB_WEBVIEW = Boolean(IS_CLIENT_SIDE && (window as any).WebBridge);

    /** Web Bridge */
    const webBridge: BridgeHandler | undefined =
        IS_WEB_WEBVIEW ? (window as any).WebBridge : undefined;

    const IS_ANDROID_WEBVIEW = Boolean(IS_CLIENT_SIDE && (window as any).AndroidBridge);

    /** Android Bridge  */
    const androidBridge: BridgeHandler | undefined =
        IS_ANDROID_WEBVIEW ? (window as any).AndroidBridge : undefined;

    /** Список функций подписанных на события  */
    const subscribers: SubscribeHandler[] = [];

    const instanceId = createInstanceId();

    function send<K extends AnyRequestMethodName>(message: RequestMessage<K>): void {
        // Отправляем сообщение в android
        if (androidBridge) {
            androidBridge.postMessage(JSON.stringify(message))
        }
        // Отправляем сообщение о том что недоступна отправка
        else if (webBridge) {
            // Подумать как отправить сразу в обработчики
            webBridge.postMessage(JSON.stringify({
                ...message,
                success: false,
                payload: {
                    code: 500,
                    reason: 'WebView postMessage not available'
                }
            }))
        }
    }

    /**
     * Добавить слушателя сообщений которые приходят из среды выполнения
     */
    function subscribe(listener: SubscribeHandler): void {
        subscribers.push(listener)
    }

    /**
     * Удалить слушателя сообщений
     */
    function unsubscribe(listener: SubscribeHandler) {
        const index = subscribers.indexOf(listener)
        if (index > -1) {
            subscribers.slice(index, 1);
        }
    }

    /**
     * Проверяет поддержку метода в среде выполнения
     */
    function supports<K extends AnyRequestMethodName>(method: K): boolean {
        return true
    }

    const sendPromise = promisifySend(send, subscribe, instanceId);

    return {
        send: sendPromise,
        subscribe,
        supports,
        unsubscribe
    }
}
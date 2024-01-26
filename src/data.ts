/**
 * Все запросы которые можно отправить в среду выполнения
 */
export type RequestMap = {
    show: string;
    open: void;
}

/**
 * Все входные данные в приложение из среды выполнения
 */
export type ReceiveMap = {
    show: string;
}
export interface RetryConfig<T> {
    retries: number | "INFINITELY";
    delay: number;
    until: (t: T) => boolean;
    logger: (msg: string) => void;
    timeout: number;
    backoff: "FIXED" | "EXPONENTIAL" | "LINEAR" | ((attempt: number, delay: number) => number);
    maxBackOff: number;
}
export declare const defaultRetryConfig: RetryConfig<any>;
export declare function wait(ms: number): Promise<void>;
export declare function retry<T>(f: () => Promise<T>, config?: Partial<RetryConfig<T>>): Promise<T>;
export declare function retryDecorator<T, F extends (...args: any[]) => Promise<T>>(func: F, config?: Partial<RetryConfig<T>>): (...funcArgs: Parameters<F>) => ReturnType<F>;
export declare function customizeDecorator<T>(customConfig: Partial<RetryConfig<T>>): typeof retryDecorator;
export declare function customizeRetry<T>(customConfig: Partial<RetryConfig<T>>): (f: () => Promise<T>, config?: RetryConfig<T>) => Promise<T>;
export declare const notEmpty: (result: any) => boolean;
export declare class RetryError extends Error {
    readonly lastError: Error;
    constructor(message: string, lastError: Error);
}
export declare class NotRetryableError extends Error {
}
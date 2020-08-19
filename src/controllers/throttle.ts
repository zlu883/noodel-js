import NoodelView from '../types/NoodelView';

export function throttle(noodel: NoodelView, key: string, func: () => any, interval: number) {
    if (noodel.throttleMap.get(key)) return;

    func();

    noodel.throttleMap.set(key, true);

    setTimeout(() => {
        noodel.throttleMap.set(key, false);
    }, interval);
}

/**
 * Execute the given function after the interval, overriding previous
 * occurrences with the same key. If interval is 0, will override and execute immediately.
 */
export function debounce(noodel: NoodelView, key: string, func: () => any, interval: number) {
    let timeoutId = noodel.debounceMap.get(key);
    
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    if (interval <= 0) {
        func();
    }
    else {
        noodel.debounceMap.set(key, setTimeout(() => {
            func();
        }, interval));
    }
}
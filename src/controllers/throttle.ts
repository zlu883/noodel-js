import NoodelState from '../types/NoodelState';

export function throttle(noodel: NoodelState, key: string, func: () => any, interval: number) {
    if (noodel.r.throttleMap.get(key)) return;

    func();

    noodel.r.throttleMap.set(key, true);

    setTimeout(() => {
        noodel.r.throttleMap.set(key, false);
    }, interval);
}

/**
 * Execute the given function after the interval, overriding previous
 * occurrences with the same key. If interval is 0, will override and execute immediately.
 */
export function debounce(noodel: NoodelState, key: string, func: () => any, interval: number) {
    let timeoutId = noodel.r.debounceMap.get(key);
    
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    if (interval <= 0) {
        func();
    }
    else {
        noodel.r.debounceMap.set(key, setTimeout(() => {
            func();
        }, interval));
    }
}
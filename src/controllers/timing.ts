/* Module for throttle and debounce functions. */

import NoodelState from '../types/NoodelState';

/**
 * Force the given function to execute only once within the given interval
 * regardless how many times it is called.
 */
export function throttle(noodel: NoodelState, key: string, func: () => any, interval: number) {
    let throttleMap = noodel.r.throttleMap;

    if (throttleMap.get(key)) return;

    func();

    throttleMap.set(key, true);

    setTimeout(() => {
        throttleMap.set(key, false);
    }, interval);
}

/**
 * Execute the given function after the interval, overriding previous
 * occurrences with the same key. If interval is 0, will override and execute immediately.
 */
export function debounce(noodel: NoodelState, key: string, func: () => any, interval: number) {
    let debounceMap = noodel.r.debounceMap;
    let timeoutId = debounceMap.get(key);
    
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    if (interval <= 0) {
        func();
    }
    else {
        debounceMap.set(key, setTimeout(() => {
            func();
        }, interval));
    }
}
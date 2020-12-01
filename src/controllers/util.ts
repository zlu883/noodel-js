/* Module for generic utility functions. */

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

export function throwError(message: string) {
    throw new Error(`[Noodel error] ${message}`);
}

/**
 * Forces a layout reflow on browsers by doing a computed property access.
 * Some browsers have an issue with transform/opacity transitions 
 * such that the rendering will glitch if the property is changed midway
 * during an ongoing transition. Forcing a reflow when a new transition is
 * expected eliminates the problem.
 * 
 * Also useful when you need to force the browser to apply style changes
 * after updates in order to prepare for further changes.
 */
export function forceReflow() {
    document.body.getBoundingClientRect();
}
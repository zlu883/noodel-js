import NoodelState from '../types/NoodelState';
import { findNoodeViewModel } from './id-register';
import NoodeState from '../types/NoodeState';
import { nextTick } from 'vue';
import { syncHashToFocalNoode } from './noodel-routing';

function queueEvent(noodel: NoodelState, ev: () => any) {
    if (noodel.eventQueue.length === 0) {
        nextTick(() => flushEventQueue(noodel));
    }

    noodel.eventQueue.push(ev);
}

function flushEventQueue(noodel: NoodelState) {
    for (let i = 0; i < noodel.eventQueue.length; i++) {
        noodel.eventQueue[i]();
    }

    noodel.eventQueue = [];
}

export function queueEnterInspectMode(noodel: NoodelState, focalNoode: NoodeState) {
    if (typeof noodel.options.onEnterInspectMode === 'function') {
        let vm = findNoodeViewModel(noodel, focalNoode.id);
        queueEvent(noodel, () => noodel.options.onEnterInspectMode(vm));
    }
}

export function queueExitInspectMode(noodel: NoodelState, focalNoode: NoodeState) {
    if (typeof noodel.options.onExitInspectMode === 'function') {
        let vm = findNoodeViewModel(noodel, focalNoode.id);
        queueEvent(noodel, () => noodel.options.onExitInspectMode(vm));
    }
}

/**
 * Triggers events and sync hash if the focal noode (and maybe also focal parent) have changed.
 * Does nothing if prev equals current.
 */
export function handleFocalNoodeChange(noodel: NoodelState, prev: NoodeState, current: NoodeState) {

    if (!prev && !current) return;
    if (prev && current && prev.id === current.id) return;

    syncHashToFocalNoode(noodel);

    let prevNoode = prev ? findNoodeViewModel(noodel, prev.id) : null;
    let currentNoode = current ? findNoodeViewModel(noodel, current.id) : null;

    if (prev && typeof prev.options.onExitFocus === 'function') {
        queueEvent(noodel, () => prev.options.onExitFocus(prevNoode, currentNoode));
    }

    if (current && typeof current.options.onEnterFocus === 'function') {
        queueEvent(noodel, () => current.options.onEnterFocus(currentNoode, prevNoode));
    }

    if (typeof noodel.options.onFocalNoodeChange === 'function') {
        queueEvent(noodel, () => noodel.options.onFocalNoodeChange(currentNoode, prevNoode));
    }

    let prevParent = prev ? prev.parent : null;
    let currentParent = current ? current.parent : null;

    if (!prevParent && !currentParent) return;
    if (prevParent && currentParent && prevParent.id === currentParent.id) return;

    let prevParentNoode = prevParent ? findNoodeViewModel(noodel, prevParent.id) : null;
    let currentParentNoode = currentParent ? findNoodeViewModel(noodel, currentParent.id) : null;

    if (prevParent && typeof prevParent.options.onChildrenExitFocus === 'function') {
        queueEvent(noodel, () => prevParent.options.onChildrenExitFocus(prevParentNoode, currentParentNoode));
    }

    if (currentParent && typeof currentParent.options.onChildrenEnterFocus === 'function') {
        queueEvent(noodel, () => currentParent.options.onChildrenEnterFocus(currentParentNoode, prevParentNoode));
    }

    if (typeof noodel.options.onFocalParentChange === 'function') {
        queueEvent(noodel, () => noodel.options.onFocalParentChange(currentParentNoode, prevParentNoode));
    }
}
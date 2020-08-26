import NoodelView from '../types/NoodelView';
import { findNoodeViewModel } from './id-register';
import NoodeView from '../types/NoodeView';
import Vue from 'vue';
import { syncHashToFocalNoode } from './noodel-routing';

function queueEvent(noodel: NoodelView, ev: () => any) {
    if (noodel.eventQueue.length === 0) {
        Vue.nextTick(() => flushEventQueue(noodel));
    }

    noodel.eventQueue.push(ev);
}

function flushEventQueue(noodel: NoodelView) {
    for (let i = 0; i < noodel.eventQueue.length; i++) {
        noodel.eventQueue[i]();
    }

    noodel.eventQueue = [];
}

export function queueEnterInspectMode(noodel: NoodelView, focalNoode: NoodeView) {
    if (typeof noodel.options.onEnterInspectMode === 'function') {
        let vm = findNoodeViewModel(noodel, focalNoode.id);
        queueEvent(noodel, () => noodel.options.onEnterInspectMode(vm));
    }
}

export function queueExitInspectMode(noodel: NoodelView, focalNoode: NoodeView) {
    if (typeof noodel.options.onExitInspectMode === 'function') {
        let vm = findNoodeViewModel(noodel, focalNoode.id);
        queueEvent(noodel, () => noodel.options.onExitInspectMode(vm));
    }
}

/**
 * Triggers events and sync hash if the focal noode (and maybe also focal parent) have changed.
 * Does nothing if prev equals current.
 */
export function handleFocalNoodeChange(noodel: NoodelView, prev: NoodeView, current: NoodeView) {

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
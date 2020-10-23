import NoodelState from '../types/NoodelState';
import NoodeState from '../types/NoodeState';
import { nextTick } from 'vue';
import { syncHashToFocalNoode } from './noodel-routing';

function queueEvent(noodel: NoodelState, ev: Function) {
    if (noodel.r.eventQueue.length === 0) {
        nextTick(() => flushEventQueue(noodel));
    }

    noodel.r.eventQueue.push(ev);
}

function flushEventQueue(noodel: NoodelState) {
    for (let i = 0; i < noodel.r.eventQueue.length; i++) {
        noodel.r.eventQueue[i]();
    }

    noodel.r.eventQueue = [];
}

export function queueEnterInspectMode(noodel: NoodelState) {
    noodel.r.eventListeners.get('enterInspectMode').forEach(l => queueEvent(noodel, l));        
}

export function queueExitInspectMode(noodel: NoodelState) {
    noodel.r.eventListeners.get('exitInspectMode').forEach(l => queueEvent(noodel, l));  
}

/**
 * Triggers events and sync hash if the focal noode (and maybe also focal parent) have changed.
 * Does nothing if prev equals current.
 */
export function handleFocalNoodeChange(noodel: NoodelState, prev: NoodeState, current: NoodeState) {

    if (!prev && !current) return;
    if (prev && current && prev.id === current.id) return;

    syncHashToFocalNoode(noodel);

    let prevNoode = prev ? prev.r.vm : null;
    let currentNoode = current ? current.r.vm : null;

    prev.r.eventListeners.get('exitFocus').forEach(l => {
        queueEvent(noodel, () => l(currentNoode));
    });

    current.r.eventListeners.get('enterFocus').forEach(l => {
        queueEvent(noodel, () => l(prevNoode));
    });

    noodel.r.eventListeners.get('focalNoodeChange').forEach(l => {
        queueEvent(noodel, () => l(currentNoode, prevNoode));
    });

    let prevParent = prev ? prev.parent : null;
    let currentParent = current ? current.parent : null;

    if (!prevParent && !currentParent) return;
    if (prevParent && currentParent && prevParent.id === currentParent.id) return;

    let prevParentNoode = prevParent ? prevParent.r.vm : null;
    let currentParentNoode = currentParent ? currentParent.r.vm : null;

    prevParent.r.eventListeners.get('childrenExitFocus').forEach(l => {
        queueEvent(noodel, () => l(currentParentNoode));
    });

    currentParent.r.eventListeners.get('childrenEnterFocus').forEach(l => {
        queueEvent(noodel, () => l(prevParentNoode));
    });

    noodel.r.eventListeners.get('focalParentChange').forEach(l => {
        queueEvent(noodel, () => l(currentParentNoode, prevParentNoode));
    });
}
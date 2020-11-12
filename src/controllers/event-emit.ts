import NoodelState from '../types/NoodelState';
import NodeState from '../types/NodeState';
import { nextTick } from 'vue';
import { syncHashToFocalNode } from './noodel-routing';

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

export function queueMount(noodel: NoodelState) {
    noodel.r.eventListeners.get('mount').forEach(l => queueEvent(noodel, l));        
}

export function queueEnterInspectMode(noodel: NoodelState) {
    noodel.r.eventListeners.get('enterInspectMode').forEach(l => queueEvent(noodel, l));        
}

export function queueExitInspectMode(noodel: NoodelState) {
    noodel.r.eventListeners.get('exitInspectMode').forEach(l => queueEvent(noodel, l));  
}

/**
 * Triggers events and sync hash if the focal node (and maybe also focal parent) have changed.
 * Does nothing if prev equals current.
 */
export function handleFocalNodeChange(noodel: NoodelState, prev: NodeState, current: NodeState) {

    if (!prev && !current) return;
    if (prev && current && prev.id === current.id) return;

    syncHashToFocalNode(noodel);

    let prevNode = prev ? prev.r.vm : null;
    let currentNode = current ? current.r.vm : null;

    if (prev) {
        prev.r.eventListeners.get('exitFocus').forEach(l => {
            queueEvent(noodel, () => l(currentNode));
        });
    }

    if (current) {
        current.r.eventListeners.get('enterFocus').forEach(l => {
            queueEvent(noodel, () => l(prevNode));
        });
    }

    noodel.r.eventListeners.get('focalNodeChange').forEach(l => {
        queueEvent(noodel, () => l(currentNode, prevNode));
    });

    let prevParent = prev ? prev.parent : null;
    let currentParent = current ? current.parent : null;

    if (!prevParent && !currentParent) return;
    if (prevParent && currentParent && prevParent.id === currentParent.id) return;

    let prevParentNode = prevParent ? prevParent.r.vm : null;
    let currentParentNode = currentParent ? currentParent.r.vm : null;

    if (prevParent) {
        prevParent.r.eventListeners.get('childrenExitFocus').forEach(l => {
            queueEvent(noodel, () => l(currentParentNode));
        });
    }

    if (currentParent) {
        currentParent.r.eventListeners.get('childrenEnterFocus').forEach(l => {
            queueEvent(noodel, () => l(prevParentNode));
        });
    }

    noodel.r.eventListeners.get('focalParentChange').forEach(l => {
        queueEvent(noodel, () => l(currentParentNode, prevParentNode));
    });
}
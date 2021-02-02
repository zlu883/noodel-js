/* Module for queueing and emitting events. */

import NoodelState from '../types/NoodelState';
import NodeState from '../types/NodeState';
import { nextTick } from 'vue';

function queueEvent(noodel: NoodelState, ev: Function) {
    if (noodel.r.eventQueue.length === 0) {
        // triple Vue nextTick so that events are in sync with Noodel's nextTick
        nextTick(() => 
        nextTick(() => 
        nextTick(() => flushEventQueue(noodel))));
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

export function queueFocalParentChange(noodel: NoodelState, prevParent: NodeState, currentParent: NodeState) {
    let prevParentVm = prevParent ? prevParent.r.vm : null;
    let currentParentVm = currentParent ? currentParent.r.vm : null;

    if (prevParent) {
        prevParent.r.eventListeners.get('childrenExitFocus').forEach(l => {
            queueEvent(noodel, () => l(currentParentVm));
        });
    }

    if (currentParent) {
        currentParent.r.eventListeners.get('childrenEnterFocus').forEach(l => {
            queueEvent(noodel, () => l(prevParentVm));
        });
    }

    noodel.r.eventListeners.get('focalParentChange').forEach(l => {
        queueEvent(noodel, () => l(currentParentVm, prevParentVm));
    });
}

export function queueFocalNodeChange(noodel: NoodelState, prev: NodeState, current: NodeState) {
    let prevVm = prev ? prev.r.vm : null;
    let currentVm = current ? current.r.vm : null;

    if (prev) {
        prev.r.eventListeners.get('exitFocus').forEach(l => {
            queueEvent(noodel, () => l(currentVm));
        });
    }

    if (current) {
        current.r.eventListeners.get('enterFocus').forEach(l => {
            queueEvent(noodel, () => l(prevVm));
        });
    }

    noodel.r.eventListeners.get('focalNodeChange').forEach(l => {
        queueEvent(noodel, () => l(currentVm, prevVm));
    });
}
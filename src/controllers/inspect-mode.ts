import NoodelState from '../types/NoodelState';
import { getActiveChild } from './getters';
import { cancelPan } from './noodel-pan';
import { queueEnterInspectMode, queueExitInspectMode } from './event-emit';

export function enterInspectMode(noodel: NoodelState) {
    
    if (noodel.isInInspectMode) return;
    
    cancelPan(noodel);

    // touch-action: auto on focal node under inspect mode
    // interferes with Hammer's recognizers, so they must be disabled first
    noodel.r.hammerJsInstance.get('pan').set({enable: false});
    
    let focalNode = getActiveChild(noodel.focalParent);
    
    focalNode.isInInspectMode = true;
    noodel.isInInspectMode = true;

    queueEnterInspectMode(noodel);
}

export function exitInspectMode(noodel: NoodelState) {

    if (!noodel.isInInspectMode) return;

    noodel.r.hammerJsInstance.get('pan').set({enable: true});

    // unset selection
    const sel = window.getSelection ? window.getSelection() : document.getSelection();

    if (sel) {
        if (sel.removeAllRanges) {
            sel.removeAllRanges();
        } 
        else if (sel.empty) {
            sel.empty();
        }
    }

    let focalNode = getActiveChild(noodel.focalParent);
    
    focalNode.isInInspectMode = false;
    noodel.isInInspectMode = false;

    queueExitInspectMode(noodel);
}
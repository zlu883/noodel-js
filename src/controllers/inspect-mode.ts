import NoodelState from '../types/NoodelState';
import { getActiveChild } from './getters';
import { cancelPan } from './noodel-pan';
import { queueEnterInspectMode, queueExitInspectMode } from './event-emit';
import { checkContentOverflow } from './noodel-align';
import { nextTick } from 'vue';

export function enterInspectMode(noodel: NoodelState) {
    
    if (noodel.isInInspectMode) return;
    
    cancelPan(noodel);

    // touch-action: auto on focal noode under inspect mode
    // interferes with Hammer's recognizers, so they must be disabled first
    noodel.r.hammerJsInstance.get('pan').set({enable: false});
    
    let focalNoode = getActiveChild(noodel.focalParent);
    
    focalNoode.hasOverflowLeft = false;
    focalNoode.hasOverflowRight = false;
    focalNoode.hasOverflowTop = false;
    focalNoode.hasOverflowBottom = false;
    focalNoode.isInInspectMode = true;
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

    let focalNoode = getActiveChild(noodel.focalParent);
    
    nextTick(() => checkContentOverflow(noodel, focalNoode));
    focalNoode.isInInspectMode = false;
    noodel.isInInspectMode = false;

    queueExitInspectMode(noodel);
}
import NoodelState from '../types/NoodelState';
import { getFocalNode } from './getters';
import { finalizePan } from './noodel-pan';
import { queueEnterInspectMode, queueExitInspectMode } from './event-emit';
import { disableBranchMove, disableTrunkMove, enableBranchMove, enableTrunkMove } from './noodel-animate';

export function enterInspectMode(noodel: NoodelState) {
    
    if (noodel.isInInspectMode) return;
    
    finalizePan(noodel);

    // stops any animations
    disableTrunkMove(noodel);
    disableBranchMove(noodel, noodel.focalParent);

    // touch-action: auto on focal node under inspect mode
    // interferes with Hammer's recognizers, so they must be disabled first
    noodel.r.hammerJsInstance.get('pan').set({enable: false});
    
    getFocalNode(noodel).isInInspectMode = true;
    noodel.isInInspectMode = true;

    queueEnterInspectMode(noodel);
}

export function exitInspectMode(noodel: NoodelState) {

    if (!noodel.isInInspectMode) return;

    enableTrunkMove(noodel);
    enableBranchMove(noodel.focalParent);

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

    getFocalNode(noodel).isInInspectMode = false;
    noodel.isInInspectMode = false;

    queueExitInspectMode(noodel);
}
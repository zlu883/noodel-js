import { setActiveChild, setFocalParent, hideActiveSubtree, showActiveSubtree } from "../controllers/noodel-mutate";
import NoodeState from '../types/NoodeState';
import NoodelState from '../types/NoodelState';
import { getActiveChild } from './getters';
import { alignTrunkToBranch, alignBranchToIndex } from './noodel-align';
import { forceReflow } from '../controllers/noodel-animate';
import { exitInspectMode } from './inspect-mode';
import { handleFocalNoodeChange } from './event-emit';
import { cancelPan } from './noodel-pan';

/**
 * Shifts the focal level by a level difference. If the difference is 0,
 * will align trunk to the current focal level.
 */
export function shiftFocalLevel(noodel: NoodelState, levelDiff: number) {

    let prevFocalNoode = noodel.r.panStartFocalNoode || getActiveChild(noodel.focalParent);
    
    noodel.r.panStartFocalNoode = null;

    if (!prevFocalNoode) return;

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    // if panning, cancel it
    if (noodel.r.panAxis === "trunk") {
        cancelPan(noodel);
    }

    let newFocalParent = findNewFocalParent(noodel, levelDiff);

    if (newFocalParent.id === noodel.focalParent.id) {
        // if unable to shift anymore in the target direction
        if (levelDiff < 0) {
            noodel.trunkStartReached = true;
        }
        else if (levelDiff > 0) {
            noodel.trunkEndReached = true;
        }
    }

    unsetLimitIndicators(noodel, 300);

    if (newFocalParent.id !== noodel.focalParent.id) {
        setFocalParent(noodel, newFocalParent);
    }
    
    alignTrunkToBranch(noodel, newFocalParent);
    forceReflow();

    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));
}

/**
 * Shifts the active noode in the focal branch by an index difference. If the difference
 * is 0, will align the branch to the current active noode.
 */
export function shiftFocalNoode(noodel: NoodelState, indexDiff: number) {
    
    let prevFocalNoode = noodel.r.panStartFocalNoode || getActiveChild(noodel.focalParent);
    
    noodel.r.panStartFocalNoode = null;

    if (!prevFocalNoode) return;

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    // if panning, cancel it
    if (noodel.r.panAxis === "branch") {
        cancelPan(noodel);
    }

    let targetIndex = noodel.focalParent.activeChildIndex + indexDiff;

    // clamp index to valid range
    if (targetIndex < 0) {
        targetIndex = 0;
    }
    else if (targetIndex >= noodel.focalParent.children.length) {
        targetIndex = noodel.focalParent.children.length - 1;
    }

    if (targetIndex === noodel.focalParent.activeChildIndex) {
        // if unable to shift anymore in the target direction
        if (indexDiff < 0) {
            noodel.branchStartReached = true;
        }
        else if (indexDiff > 0) {
            noodel.branchEndReached = true;
        }
    }

    unsetLimitIndicators(noodel, 300);

    if (targetIndex !== noodel.focalParent.activeChildIndex) {
        hideActiveSubtree(getActiveChild(noodel.focalParent));
        setActiveChild(noodel.focalParent, targetIndex);
        showActiveSubtree(noodel, noodel.focalParent, noodel.options.visibleSubtreeDepth, noodel.options.subtreeDebounceInterval);
    }
    
    alignBranchToIndex(noodel.focalParent, targetIndex);
    forceReflow();

    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));
}

/**
 * Jumps to a specific noode in the tree, realigning all affected branches and trunk
 * if necessary. Should not expose to input handlers/API methods, use doJumpNavigation instead.
 */
export function alignNoodelOnJump(noodel: NoodelState, target: NoodeState) {

    // if panning, cancel it
    if (noodel.r.panAxis !== null) {
        cancelPan(noodel);
    }

    // No need to jump if target is already focal noode
    if (target.id === noodel.focalParent.children[noodel.focalParent.activeChildIndex].id) {
        return;
    }

    // finds the nearest visible branch
    let nearestVisibleBranchParent = target.parent;

    while (!nearestVisibleBranchParent.isBranchVisible) {
        nearestVisibleBranchParent = nearestVisibleBranchParent.parent;
    }

    hideActiveSubtree(getActiveChild(nearestVisibleBranchParent));

    // adjusts the active child of ancestors up to the nearest visible branch to point to target
    let nextParent = target.parent;
    let nextActiveChildIndex = target.index;

    while (true) {
        if (nextParent.activeChildIndex !== nextActiveChildIndex) {
            setActiveChild(nextParent, nextActiveChildIndex);
            alignBranchToIndex(nextParent, nextActiveChildIndex);
        }

        if (nextParent.id === nearestVisibleBranchParent.id) {
            break;
        }

        // shows the intermediate branch that was not visible, should happen after alignBranch
        // to prevent triggering a transition that will be ignored by the browser
        nextParent.isBranchVisible = true;

        nextActiveChildIndex = nextParent.index;
        nextParent = nextParent.parent;
    }

    showActiveSubtree(noodel, target.parent, noodel.options.visibleSubtreeDepth);

    if (target.parent.id !== noodel.focalParent.id) {
        setFocalParent(noodel, target.parent);
        alignTrunkToBranch(noodel, target.parent);
    }
    
    forceReflow();
}

/**
 * Jump navigation wrapper for use by input handlers/API methods, taking 
 * care of side effects.
 */
export function doJumpNavigation(noodel: NoodelState, target: NoodeState) {

    clearTimeout(noodel.r.limitIndicatorTimeout);

    let prevFocalNoode = getActiveChild(noodel.focalParent);

    if (!prevFocalNoode) return;

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    alignNoodelOnJump(noodel, target);
    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));
}

export function unsetLimitIndicators(noodel: NoodelState, wait: number) {

    function unset() {
        forceReflow();
        noodel.branchStartReached = false;
        noodel.branchEndReached = false;
        noodel.trunkStartReached = false;
        noodel.trunkEndReached = false;
    }

    if (wait <= 0) {
        clearTimeout(noodel.r.limitIndicatorTimeout);
        noodel.r.limitIndicatorTimeout = null;
        unset();
    }
    else {
        clearTimeout(noodel.r.limitIndicatorTimeout);
        noodel.r.limitIndicatorTimeout = setTimeout(unset, 300);
    }
}

/**
 * Finds the new focal parent to move to when the a focal level change should occur
 * on the current active tree. If levelDiff goes beyond the existing
 * branches, will return the furthest branch possible, i.e. the root or the deepest branch.
 */
function findNewFocalParent(noodel: NoodelState, levelDiff: number): NoodeState {

    let nextParent = noodel.focalParent;

    if (levelDiff < 0) {
        for (let i = 0; i > levelDiff; i--) {
            if (nextParent.parent) {
                nextParent = nextParent.parent;
            }
            else {
                break;
            }
        }
    }
    else if (levelDiff > 0) {
        for (let i = 0; i < levelDiff; i++) {
            if (getActiveChild(nextParent).activeChildIndex !== null) {
                nextParent = getActiveChild(nextParent);
            }
            else {
                break;
            }
        }
    }

    return nextParent;
}
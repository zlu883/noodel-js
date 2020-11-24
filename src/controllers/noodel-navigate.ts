import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { getActiveChild, getFocalNode, isPanning, isPanningBranch, isPanningTrunk } from './getters';
import { forceReflow } from '../controllers/noodel-animate';
import { exitInspectMode } from './inspect-mode';
import { queueFocalNodeChange, queueFocalParentChange } from './event-emit';
import { finalizePan } from './noodel-pan';
import { traverseActiveDescendents } from './noodel-traverse';
import { syncHashToFocalNode } from './noodel-routing';

/**
 * Changes the focal parent of the noodel, emit focal change events for
 * focal parent AND focal node, and sync hash. This only changes the focal state, will not toggle
 * the visible tree.
 */
export function setFocalParent(noodel: NoodelState, newParent: NodeState) {
    if (newParent === noodel.focalParent) return;

    let prevParent = noodel.focalParent;

    prevParent.isFocalParent = false;
    newParent.isFocalParent = true;
    noodel.focalParent = newParent;
    noodel.focalLevel = newParent.level + 1;

    queueFocalParentChange(noodel, prevParent, newParent);
    queueFocalNodeChange(noodel, getActiveChild(prevParent), getActiveChild(newParent));
    syncHashToFocalNode(noodel);
}

/**
 * Changes the active child of the parent to the given index (can be null to unset active child).
 * If the parent is focal, will emit focal node change events and sync hash.
 * This only changes the active state, will not toggle the visible tree.
 */
export function setActiveChild(noodel: NoodelState, parent: NodeState, index: number | null) {
    if (index === parent.activeChildIndex) return;

    let prev = getActiveChild(parent);

    if (prev) prev.isActive = false;

    parent.activeChildIndex = index;

    let current = getActiveChild(parent);

    if (current) current.isActive = true;

    // you set index to null only when deleting every child
    // if this happens to the focal branch, it must change and 
    // should not emit events in that case
    if (parent.isFocalParent && index !== null) {
        queueFocalNodeChange(noodel, prev, current);
        syncHashToFocalNode(noodel);
    }
}

export function showActiveSubtree(origin: NodeState, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isBranchVisible = true;
    }, true, false, depth);
}

export function hideActiveSubtree(origin: NodeState, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isBranchVisible = false;
    }, true, false, depth);
}

/**
 * Shifts the focal level by a level difference. If the difference is 0,
 * will align trunk to the current focal level.
 */
export function shiftFocalLevel(noodel: NoodelState, levelDiff: number) {

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    if (isPanningTrunk(noodel)) {
        finalizePan(noodel);
    }

    let newFocalParent = findNewFocalParent(noodel, levelDiff);

    if (newFocalParent === noodel.focalParent) {
        // if unable to shift anymore in the target direction
        if (levelDiff < 0) {
            noodel.trunkStartReached = true;
            queueUnsetLimitIndicator(noodel, 300);
        }
        else if (levelDiff > 0) {
            noodel.trunkEndReached = true;
            queueUnsetLimitIndicator(noodel, 300);
        }
    }
    else {
        hideActiveSubtree(newFocalParent);
        setFocalParent(noodel, newFocalParent);
        showActiveSubtree(noodel.root, noodel.focalLevel + noodel.options.visibleSubtreeDepth);
        forceReflow();
    }
}

/**
 * Shifts the active node in the focal branch by an index difference. If the difference
 * is 0, will align the branch to the current active node.
 */
export function shiftFocalNode(noodel: NoodelState, indexDiff: number) {

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    if (isPanningBranch(noodel)) {
        finalizePan(noodel);
    }

    let focalParent = noodel.focalParent;
    let targetIndex = focalParent.activeChildIndex + indexDiff;

    // clamp index to valid range
    if (targetIndex < 0) {
        targetIndex = 0;
    }
    else if (targetIndex >= focalParent.children.length) {
        targetIndex = focalParent.children.length - 1;
    }

    if (targetIndex === focalParent.activeChildIndex) {
        // if unable to shift anymore in the target direction
        if (indexDiff < 0) {
            noodel.branchStartReached = true;
            queueUnsetLimitIndicator(noodel, 300);
        }
        else if (indexDiff > 0) {
            noodel.branchEndReached = true;
            queueUnsetLimitIndicator(noodel, 300);
        }
    }
    else {
        hideActiveSubtree(getActiveChild(focalParent));
        setActiveChild(noodel, focalParent, targetIndex);
        showActiveSubtree(focalParent, noodel.options.visibleSubtreeDepth);
        forceReflow();
    }
}

/**
 * Jump to a specific node in the tree.
 */
export function jumpTo(noodel: NoodelState, target: NodeState) {

    // No need to jump if target is already focal node
    if (target === getFocalNode(noodel)) {
        return;
    }

    queueUnsetLimitIndicator(noodel, 0);

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    finalizePan(noodel);

    let nextParent = target.parent;
    let nextActiveChildIndex = target.index;

    // first establish the focal parent and nodes so that events are triggered properly,
    // the order here is important so events won't be triggered twice
    setActiveChild(noodel, nextParent, nextActiveChildIndex);
    setFocalParent(noodel, nextParent);

    // adjusts the active child of ancestors up to the nearest visible branch to point to target
    while (true) {
        if (nextParent.isBranchVisible) { // has reached nearest visible branch
            hideActiveSubtree(nextParent);
            setActiveChild(noodel, nextParent, nextActiveChildIndex);
            showActiveSubtree(noodel.root, noodel.focalLevel + noodel.options.visibleSubtreeDepth);
            break; 
        }
        
        setActiveChild(noodel, nextParent, nextActiveChildIndex);
        nextActiveChildIndex = nextParent.index;
        nextParent = nextParent.parent;
    }
    
    forceReflow();
}

/**
 * Wait for the specified time before unsetting the limit indicators.
 * Will replace previous instances of the wait.
 */
export function queueUnsetLimitIndicator(noodel: NoodelState, wait: number) {

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
        noodel.r.limitIndicatorTimeout = setTimeout(unset, wait);
    }
}

/**
 * Finds the new focal parent to move to when the a focal level change should occur
 * on the current active tree. If levelDiff goes beyond the limit, 
 * will return the furthest parent possible, i.e. the root or the deepest branch.
 */
function findNewFocalParent(noodel: NoodelState, levelDiff: number): NodeState {

    let target = noodel.focalParent;

    if (levelDiff < 0) {
        for (let i = 0; i > levelDiff; i--) {
            let next = target.parent;

            if (next) {
                target = next;
            }
            else {
                break;
            }
        }
    }
    else if (levelDiff > 0) {
        for (let i = 0; i < levelDiff; i++) {
            let next = getActiveChild(target);

            if (next.activeChildIndex !== null) {
                target = next;
            }
            else {
                break;
            }
        }
    }

    return target;
}
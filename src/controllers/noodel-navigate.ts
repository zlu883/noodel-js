import { setActiveChild, setFocalParent, hideActiveSubtree, showActiveSubtree } from "../controllers/noodel-mutate";
import { NoodelAxis } from '../types/NoodelAxis';
import NoodeState from '../types/NoodeState';
import NoodelState from '../types/NoodelState';
import { getActiveChild, getFocalWidth, getFocalHeight } from './getters';
import { alignTrunkToBranch, alignBranchToIndex } from './noodel-align';
import { forceReflow } from '../controllers/noodel-animate';
import { exitInspectMode } from './inspect-mode';
import { handleFocalNoodeChange } from './event-emit';

/**
 * Core function for panning the trunk to a specified position, changing the focal parent
 * or set limit indicators as necessary. Makes no assumption on the magnitude of the movement, 
 * and aims to be correct regardless of the target offset, bounding the movement to the possible limits.
 */
function panTrunk(noodel: NoodelState, targetOffset: number) {

    let offsetDiff = targetOffset - noodel.trunkOffsetAligned;
    let targetFocalParent = noodel.focalParent;
    let alignedOffsetDiff = 0;

    noodel.showRightLimit = false;
    noodel.showLeftLimit = false;

    // takes the offset difference, reduce it branch by branch to find the target focal parent
    if (offsetDiff < 0) { // revealing right
        while (getActiveChild(targetFocalParent).activeChildIndex !== null) {
            offsetDiff += targetFocalParent.branchSize / 2;
            
            if (offsetDiff >= 0) break;

            alignedOffsetDiff -= targetFocalParent.branchSize / 2;
            targetFocalParent = getActiveChild(targetFocalParent);
            alignedOffsetDiff -= targetFocalParent.branchSize / 2;
            
            offsetDiff += targetFocalParent.branchSize / 2;
        }

        // check if diff exceeds trunk offset limit
        if (offsetDiff < 0) {
            noodel.showRightLimit = true;
            targetOffset -= offsetDiff; // adjust target offset to boundary
        }
    }
    else if (offsetDiff > 0) { // revealing left
        while (targetFocalParent.parent !== null) {

            offsetDiff -= targetFocalParent.branchSize / 2;
            
            if (offsetDiff <= 0) break;

            alignedOffsetDiff += targetFocalParent.branchSize / 2;
            targetFocalParent = targetFocalParent.parent;
            alignedOffsetDiff += targetFocalParent.branchSize / 2;
            
            offsetDiff -= targetFocalParent.branchSize / 2;
        }

        // check if diff exceeds trunk offset limit
        if (offsetDiff > 0) {
            noodel.showLeftLimit = true;
            targetOffset -= offsetDiff; // adjust target offset to boundary
        }
    }

    if (targetFocalParent.id !== noodel.focalParent.id) {
        setFocalParent(noodel, targetFocalParent);
        noodel.trunkOffsetAligned += alignedOffsetDiff;
    }

    noodel.trunkOffset = targetOffset;
}

/**
 * Core function for panning the focal branch to a specified position.
 * Changes active noode or set limit indicators as necessary.
 * Makes no assumption on the magnitude of the movement, and aims to be correct
 * regardless of the target offset, bounding the movement to the possible limits.
 */
function panFocalBranch(noodel: NoodelState, targetOffset: number) {

    let offsetDiff = targetOffset - noodel.focalParent.childBranchOffsetAligned;
    let targetIndex = noodel.focalParent.activeChildIndex;
    let alignedOffsetDiff = 0;

    noodel.showTopLimit = false;
    noodel.showBottomLimit = false;

    // takes the offset difference, reduce it noode by noode to find the target index
    if (offsetDiff < 0) { // revealing bottom
        while (targetIndex < noodel.focalParent.children.length - 1) {
            offsetDiff += noodel.focalParent.children[targetIndex].size / 2;
             
            if (offsetDiff >= 0) break;

            alignedOffsetDiff -= noodel.focalParent.children[targetIndex].size / 2;
            targetIndex++;
            alignedOffsetDiff -= noodel.focalParent.children[targetIndex].size / 2;
            
            offsetDiff += noodel.focalParent.children[targetIndex].size / 2;
        }

        // check if diff exceeds branch offset limit
        if (offsetDiff < 0) { // revealing top
            noodel.showBottomLimit = true;
            targetOffset -= offsetDiff; // adjust target offset to boundary
        }
    }
    else if (offsetDiff > 0) {
        while (targetIndex > 0) {
            offsetDiff -= noodel.focalParent.children[targetIndex].size / 2;
            
            if (offsetDiff <= 0) break;

            alignedOffsetDiff += noodel.focalParent.children[targetIndex].size / 2;
            targetIndex--;
            alignedOffsetDiff += noodel.focalParent.children[targetIndex].size / 2;
            
            offsetDiff -= noodel.focalParent.children[targetIndex].size / 2;
        }

        // check if diff exceeds branch offset limit
        if (offsetDiff > 0) {
            noodel.showTopLimit = true;
            targetOffset -= offsetDiff; // adjust target offset to boundary
        }
    }

    if (targetIndex !== noodel.focalParent.activeChildIndex) {
        hideActiveSubtree(getActiveChild(noodel.focalParent));
        setActiveChild(noodel, noodel.focalParent, targetIndex);
        showActiveSubtree(noodel, noodel.focalParent, noodel.options.visibleSubtreeDepth, noodel.options.subtreeDebounceInterval);
        noodel.focalParent.childBranchOffsetAligned += alignedOffsetDiff; 
    }

    noodel.focalParent.childBranchOffset = targetOffset;
}

export function startPan(noodel: NoodelState, ev: HammerInput) {

    clearTimeout(noodel.limitIndicatorTimeout);

    let currentFocalNoode = getActiveChild(noodel.focalParent);

    if (!currentFocalNoode) return;
    noodel.panStartFocalNoode = currentFocalNoode;

    if (ev.direction === Hammer.DIRECTION_LEFT || ev.direction === Hammer.DIRECTION_RIGHT) {
        noodel.panAxis = "trunk";

        // finds the current trunk offset with getBoundingClientRect, even if trunk is in transition,
        // taking into account the canvas's position as it may not be full page
        let currentTrunkOffset = noodel.trunkEl.getBoundingClientRect().left - noodel.canvasEl.getBoundingClientRect().left - getFocalWidth(noodel);

        noodel.applyTrunkMove = false;
        noodel.trunkOffset = currentTrunkOffset;
        noodel.panOffsetOriginTrunk = currentTrunkOffset;
    }
    else if (ev.direction === Hammer.DIRECTION_UP || ev.direction === Hammer.DIRECTION_DOWN) {
        noodel.panAxis = "branch";

        // finds the current focal branch offset with getBoundingClientRect, even if branch is in transition,
        // taking into account the canvas's position as it may not be full page
        let currentFocalBranchOffset = noodel.focalParent.branchEl.getBoundingClientRect().top - noodel.canvasEl.getBoundingClientRect().top - getFocalHeight(noodel);

        noodel.focalParent.applyBranchMove = false;
        noodel.focalParent.childBranchOffset = currentFocalBranchOffset;
        noodel.panOffsetOriginFocalBranch = currentFocalBranchOffset;
    }
}

export function updatePan(noodel: NoodelState, ev: HammerInput) {

    if (noodel.panAxis === "trunk") {
        updateSwipeVelocityBuffer(noodel, ev.velocityX, (ev as any).timeStamp);
        panTrunk(noodel, noodel.panOffsetOriginTrunk + (ev.deltaX * noodel.options.swipeMultiplierTrunk));     
    }
    else if (noodel.panAxis === "branch") {
        updateSwipeVelocityBuffer(noodel, ev.velocityY, (ev as any).timeStamp);
        panFocalBranch(noodel, noodel.panOffsetOriginFocalBranch + (ev.deltaY * noodel.options.swipeMultiplierBranch));
    }
}

export function releasePan(noodel: NoodelState, ev: HammerInput) {

    if (noodel.panAxis === "trunk") {
        noodel.panOffsetOriginTrunk = null;
        noodel.panAxis = null; // before shiftFocalLevel to prevent extra cancelPan check
        updateSwipeVelocityBuffer(noodel, ev.velocityX, (ev as any).timeStamp);
        shiftFocalLevel(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierTrunk));
    }
    else if (noodel.panAxis === "branch") {
        noodel.panOffsetOriginFocalBranch = null;
        noodel.panAxis = null; // before shiftFocalNoode to prevent extra cancelPan check
        updateSwipeVelocityBuffer(noodel, ev.velocityY, (ev as any).timeStamp);
        shiftFocalNoode(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierBranch));
    }

    unsetLimitIndicators(noodel);
    clearSwipeVelocityBuffer(noodel);
}

export function cancelPan(noodel: NoodelState) {

    if (noodel.panAxis === null) return;

    if (noodel.panAxis === "trunk") {
        noodel.panOffsetOriginTrunk = null;
        noodel.panAxis = null;
        shiftFocalLevel(noodel, 0);
    }
    else if (noodel.panAxis === "branch") {
        noodel.panOffsetOriginFocalBranch = null;
        noodel.panAxis = null;
        shiftFocalNoode(noodel, 0);
    }

    unsetLimitIndicators(noodel);
    clearSwipeVelocityBuffer(noodel);
}

export function unsetLimitIndicators(noodel: NoodelState) {
    forceReflow();
    noodel.showTopLimit = false;
    noodel.showBottomLimit = false;
    noodel.showLeftLimit = false;
    noodel.showRightLimit = false;
}

/**
 * Shifts the focal level by a level difference. If the difference is 0,
 * will align trunk to the current focal level.
 */
export function shiftFocalLevel(noodel: NoodelState, levelDiff: number) {

    clearTimeout(noodel.limitIndicatorTimeout);

    let prevFocalNoode = noodel.panStartFocalNoode || getActiveChild(noodel.focalParent);
    
    noodel.panStartFocalNoode = null;

    if (!prevFocalNoode) return;

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    // if panning, cancel it
    if (noodel.panAxis === "trunk") {
        cancelPan(noodel);
    }

    let newFocalParent = findNewFocalParent(noodel, levelDiff);

    if (newFocalParent.id === noodel.focalParent.id) {
        // if unable to shift anymore in the target direction
        if (levelDiff < 0) {
            noodel.showLeftLimit = true;
        }
        else if (levelDiff > 0) {
            noodel.showRightLimit = true;
        }
    }

    noodel.limitIndicatorTimeout = setTimeout(() => unsetLimitIndicators(noodel), 300);

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
    
    clearTimeout(noodel.limitIndicatorTimeout);

    let prevFocalNoode = noodel.panStartFocalNoode || getActiveChild(noodel.focalParent);
    
    noodel.panStartFocalNoode = null;

    if (!prevFocalNoode) return;

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    // if panning, cancel it
    if (noodel.panAxis === "branch") {
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
            noodel.showTopLimit = true;
        }
        else if (indexDiff > 0) {
            noodel.showBottomLimit = true;
        }
    }

    noodel.limitIndicatorTimeout = setTimeout(() => unsetLimitIndicators(noodel), 300);

    if (targetIndex !== noodel.focalParent.activeChildIndex) {
        hideActiveSubtree(getActiveChild(noodel.focalParent));
        setActiveChild(noodel, noodel.focalParent, targetIndex);
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
    if (noodel.panAxis !== null) {
        cancelPan(noodel);
    }

    // No need to jump if target is already focal noode
    if (target.id === noodel.focalParent.children[noodel.focalParent.activeChildIndex].id) {
        return;
    }

    // finds the nearest visible branch
    let nearestVisibleBranchParent = target.parent;

    while (!nearestVisibleBranchParent.isChildrenVisible) {
        nearestVisibleBranchParent = nearestVisibleBranchParent.parent;
    }

    hideActiveSubtree(getActiveChild(nearestVisibleBranchParent));

    // adjusts the active child of ancestors up to the nearest visible branch to point to target
    let nextParent = target.parent;
    let nextActiveChildIndex = target.index;

    while (true) {
        if (nextParent.activeChildIndex !== nextActiveChildIndex) {
            setActiveChild(noodel, nextParent, nextActiveChildIndex);
            alignBranchToIndex(nextParent, nextActiveChildIndex);
        }

        if (nextParent.id === nearestVisibleBranchParent.id) {
            break;
        }

        // shows the intermediate branch that was not visible, should happen after alignBranch
        // to prevent triggering a transition that will be ignored by the browser
        nextParent.isChildrenVisible = true;

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

    clearTimeout(noodel.limitIndicatorTimeout);

    let prevFocalNoode = getActiveChild(noodel.focalParent);

    if (!prevFocalNoode) return;

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }

    alignNoodelOnJump(noodel, target);
    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));
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

/**
 * Calculate how many noodes to snap across depending on swipe velocity.
 * The current algorithm is adjusted based on velocities obtained 
 * from manual tests of swipe motions on mobile and desktop.
 * Can be further fine-tuned if necessary.
 */
function computeSnapCount(velocity: number, snapMultiplier: number) {
    let absVelocity = Math.abs(velocity) * snapMultiplier;

    if (absVelocity < 0.1) {
        return 0;
    }
    else if (absVelocity < 1) {
        return (velocity > 0) ? -1 : 1;
    }
    else {
        // count = 1.4 ln(velocity) + 1
        let count = Math.round((1.4 * Math.log(absVelocity) + 1));
        
        return (velocity > 0) ? -count : count;
    }
}

/**
 * The velocity values obtained from hammerjs is highly unstable and thus need
 * to be averaged out by capturing the last 10 velocities in a buffer.
 * 
 * There is also a 60ms threshold for detecting "settle" of the swipe movement.
 * If duration between two consecutive events exceed this threshold the buffer will be refreshed.
 * 
 * Direction change of the swipe movement will not cause a buffer refresh for now
 * to account for transient directional glitches in the swipe motion.
 */
function updateSwipeVelocityBuffer(noodel: NoodelState, velocity: number, timestamp: number) {
    if (noodel.lastPanTimestamp === null || timestamp - noodel.lastPanTimestamp < 60) {
        noodel.swipeVelocityBuffer.push(velocity);

        if (noodel.swipeVelocityBuffer.length > 10) {
            noodel.swipeVelocityBuffer.shift();
        }
    }
    else {
        noodel.swipeVelocityBuffer = [];
        noodel.swipeVelocityBuffer.push(velocity);
    }

    noodel.lastPanTimestamp = timestamp;
}

/**
 * Computes the average of the last 10 velocities.
 */
function computeSwipeVelocity(noodel: NoodelState) {
    let sum = 0;

    noodel.swipeVelocityBuffer.forEach(val => sum += val);

    return sum / noodel.swipeVelocityBuffer.length;
}

function clearSwipeVelocityBuffer(noodel: NoodelState) {
    noodel.lastPanTimestamp = null;
    noodel.swipeVelocityBuffer = [];
}
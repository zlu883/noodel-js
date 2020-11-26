/* Module for handling pan input and logic. */

import NoodelState from 'src/types/NoodelState';
import { getActiveChild, getAnchorOffsetBranch, getAnchorOffsetTrunk, isDeepestBranch, isFirstNode, isLastNode, isPanning, isPanningBranch, isPanningTrunk, isTopmostBranch } from './getters';
import { setActiveChild, setFocalParent } from './navigate';
import { NoodelAxis } from 'src/types/NoodelAxis';
import { Axis } from 'src/types/Axis';
import { shiftFocalLevel, shiftFocalNode, queueUnsetLimitIndicator } from './navigate';
import { enableBranchTransition, enableTrunkTransition, disableBranchTransition, disableTrunkTransition } from './transition';
import NodeState from '../types/NodeState';

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
    let swipeVelocityBuffer = noodel.r.swipeVelocityBuffer;
    let lastPanTimestamp = noodel.r.lastPanTimestamp;

    if (lastPanTimestamp === null || timestamp - lastPanTimestamp < 60) {
        swipeVelocityBuffer.push(velocity);

        if (swipeVelocityBuffer.length > 10) {
            swipeVelocityBuffer.shift();
        }
    }
    else {
        noodel.r.swipeVelocityBuffer = [velocity];
    }

    noodel.r.lastPanTimestamp = timestamp;
}

/**
 * Computes the average of the last 10 velocities.
 */
function computeSwipeVelocity(noodel: NoodelState) {
    let sum = 0;

    noodel.r.swipeVelocityBuffer.forEach(val => sum += val);

    return sum / noodel.r.swipeVelocityBuffer.length;
}

function clearSwipeVelocityBuffer(noodel: NoodelState) {
    noodel.r.lastPanTimestamp = null;
    noodel.r.swipeVelocityBuffer = [];
}

/**
 * Calculate how many nodes to snap across depending on swipe velocity.
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
        return (velocity > 0) ? 1 : -1;
    }
    else {
        let count = Math.round((1.4 * Math.log(absVelocity) + 1));

        return (velocity > 0) ? count : -count;
    }
}

/** 
 * Get the set of expected results if the given pan delta is applied to the trunk.
 */
function getPanResultsTrunk(noodel: NoodelState, delta: number): {
    targetFocalParent: NodeState,
    targetMoveOffset: number,
    trunkStartReached: boolean,
    trunkEndReached: boolean
} {
    let targetMoveOffset = noodel.trunkPanOffset;
    let targetFocalParent = noodel.focalParent;
    let targetFocalParentAnchorOffset = getAnchorOffsetTrunk(noodel, targetFocalParent);
    let trunkStartReached = false;
    let trunkEndReached = false;

    if (delta < 0) { // moving towards trunk axis start

        // makes it easier to reason with the signs
        delta = Math.abs(delta);

        while (true) {
            let projectedOffset = targetMoveOffset - delta;

            if (isTopmostBranch(targetFocalParent) && projectedOffset < 0) {
                trunkStartReached = true;
                targetMoveOffset = 0;
                break;
            }

            if (projectedOffset < -targetFocalParentAnchorOffset) {
                // reduce applied delta - be very careful with signs here
                delta -= targetMoveOffset + targetFocalParentAnchorOffset;
                targetFocalParent = targetFocalParent.parent;
                targetFocalParentAnchorOffset = getAnchorOffsetTrunk(noodel, targetFocalParent);
                targetMoveOffset = targetFocalParent.branchSize - targetFocalParentAnchorOffset;
            }
            else {
                targetMoveOffset = projectedOffset;
                break;
            }
        }
    }
    else { // moving towards trunk axis end   

        // makes it easier to reason with the signs
        delta = Math.abs(delta);

        while (true) {
            let projectedOffset = targetMoveOffset + delta;

            if (isDeepestBranch(targetFocalParent) && projectedOffset > 0) {
                trunkEndReached = true;
                targetMoveOffset = 0;
                break;
            }

            if (projectedOffset > targetFocalParent.branchSize - targetFocalParentAnchorOffset) {
                // reduce applied delta - be very careful with signs here
                delta -= targetFocalParent.branchSize - targetFocalParentAnchorOffset - targetMoveOffset;
                targetFocalParent = getActiveChild(targetFocalParent);
                targetFocalParentAnchorOffset = getAnchorOffsetTrunk(noodel, targetFocalParent);
                targetMoveOffset = -targetFocalParentAnchorOffset;
            }
            else {
                targetMoveOffset = projectedOffset;
                break;
            }
        }
    }

    return {
        targetFocalParent,
        targetMoveOffset,
        trunkEndReached,
        trunkStartReached
    }
}

/** 
 * Get the set of expected results if the given pan delta is applied to the focal branch.
 */
function getPanResultsBranch(noodel: NoodelState, delta: number): {
    targetActiveNode: NodeState,
    targetMoveOffset: number,
    branchStartReached: boolean,
    branchEndReached: boolean
} {
    let focalParent = noodel.focalParent;
    let targetMoveOffset = noodel.branchPanOffset;
    let targetActiveNode = focalParent.children[focalParent.activeChildIndex];
    let targetActiveNodeAnchorOffset = getAnchorOffsetBranch(noodel, targetActiveNode);
    let branchStartReached = false;
    let branchEndReached = false;

    if (delta < 0) { // moving towards branch axis start

        // makes it easier to reason with the signs
        delta = Math.abs(delta);

        while (true) {
            let projectedOffset = targetMoveOffset - delta;

            if (isFirstNode(targetActiveNode) && projectedOffset < 0) {
                branchStartReached = true;
                targetMoveOffset = 0;
                break;
            }

            if (projectedOffset < -targetActiveNodeAnchorOffset) {
                // reduce applied delta - be very careful with signs here
                delta -= targetMoveOffset + targetActiveNodeAnchorOffset;
                targetActiveNode = focalParent.children[targetActiveNode.index - 1];
                targetActiveNodeAnchorOffset = getAnchorOffsetBranch(noodel, targetActiveNode);
                targetMoveOffset = targetActiveNode.size - targetActiveNodeAnchorOffset;
            }
            else {
                targetMoveOffset = projectedOffset;
                break;
            }
        }
    }
    else { // moving towards branch axis end

        // makes it easier to reason with the signs
        delta = Math.abs(delta);

        while (true) {
            let projectedOffset = targetMoveOffset + delta;

            if (isLastNode(targetActiveNode) && projectedOffset > 0) {
                branchEndReached = true;
                targetMoveOffset = 0;
                break;
            }

            if (projectedOffset > targetActiveNode.size - targetActiveNodeAnchorOffset) {
                // reduce applied delta - be very careful with signs here
                delta -= targetActiveNode.size - targetActiveNodeAnchorOffset - targetMoveOffset;
                targetActiveNode = focalParent.children[targetActiveNode.index + 1];
                targetActiveNodeAnchorOffset = getAnchorOffsetBranch(noodel, targetActiveNode);
                targetMoveOffset = -targetActiveNodeAnchorOffset;
            }
            else {
                targetMoveOffset = projectedOffset;
                break;
            }
        }
    }

    return {
        targetActiveNode,
        targetMoveOffset,
        branchEndReached,
        branchStartReached
    }
}

export function startPan(noodel: NoodelState, realAxis: Axis) {

    queueUnsetLimitIndicator(noodel, 0);

    let panAxis: NoodelAxis = null;
    let orientation = noodel.options.orientation;

    if (orientation === 'ltr' || orientation === 'rtl') {
        panAxis = realAxis === 'x' ? 'trunk' : 'branch';
    }
    else {
        panAxis = realAxis === 'y' ? 'trunk' : 'branch';
    }

    noodel.r.panAxis = panAxis;

    if (panAxis === "trunk") {
        disableTrunkTransition(noodel, true);
    }
    else if (panAxis === "branch") {
        disableBranchTransition(noodel, noodel.focalParent, true);
    }
}

export function updatePan(noodel: NoodelState, velocityX: number, velocityY: number, distanceX: number, distanceY: number, timestamp: number) {
    let orientation = noodel.options.orientation;
    let deltaX = distanceX - noodel.r.lastPanDistanceX;
    let deltaY = distanceY - noodel.r.lastPanDistanceY;

    noodel.r.lastPanDistanceX = distanceX;
    noodel.r.lastPanDistanceY = distanceY;

    let appliedDelta = null; // this is the orientation agnostic delta caused by the movement
    let appliedVelocity = null; // this is the orientation agnostic velocity caused by the movement

    if (isPanningTrunk(noodel)) {

        if (orientation === 'ltr') {
            appliedVelocity = -velocityX;
            appliedDelta = -deltaX;
        }
        else if (orientation === 'rtl') {
            appliedVelocity = velocityX;
            appliedDelta = deltaX;
        }
        else if (orientation === 'ttb') {
            appliedVelocity = -velocityY;
            appliedDelta = -deltaY;
        }
        else if (orientation === 'btt') {
            appliedVelocity = velocityY;
            appliedDelta = deltaY;
        }

        updateSwipeVelocityBuffer(noodel, appliedVelocity, timestamp);

        if (appliedDelta === 0) return;

        appliedDelta *= noodel.options.swipeMultiplierTrunk;

        let panResults = getPanResultsTrunk(noodel, appliedDelta);

        if (panResults.targetFocalParent !== noodel.focalParent) {
            setFocalParent(noodel, panResults.targetFocalParent);
        }

        noodel.trunkPanOffset = panResults.targetMoveOffset;
        noodel.trunkEndReached = panResults.trunkEndReached;
        noodel.trunkStartReached = panResults.trunkStartReached;
    }
    else if (isPanningBranch(noodel)) {

        let branchDirection = noodel.options.branchDirection;

        if (orientation === 'ltr' || orientation === 'rtl') {
            if (branchDirection === 'normal') {
                appliedVelocity = -velocityY;
                appliedDelta = -deltaY;
            }
            else if (branchDirection === 'reverse') {
                appliedVelocity = velocityY;
                appliedDelta = deltaY;
            }
        }
        else if (orientation === 'ttb' || orientation === 'btt') {
            if (branchDirection === 'normal') {
                appliedVelocity = -velocityX;
                appliedDelta = -deltaX;
            }
            else if (branchDirection === 'reverse') {
                appliedVelocity = velocityX;
                appliedDelta = deltaX;
            }
        }

        updateSwipeVelocityBuffer(noodel, appliedVelocity, timestamp);

        if (appliedDelta === 0) return;
        appliedDelta *= noodel.options.swipeMultiplierBranch;

        let panResults = getPanResultsBranch(noodel, appliedDelta);
        let currentFocalNode = getActiveChild(noodel.focalParent);

        if (panResults.targetActiveNode !== currentFocalNode) {
            setActiveChild(noodel, noodel.focalParent, panResults.targetActiveNode.index);
        }

        noodel.branchPanOffset = panResults.targetMoveOffset;
        noodel.branchStartReached = panResults.branchStartReached;
        noodel.branchEndReached = panResults.branchEndReached;
    }
}

export function releasePan(noodel: NoodelState) {
    if (isPanningTrunk(noodel)) {
        shiftFocalLevel(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierTrunk));
    }
    else if (isPanningBranch(noodel)) {
        shiftFocalNode(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierBranch));
    }

    finalizePan(noodel);
}

export function finalizePan(noodel: NoodelState) {
    if (!isPanning(noodel)) return;

    if (isPanningTrunk(noodel)) {
        enableTrunkTransition(noodel);
        noodel.trunkPanOffset = 0;
    }
    else if (isPanningBranch(noodel)) {
        enableBranchTransition(noodel.focalParent);
        noodel.branchPanOffset = 0;
    }

    noodel.r.panAxis = null;
    noodel.r.lastPanDistanceX = null;
    noodel.r.lastPanDistanceY = null;
    queueUnsetLimitIndicator(noodel, 0);
    clearSwipeVelocityBuffer(noodel);
}
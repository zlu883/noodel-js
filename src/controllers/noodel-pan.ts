import NoodelState from 'src/types/NoodelState';
import { getActiveChild } from './getters';
import { hideActiveSubtree, setActiveChild, setFocalParent, showActiveSubtree } from './noodel-mutate';
import { NoodelAxis } from 'src/types/NoodelAxis';
import { Axis } from 'src/types/Axis';
import { shiftFocalLevel, shiftFocalNoode, unsetLimitIndicators } from './noodel-navigate';
import { findCurrentBranchOffset, findCurrentTrunkOffset } from './noodel-animate';

export function startPan(noodel: NoodelState, realAxis: Axis) {

    clearTimeout(noodel.r.limitIndicatorTimeout);

    let currentFocalNoode = getActiveChild(noodel.focalParent);

    if (!currentFocalNoode) return;

    noodel.r.panStartFocalNoode = currentFocalNoode;

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
        let currentTrunkOffset = findCurrentTrunkOffset(noodel);

        noodel.applyTrunkMove = false;
        noodel.trunkOffset = currentTrunkOffset;
        noodel.r.panOriginTrunk = currentTrunkOffset;
    }
    else if (panAxis === "branch") {
        let currentFocalBranchOffset = findCurrentBranchOffset(noodel, noodel.focalParent);

        noodel.focalParent.applyBranchMove = false;
        noodel.focalParent.branchOffset = currentFocalBranchOffset;
        noodel.r.panOriginBranch = currentFocalBranchOffset;
    }
}

/**
 * Make pan movement based on the given delta, changing the focal noode/parent
 * and set limit indicators as necessary. Makes no assumption on the magnitude of the movement, 
 * and aims to be correct regardless of the target offset, bounding the movement to the possible limits.
 */
export function updatePan(noodel: NoodelState, velocityX: number, velocityY: number, deltaX: number, deltaY: number, timestamp: number) {

    if (noodel.r.panAxis === null) return;

    let velocity = null;
    let delta = null;
    let orientation = noodel.options.orientation;

    if (noodel.r.panAxis === "trunk") {

        if (orientation === 'ltr') {
            velocity = -velocityX;
            delta = -deltaX;
        }
        else if (orientation === 'rtl') {
            velocity = velocityX;
            delta = deltaX;
        }
        else if (orientation === 'ttb') {
            velocity = -velocityY;
            delta = -deltaY;
        }
        else if (orientation === 'btt') {
            velocity = velocityY;
            delta = deltaY;
        }

        updateSwipeVelocityBuffer(noodel, velocity, timestamp);

        let targetOffset = noodel.r.panOriginTrunk + (delta * noodel.options.swipeMultiplierTrunk);
        let targetFocalParent = noodel.focalParent;
        let trunkStartReached = false;
        let trunkEndReached = false;

        if (targetOffset === noodel.trunkOffset) {
            return;
        }
        else if (targetOffset > noodel.trunkOffset) { // moving towards trunk axis end
            while (targetOffset > targetFocalParent.r.trunkRelativeOffset + targetFocalParent.r.branchSize) {
                let next = getActiveChild(targetFocalParent);

                if (!getActiveChild(next)) break;
                targetFocalParent = next;
            }

            if (!getActiveChild(getActiveChild(targetFocalParent))) {
                let limit = targetFocalParent.r.trunkRelativeOffset + targetFocalParent.r.branchSize / 2;

                if (targetOffset > limit) {
                    trunkEndReached = true;
                    targetOffset = limit;
                }
            }
        }
        else { // moving towards trunk axis start            
            while (targetOffset < targetFocalParent.r.trunkRelativeOffset) {
                let prev = targetFocalParent.parent;

                if (!prev) break;
                targetFocalParent = prev;
            }

            if (!targetFocalParent.parent) { // is root
                let limit = targetFocalParent.r.branchSize / 2;

                if (targetOffset < limit) {
                    trunkStartReached = true;
                    targetOffset = limit;
                }
            }
        }

        if (targetFocalParent !== noodel.focalParent) {
            setFocalParent(noodel, targetFocalParent);
        }

        noodel.trunkEndReached = trunkEndReached;
        noodel.trunkStartReached = trunkStartReached;
        noodel.trunkOffset = targetOffset;
    }
    else if (noodel.r.panAxis === "branch") {

        let branchDirection = noodel.options.branchDirection;

        if (orientation === 'ltr' || orientation === 'rtl') {
            if (branchDirection === 'normal') {
                velocity = -velocityY;
                delta = -deltaY;
            }
            else if (branchDirection === 'reverse') {
                velocity = velocityY;
                delta = deltaY;
            }           
        }
        else if (orientation === 'ttb' || orientation === 'btt') {
            if (branchDirection === 'normal') {
                velocity = -velocityX;
                delta = -deltaX;
            }
            else if (branchDirection === 'reverse') {
                velocity = velocityX;
                delta = deltaX;
            }     
        }

        updateSwipeVelocityBuffer(noodel, velocity, timestamp);

        let targetOffset = noodel.r.panOriginBranch + (delta * noodel.options.swipeMultiplierBranch);
        let focalParent = noodel.focalParent;
        let targetIndex = focalParent.activeChildIndex;
        let targetNoode = focalParent.children[targetIndex];
        let branchStartReached = false;
        let branchEndReached = false;

        if (targetOffset === noodel.focalParent.branchOffset) {
            return;
        }
        else if (targetOffset > noodel.focalParent.branchOffset) { // moving towards branch axis end
            while (targetOffset > targetNoode.r.branchRelativeOffset + targetNoode.r.size) {
                let nextIndex = targetIndex + 1;

                if (nextIndex >= focalParent.children.length) break;
                targetIndex = nextIndex;
                targetNoode = focalParent.children[targetIndex];
            }

            if (targetIndex === focalParent.children.length - 1) {
                let limit = targetNoode.r.branchRelativeOffset + targetNoode.r.size / 2;

                if (targetOffset > limit) {
                    branchEndReached = true;
                    targetOffset = limit;
                }
            }
        }
        else { // moving towards branch axis start
            while (targetOffset < targetNoode.r.branchRelativeOffset) {
                let prevIndex = targetIndex - 1;

                if (prevIndex < 0) break;
                targetIndex = prevIndex;
                targetNoode = focalParent.children[targetIndex];
            }

            if (targetIndex === 0) {
                let limit = targetNoode.r.size / 2;

                if (targetOffset < limit) {
                    branchStartReached = true;
                    targetOffset = limit;
                }
            }
        }

        if (targetIndex !== focalParent.activeChildIndex) {
            hideActiveSubtree(getActiveChild(focalParent));
            setActiveChild(focalParent, targetIndex);
            showActiveSubtree(noodel, focalParent, noodel.options.visibleSubtreeDepth, noodel.options.subtreeDebounceInterval);
        }

        noodel.branchStartReached = branchStartReached;
        noodel.branchEndReached = branchEndReached;
        noodel.focalParent.branchOffset = targetOffset;
    }
}

export function releasePan(noodel: NoodelState) {

    if (noodel.r.panAxis === null) return;

    if (noodel.r.panAxis === "trunk") {
        noodel.r.panOriginTrunk = null;
        noodel.r.panAxis = null; // before shiftFocalLevel to prevent extra cancelPan check
        shiftFocalLevel(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierTrunk));
    }
    else if (noodel.r.panAxis === "branch") {
        noodel.r.panOriginBranch = null;
        noodel.r.panAxis = null; // before shiftFocalNoode to prevent extra cancelPan check
        shiftFocalNoode(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierBranch));
    }

    unsetLimitIndicators(noodel, 0);
    clearSwipeVelocityBuffer(noodel);
}

export function cancelPan(noodel: NoodelState) {

    if (noodel.r.panAxis === null) return;

    if (noodel.r.panAxis === "trunk") {
        noodel.r.panOriginTrunk = null;
        noodel.r.panAxis = null;
        shiftFocalLevel(noodel, 0);
    }
    else if (noodel.r.panAxis === "branch") {
        noodel.r.panOriginBranch = null;
        noodel.r.panAxis = null;
        shiftFocalNoode(noodel, 0);
    }

    unsetLimitIndicators(noodel, 0);
    clearSwipeVelocityBuffer(noodel);
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
    if (noodel.r.lastPanTimestamp === null || timestamp - noodel.r.lastPanTimestamp < 60) {
        noodel.r.swipeVelocityBuffer.push(velocity);

        if (noodel.r.swipeVelocityBuffer.length > 10) {
            noodel.r.swipeVelocityBuffer.shift();
        }
    }
    else {
        noodel.r.swipeVelocityBuffer = [];
        noodel.r.swipeVelocityBuffer.push(velocity);
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
        return (velocity > 0) ? 1 : -1;
    }
    else {
        let count = Math.round((1.4 * Math.log(absVelocity) + 1));
        
        return (velocity > 0) ? count : -count;
    }
}
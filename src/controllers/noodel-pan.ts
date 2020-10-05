import NoodelState from 'src/types/NoodelState';
import { getActiveChild, getFocalHeight, getFocalWidth } from './getters';
import { hideActiveSubtree, setActiveChild, setFocalParent, showActiveSubtree } from './noodel-mutate';
import { NoodelAxis } from 'src/types/NoodelAxis';
import { Axis } from 'src/types/Axis';
import { shiftFocalLevel, shiftFocalNoode, unsetLimitIndicators } from './noodel-navigate';

export function startPan(noodel: NoodelState, realAxis: Axis) {

    clearTimeout(noodel.limitIndicatorTimeout);

    let currentFocalNoode = getActiveChild(noodel.focalParent);

    if (!currentFocalNoode) return;

    noodel.panStartFocalNoode = currentFocalNoode;

    let panAxis: NoodelAxis = null;
    let orientation = noodel.options.orientation;

    if (orientation === 'ltr' || orientation === 'rtl') {
        panAxis = realAxis === 'x' ? 'trunk' : 'branch';
    }
    else {
        panAxis = realAxis === 'y' ? 'trunk' : 'branch';
    }

    noodel.panAxis = panAxis;

    if (panAxis === "trunk") {
        // Finds the trunk offset at the current moment (may be in transition)
        let currentTrunkOffset = null;
        let canvasRect = noodel.canvasEl.getBoundingClientRect();
        let trunkRect = noodel.trunkEl.getBoundingClientRect();

        if (orientation === 'ltr') {
            currentTrunkOffset = trunkRect.left - canvasRect.left - getFocalWidth(noodel);
        }
        else if (orientation === 'rtl') {
            currentTrunkOffset = canvasRect.right - trunkRect.right - getFocalWidth(noodel);
        }
        else if (orientation === 'ttb') {
            currentTrunkOffset = trunkRect.top - canvasRect.top - getFocalHeight(noodel);
        }
        else if (orientation === 'btt') {
            currentTrunkOffset = canvasRect.bottom - trunkRect.bottom - getFocalHeight(noodel);
        }

        noodel.applyTrunkMove = false;
        noodel.trunkOffset = currentTrunkOffset;
        noodel.panOffsetOriginTrunk = currentTrunkOffset;
    }
    else if (panAxis === "branch") {
        // Finds the focal branch offset at the current moment (may be in transition)
        let currentFocalBranchOffset = null;
        let branchDirection = noodel.options.branchDirection;
        let canvasRect = noodel.canvasEl.getBoundingClientRect();
        let focalBranchRect = noodel.focalParent.branchEl.getBoundingClientRect();

        if (orientation === 'ltr' || orientation === 'rtl') {
            if (branchDirection === 'normal') {
                currentFocalBranchOffset = focalBranchRect.top - canvasRect.top - getFocalHeight(noodel);
            }
            else if (branchDirection === 'reversed') {
                currentFocalBranchOffset = canvasRect.bottom - focalBranchRect.bottom - getFocalHeight(noodel);
            }
        }
        else if (orientation === 'ttb' || orientation === 'btt') {
            if (branchDirection === 'normal') {
                currentFocalBranchOffset = focalBranchRect.left - canvasRect.left - getFocalWidth(noodel);
            }
            else if (branchDirection === 'reversed') {
                currentFocalBranchOffset = canvasRect.right - focalBranchRect.right - getFocalWidth(noodel);
            }
        }

        noodel.focalParent.applyBranchMove = false;
        noodel.focalParent.childBranchOffset = currentFocalBranchOffset;
        noodel.panOffsetOriginFocalBranch = currentFocalBranchOffset;
    }
}

/**
 * Make pan movement based on the given delta, changing the focal noode/parent
 * and set limit indicators as necessary. Makes no assumption on the magnitude of the movement, 
 * and aims to be correct regardless of the target offset, bounding the movement to the possible limits.
 */
export function updatePan(noodel: NoodelState, velocityX: number, velocityY: number, deltaX: number, deltaY: number, timestamp: number) {

    if (noodel.panAxis === null) return;

    let velocity = null;
    let delta = null;
    let orientation = noodel.options.orientation;

    if (noodel.panAxis === "trunk") {

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

        let targetOffset = noodel.panOffsetOriginTrunk + (delta * noodel.options.swipeMultiplierTrunk);
        let targetFocalParent = noodel.focalParent;
        let trunkStartReached = false;
        let trunkEndReached = false;

        if (targetOffset > noodel.trunkOffset) { // moving towards trunk axis end
            while (targetOffset > targetFocalParent.trunkRelativeOffset + targetFocalParent.childBranchSize) {
                let next = getActiveChild(targetFocalParent);

                if (!getActiveChild(next)) {
                    let limit = targetFocalParent.trunkRelativeOffset + targetFocalParent.childBranchSize / 2;

                    if (targetOffset > limit) {
                        trunkEndReached = true;
                        targetOffset = limit;
                    }

                    break;
                }

                targetFocalParent = next;
            }
        }
        else { // moving towards trunk axis start
            while (targetOffset < targetFocalParent.trunkRelativeOffset) {
                let prev = targetFocalParent.parent;

                if (!prev) { // target is root
                    let limit = targetFocalParent.childBranchSize / 2;

                    if (targetOffset < limit) {
                        trunkStartReached = true;
                        targetOffset = limit;
                    }

                    break;
                }

                targetFocalParent = prev;
            }
        }

        if (targetFocalParent !== noodel.focalParent) {
            setFocalParent(noodel, targetFocalParent);
        }

        noodel.trunkEndReached = trunkEndReached;
        noodel.trunkStartReached = trunkStartReached;
        noodel.trunkOffset = targetOffset;
    }
    else if (noodel.panAxis === "branch") {

        let branchDirection = noodel.options.branchDirection;

        if (orientation === 'ltr' || orientation === 'rtl') {
            if (branchDirection === 'normal') {
                velocity = -velocityY;
                delta = -deltaY;
            }
            else if (branchDirection === 'reversed') {
                velocity = velocityY;
                delta = deltaY;
            }           
        }
        else if (orientation === 'ttb' || orientation === 'btt') {
            if (branchDirection === 'normal') {
                velocity = -velocityX;
                delta = -deltaX;
            }
            else if (branchDirection === 'reversed') {
                velocity = velocityX;
                delta = deltaX;
            }     
        }

        updateSwipeVelocityBuffer(noodel, velocity, timestamp);

        let targetOffset = noodel.panOffsetOriginFocalBranch + (delta * noodel.options.swipeMultiplierBranch);
        let focalParent = noodel.focalParent;
        let targetIndex = focalParent.activeChildIndex;
        let targetNoode = focalParent.children[targetIndex];
        let branchStartReached = false;
        let branchEndReached = false;

        if (targetOffset > noodel.focalParent.childBranchOffset) { // moving towards branch axis end
            while (targetOffset > targetNoode.branchRelativeOffset + targetNoode.size) {
                let nextIndex = targetIndex + 1;

                if (nextIndex >= focalParent.children.length) {
                    let limit = targetNoode.branchRelativeOffset + targetNoode.size / 2;

                    if (targetOffset > limit) {
                        branchEndReached = true;
                        targetOffset = limit;
                    }

                    break;
                }

                targetIndex = nextIndex;
                targetNoode = focalParent.children[targetIndex];
            }
        }
        else { // moving towards branch axis start
            while (targetOffset < targetNoode.trunkRelativeOffset) {
                let prevIndex = targetIndex - 1;

                if (prevIndex <= 0) {
                    let limit = targetNoode.size / 2;

                    if (targetOffset < limit) {
                        branchStartReached = true;
                        targetOffset = limit;
                    }

                    break;
                }

                targetIndex = prevIndex;
                targetNoode = focalParent.children[targetIndex];
            }
        }

        if (targetIndex !== focalParent.activeChildIndex) {
            hideActiveSubtree(getActiveChild(focalParent));
            setActiveChild(noodel, focalParent, targetIndex);
            showActiveSubtree(noodel, focalParent, noodel.options.visibleSubtreeDepth, noodel.options.subtreeDebounceInterval);
        }

        noodel.branchStartReached = branchStartReached;
        noodel.branchEndReached = branchEndReached;
        noodel.focalParent.childBranchOffset = targetOffset;
    }
}

export function releasePan(noodel: NoodelState) {

    if (noodel.panAxis === null) return;

    if (noodel.panAxis === "trunk") {
        noodel.panOffsetOriginTrunk = null;
        noodel.panAxis = null; // before shiftFocalLevel to prevent extra cancelPan check
        shiftFocalLevel(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierTrunk));
    }
    else if (noodel.panAxis === "branch") {
        noodel.panOffsetOriginFocalBranch = null;
        noodel.panAxis = null; // before shiftFocalNoode to prevent extra cancelPan check
        shiftFocalNoode(noodel, computeSnapCount(computeSwipeVelocity(noodel), noodel.options.snapMultiplierBranch));
    }

    unsetLimitIndicators(noodel, 0);
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
        let count = Math.round((1.4 * Math.log(absVelocity) + 1));
        
        return (velocity > 0) ? -count : count;
    }
}
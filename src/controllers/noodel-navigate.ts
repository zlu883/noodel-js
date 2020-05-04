import TWEEN from '@tweenjs/tween.js';
import { setActiveChild, setActiveSubtreeVisibility, setFocalParent, hideActiveSubtree, showActiveSubtree } from "@/controllers/noodel-mutate";
import { Axis } from '@/enums/Axis';
import NoodeView from '@/model/NoodeView';
import NoodelView from '@/model/NoodelView';
import { getChildrenBranchMidSize, getActiveChild, getMidSize, isRoot } from '@/util/getters';
import { alignTrunkToBranch, alignBranchToIndex } from './noodel-align';
import { forceReflow } from '@/util/animate';

/**
 * Core function for moving the trunk to a specified position.
 * Makes no assumption on the magnitude of the movement, and aims to be correct
 * regardless of the target offset, bounding the movement to the possible limits.
 */
function moveTrunk(noodel: NoodelView, destinationOffset: number) {

    let offsetDiff = destinationOffset - noodel.trunkOffset;

    if (offsetDiff === 0) return;

    let newTrunkOffset = noodel.trunkOffset;
    let newFocalParent = noodel.focalParent;
    let levelDiff = 0;
    let newRelativeOffset = noodel.trunkRelativeOffset;
    let remainingDiff = Math.abs(offsetDiff);

    if (offsetDiff < 0) {
        noodel.showLimits.left = false;

        while (true) {      
            if (!getActiveChild(getActiveChild(newFocalParent)) && newRelativeOffset + remainingDiff > getChildrenBranchMidSize(newFocalParent)) {
                newTrunkOffset -= getChildrenBranchMidSize(newFocalParent) - newRelativeOffset;
                newRelativeOffset = getChildrenBranchMidSize(newFocalParent);
                noodel.showLimits.right = true;
                break;
            }

            let relativeDiff = newFocalParent.branchSize - newRelativeOffset;

            if (remainingDiff > relativeDiff) {
                newTrunkOffset -= relativeDiff;
                newRelativeOffset = 0;
                remainingDiff -= relativeDiff;
                newFocalParent = getActiveChild(newFocalParent);
                levelDiff++;
            }
            else {
                newTrunkOffset -= remainingDiff;
                newRelativeOffset += remainingDiff;
                noodel.showLimits.right = false;
                break;
            } 
        }
    }
    else if (offsetDiff > 0) {
        noodel.showLimits.right = false;

        while (true) {
            if (isRoot(newFocalParent) && newRelativeOffset - remainingDiff < getChildrenBranchMidSize(newFocalParent)) {
                newTrunkOffset += newRelativeOffset - getChildrenBranchMidSize(newFocalParent);
                newRelativeOffset = getChildrenBranchMidSize(newFocalParent);
                noodel.showLimits.left = true;
                break;
            }

            let relativeDiff = newRelativeOffset;

            if (remainingDiff > relativeDiff) {
                newTrunkOffset += relativeDiff;
                newFocalParent = newFocalParent.parent;
                newRelativeOffset = newFocalParent.branchSize;
                remainingDiff -= relativeDiff;
                levelDiff--;
            }
            else {
                newTrunkOffset += remainingDiff;
                newRelativeOffset -= remainingDiff;
                noodel.showLimits.left = false;
                break;
            } 
        }
    }
    
    noodel.trunkOffset = newTrunkOffset;
    noodel.trunkRelativeOffset = newRelativeOffset;

    if (newFocalParent.id !== noodel.focalParent.id) {
        changeFocalLevel(noodel, newFocalParent, levelDiff);
    }
}

function changeFocalLevel(noodel: NoodelView, newFocalParent: NoodeView, levelDiff: number) {

    noodel.focalParent.isFocalParent = false;
    newFocalParent.isFocalParent = true;

    if (levelDiff < 0) {
        setActiveSubtreeVisibility(newFocalParent, false, Math.abs(levelDiff) + noodel.options.visibleSubtreeDepth);
        setActiveSubtreeVisibility(newFocalParent, true, noodel.options.visibleSubtreeDepth);
    } 
    else if (levelDiff > 0) {
        setActiveSubtreeVisibility(noodel.focalParent, true, Math.abs(levelDiff) + noodel.options.visibleSubtreeDepth);
    }

    noodel.focalParent = newFocalParent;
    noodel.focalLevel += levelDiff;
}

/**
 * Core function for moving a branch to a specified position.
 * Makes no assumption on the magnitude of the movement, and aims to be correct
 * regardless of the target offset, bounding the movement to the possible limits.
 */
function moveBranch(noodel: NoodelView, parent: NoodeView, destinationOffset: number) {

    let offsetDiff = destinationOffset - parent.branchOffset;

    if (offsetDiff === 0) return;

    let newBranchOffset = parent.branchOffset;
    let newActiveIndex = parent.activeChildIndex;
    let newRelativeOffset = parent.branchRelativeOffset;
    let remainingDiff = Math.abs(offsetDiff);

    if (offsetDiff < 0) {
        if (parent.isFocalParent) noodel.showLimits.top = false;

        while (true) {      
            if (newActiveIndex >= parent.children.length - 1 && newRelativeOffset + remainingDiff > getMidSize(parent.children[newActiveIndex])) {
                newBranchOffset -= getMidSize(parent.children[newActiveIndex]) - newRelativeOffset;
                newRelativeOffset = getMidSize(parent.children[newActiveIndex]);
                if (parent.isFocalParent) noodel.showLimits.bottom = true;
                break;
            }
            
            let relativeDiff = parent.children[newActiveIndex].size - newRelativeOffset;

            if (remainingDiff> relativeDiff) {
                newBranchOffset -= relativeDiff;
                newRelativeOffset = 0;
                remainingDiff -= relativeDiff;
                newActiveIndex++;
            }
            else {
                newBranchOffset -= remainingDiff;
                newRelativeOffset += remainingDiff;
                if (parent.isFocalParent) noodel.showLimits.bottom = false;
                break;
            } 
        }
    }
    else if (offsetDiff > 0) {
        if (parent.isFocalParent) noodel.showLimits.bottom = false;

        while (true) {
            if (newActiveIndex <= 0 && newRelativeOffset - remainingDiff < getMidSize(parent.children[newActiveIndex])) {
                newBranchOffset += newRelativeOffset - getMidSize(parent.children[newActiveIndex]);
                newRelativeOffset = getMidSize(parent.children[newActiveIndex]);
                if (parent.isFocalParent) noodel.showLimits.top = true;
                break;
            }

            let relativeDiff = newRelativeOffset;

            if (remainingDiff > relativeDiff) {
                newBranchOffset += relativeDiff;
                newActiveIndex--;
                newRelativeOffset = parent.children[newActiveIndex].size;
                remainingDiff -= relativeDiff;
            }
            else {
                newBranchOffset += remainingDiff;
                newRelativeOffset -= remainingDiff;
                if (parent.isFocalParent) noodel.showLimits.top = false;
                break;
            } 
        }
    }
    
    parent.branchOffset = newBranchOffset;
    parent.branchRelativeOffset = newRelativeOffset;

    if (newActiveIndex !== parent.activeChildIndex) {
        changeActiveChild(noodel, parent, newActiveIndex);
    }
}

function changeActiveChild(noodel: NoodelView, parent: NoodeView, newActiveIndex: number) {

    setActiveSubtreeVisibility(parent, false);
    setActiveChild(parent, newActiveIndex);
    setActiveSubtreeVisibility(parent, true, noodel.options.visibleSubtreeDepth);
}

function initializeMovement(noodel: NoodelView, axis: Axis) {

    noodel.lastSwipeDelta = 0;
    noodel.totalSwipeDelta = 0;
    noodel.movingAxis = axis;

    if (axis === Axis.HORIZONTAL) {
        finalizeTrunkPosition(noodel, noodel.trunkOffset);
        finalizeBranchPosition(noodel, noodel.focalParent, noodel.focalParent.branchOffset - (getMidSize(getActiveChild(noodel.focalParent)) - noodel.focalParent.branchRelativeOffset));
    }
    else if (axis === Axis.VERTICAL) {
        finalizeTrunkPosition(noodel, noodel.trunkOffset - (getChildrenBranchMidSize(noodel.focalParent) - noodel.trunkRelativeOffset));
        finalizeBranchPosition(noodel, noodel.focalParent, noodel.focalParent.branchOffset);
    }
}

function finalizeTrunkPosition(noodel: NoodelView, offset: number) {

    if (noodel.trunkSnapAnimation) {
        noodel.trunkSnapAnimation.stop();
        noodel.trunkSnapAnimation = null;
    }

    moveTrunk(noodel, offset);
    noodel.trunkOffsetOrigin = noodel.trunkOffset;
}

function finalizeBranchPosition(noodel: NoodelView, parent: NoodeView, offset: number) {

    if (noodel.branchSnapAnimation) {
        noodel.branchSnapAnimation.stop();
        noodel.branchSnapAnimation = null;
    };

    moveBranch(noodel, parent, offset);
    parent.branchOffsetOrigin = parent.branchOffset;
} 

/**
 * Algorithm for computing how many noodes to snap across depending on swipe velocity.
 * Currently just a rough formula, can be further adjusted if necessary. 
 */
function computeSnapCount(velocity: number) {
    if (Math.abs(velocity) < 0.1) return 0;
    let count = Math.max(0, Math.round(Math.log(Math.abs(velocity) + Math.E)));
    
    return (velocity > 0) ? -count : count;
}

function animateSnap() {
    if (TWEEN.update()) requestAnimationFrame(animateSnap);
} 

function startTrunkSnap(noodel: NoodelView, snapCount: number) {

    let destinationOffset = calculateTargetTrunkOffset(noodel, snapCount);

    if (destinationOffset === noodel.trunkOffset) {
        finalizeTrunkPosition(noodel, destinationOffset);
        finalizeMovement(noodel);
        return;
    } 

    noodel.trunkSnapAnimation = new TWEEN.Tween({d: noodel.trunkOffset})
        .to({d: destinationOffset}, noodel.options.snapDuration)
        .easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(dispObj => moveTrunk(noodel, dispObj.d))
        .onComplete(() => {
            finalizeTrunkPosition(noodel, destinationOffset);
            finalizeMovement(noodel);
        })
        .start();
       
    animateSnap();
}

function startBranchSnap(noodel: NoodelView, parent: NoodeView, snapCount: number) {

    let destinationOffset = calculateTargetBranchOffset(parent, snapCount);

    if (destinationOffset === parent.branchOffset) {
        finalizeBranchPosition(noodel, parent, destinationOffset);
        finalizeMovement(noodel);
        return;
    } 

    noodel.branchSnapAnimation = new TWEEN.Tween({d: parent.branchOffset})
        .to({d: destinationOffset}, noodel.options.snapDuration)
        .easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(dispObj => moveBranch(noodel, parent, dispObj.d))
        .onComplete(() => {
            finalizeBranchPosition(noodel, parent, destinationOffset);
            finalizeMovement(noodel);
        })
        .start();
       
    animateSnap();
}

function calculateTargetTrunkOffset(noodel: NoodelView, levelDiff: number): number {

    let destinationOffset = noodel.trunkOffset - (getChildrenBranchMidSize(noodel.focalParent) - noodel.trunkRelativeOffset);
    let currentParent = noodel.focalParent;

    if (levelDiff > 0) {
        for (let i = 0; i < levelDiff; i++) {
            if (getActiveChild(getActiveChild(currentParent))) {
                destinationOffset -= (getChildrenBranchMidSize(currentParent) + getChildrenBranchMidSize(getActiveChild(currentParent)));
                currentParent = getActiveChild(currentParent);
            }
            else {
                break;
            }
        }
    }
    else if (levelDiff < 0) {
        for (let i = 0; i > levelDiff; i--) {
            if (!isRoot(currentParent)) {
                destinationOffset += (getChildrenBranchMidSize(currentParent) + getChildrenBranchMidSize(currentParent.parent));
                currentParent = currentParent.parent;
            }
            else {
                break;
            }
        }
    }

    return destinationOffset;
}

function calculateTargetBranchOffset(parent: NoodeView, noodeDiff: number) {

    let destinationOffset = parent.branchOffset - (getMidSize(getActiveChild(parent)) - parent.branchRelativeOffset);
    let currentActiveIndex = parent.activeChildIndex;

    if (noodeDiff > 0) {
        for (let i = 0; i < noodeDiff; i++) {
            if (currentActiveIndex < parent.children.length - 1) {
                destinationOffset -= (getMidSize(parent.children[currentActiveIndex]) + getMidSize(parent.children[currentActiveIndex + 1]));
                currentActiveIndex++;
            }
            else {
                break;
            }
        }
    }
    else if (noodeDiff < 0) {
        for (let i = 0; i > noodeDiff; i--) {
            if (currentActiveIndex > 0) {
                destinationOffset += (getMidSize(parent.children[currentActiveIndex]) + getMidSize(parent.children[currentActiveIndex - 1]));
                currentActiveIndex--;
            }
            else {
                break;
            }
        }
    }

    return destinationOffset;
}

export function startSwipe(noodel: NoodelView, ev: HammerInput) {
    if (ev.direction === Hammer.DIRECTION_LEFT || ev.direction === Hammer.DIRECTION_RIGHT) {
        initializeMovement(noodel, Axis.HORIZONTAL);
    }
    else if (ev.direction === Hammer.DIRECTION_UP || ev.direction === Hammer.DIRECTION_DOWN) {
        initializeMovement(noodel, Axis.VERTICAL);
    }
}

export function updateSwipe(noodel: NoodelView, ev: HammerInput) {

    if (noodel.movingAxis === Axis.HORIZONTAL) {
        noodel.totalSwipeDelta += Math.abs(ev.deltaX - noodel.lastSwipeDelta);

        let multiplier = Math.min(noodel.totalSwipeDelta / 30, 1);

        moveTrunk(noodel, noodel.trunkOffset + (ev.deltaX - noodel.lastSwipeDelta) * multiplier);
        noodel.lastSwipeDelta = ev.deltaX;
    }
    else if (noodel.movingAxis === Axis.VERTICAL) {
        noodel.totalSwipeDelta += Math.abs(ev.deltaY - noodel.lastSwipeDelta);

        let multiplier = Math.min(noodel.totalSwipeDelta / 140, 1.1);

        moveBranch(noodel, noodel.focalParent, noodel.focalParent.branchOffset + (ev.deltaY - noodel.lastSwipeDelta) * multiplier);
        noodel.lastSwipeDelta = ev.deltaY;
    }
}

export function releaseSwipe(noodel: NoodelView, ev: HammerInput) {
    unsetLimitIndicators(noodel);

    if (noodel.movingAxis === Axis.HORIZONTAL) {
        startTrunkSnap(noodel, computeSnapCount(ev.velocityX));
    }
    else if (noodel.movingAxis === Axis.VERTICAL) {
        startBranchSnap(noodel, noodel.focalParent, computeSnapCount(ev.velocityY));
    }
}

export function unsetLimitIndicators(noodel: NoodelView) {
    noodel.showLimits.top = false;
    noodel.showLimits.bottom = false;
    noodel.showLimits.left = false;
    noodel.showLimits.right = false;
}

/**
 * Shifts the focal level by a level difference.
 */
export function shiftFocalLevel(noodel: NoodelView, levelDiff: number) {

    let newFocalParent = findNewFocalParent(noodel, levelDiff);

    // if unable to shift anymore in the target direction
    if (newFocalParent.id === noodel.focalParent.id) {
        if (levelDiff < 0) {
            noodel.showLimits.left = true;
        }
        else if (levelDiff > 0) {
            noodel.showLimits.right = true;
        }

        return;
    }

    setFocalParent(noodel, newFocalParent);
    alignTrunkToBranch(noodel, newFocalParent);
    forceReflow();
}

/**
 * Shifts the active noode in the focal branch by an index difference.
 */
export function shiftFocalNoode(noodel: NoodelView, indexDiff: number) {

    let targetIndex = noodel.focalParent.activeChildIndex + indexDiff;

    // clamp index to valid range
    if (targetIndex < 0) {
        targetIndex = 0;
    }
    else if (targetIndex >= noodel.focalParent.children.length) {
        targetIndex = noodel.focalParent.children.length - 1;
    }

    // if unable to shift anymore in the target direction
    if (targetIndex === noodel.focalParent.activeChildIndex) {
        if (indexDiff < 0) {
            noodel.showLimits.top = true;
        }
        else if (indexDiff > 0) {
            noodel.showLimits.bottom = true;
        }

        return;
    }

    hideActiveSubtree(noodel.focalParent);
    setActiveChild(noodel.focalParent, targetIndex);
    showActiveSubtree(noodel.focalParent, noodel.options.visibleSubtreeDepth);
    alignBranchToIndex(noodel.focalParent, targetIndex);
    forceReflow();
}

/**
 * Jumps to a specific noode in the tree, realigning all affected branches and trunk
 * if necessary.
 */
export function jumpToNoode(noodel: NoodelView, target: NoodeView) {

    // No need to jump if target is already focal noode
    if (target.id === noodel.focalParent.children[noodel.focalParent.activeChildIndex].id) {
        return;
    }
     
    // finds the nearest visible branch
    let nearestVisibleBranchParent = target.parent;
    
    while (!nearestVisibleBranchParent.isChildrenVisible) {
        nearestVisibleBranchParent = nearestVisibleBranchParent.parent;
    }

    hideActiveSubtree(nearestVisibleBranchParent);

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

        nextActiveChildIndex = nextParent.index;
        nextParent = nextParent.parent;
    }

    showActiveSubtree(nearestVisibleBranchParent, (target.level - nearestVisibleBranchParent.level) + noodel.options.visibleSubtreeDepth);
    
    if (target.parent.id !== noodel.focalParent.id) {
        setFocalParent(noodel, target.parent);
        alignTrunkToBranch(noodel, target.parent);
    }
    
    forceReflow();
}

export function finalizeMovement(noodel: NoodelView) {

    noodel.movingAxis = null;
    noodel.isLocked = false;
    unsetLimitIndicators(noodel);
}

/**
 * Finds the new focal parent to move to when the a focal level change should occur
 * on the current active subtree. If levelDiff goes beyond the existing
 * branches, will return the furthest branch possible, i.e. the root or the deepest branch.
 */
function findNewFocalParent(noodel: NoodelView, levelDiff: number): NoodeView {
    
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
            if (nextParent.children[nextParent.activeChildIndex].activeChildIndex !== null) {
                nextParent = nextParent.children[nextParent.activeChildIndex];
            }
            else {
                break;
            }
        }
    }

    return nextParent;
}
import TWEEN from '@tweenjs/tween.js';
import { setActiveChild, setActiveSubtreeVisibility } from "@/controllers/noodel-mutate";
import { Axis } from '@/enums/Axis';
import NoodeView from '@/model/NoodeView';
import NoodelView from '@/model/NoodelView';
import { getChildrenBranchMidSize, getActiveChild, getMidSize, isRoot, canNavigateLeft, canNavigateRight, canNavigateUp, canNavigateDown } from '@/util/getters';

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

export function shiftLeft(noodel: NoodelView, noodeCount = -1) {

    if (canNavigateLeft(noodel)) {
        initializeMovement(noodel, Axis.HORIZONTAL);
        startTrunkSnap(noodel, noodeCount);
    }
    else {
        if (noodel.movingAxis === null) {
            noodel.showLimits.left = true;
        }
    }
}

export function shiftRight(noodel: NoodelView, noodeCount = 1) {

    if (canNavigateRight(noodel)) {
        initializeMovement(noodel, Axis.HORIZONTAL);
        startTrunkSnap(noodel, noodeCount);
    }
    else {
        if (noodel.movingAxis === null) {
            noodel.showLimits.right = true;
        }
    }
}

export function shiftUp(noodel: NoodelView, noodeCount = -1) {

    if (canNavigateUp(noodel)) {
        initializeMovement(noodel, Axis.VERTICAL);
        startBranchSnap(noodel, noodel.focalParent, noodeCount);
    }
    else {
        if (noodel.movingAxis === null) {
            noodel.showLimits.top = true;
        }
    } 
}

export function shiftDown(noodel: NoodelView, noodeCount = 1) {

    if (canNavigateDown(noodel)) {
        initializeMovement(noodel, Axis.VERTICAL);
        startBranchSnap(noodel, noodel.focalParent, noodeCount);
    }
    else {
        if (noodel.movingAxis === null) {
            noodel.showLimits.bottom = true;
        }
    } 
}

export function alignTrunkToLevel(noodel: NoodelView, level: number) {

    if (level < 0) {
        console.warn("Cannot align trunk to level: invalid level");
        return;
    }

    let targetOffset = 0;
    let currentBranch = noodel.root;

    for (let i = 0; i < level; i++) {
        if (currentBranch.activeChildIndex !== null) {
            targetOffset -= currentBranch.branchSize;
            currentBranch = getActiveChild(currentBranch);
        }
        else {
            console.warn("Cannot align trunk to level: invalid level");
            return;
        }
    }

    targetOffset -= currentBranch.branchSize / 2;

    initializeMovement(noodel, Axis.HORIZONTAL);
    finalizeTrunkPosition(noodel, targetOffset);
    finalizeMovement(noodel);
}

export function alignBranchToIndex(noodel: NoodelView, parent: NoodeView, index: number) {

    if (index < 0 || index >= parent.children.length) {
        console.warn("Cannot align branch to index: invalid index");
        return;
    }

    let targetOffset = 0;

    for (let i = 0; i <= index; i++) {
        targetOffset -= parent.children[i].size;
    }

    targetOffset += parent.children[index].size / 2;

    initializeMovement(noodel, Axis.HORIZONTAL);
    finalizeBranchPosition(noodel, parent, targetOffset);
    finalizeMovement(noodel);
}

/**
 * Logic for animating a 'jump' between noodes.
 * Currently incompatible with the normal movement logic, needs refactoring.
 */
export function jumpToNoode(noodel: NoodelView, targetPath: number[]) {
     
    let nearestVisibleBranchParent = noodel.root;
    let nearestVisibleBranchLevel = 0;
    
    for (let i = 0; i < targetPath.length - 1; i++) {
        if (nearestVisibleBranchParent.children[targetPath[i]].isChildrenVisible) {
            nearestVisibleBranchParent = nearestVisibleBranchParent.children[targetPath[i]];
            nearestVisibleBranchLevel++;
        }
        else {
            break;
        }
    }

    if (noodel.trunkSnapAnimation) {
        noodel.trunkSnapAnimation.stop();
        noodel.trunkSnapAnimation = null;
    }

    if (noodel.branchSnapAnimation) {
        noodel.branchSnapAnimation.stop();
        noodel.branchSnapAnimation = null;
    };

    setActiveSubtreeVisibility(noodel.root, false);

    let targetTrunkOffset = 0;
    let targetParent = noodel.root;

    for (let i = 0; i < targetPath.length; i++) {
        setActiveChild(targetParent, targetPath[i]);

        if (i > nearestVisibleBranchLevel) {

            let targetBranchOffset = 0;

            for (let j = 0; j <= targetParent.activeChildIndex; j++) {
                if (j < targetParent.activeChildIndex) {
                    targetBranchOffset -= targetParent.children[j].size;
                }
                else {
                    targetBranchOffset -= getMidSize(targetParent.children[j]);
                }
            }

            targetParent.branchOffset = targetBranchOffset;
            targetParent.branchOffsetOrigin = targetBranchOffset;
            targetParent.branchRelativeOffset = getMidSize(getActiveChild(targetParent));
        }    

        if (i < targetPath.length - 1) {
            targetTrunkOffset -= targetParent.branchSize;
            targetParent = getActiveChild(targetParent);
        }
        else {
            targetTrunkOffset -= getChildrenBranchMidSize(targetParent);
        }
    }

    setActiveSubtreeVisibility(noodel.root, true, (targetPath.length - 1) + noodel.options.visibleSubtreeDepth);

    let targetBranchSnapOffset = 0;
    let targetIndex = targetPath[nearestVisibleBranchLevel];

    for (let i = 0; i <= targetIndex; i++) {
        if (i < targetIndex) {
            targetBranchSnapOffset -= nearestVisibleBranchParent.children[i].size;
        }
        else {
            targetBranchSnapOffset -= getMidSize(nearestVisibleBranchParent.children[i]);
        }
    }

    let animateBranch = Math.abs(targetBranchSnapOffset - nearestVisibleBranchParent.branchOffset) > 0.0001;
    let animateTrunk = Math.abs(targetTrunkOffset - noodel.trunkOffset) > 0.0001;

    if (animateBranch || animateTrunk) {
        noodel.isLocked = true;
    }

    noodel.focalParent.isFocalParent = false;
    noodel.focalParent = targetParent;
    noodel.focalParent.isFocalParent = true;
    noodel.focalLevel = targetPath.length - 1;

    let from = {};
    let to = {};

    if (animateBranch) {
        from['b'] = nearestVisibleBranchParent.branchOffset;
        to['b'] = targetBranchSnapOffset;       
    }

    if (animateTrunk) {
        from['t'] = noodel.trunkOffset;
        to['t'] = targetTrunkOffset; 
    }

    new TWEEN.Tween(from)
        .to(to, noodel.options.snapDuration)
        .easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(next => {
            if (animateBranch) nearestVisibleBranchParent.branchOffset = next.b;
            if (animateTrunk) noodel.trunkOffset = next.t;
        })
        .onComplete(() => {
            if (animateBranch) {
                nearestVisibleBranchParent.branchRelativeOffset = getMidSize(getActiveChild(nearestVisibleBranchParent));
                finalizeBranchPosition(noodel, nearestVisibleBranchParent, targetBranchSnapOffset);
            }

            if (animateTrunk) {
                noodel.trunkRelativeOffset = getChildrenBranchMidSize(noodel.focalParent);
                finalizeTrunkPosition(noodel, targetTrunkOffset);
            }
            
            finalizeMovement(noodel);
        })
        .start();

    animateSnap();
}

export function finalizeMovement(noodel: NoodelView) {

    noodel.movingAxis = null;
    noodel.isLocked = false;
    unsetLimitIndicators(noodel);
}
import NoodeState from '../types/NoodeState';
import NoodelState from '../types/NoodelState';
import { traverseDescendents } from './noodel-traverse';
import { nextTick } from 'vue';
import { findCurrentBranchOffset, findCurrentTrunkOffset, forceReflow } from './noodel-animate';
import { cancelPan } from './noodel-pan';

export function updateNoodeSize(noodel: NoodelState, noode: NoodeState, newHeight: number, newWidth: number, isInsert = false) {
    let orientation = noodel.options.orientation;
    let newSize = null;

    if (orientation === 'ltr' || orientation === 'rtl') {
        newSize = newHeight;
    }
    else if (orientation === "ttb" || orientation === 'btt') {
        newSize = newWidth;
    }

    const parent = noode.parent;
    let diff = newSize - noode.size;

    noode.size = newSize;

    if (Math.abs(diff) > 0.01) {
        for (let i = noode.index + 1; i < parent.children.length; i++) {
            parent.children[i].branchRelativeOffset += diff;
        }

        let alignVal = 0;

        if (noode.index === parent.activeChildIndex) {
            alignVal = diff / 2;
        }
        else if (noode.index < parent.activeChildIndex) {
            alignVal = diff;
        }

        if (alignVal !== 0) {
            if (noodel.r.panAxis === "branch" && parent.isFocalParent) {
                noodel.r.panOriginBranch += alignVal;
            }

            // If branch is in transition, cancel it temporarily and force an alignment.
            // This does not apply to inserts as branch transition is needed for FLIP animation in transition groups
            if (parent.applyBranchMove && !isInsert) {
                let currentOffset = findCurrentBranchOffset(noodel, parent);
                
                // Find out the diff between transition target and current, for adding back later.
                // Using diff rather than a fixed value prevents possible bugs with simultaneous resize of multiple noodes.
                let transitDiff = parent.branchOffset - currentOffset;

                // set branch to current exact position + alignment 
                parent.branchOffset = currentOffset + alignVal;                
                parent.applyBranchMove = false;
    
                nextTick(() => {
                    forceReflow();
                    parent.branchOffset += transitDiff;
                    parent.applyBranchMove = true;
                });
            }
            else {
                if (isInsert && noodel.r.isMounted) {
                    parent.applyBranchMove = true;
                    parent.branchOffset += alignVal;
                }
                else {
                    parent.branchOffset += alignVal;
                }
            }
        }
    }
}

export function updateBranchSize(noodel: NoodelState, parent: NoodeState, newHeight: number, newWidth: number, isInsert = false) {
    let orientation = noodel.options.orientation;
    let newSize = null;

    if (orientation === 'ltr' || orientation === 'rtl') {
        newSize = newWidth;
    }
    else if (orientation === "ttb" || orientation === 'btt') {
        newSize = newHeight;
    }

    let diff = newSize - parent.branchSize;

    parent.branchSize = newSize;

    if (Math.abs(diff) > 0.01) {
        traverseDescendents(parent, desc => desc.trunkRelativeOffset += diff, false);

        let alignVal = 0;

        if (parent.isFocalParent) {
            alignVal = diff / 2;
        }
        else if (parent.isBranchVisible && (parent.level + 1) < noodel.focalLevel) {
            alignVal = diff; 
        }

        if (alignVal !== 0) {
            if (noodel.r.panAxis === "trunk") {
                noodel.r.panOriginTrunk += alignVal;
            }

            // If trunk is in transition, cancel it temporarily and force an alignment.
            // This does not apply to inserts as transitions can only happen during simultaneous child insert + navigation,
            // and transition should be kept in this case
            if (noodel.applyTrunkMove && !isInsert) {                
                let currentOffset = findCurrentTrunkOffset(noodel);
                // Find out the diff between transition target and current, for adding back later.
                // Using diff rather than a fixed value prevents possible bugs with simultaneous resize of multiple branches.
                let transitDiff = noodel.trunkOffset - currentOffset;
                // set trunk to current exact position + alignment 
                noodel.trunkOffset = currentOffset + alignVal;
                noodel.applyTrunkMove = false;

                // resume transition
                nextTick(() => {
                    forceReflow();
                    noodel.trunkOffset += transitDiff;
                    noodel.applyTrunkMove = true;
                });
            }
            else {
                noodel.trunkOffset += alignVal;
            }
        }
    }
}

/**
 * Aligns the branch as necessary BEFORE the deletion of a noode
 * and the mutation of its array of siblings.
 */
export function alignBranchBeforeNoodeDelete(noode: NoodeState) {

    let parent = noode.parent;

    // adjust sibling offsets
    for (let i = noode.index + 1; i < parent.children.length; i++) {
        parent.children[i].branchRelativeOffset -= noode.size;
    }

    if (noode.index === parent.activeChildIndex) {
        parent.applyBranchMove = true;
        parent.branchOffset -= noode.size / 2;
    }
    else if (noode.index < parent.activeChildIndex) {
        parent.applyBranchMove = true;
        parent.branchOffset -= noode.size;
    }
}

/**
 * Aligns the trunk to center on the given branch.
 */
export function alignTrunkToBranch(noodel: NoodelState, branchParent: NoodeState) {

    let targetOffset = branchParent.trunkRelativeOffset + (branchParent.branchSize / 2);

    // only apply transition effect if there's actual movement
    if (Math.abs(noodel.trunkOffset - targetOffset) >= 1) { 
        noodel.applyTrunkMove = true;
        noodel.r.ignoreTransitionEnd = true;
        requestAnimationFrame(() => noodel.r.ignoreTransitionEnd = false);
    }

    noodel.trunkOffset = targetOffset;
}

/**
 * Aligns a branch to center on the noode at the given index.
 */
export function alignBranchToIndex(parent: NoodeState, index: number) {

    let targetChild = parent.children[index];
    let targetOffset = targetChild.branchRelativeOffset + (targetChild.size / 2);

    // only apply transition effect if there's actual movement and branch is visible
    if (parent.isBranchVisible && Math.abs(parent.branchOffset - targetOffset) >= 1) { 
        parent.applyBranchMove = true;
        parent.r.ignoreTransitionEnd = true;
        requestAnimationFrame(() => parent.r.ignoreTransitionEnd = false);
    }

    parent.branchOffset = targetOffset;
}

/**
 * Recapture the size of all noodes and branches and realign the trunk and all branches.
 * This method is used to reset various values if the noodel changed its orientation.
 */
export function resetAlignment(noodel: NoodelState) {

    cancelPan(noodel);
    noodel.applyTrunkMove = false;
    noodel.trunkOffset = 0;

    traverseDescendents(
        noodel.root,
        (noode) => {
            noode.trunkRelativeOffset = 0;
            noode.branchRelativeOffset = 0;
            noode.size = 0;
            noode.branchSize = 0;
            noode.applyBranchMove = false;
            noode.branchOffset = 0;
            noode.isBranchTransparent = true;
        },
        true
    );

    nextTick(() => {
        traverseDescendents(
            noodel.root,
            (noode) => {
                if (noode.r.el) {
                    let rect = noode.r.el.getBoundingClientRect();
                    updateNoodeSize(noodel, noode, rect.height, rect.width);
                }
    
                if (noode.r.branchEl) {
                    let rect = noode.r.branchEl.getBoundingClientRect();
                    updateBranchSize(noodel, noode, rect.height, rect.width);
                }

                noode.isBranchTransparent = false;
            },
            true
        );
    });
}

export function checkContentOverflow(noodel: NoodelState, noode: NoodeState) {

    if (!(typeof noode.options.showOverflowIndicators === "boolean"
    ? noode.options.showOverflowIndicators
    : noodel.options.showOverflowIndicators)) {
        return;
    }
    
    if (!(noode.parent.isBranchVisible || noode.parent.isBranchTransparent)) return;

    let el = noode.r.contentBoxEl;
    let clientHeight = el.clientHeight;
    let clientWidth = el.clientWidth;
    let scrollHeight = el.scrollHeight;
    let scrollWidth = el.scrollWidth;
    let scrollTop = el.scrollTop;
    let scrollLeft = el.scrollLeft;
    let direction = getComputedStyle(el).direction;

    noode.hasOverflowTop = scrollHeight > clientHeight && scrollTop >= 1;
    noode.hasOverflowBottom = scrollHeight > clientHeight && scrollTop + clientHeight <= scrollHeight - 1;

    if (direction === 'ltr') {
        noode.hasOverflowLeft = scrollWidth > clientWidth && scrollLeft >= 1;
        noode.hasOverflowRight = scrollWidth > clientWidth && scrollLeft + clientWidth <= scrollWidth - 1;
    }
    else {
        noode.hasOverflowLeft = scrollWidth > clientWidth && Math.abs(scrollLeft) + clientWidth <= scrollWidth - 1;
        noode.hasOverflowRight = scrollWidth > clientWidth && scrollLeft <= -1;
    }
}
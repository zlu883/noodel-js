import NoodeView from '@/types/NoodeView';
import NoodelView from '@/types/NoodelView';
import { traverseDescendents } from './noodel-traverse';
import { Axis } from '@/enums/Axis';
import Vue from 'vue';
import { forceReflow } from './noodel-animate';
import { getFocalWidth, getFocalHeight } from '@/util/getters';

export function alignTrunkOnBranchResize(noodel: NoodelView, parent: NoodeView, newSize: number, isInsert = false) {

    let diff = newSize - parent.branchSize;
    
    parent.branchSize = newSize;

    if (Math.abs(diff) > 0.01) {
        traverseDescendents(parent, desc => desc.trunkRelativeOffset += diff, false);

        let alignVal = 0;

        if (parent.isFocalParent) {
            alignVal = diff / 2;
        }
        else if (parent.isChildrenVisible && parent.level < noodel.focalLevel) {
            alignVal = diff; 
        }

        if (alignVal !== 0) {
            if (noodel.panAxis === Axis.HORIZONTAL) {
                noodel.panOffsetOriginTrunk -= alignVal;
            }

            // If trunk is in transition, cancel it temporarily and force an alignment.
            // This does not apply to inserts as transitions can only happen during simultaneous child insert + navigation,
            // and transition should be kept in this case
            if (noodel.applyTrunkMove && !isInsert) {                
                let currentOffset = noodel.trunkEl.getBoundingClientRect().left - noodel.canvasEl.getBoundingClientRect().left - getFocalWidth(noodel);
                
                // Find out the diff between transition target and current, for adding back later.
                // Using diff rather than a fixed value prevents possible bugs with simultaneous resize of multiple branches.
                let transitDiff = noodel.trunkOffset - currentOffset;

                // set trunk to current exact position + alignment 
                noodel.trunkOffset = currentOffset - alignVal;
                noodel.applyTrunkMove = false;

                // resume transition
                Vue.nextTick(() => {
                    forceReflow();
                    noodel.trunkOffset += transitDiff;
                    noodel.applyTrunkMove = true;
                });
            }
            else {
                noodel.trunkOffset -= alignVal;
            }

            noodel.trunkOffsetAligned -= alignVal;
        }
    }
}

export function alignBranchOnNoodeResize(noodel: NoodelView, noode: NoodeView, newSize: number, isInsert = false) {

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
            if (noodel.panAxis === Axis.VERTICAL && parent.isFocalParent) {
                noodel.panOffsetOriginFocalBranch -= alignVal;
            }

            // If branch is in transition, cancel it temporarily and force an alignment.
            // This does not apply to inserts as branch transition is needed for FLIP animation in transition groups
            if (parent.applyBranchMove && !isInsert) {
                let currentOffset = parent.childBranchEl.getBoundingClientRect().top - noodel.canvasEl.getBoundingClientRect().top - getFocalHeight(noodel);
                
                // Find out the diff between transition target and current, for adding back later.
                // Using diff rather than a fixed value prevents possible bugs with simultaneous resize of multiple noodes.
                let transitDiff = parent.childBranchOffset - currentOffset;

                // set branch to current exact position + alignment 
                parent.childBranchOffset = currentOffset - alignVal;                
                parent.applyBranchMove = false;
    
                Vue.nextTick(() => {
                    forceReflow();
                    parent.childBranchOffset += transitDiff;
                    parent.applyBranchMove = true;
                });
            }
            else {
                if (isInsert && noodel.isFirstRenderDone) {
                    parent.applyBranchMove = true;
                    parent.childBranchOffset -= alignVal;
                }
                else {
                    parent.childBranchOffset -= alignVal;
                }
            }

            parent.childBranchOffsetAligned -= alignVal;
        }
    }
}

/**
 * Aligns the branch as necessary BEFORE the deletion of a noode
 * and the mutation of its array of siblings.
 */
export function alignBranchBeforeNoodeDelete(noode: NoodeView) {

    let parent = noode.parent;

    // adjust sibling offsets
    for (let i = noode.index + 1; i < parent.children.length; i++) {
        parent.children[i].branchRelativeOffset -= noode.size;
    }

    if (noode.index === parent.activeChildIndex) {
        parent.applyBranchMove = true;
        parent.childBranchOffset += noode.size / 2;
        parent.childBranchOffsetAligned += noode.size / 2;
    }
    else if (noode.index < parent.activeChildIndex) {
        parent.applyBranchMove = true;
        parent.childBranchOffset += noode.size;
        parent.childBranchOffsetAligned += noode.size;
    }
}

/**
 * Aligns the trunk to center on the given branch.
 */
export function alignTrunkToBranch(noodel: NoodelView, branchParent: NoodeView) {

    let targetOffset = (-branchParent.trunkRelativeOffset) - (branchParent.branchSize / 2);

    // only apply transition effect if there's actual movement
    if (Math.abs(noodel.trunkOffset - targetOffset) >= 1) { 
        noodel.applyTrunkMove = true;
    }

    noodel.trunkOffset = targetOffset;
    noodel.trunkOffsetAligned = targetOffset;
}

/**
 * Aligns a branch to center on the noode at the given index.
 */
export function alignBranchToIndex(parent: NoodeView, index: number) {

    let targetOffset = (-parent.children[index].branchRelativeOffset) - (parent.children[index].size / 2);

    // only apply transition effect if there's actual movement
    if (Math.abs(parent.childBranchOffset - targetOffset) >= 1) { 
        parent.applyBranchMove = true;
    }

    parent.childBranchOffset = targetOffset;
    parent.childBranchOffsetAligned = targetOffset;
}
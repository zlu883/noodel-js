import NoodeView from '@/model/NoodeView';
import NoodelView from '@/model/NoodelView';
import { traverseDescendents } from './noodel-traverse';
import { animateNoodeSizeChange } from './noodel-animate';

/**
 * Handler for noode size change. Realigns the trunk, trunk axis offsets of the noode's subtree
 * and the branch offset of the parent branch, if necessary.
 */
export function alignNoodelOnNoodeSizeChange(noodel: NoodelView, noode: NoodeView, newWidth: number, newHeight: number, animate: boolean) {
    const parent = noode.parent;

    let heightDiff = newHeight - noode.size;
    let widthDiff = newWidth - parent.branchSize;

    noode.size = newHeight;
    parent.branchSize = newWidth;

    if (Math.abs(heightDiff) > 0.001) {
        
        // align branch
        if (noode.index === noode.parent.activeChildIndex) {
            parent.childBranchOffset -= heightDiff / 2;
            parent.childBranchOffsetAligned -= heightDiff / 2;
        }
        else if (noode.index < parent.activeChildIndex) {
            parent.childBranchOffset -= heightDiff;
            parent.childBranchOffsetAligned -= heightDiff;
        }

        // set branch relative offset for siblings, necessary for animations
        for (let i = noode.index + 1; i < parent.children.length; i++) {
            parent.children[i].branchRelativeOffset += heightDiff;
        }

        if (animate) animateNoodeSizeChange(noode, heightDiff);
    }

    if (Math.abs(widthDiff) > 0.001) {
        
        // align trunk
        if (parent.isFocalParent) {
            noodel.trunkOffset -= widthDiff / 2;
            noodel.trunkOffsetAligned -= widthDiff / 2;
        }
        else if (parent.isChildrenVisible && parent.level < noodel.focalLevel) {
            noodel.trunkOffset -= widthDiff;
            noodel.trunkOffsetAligned -= widthDiff;
        }

        // align noode subtree
        traverseDescendents(parent, desc => desc.childTrunkOffset += widthDiff, false);
    }
}

/**
 * Aligns the trunk to center on the given branch.
 */
export function alignTrunkToBranch(noodel: NoodelView, branchParent: NoodeView) {

    let targetOffset = (-branchParent.childTrunkOffset) - (branchParent.branchSize / 2);
    
    noodel.trunkOffset = targetOffset;
    noodel.trunkOffsetAligned = targetOffset;
}

/**
 * Aligns a branch to center on the noode at the given index.
 */
export function alignBranchToIndex(parent: NoodeView, index: number) {

    let targetOffset = 0;

    for (let i = 0; i < index; i++) {
        targetOffset -= parent.children[i].size;
    }

    targetOffset -= parent.children[index].size / 2;
    parent.childBranchOffset = targetOffset;
    parent.childBranchOffsetAligned = targetOffset;
}
import NoodeView from '@/model/NoodeView';
import NoodelView from '@/model/NoodelView';
import { traverseDescendents } from './noodel-traverse';
import Vector2D from '@/model/Vector2D';

/**
 * Handler for noode size change. Updates the relative offsets of siblings and descendents,
 * but will not move the trunk or branches. Returns a vector of the noode size difference.
 */
export function updateOffsetsOnNoodeSizeChange(noode: NoodeView, newWidth: number, newHeight: number): Vector2D {
    const parent = noode.parent;

    let heightDiff = newHeight - noode.size;
    let widthDiff = newWidth - parent.branchSize;
    let diffVector: Vector2D = {x: 0, y: 0};

    noode.size = newHeight;
    parent.branchSize = newWidth;

    if (Math.abs(heightDiff) > 0.001) {
        for (let i = noode.index + 1; i < parent.children.length; i++) {
            parent.children[i].branchRelativeOffset += heightDiff;
        }

        diffVector.y = heightDiff;
    }

    if (Math.abs(widthDiff) > 0.001) {
        traverseDescendents(parent, desc => desc.trunkRelativeOffset += widthDiff, false);

        diffVector.x = widthDiff;
    }

    return diffVector;
}

/**
 * Aligns the trunk to center on the given branch.
 */
export function alignTrunkToBranch(noodel: NoodelView, branchParent: NoodeView) {

    let targetOffset = (-branchParent.trunkRelativeOffset) - (branchParent.branchSize / 2);
    
    noodel.trunkOffset = targetOffset;
    noodel.trunkOffsetAligned = targetOffset;
}

/**
 * Aligns a branch to center on the noode at the given index.
 */
export function alignBranchToIndex(parent: NoodeView, index: number) {

    let targetOffset = (-parent.children[index].branchRelativeOffset) - (parent.children[index].size / 2);

    parent.childBranchOffset = targetOffset;
    parent.childBranchOffsetAligned = targetOffset;
}
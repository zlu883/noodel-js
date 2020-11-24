import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { traverseDescendents } from './noodel-traverse';
import { nextTick } from 'vue';
import { disableBranchMove, disableTrunkMove, enableBranchMove, enableTrunkMove, forceReflow } from './noodel-animate';
import { finalizePan } from './noodel-pan';
import { getAnchorOffsetBranch, getAnchorOffsetTrunk, getFocalNode, isPanningBranch, isPanningTrunk } from './getters';

export function updateCanvasSize(noodel: NoodelState, height: number, width: number) {
    let orientation = noodel.options.orientation;

    if (orientation === 'ltr' || orientation === 'rtl') {
        noodel.canvasSizeTrunk = width;
        noodel.canvasSizeBranch = height
    }
    else {
        noodel.canvasSizeTrunk = height;
        noodel.canvasSizeBranch = width;
    }
}

export function updateNodeSize(noodel: NoodelState, node: NodeState, newHeight: number, newWidth: number, isInsert = false) {
    let orientation = noodel.options.orientation;
    let newSize = null;

    if (orientation === 'ltr' || orientation === 'rtl') {
        newSize = newHeight;
    }
    else if (orientation === "ttb" || orientation === 'btt') {
        newSize = newWidth;
    }

    const parent = node.parent;
    let diff = newSize - node.size;

    if (Math.abs(diff) > 0.01) {
        // update node size
        node.size = newSize;

        // update branch relative offsets of next siblings in the branch
        for (let i = node.index + 1; i < parent.children.length; i++) {
            parent.children[i].branchRelativeOffset += diff;
        }

        if (isPanningBranch(noodel) && node.isActive && parent.isFocalParent) {
            adjustBranchMoveOffset(noodel);
        }

        // If branch is in transition, cancel it temporarily and apply transit offset.
        // This does not apply to inserts as branch transition is needed simultaneously with FLIP of child nodes
        if (parent.applyBranchMove && !isInsert) {
            disableBranchMove(noodel, parent, true);

            nextTick(() => {
                enableBranchMove(parent);
                forceReflow();
            });
        }
    }
}

export function updateBranchSize(noodel: NoodelState, parent: NodeState, newHeight: number, newWidth: number, isInsert = false) {
    let orientation = noodel.options.orientation;
    let newSize = null;

    if (orientation === 'ltr' || orientation === 'rtl') {
        newSize = newWidth;
    }
    else if (orientation === "ttb" || orientation === 'btt') {
        newSize = newHeight;
    }

    let diff = newSize - parent.branchSize;

    if (Math.abs(diff) > 0.01) {
        // update branch size
        parent.branchSize = newSize;

        // update trunk relative offset of all descendants
        traverseDescendents(parent, desc => desc.trunkRelativeOffset += diff, false);

        if (isPanningTrunk(noodel) && parent.isFocalParent) {
            adjustTrunkMoveOffset(noodel);
        }

        // If trunk is in transition, cancel it temporarily and apply transit offset.
        // This does not apply to inserts as transitions can only happen during simultaneous child insert + navigation,
        // and transition should be kept in this case
        if (noodel.applyTrunkMove && !isInsert) {                
            disableTrunkMove(noodel, true);

            // resume transition
            nextTick(() => {
                enableTrunkMove(noodel);
                forceReflow();
            });
        }
    }
}

/**
 * Update siblings' relative offsets BEFORE the deletion of a node
 * and the mutation of its array of siblings.
 */
export function updateOffsetsBeforeNodeDelete(node: NodeState) {

    let parent = node.parent;

    // adjust sibling offsets
    for (let i = node.index + 1; i < parent.children.length; i++) {
        parent.children[i].branchRelativeOffset -= node.size;
    }
}

/**
 * Adjust trunk move offset if focal branch size or anchor position changes.
 */
export function adjustTrunkMoveOffset(noodel: NoodelState) {
    let anchorOffset = getAnchorOffsetTrunk(noodel, noodel.focalParent);
    let endLimit = noodel.focalParent.branchSize - anchorOffset;
    let startLimit = -anchorOffset;

    if (noodel.trunkMoveOffset > endLimit) {
        noodel.trunkMoveOffset = endLimit;
    }
    else if (noodel.trunkMoveOffset < startLimit) {
        noodel.trunkMoveOffset = startLimit;
    }
}

/**
 * Adjust branch move offset if focal node size or anchor position changes.
 */
export function adjustBranchMoveOffset(noodel: NoodelState) {
    let focalNode = getFocalNode(noodel);
    let anchorOffset = getAnchorOffsetBranch(noodel, focalNode);
    let endLimit = focalNode.size - anchorOffset;
    let startLimit = -anchorOffset;

    if (noodel.branchMoveOffset > endLimit) {
        noodel.branchMoveOffset = endLimit;
    }
    else if (noodel.branchMoveOffset < startLimit) {
        noodel.branchMoveOffset = startLimit;
    }
}

/**
 * Recapture the size of all nodes and branches and realign the trunk and all branches.
 * This method is used to reset various values if the noodel changed its orientation.
 */
export function resetAlignment(noodel: NoodelState) {

    finalizePan(noodel);
    disableTrunkMove(noodel);

    let rect = noodel.r.canvasEl.getBoundingClientRect();

    updateCanvasSize(noodel, rect.height, rect.width);

    traverseDescendents(
        noodel.root,
        (node) => {
            node.trunkRelativeOffset = 0;
            node.branchRelativeOffset = 0;
            node.size = 0;
            node.branchSize = 0;
            disableBranchMove(noodel, node);
            node.isBranchTransparent = true;
        },
        true
    );

    nextTick(() => {
        traverseDescendents(
            noodel.root,
            (node) => {
                if (node.r.el) {
                    let rect = node.r.el.getBoundingClientRect();
                    updateNodeSize(noodel, node, rect.height, rect.width);
                }
    
                if (node.r.branchSliderEl) {
                    let rect = node.r.branchSliderEl.getBoundingClientRect();
                    updateBranchSize(noodel, node, rect.height, rect.width);
                }

                node.isBranchTransparent = false;
            },
            true
        );

        nextTick(() => {
            forceReflow();
            enableTrunkMove(noodel);
            traverseDescendents(noodel.root, node => enableBranchMove(node), true);
        });
    });
}
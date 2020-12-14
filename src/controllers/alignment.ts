/* Module for managing position alignments in response to size and layout changes. */

import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { traverseDescendents } from './traverse';
import { nextTick } from 'vue';
import { disableBranchTransition, disableTrunkTransition, enableBranchTransition, enableTrunkTransition } from './transition';
import { finalizePan } from './pan';
import { getAnchorOffsetBranch, getAnchorOffsetTrunk, getFocalNode, getOrientation, isBranchVisible, isPanningBranch, isPanningTrunk } from './getters';
import { forceReflow } from './util';

export function updateCanvasSize(noodel: NoodelState, height: number, width: number) {
    let orientation = getOrientation(noodel);

    if (orientation === 'ltr' || orientation === 'rtl') {
        noodel.canvasSizeTrunk = width;
        noodel.canvasSizeBranch = height
    }
    else {
        noodel.canvasSizeTrunk = height;
        noodel.canvasSizeBranch = width;
    }
}

export function updateNodeSize(noodel: NoodelState, node: NodeState, newHeight: number, newWidth: number) {
    let orientation = getOrientation(noodel);
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

        // Disable branch transition temporarily and apply transit offset
        if (parent.isBranchMounted && isBranchVisible(noodel, parent) && node.index <= parent.activeChildIndex && parent.applyBranchMove) {
            disableBranchTransition(noodel, parent, true);

            nextTick(() => {
                enableBranchTransition(parent);
                forceReflow();
            });
        }

        // update node size
        node.size = newSize;

        // update branch relative offsets of next siblings in the branch
        for (let i = node.index + 1; i < parent.children.length; i++) {
            parent.children[i].branchRelativeOffset += diff;
        }

        if (isPanningBranch(noodel) && node.isActive && parent.isFocalParent) {
            adjustBranchPanOffset(noodel);
        }
    }
}

export function updateBranchSize(noodel: NoodelState, parent: NodeState, newHeight: number, newWidth: number) {
    let orientation = getOrientation(noodel);
    let newSize = null;

    if (orientation === 'ltr' || orientation === 'rtl') {
        newSize = newWidth;
    }
    else if (orientation === "ttb" || orientation === 'btt') {
        newSize = newHeight;
    }

    let diff = newSize - parent.branchSize;

    if (Math.abs(diff) > 0.01) {

        // Disable trunk transition temporarily and apply transit offset.
        if (parent.isBranchMounted && isBranchVisible(noodel, parent) && parent.level < noodel.focalLevel && noodel.applyTrunkMove) {
            disableTrunkTransition(noodel, true);

            // resume transition
            nextTick(() => {
                enableTrunkTransition(noodel);
                forceReflow();
            });
        }

        // update branch size
        parent.branchSize = newSize;

        // update trunk relative offset of all descendants
        traverseDescendents(parent, desc => desc.trunkRelativeOffset += diff, false);

        if (isPanningTrunk(noodel) && parent.isFocalParent) {
            adjustTrunkPanOffset(noodel);
        }
    }
}

/**
 * Update siblings' relative offsets BEFORE the deletion of a node
 * and the mutation of its array of siblings.
 */
export function updateOffsetsBeforeNodeDelete(node: NodeState) {

    let siblings = node.parent.children;

    // adjust sibling offsets
    for (let i = node.index + 1; i < siblings.length; i++) {
        siblings[i].branchRelativeOffset -= node.size;
    }
}

/**
 * Adjust trunk pan offset if focal branch size or anchor position changes.
 */
export function adjustTrunkPanOffset(noodel: NoodelState) {
    let anchorOffset = getAnchorOffsetTrunk(noodel, noodel.focalParent);
    let endLimit = noodel.focalParent.branchSize - anchorOffset;
    let startLimit = -anchorOffset;

    if (noodel.trunkPanOffset > endLimit) {
        noodel.trunkPanOffset = endLimit;
    }
    else if (noodel.trunkPanOffset < startLimit) {
        noodel.trunkPanOffset = startLimit;
    }
}

/**
 * Adjust branch pan offset if focal node size or anchor position changes.
 */
export function adjustBranchPanOffset(noodel: NoodelState) {
    let focalNode = getFocalNode(noodel);
    let anchorOffset = getAnchorOffsetBranch(noodel, focalNode);
    let endLimit = focalNode.size - anchorOffset;
    let startLimit = -anchorOffset;

    if (noodel.branchPanOffset > endLimit) {
        noodel.branchPanOffset = endLimit;
    }
    else if (noodel.branchPanOffset < startLimit) {
        noodel.branchPanOffset = startLimit;
    }
}

/**
 * Recapture the size of all nodes and branches and realign the trunk and all branches.
 * This method is used to reset various values if the noodel changed its orientation.
 */
export function resetAlignment(noodel: NoodelState) {

    finalizePan(noodel);
    disableTrunkTransition(noodel);

    let rect = noodel.r.canvasEl.getBoundingClientRect();

    updateCanvasSize(noodel, rect.height, rect.width);

    traverseDescendents(
        noodel.root,
        (node) => {
            node.trunkRelativeOffset = 0;
            node.branchRelativeOffset = 0;
            node.size = 0;
            node.branchSize = 0;
            disableBranchTransition(noodel, node);
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
            enableTrunkTransition(noodel);
            traverseDescendents(noodel.root, node => enableBranchTransition(node), true);
        });
    });
}
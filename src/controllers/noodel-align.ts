import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { traverseDescendents } from './noodel-traverse';
import { nextTick } from 'vue';
import { findRenderedBranchOffset, findRenderedTrunkOffset, forceReflow } from './noodel-animate';
import { cancelPan } from './noodel-pan';

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

    node.size = newSize;

    if (Math.abs(diff) > 0.01) {
        for (let i = node.index + 1; i < parent.children.length; i++) {
            parent.children[i].branchRelativeOffset += diff;
        }

        let alignVal = 0;

        if (node.index === parent.activeChildIndex) {
            alignVal = diff / 2;
        }
        else if (node.index < parent.activeChildIndex) {
            alignVal = diff;
        }

        if (alignVal !== 0) {
            if (noodel.r.panAxis === "branch" && parent.isFocalParent) {
                noodel.r.panOriginBranch += alignVal;
            }

            // If branch is in transition, cancel it temporarily and force an alignment.
            // This does not apply to inserts as branch transition is needed for FLIP animation in transition groups
            if (parent.applyBranchMove && !isInsert) {
                let currentOffset = findRenderedBranchOffset(noodel, parent);
                
                // Find out the diff between transition target and current, for adding back later.
                // Using diff rather than a fixed value prevents possible bugs with simultaneous resize of multiple nodes.
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
                parent.branchOffset += alignVal;

                if (isInsert && parent.isBranchMounted) {
                    parent.applyBranchMove = true;
                }
            }
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
                let currentOffset = findRenderedTrunkOffset(noodel);
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
 * Aligns the branch as necessary BEFORE the deletion of a node
 * and the mutation of its array of siblings.
 */
export function alignBranchBeforeNodeDelete(node: NodeState) {

    let parent = node.parent;

    // adjust sibling offsets
    for (let i = node.index + 1; i < parent.children.length; i++) {
        parent.children[i].branchRelativeOffset -= node.size;
    }

    if (node.index === parent.activeChildIndex) {
        parent.applyBranchMove = true;
        parent.branchOffset -= node.size / 2;
    }
    else if (node.index < parent.activeChildIndex) {
        parent.applyBranchMove = true;
        parent.branchOffset -= node.size;
    }
}

/**
 * Aligns the trunk to center on the given branch.
 */
export function alignTrunkToBranch(noodel: NoodelState, branchParent: NodeState) {

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
 * Aligns a branch to center on the node at the given index.
 */
export function alignBranchToIndex(parent: NodeState, index: number) {

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
 * Recapture the size of all nodes and branches and realign the trunk and all branches.
 * This method is used to reset various values if the noodel changed its orientation.
 */
export function resetAlignment(noodel: NoodelState) {

    cancelPan(noodel);
    noodel.applyTrunkMove = false;
    noodel.trunkOffset = 0;

    let rect = noodel.r.canvasEl.getBoundingClientRect();

    updateCanvasSize(noodel, rect.height, rect.width);

    traverseDescendents(
        noodel.root,
        (node) => {
            node.trunkRelativeOffset = 0;
            node.branchRelativeOffset = 0;
            node.size = 0;
            node.branchSize = 0;
            node.applyBranchMove = false;
            node.branchOffset = 0;
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
    });
}

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
/* Module for various convenience getters. */

import { BranchDirection } from '../types/BranchDirection';
import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { Orientation } from '../types/Orientation';
import { traverseAncestors } from './traverse';

export function getFocalNode(noodel: NoodelState) {
    return getActiveChild(noodel.focalParent);
}

export function getActiveChild(node: NodeState) {
    let activeChildIndex = node.activeChildIndex;
    
    if (activeChildIndex === null) return null;
    return node.children[activeChildIndex];
}

export function getPath(node: NodeState): number[] {
    let path = [];

    traverseAncestors(node, node => {
        path.push(node.index);
    }, true, false);

    return path.reverse();
}

export function isFirstNode(node: NodeState): boolean {
    return node.index === 0;
}

export function isLastNode(node: NodeState): boolean {
    return node.index === node.parent.children.length - 1;
}

export function isTopmostBranch(parent: NodeState): boolean {
    return parent.r.isRoot;
}

export function isDeepestBranch(parent: NodeState): boolean {
    return getActiveChild(getActiveChild(parent)) === null;
}

export function isEmpty(noodel: NoodelState): boolean {
    return noodel.root.children.length === 0;
}

export function isPanning(noodel: NoodelState): boolean {
    return noodel.r.panAxis !== null;
}

export function isPanningTrunk(noodel: NoodelState): boolean {
    return noodel.r.panAxis === 'trunk';
}

export function isPanningBranch(noodel: NoodelState): boolean {
    return noodel.r.panAxis === 'branch';
}

export function isBranchVisible(noodel: NoodelState, parent: NodeState): boolean {
    return parent.isActiveLineage && parent.level <= (noodel.focalLevel - 1) + noodel.options.visibleSubtreeDepth;
}

export function getOrientation(noodel: NoodelState): Orientation {
    return noodel.options.orientation;
}

export function getBranchDirection(noodel: NoodelState): BranchDirection {
    return noodel.options.branchDirection;
}
 
/**
 * The orientation agnostic distance counting from the start of the trunk axis
 * to the focal position.
 */
export function getFocalOffsetTrunk(noodel: NoodelState): number {
    let canvasSizeTrunk = noodel.canvasSizeTrunk;

    return Math.min(noodel.options.focalOffsetTrunk(canvasSizeTrunk), canvasSizeTrunk);
}

/**
 * The orientation agnostic distance counting from the start of the branch axis
 * to the focal position.
 */
export function getFocalOffsetBranch(noodel: NoodelState) {
    let canvasSizeBranch = noodel.canvasSizeBranch;

    return Math.min(noodel.options.focalOffsetBranch(canvasSizeBranch), canvasSizeBranch);
}

/**
 * The orientation agnostic distance of the current focal branch relative
 * to the start of the trunk axis.
 */
export function getRelativeOffsetTrunk(noodel: NoodelState) {
    return noodel.focalParent.trunkRelativeOffset;
}

/**
 * The orientation agnostic distance of an active node relative
 * to the start of the branch axis.
 */
export function getRelativeOffsetBranch(branchParent: NodeState) {
    return getActiveChild(branchParent).branchRelativeOffset;
}

/**
 * The orientation agnostic distance of a branch's anchor point
 * from the branch's starting edge.
 */
export function getAnchorOffsetTrunk(noodel: NoodelState, branchParent: NodeState) {
    let focalBranchSize = branchParent.branchSize;
    let func = branchParent.options.anchorOffsetTrunk || noodel.options.anchorOffsetTrunk;

    return Math.min(func(focalBranchSize), focalBranchSize);
}

/**
 * The orientation agnostic distance of a node's anchor point
 * from the node's starting edge.
 */
export function getAnchorOffsetBranch(noodel: NoodelState, node: NodeState) {
    let nodeSize = node.size;
    let func = node.options.anchorOffsetBranch || noodel.options.anchorOffsetBranch;

    return Math.min(func(nodeSize), nodeSize);
}

/**
 * The actual orientation-agnostic offset of the trunk taking into account all
 * calculations.
 */
export function getActualOffsetTrunk(noodel: NoodelState): number {
    return (
        getFocalOffsetTrunk(noodel) 
        - getRelativeOffsetTrunk(noodel)
        - getAnchorOffsetTrunk(noodel, noodel.focalParent)
        - noodel.trunkPanOffset
        + noodel.trunkTransitOffset
    );
}

/**
 * The actual orientation-agnostic offset of a branch taking into account all
 * calculations.
 */
export function getActualOffsetBranch(noodel: NoodelState, branchParent: NodeState) {
    return (
        getFocalOffsetBranch(noodel) 
        - getRelativeOffsetBranch(branchParent)
        - getAnchorOffsetBranch(noodel, getActiveChild(branchParent))
        - (branchParent.isFocalParent ? noodel.branchPanOffset : 0)
        + branchParent.branchTransitOffset
    );
}
import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { traverseAncestors } from './noodel-traverse';

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

/**
 * The orientation agnostic distance counting from the start of the trunk axis
 * to the focal position.
 */
export function getFocalOffsetTrunk(noodel: NoodelState): number {
    let canvasSizeTrunk = noodel.canvasSizeTrunk;

    return Math.min(noodel.options.focalPositionTrunk(canvasSizeTrunk), canvasSizeTrunk);
}

/**
 * The orientation agnostic distance counting from the start of the branch axis
 * to the focal position.
 */
export function getFocalOffsetBranch(noodel: NoodelState) {
    let canvasSizeBranch = noodel.canvasSizeBranch;

    return Math.min(noodel.options.focalPositionBranch(canvasSizeBranch), canvasSizeBranch);
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
 * The orientation agnostic distance of the current focal branch's anchor point
 * from the branch's starting edge.
 */
export function getAnchorOffsetTrunk(noodel: NoodelState) {
    let focalBranchSize = noodel.focalParent.branchSize;

    return Math.min(noodel.options.focalAnchorTrunk(focalBranchSize), focalBranchSize);
}

/**
 * The orientation agnostic distance of an active node's anchor point
 * from the node's starting edge.
 */
export function getAnchorOffsetBranch(noodel: NoodelState, branchParent: NodeState) {
    let nodeSize = getActiveChild(branchParent).size;

    return Math.min(noodel.options.focalAnchorBranch(nodeSize), nodeSize);
}

/**
 * The actual orientation-agnostic offset of the trunk taking into account all
 * calculations.
 */
export function getActualOffsetTrunk(noodel: NoodelState): number {
    return (
        getFocalOffsetTrunk(noodel) 
        - getRelativeOffsetTrunk(noodel)
        - getAnchorOffsetTrunk(noodel)
        - noodel.trunkMoveOffset
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
        - getAnchorOffsetBranch(noodel, branchParent)
        - branchParent.branchMoveOffset
    );
}
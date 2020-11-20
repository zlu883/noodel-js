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
 * The x-coordinate of the focal position on the canvas.
 */
export function getFocalPositionX(noodel: NoodelState): number {
    let canvasWidth = noodel.canvasWidth;

    return Math.min(noodel.options.focalPositionX(canvasWidth), canvasWidth);
}

/**
 * The y-coordinate of the focal position on the canvas.
 */
export function getFocalPositionY(noodel: NoodelState): number {
    let canvasHeight = noodel.canvasHeight;

    return Math.min(noodel.options.focalPositionY(canvasHeight), canvasHeight);
}

/**
 * The orientation agnostic distance counting from the start of the trunk axis
 * to the focal position.
 */
export function getFocalOffsetTrunk(noodel: NoodelState): number {
    let orientation = noodel.options.orientation;

    if (orientation === 'ltr') {
        return getFocalPositionX(noodel);
    }
    else if (orientation === 'rtl') {
        return noodel.canvasWidth - getFocalPositionX(noodel);
    }
    else if (orientation === 'ttb') {
        return getFocalPositionY(noodel);
    }
    else if (orientation === 'btt') {
        return noodel.canvasHeight - getFocalPositionY(noodel);
    }
}

/**
 * The orientation agnostic distance counting from the start of the branch axis
 * to the focal position.
 */
export function getFocalOffsetBranch(noodel: NoodelState) {
    let options = noodel.options;
    let orientation = options.orientation;
    let branchDirection = options.branchDirection;

    if (orientation === 'ltr' || orientation === 'rtl') {
        if (branchDirection === 'normal') {
            return getFocalPositionY(noodel);
        }
        else if (branchDirection === 'reverse') {
            return noodel.canvasHeight - getFocalPositionY(noodel);
        }
    }
    else {
        if (branchDirection === 'normal') {
            return getFocalPositionX(noodel);
        }
        else if (branchDirection === 'reverse') {
            return noodel.canvasWidth - getFocalPositionX(noodel);
        }
    }
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

    return Math.min(noodel.options.focalAnchorBranch(focalBranchSize), focalBranchSize);
}

/**
 * The orientation agnostic distance of an active node's anchor point
 * from the node's starting edge.
 */
export function getAnchorOffsetBranch(noodel: NoodelState, branchParent: NodeState) {
    let nodeSize = getActiveChild(branchParent).size;

    return Math.min(noodel.options.focalAnchorNode(nodeSize), nodeSize);
}
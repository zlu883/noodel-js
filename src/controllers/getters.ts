import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { traverseAncestors } from './noodel-traverse';

export function getFocalHeight(noodel: NoodelState) {
    return noodel.containerHeight / 2;
}

export function getFocalWidth(noodel: NoodelState) {
    return noodel.containerWidth / 2;
}

export function getActiveChild(node: NodeState) {
    if (node.activeChildIndex === null) return null;
    return node.children[node.activeChildIndex];
}

export function getPath(node: NodeState): number[] {
    let path = [];

    traverseAncestors(node, node => {
        path.push(node.index);
    }, true, false);

    return path.reverse();
}
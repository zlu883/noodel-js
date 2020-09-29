import NoodeState from '../types/NoodeState';
import NoodelState from '../types/NoodelState';
import { traverseAncestors } from '../controllers/noodel-traverse';

export function getFocalHeight(noodel: NoodelState) {
    return noodel.containerHeight / 2;
}

export function getFocalWidth(noodel: NoodelState) {
    return noodel.containerWidth / 2;
}

export function isRoot(noode: NoodeState): boolean {
    return !noode.parent;
}

export function getActiveChild(noode: NoodeState) {
    if (noode.activeChildIndex === null) return null;
    return noode.children[noode.activeChildIndex];
}

export function getMidSize(noode: NoodeState) {
    return noode.size / 2;
}

export function getChildrenBranchMidSize(noode: NoodeState) {
    return noode.branchSize / 2;
}

export function getPath(noode: NoodeState): number[] {
    let path = [];

    traverseAncestors(noode, noode => {
        path.push(noode.index);
    }, true, false);

    return path.reverse();
}
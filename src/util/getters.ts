import NoodeView from '../types/NoodeView';
import NoodelView from '../types/NoodelView';
import { traverseAncestors } from '../controllers/noodel-traverse';

export function getFocalHeight(noodel: NoodelView) {
    return noodel.containerHeight / 2;
}

export function getFocalWidth(noodel: NoodelView) {
    return noodel.containerWidth / 2;
}

export function isRoot(noode: NoodeView): boolean {
    return !noode.parent;
}

export function getActiveChild(noode: NoodeView) {
    if (noode.activeChildIndex === null) return null;
    return noode.children[noode.activeChildIndex];
}

export function getMidSize(noode: NoodeView) {
    return noode.size / 2;
}

export function getChildrenBranchMidSize(noode: NoodeView) {
    return noode.branchSize / 2;
}

export function getPath(noode: NoodeView): number[] {
    let path = [];

    traverseAncestors(noode, noode => {
        path.push(noode.index);
    }, true, false);

    return path.reverse();
}
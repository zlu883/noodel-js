import NoodeView from '@/model/NoodeView';
import NoodelView from '@/model/NoodelView';
import { traverseAncestors } from '@/controllers/noodel-traverse';

export function getFocalHeight(noodel: NoodelView) {
    return noodel.containerSize.y / 2;
}

export function getFocalWidth(noodel: NoodelView) {
    return noodel.containerSize.x / 2;
}

export function isRoot(noode: NoodeView): boolean {
    return !noode.parent;
}

export function getActiveChild(noode: NoodeView) {
    if (noode.activeChildIndex === null) return null;
    return noode.children[noode.activeChildIndex];
}

export function getFirstChild(noode: NoodeView) {
    if (noode.children.length === 0) return null;
    return noode.children[0];
}

export function getLastChild(noode: NoodeView) {
    if (noode.children.length === 0) return null;
    return noode.children[noode.children.length - 1];
}

export function isFirstChildActive(noode: NoodeView) {
    return noode.activeChildIndex === 0;
}

export function isLastChildActive(noode: NoodeView) {
    return noode.activeChildIndex === noode.children.length - 1;
}

export function getMidSize(noode: NoodeView) {
    return noode.size / 2;
}

export function getChildrenBranchMidSize(noode: NoodeView) {
    return noode.branchSize / 2;
}

export function canNavigateUp(noodel: NoodelView): boolean {
    if (!getActiveChild(noodel.focalParent)) return false; 
    return !isFirstChildActive(noodel.focalParent);
}

export function canNavigateDown(noodel: NoodelView): boolean {
    if (!getActiveChild(noodel.focalParent)) return false;
    return !isLastChildActive(noodel.focalParent);
}

export function canNavigateLeft(noodel: NoodelView): boolean {
    if (!getActiveChild(noodel.focalParent)) return false;    
    return !isRoot(noodel.focalParent);
}

export function canNavigateRight(noodel: NoodelView): boolean {
    if (!getActiveChild(noodel.focalParent)) return false;  
    return !!getActiveChild(getActiveChild(noodel.focalParent));
}

export function getPath(noode: NoodeView): number[] {
    let path = [];

    traverseAncestors(noode, noode => {
        path.push(noode.index);
    }, true, false);

    return path.reverse();
}
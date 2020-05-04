import NoodeView from '@/model/NoodeView';
import { traverseActiveDescendents } from './noodel-traverse';
import { getActiveChild } from '@/util/getters';
import NoodelView from '@/model/NoodelView';

export function setActiveSubtreeVisibility(origin: NoodeView, visible: boolean, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isChildrenVisible = visible;
    }, true, false, depth);
}

/**
 * Changes the focal parent of the noodel, and toggles the visibility of the active subtree.
 * Does not align the trunk.
 */
export function setFocalParent(noodel: NoodelView, newFocalParent: NoodeView) {

    noodel.focalParent.isFocalParent = false;
    hideActiveSubtree(noodel.root);

    newFocalParent.isFocalParent = true;
    noodel.focalParent = newFocalParent;
    noodel.focalLevel = newFocalParent.level;
    showActiveSubtree(noodel.root, newFocalParent.level + noodel.options.visibleSubtreeDepth);
}

/**
 * Changes the active child of the parent to the given index (can be null to unset active child).
 * Does not align the branch.
 */
export function setActiveChild(parent: NoodeView, index: number | null) {
    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = false;
    }

    parent.activeChildIndex = index;

    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = true;
    }
}

export function showActiveSubtree(origin: NoodeView, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isChildrenVisible = true;
    }, true, false, depth);
}

export function hideActiveSubtree(origin: NoodeView, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isChildrenVisible = false;
    }, true, false, depth);
}
import NoodeView from '@/model/NoodeView';
import { traverseActiveDescendents } from './noodel-traverse';
import { getActiveChild } from '@/util/getters';

export function setActiveChild(parent: NoodeView, index: number) {
    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = false;
    }

    parent.activeChildIndex = index;

    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = true;
    }
}

export function setActiveSubtreeVisibility(origin: NoodeView, visible: boolean, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isChildrenVisible = visible;
    }, true, false, depth);
}
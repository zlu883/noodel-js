import NoodeView from '@/model/NoodeView';
import { traverseActiveDescendents } from './noodel-traverse';
import { getActiveChild, isRoot } from '@/util/getters';
import NoodelView from '@/model/NoodelView';
import { alignTrunkToBranch, alignNoodelBeforeNoodeDelete } from './noodel-align';
import { forceReflow } from './noodel-animate';
import { Axis } from '@/enums/Axis';
import { cancelPan } from './noodel-navigate';

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

    // if panning focal branch, cancel it
    if (noodel.panAxis === Axis.VERTICAL) {
        cancelPan(noodel);
    }

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

/**
 * Insert children to a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function insertChildren(noodel: NoodelView, parent: NoodeView, index: number, children: NoodeView[]) {

    // if panning focal branch, cancel it
    if (parent.isFocalParent && noodel.panAxis === Axis.VERTICAL) {
        cancelPan(noodel);
    }

    parent.children.splice(index, 0, ...children);

    if (parent.activeChildIndex !== null && index <= parent.activeChildIndex) {
        parent.activeChildIndex += children.length;
    }

    for (let i = index + children.length; i < parent.children.length; i++) {
        parent.children[i].index += children.length;
    }

    if (parent.children.length === children.length) {
        setActiveChild(parent, 0);
    }

    if (parent.isActive && (isRoot(parent) || parent.parent.isChildrenVisible)) {
        setActiveSubtreeVisibility(noodel.focalParent, true, noodel.options.visibleSubtreeDepth);
    }
}

/**
 * Deletes children from a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function deleteChildren(noodel: NoodelView, parent: NoodeView, index: number, deleteCount: number): NoodeView[] {

    // if panning focal branch, cancel it
    if (parent.isFocalParent && noodel.panAxis === Axis.VERTICAL) {
        cancelPan(noodel);
    }
    
    // first adjust alignment of branch
    for (let i = index; i < index + deleteCount; i++) {
        alignNoodelBeforeNoodeDelete(noodel, parent.children[i]);
    }

    // if deletion includes active child, change the active child as appropriate
    if (parent.activeChildIndex >= index && parent.activeChildIndex < index + deleteCount) { 

        // align trunk to nearest parent branch if current focal branch is being deleted
        if (parent.level <= noodel.focalLevel && parent.isChildrenVisible) {
            if (parent.children.length === deleteCount) {
                if (isRoot(parent)) {
                    setFocalParent(noodel, parent);
                    alignTrunkToBranch(noodel, parent);
                    forceReflow();
                }
                else {
                    setFocalParent(noodel, parent.parent);
                    alignTrunkToBranch(noodel, parent.parent);
                    forceReflow();
                }
            }
            else if (parent.level < noodel.focalLevel) {
                setFocalParent(noodel, parent);
                alignTrunkToBranch(noodel, parent);
                forceReflow();
            }
        }

        if (parent.children.length === deleteCount) { // all children deleted
            setActiveChild(parent, null);
        }
        else if (index + deleteCount < parent.children.length) { // siblings exist after the deleted children
            setActiveChild(parent, index + deleteCount); // set next sibling active
            showActiveSubtree(parent, noodel.options.visibleSubtreeDepth);            
            parent.childBranchOffset -= getActiveChild(parent).size / 2;
            parent.childBranchOffsetAligned -= getActiveChild(parent).size / 2;
        }
        else { // no siblings exist after deleted children
            setActiveChild(parent, index - 1); // set prev sibling active
            showActiveSubtree(parent, noodel.options.visibleSubtreeDepth);
            parent.childBranchOffset += getActiveChild(parent).size / 2;
            parent.childBranchOffsetAligned += getActiveChild(parent).size / 2;
        }
    }

    // update sibling indices
    for (let i = index; i < parent.children.length; i++) {
        parent.children[i].index -= deleteCount;
    }

    // update parent's active child index
    if (parent.activeChildIndex > index) {
        parent.activeChildIndex -= deleteCount;
    }

    // do delete
    return parent.children.splice(index, deleteCount);
}
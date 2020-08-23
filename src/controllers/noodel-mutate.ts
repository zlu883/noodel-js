import NoodeView from '../types/NoodeView';
import { traverseActiveDescendents } from './noodel-traverse';
import { getActiveChild, isRoot } from '../util/getters';
import NoodelView from '../types/NoodelView';
import { alignTrunkToBranch, alignBranchBeforeNoodeDelete } from './noodel-align';
import { forceReflow } from './noodel-animate';
import { Axis } from '../enums/Axis';
import { cancelPan } from './noodel-navigate';
import { syncHashToFocalNoode } from './noodel-routing';
import Noode from '../main/Noode';
import { unregisterNoode, findNoode } from './id-register';
import NoodeDefinition from '../types/NoodeDefinition';
import { buildNoodeView } from './noodel-setup';
import { debounce } from './throttle';

/**
 * Changes the focal parent of the noodel, and toggles the visibility of the active tree.
 * Does not align the trunk.
 */
export function setFocalParent(noodel: NoodelView, newFocalParent: NoodeView) {

    noodel.focalParent.isFocalParent = false;

    let hideFrom = getActiveChild(newFocalParent);

    if (hideFrom) {
        for (let i = 0; i < noodel.options.visibleSubtreeDepth; i++) {
            let next = getActiveChild(hideFrom);

            if (!next) break;
            hideFrom = next;
        }
    
        hideActiveSubtree(hideFrom);  
    }

    newFocalParent.isFocalParent = true;
    noodel.focalParent = newFocalParent;
    noodel.focalLevel = newFocalParent.level;
    showActiveSubtree(noodel, noodel.root, newFocalParent.level - 1 + noodel.options.visibleSubtreeDepth, 0);
}

/**
 * Changes the active child of the parent to the given index (can be null to unset active child).
 * Does not align the branch.
 */
export function setActiveChild(noodel: NoodelView, parent: NoodeView, index: number | null) {
    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = false;
    }

    parent.activeChildIndex = index;

    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = true;
    }
}

export function showActiveSubtree(noodel: NoodelView, origin: NoodeView, depth?: number, debounceInterval = 0) {
    debounce(noodel, 'showActiveSubtree', () => {
        traverseActiveDescendents(origin, desc => {
            // check necessary to reduce Vue node patching
            if (!desc.isChildrenVisible) {
                desc.isChildrenVisible = true;
            }
        }, true, false, depth);
    }, debounceInterval)
}

export function hideActiveSubtree(origin: NoodeView, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        // check necessary to reduce Vue node patching
        if (desc.isChildrenVisible) {
            desc.isChildrenVisible = false;
        }
    }, true, false, depth);
}

/**
 * Insert children to a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function insertChildren(noodel: NoodelView, parent: NoodeView, index: number, childDefs: NoodeDefinition[]): NoodeView[] {

    let prevFocalNoode = getActiveChild(noodel.focalParent);

    // if panning focal branch, cancel it
    // unfortunately it's too difficult to align pan offsets at the moment
    if (parent.isFocalParent && noodel.panAxis === Axis.VERTICAL) {
        cancelPan(noodel);
    }

    if (parent.activeChildIndex !== null && index <= parent.activeChildIndex) {
        parent.activeChildIndex += childDefs.length;
    }

    let children = childDefs.map((def, pos) => {
        let child = buildNoodeView(
            noodel,
            def,
            parent.level + 1,
            index + pos,
            parent
        );

        return child;
    });

    parent.children.splice(index, 0, ...children);

    for (let i = index + children.length; i < parent.children.length; i++) {
        parent.children[i].index += children.length;
    }

    if (parent.children.length === children.length) {
        setActiveChild(noodel, parent, 0);
    }

    if (parent.isActive && (isRoot(parent) || parent.parent.isChildrenVisible)) {
        showActiveSubtree(noodel, noodel.focalParent, noodel.options.visibleSubtreeDepth);
    }

    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));

    // Allows resize sensors to be attached properly, preventing possible performance issue.
    // Will be toggled back off at noode mount.
    parent.isChildrenTransparent = true;

    return children;
}

/**
 * Deletes children from a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function deleteChildren(noodel: NoodelView, parent: NoodeView, index: number, deleteCount: number): NoodeView[] {

    let prevFocalNoode = getActiveChild(noodel.focalParent);

    // if panning focal branch, cancel it
    // unfortunately it's too difficult to align pan offsets at the moment
    if (parent.isFocalParent && noodel.panAxis === Axis.VERTICAL) {
        cancelPan(noodel);
    }

    // first adjust alignment of branch
    for (let i = index; i < index + deleteCount; i++) {
        alignBranchBeforeNoodeDelete(parent.children[i]);
    }

    // if deletion includes active child, change the active child as appropriate
    if (parent.activeChildIndex >= index && parent.activeChildIndex < index + deleteCount) { 

        // align trunk to nearest parent branch if current focal branch is being deleted
        if (parent.level <= noodel.focalLevel && parent.isChildrenVisible) {

            if (noodel.panAxis === Axis.HORIZONTAL) {
                cancelPan(noodel);
            }

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
            setActiveChild(noodel, parent, null);
            parent.isChildrenVisible = false;
        }
        else if (index + deleteCount < parent.children.length) { // siblings exist after the deleted children
            setActiveChild(noodel, parent, index + deleteCount); // set next sibling active
            showActiveSubtree(noodel, parent, noodel.options.visibleSubtreeDepth);            
            parent.childBranchOffset -= getActiveChild(parent).size / 2;
            parent.childBranchOffsetAligned -= getActiveChild(parent).size / 2;
        }
        else { // no siblings exist after deleted children
            setActiveChild(noodel, parent, index - 1); // set prev sibling active
            showActiveSubtree(noodel, parent, noodel.options.visibleSubtreeDepth);
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
    let deletedNoodes = parent.children.splice(index, deleteCount);

    deletedNoodes.forEach(n => unregisterNoode(noodel, n.id));

    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));

    return deletedNoodes;
}

/**
 * Triggers events and sync hash if the focal noode (and maybe also focal parent) have changed.
 * Does nothing if prev equals current.
 */
export function handleFocalNoodeChange(noodel: NoodelView, prev: NoodeView, current: NoodeView) {

    if (!prev && !current) return;
    if (prev && current && prev.id === current.id) return;

    syncHashToFocalNoode(noodel);

    let prevNoode = prev ? findNoode(noodel, prev.id) : null;
    let currentNoode = current ? findNoode(noodel, current.id) : null;

    if (prev && typeof prev.options.onExitFocus === 'function') {
        prev.options.onExitFocus(prevNoode, currentNoode);
    }

    if (current && typeof current.options.onEnterFocus === 'function') {
        current.options.onEnterFocus(currentNoode, prevNoode);
    }

    if (typeof noodel.options.onFocalNoodeChange === 'function') {
        noodel.options.onFocalNoodeChange(currentNoode, prevNoode);
    }

    let prevParent = prev ? prev.parent : null;
    let currentParent = current ? current.parent : null;

    if (!prevParent && !currentParent) return;
    if (prevParent && currentParent && prevParent.id === currentParent.id) return;

    let prevParentNoode = prevParent ? findNoode(noodel, prevParent.id) : null;
    let currentParentNoode = currentParent ? findNoode(noodel, currentParent.id) : null;

    if (prevParent && typeof prevParent.options.onChildrenExitFocus === 'function') {
        prevParent.options.onChildrenExitFocus(prevParentNoode, currentParentNoode);
    }

    if (currentParent && typeof currentParent.options.onChildrenEnterFocus === 'function') {
        currentParent.options.onChildrenEnterFocus(currentParentNoode, prevParentNoode);
    }

    if (typeof noodel.options.onFocalParentChange === 'function') {
        noodel.options.onFocalParentChange(currentParentNoode, prevParentNoode);
    }
}
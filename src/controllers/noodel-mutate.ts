import NoodeState from '../types/NoodeState';
import { traverseActiveDescendents } from './noodel-traverse';
import { getActiveChild, isRoot } from './getters';
import NoodelState from '../types/NoodelState';
import { alignTrunkToBranch, alignBranchBeforeNoodeDelete } from './noodel-align';
import { forceReflow } from './noodel-animate';
import { cancelPan } from './noodel-pan';
import { registerNoodeSubtree } from './id-register';
import NoodeDefinition from '../types/NoodeDefinition';
import { buildNoodeView } from './noodel-setup';
import { debounce } from './throttle';
import { handleFocalNoodeChange } from './event-emit';

/**
 * Changes the focal parent of the noodel, and toggles the visibility of the active tree.
 * Does not align the trunk.
 */
export function setFocalParent(noodel: NoodelState, newFocalParent: NoodeState) {

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
    noodel.focalLevel = newFocalParent.level + 1;
    showActiveSubtree(noodel, noodel.root, newFocalParent.level + noodel.options.visibleSubtreeDepth, 0);
}

/**
 * Changes the active child of the parent to the given index (can be null to unset active child).
 * Does not align the branch.
 */
export function setActiveChild(noodel: NoodelState, parent: NoodeState, index: number | null) {
    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = false;
    }

    parent.activeChildIndex = index;

    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = true;
    }
}

export function showActiveSubtree(noodel: NoodelState, origin: NoodeState, depth?: number, debounceInterval = 0) {
    debounce(noodel, 'showActiveSubtree', () => {
        traverseActiveDescendents(origin, desc => {
            // check necessary to reduce Vue node patching
            if (!desc.isBranchVisible) {
                desc.isBranchVisible = true;
            }
        }, true, false, depth);
    }, debounceInterval)
}

export function hideActiveSubtree(origin: NoodeState, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        // check necessary to reduce Vue node patching
        if (desc.isBranchVisible) {
            desc.isBranchVisible = false;
        }
    }, true, false, depth);
}

/**
 * Insert children to a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function insertChildren(noodel: NoodelState, parent: NoodeState, index: number, childDefs: NoodeDefinition[]): NoodeState[] {

    // find initial relative offset for the new children
    let prev = parent.children[index - 1];
    let branchRelativeOffset = prev ? prev.branchRelativeOffset + prev.size : 0;

    // construct view tree, this should come first as it may throw error
    let children = childDefs.map((def, pos) => {
        return buildNoodeView(
            noodel,
            def,
            index + pos,
            parent,
            false, // ignore whether the immediate children should be active, for now
            branchRelativeOffset 
        );
    });

    // register new children and their descendents
    children.forEach(child => registerNoodeSubtree(noodel, child));

    let prevFocalNoode = getActiveChild(noodel.focalParent);

    // if panning focal branch, cancel it
    // unfortunately it's too difficult to align pan offsets at the moment
    if (parent.isFocalParent && noodel.panAxis === "branch") {
        cancelPan(noodel);
    }

    // adjust active child index if inserting before active, to retain active child
    if (parent.activeChildIndex !== null && index <= parent.activeChildIndex) {
        parent.activeChildIndex += childDefs.length;
    }

    // do insert
    parent.children.splice(index, 0, ...children);

    // adjust any sibling indices
    for (let i = index + children.length; i < parent.children.length; i++) {
        parent.children[i].index += children.length;
    }

    // parse isActive from the definitions to set active child, only when the parent was originally empty
    if (parent.children.length === children.length) {
        let activeChildIndex = 0; // assumes this cannot be null as there must be at least 1 child added

        for (let i = 0; i < childDefs.length; i++) {
            if (childDefs[i].isActive) {
                activeChildIndex = i;
                break;
            }
        }

        setActiveChild(noodel, parent, activeChildIndex);
    }

    if (parent.isActive && (isRoot(parent) || parent.parent.isBranchVisible)) {
        showActiveSubtree(noodel, noodel.focalParent, noodel.options.visibleSubtreeDepth);
    }

    // Allows resize sensors to be attached properly, preventing possible performance issue.
    // Will be toggled back off at noode mount.
    parent.isBranchTransparent = true;

    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));

    return children;
}

/**
 * Deletes children from a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function deleteChildren(noodel: NoodelState, parent: NoodeState, index: number, deleteCount: number): NoodeState[] {

    let prevFocalNoode = getActiveChild(noodel.focalParent);

    // if panning focal branch, cancel it
    // unfortunately it's too difficult to align pan offsets at the moment
    if (parent.isFocalParent && noodel.panAxis === "branch") {
        cancelPan(noodel);
    }

    // first adjust alignment of branch
    for (let i = index; i < index + deleteCount; i++) {
        alignBranchBeforeNoodeDelete(parent.children[i]);
    }

    // if deletion includes active child, change the active child as appropriate
    if (parent.activeChildIndex >= index && parent.activeChildIndex < index + deleteCount) { 

        // align trunk to nearest parent branch if current focal branch is being deleted
        if ((parent.level + 1) <= noodel.focalLevel && parent.isBranchVisible) {

            if (noodel.panAxis === "trunk") {
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
            else if ((parent.level + 1) < noodel.focalLevel) {
                setFocalParent(noodel, parent);
                alignTrunkToBranch(noodel, parent);
                forceReflow();
            }
        }

        if (parent.children.length === deleteCount) { // all children deleted
            setActiveChild(noodel, parent, null);
            parent.isBranchVisible = false;
        }
        else if (index + deleteCount < parent.children.length) { // siblings exist after the deleted children
            setActiveChild(noodel, parent, index + deleteCount); // set next sibling active
            showActiveSubtree(noodel, parent, noodel.options.visibleSubtreeDepth);            
            parent.branchOffset += getActiveChild(parent).size / 2;
        }
        else { // no siblings exist after deleted children
            setActiveChild(noodel, parent, index - 1); // set prev sibling active
            showActiveSubtree(noodel, parent, noodel.options.visibleSubtreeDepth);
            parent.branchOffset -= getActiveChild(parent).size / 2;
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

    // add fading flag for noodes to be removed from a branch where the branch itself is not deleted
    // this is used to determine which noodes need their positions adjusted for fade out
    if (parent.children.length > 0) deletedNoodes.forEach(noode => noode["fade"] = true);

    // queue events
    handleFocalNoodeChange(noodel, prevFocalNoode, getActiveChild(noodel.focalParent));

    return deletedNoodes;
}
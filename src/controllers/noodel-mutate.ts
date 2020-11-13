import NodeState from '../types/NodeState';
import { traverseActiveDescendents } from './noodel-traverse';
import { getActiveChild } from './getters';
import NoodelState from '../types/NoodelState';
import { alignTrunkToBranch, alignBranchBeforeNodeDelete } from './noodel-align';
import { forceReflow } from './noodel-animate';
import { cancelPan } from './noodel-pan';
import { registerNodeSubtree } from './id-register';
import NodeDefinition from '../types/NodeDefinition';
import { buildNodeView } from './noodel-setup';
import { debounce } from './throttle';
import { handleFocalNodeChange } from './event-emit';

/**
 * Changes the focal parent of the noodel, and toggles the visibility of the active tree.
 * Does not align the trunk.
 */
export function setFocalParent(noodel: NoodelState, newFocalParent: NodeState) {

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
    showActiveSubtree(noodel.root, newFocalParent.level + noodel.options.visibleSubtreeDepth);
}

/**
 * Changes the active child of the parent to the given index (can be null to unset active child).
 * Does not align the branch.
 */
export function setActiveChild(parent: NodeState, index: number | null) {
    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = false;
    }

    parent.activeChildIndex = index;

    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = true;
    }
}

export function showActiveSubtree(origin: NodeState, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isBranchVisible = true;
    }, true, false, depth);
}

export function hideActiveSubtree(origin: NodeState, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isBranchVisible = false;
    }, true, false, depth);
}

/**
 * Insert children to a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function insertChildren(noodel: NoodelState, parent: NodeState, index: number, childDefs: NodeDefinition[]): NodeState[] {

    // find initial relative offset for the new children
    let prev = parent.children[index - 1];
    let branchRelativeOffset = prev ? prev.branchRelativeOffset + prev.size : 0;

    // construct view tree, this should come first as it may throw error
    let children = childDefs.map((def, pos) => {
        return buildNodeView(
            noodel,
            def,
            index + pos,
            parent,
            false, // ignore whether the immediate children should be active, for now
            branchRelativeOffset 
        );
    });

    // register new children and their descendents
    children.forEach(child => registerNodeSubtree(noodel, child));

    let prevFocalNode = getActiveChild(noodel.focalParent);

    // if panning focal branch, cancel it
    // unfortunately it's too difficult to align pan offsets at the moment
    if (parent.isFocalParent && noodel.r.panAxis === "branch") {
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

        setActiveChild(parent, activeChildIndex);
    }

    if (parent.isActive && (parent.r.isRoot || parent.parent.isBranchVisible)) {
        showActiveSubtree(noodel.focalParent, noodel.options.visibleSubtreeDepth);
    }

    // Allows resize sensors to be attached properly, preventing possible performance issue.
    // Will be toggled back off at node mount.
    parent.isBranchTransparent = true;

    handleFocalNodeChange(noodel, prevFocalNode, getActiveChild(noodel.focalParent));

    return children;
}

/**
 * Deletes children from a parent at a particular index, adjusting the indices of siblings,
 * and the parent's active child if necessary.
 */
export function deleteChildren(noodel: NoodelState, parent: NodeState, index: number, deleteCount: number): NodeState[] {

    let prevFocalNode = getActiveChild(noodel.focalParent);

    // if panning focal branch, cancel it
    // unfortunately it's too difficult to align pan offsets at the moment
    if (parent.isFocalParent && noodel.r.panAxis === "branch") {
        cancelPan(noodel);
    }

    // first adjust alignment of branch
    for (let i = index; i < index + deleteCount; i++) {
        alignBranchBeforeNodeDelete(parent.children[i]);
    }

    // if deletion includes active child, change the active child as appropriate
    if (parent.activeChildIndex >= index && parent.activeChildIndex < index + deleteCount) { 

        // align trunk to nearest parent branch if current focal branch is being deleted
        if ((parent.level + 1) <= noodel.focalLevel && parent.isBranchVisible) {

            if (noodel.r.panAxis === "trunk") {
                cancelPan(noodel);
            }

            if (parent.children.length === deleteCount) {
                if (parent.r.isRoot) {
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
            setActiveChild(parent, null);
            parent.isBranchVisible = false;
        }
        else if (index + deleteCount < parent.children.length) { // siblings exist after the deleted children
            setActiveChild(parent, index + deleteCount); // set next sibling active
            showActiveSubtree(parent, noodel.options.visibleSubtreeDepth);            
            parent.branchOffset += getActiveChild(parent).size / 2;
        }
        else { // no siblings exist after deleted children
            setActiveChild(parent, index - 1); // set prev sibling active
            showActiveSubtree(parent, noodel.options.visibleSubtreeDepth);
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
    let deletedNodes = parent.children.splice(index, deleteCount);

    // adjust properties of the deleted nodes only (not their descendants)
    deletedNodes.forEach(n => {
        n.parent = null;
        n.index = 0;
        n.isActive = false;
    });

    // add fading flag for nodes to be removed from a branch where the branch itself is not deleted
    // this is used to determine which nodes need their positions adjusted for fade out
    if (noodel.isMounted && parent.children.length > 0) {
        deletedNodes.forEach(node => node.r.fade = true);
    }

    // queue events
    handleFocalNodeChange(noodel, prevFocalNode, getActiveChild(noodel.focalParent));

    return deletedNodes;
}
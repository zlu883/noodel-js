/* Module for handling mutations of the noodel tree. */

import NodeState from '../types/NodeState';
import { getActiveChild, isBranchVisible, isPanningBranch } from './getters';
import NoodelState from '../types/NoodelState';
import { updateOffsetsBeforeNodeDelete } from './alignment';
import { finalizePan } from './pan';
import { registerNodeSubtree } from './identity';
import NodeDefinition from '../types/NodeDefinition';
import { createNodeState } from './setup';
import { setActiveChild, setFocalParent } from './navigate';
import { traverseDescendants } from './traverse';

/**
 * Insert children to a parent at a particular index. Always keep the current active child
 * unless it's originally empty.
 */
export function insertChildren(noodel: NoodelState, parent: NodeState, index: number, childDefs: NodeDefinition[]): NodeState[] {

    // find initial relative offset for the new children
    let prev = parent.children[index - 1];
    let branchRelativeOffset = prev ? prev.branchRelativeOffset + prev.size : 0;

    // construct state tree, this should come first as it may throw error
    let children = childDefs.map((def, pos) => {
        return createNodeState(
            noodel,
            def,
            index + pos,
            parent,
            false, // ignore whether the immediate children should be active, for now
            branchRelativeOffset
        );
    });

    // register new children and their descendants
    children.forEach(child => registerNodeSubtree(noodel, child));

    // adjust active child index if inserting before active, to retain active child
    if (parent.activeChildIndex !== null && index <= parent.activeChildIndex) {
        parent.activeChildIndex += childDefs.length;
    }

    // do insert
    parent.children.splice(index, 0, ...children);

    // adjust next sibling indices
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

    // if panning focal branch, cancel it since it may conflict with animations
    if (parent.isFocalParent && isPanningBranch(noodel)) {
        finalizePan(noodel);
    }

    // Allow new nodes' size capture
    if (parent.isBranchMounted) {
        parent.isBranchTransparent = true;
    }

    return children;
}

/**
 * Delete children from a parent at a particular index, always keeping the
 * active child unless it is to be deleted.
 */
export function deleteChildren(noodel: NoodelState, parent: NodeState, index: number, deleteCount: number): NodeState[] {

    let children = parent.children;

    // The logic differs depending on whether all children are deleted
    if (children.length === deleteCount) {

        // For this set of logic, setFocalParent must come before setActiveChild
        // for correct event emitting

        // change focal parent if current focal branch is being deleted
        if (parent.level <= noodel.focalLevel && parent.isActiveLineage) {

            finalizePan(noodel);

            // if emptying the noodel
            if (parent.r.isRoot) { 
                setFocalParent(noodel, parent);
            }
            else {
                setFocalParent(noodel, parent.parent);
            }
        }

        setActiveChild(noodel, parent, null);
    }
    else {
        // first adjust sibling offsets
        for (let i = index; i < index + deleteCount; i++) {
            updateOffsetsBeforeNodeDelete(parent.children[i]);
        }

        if (parent.isFocalParent && isPanningBranch(noodel)) {
            finalizePan(noodel);
        }

        // if deletion includes active child, change the active child as appropriate
        if (parent.activeChildIndex >= index && parent.activeChildIndex < index + deleteCount) {

            // For this set of logic, setActiveChild must come before setFocalParent
            // for correct event emitting

            if (index + deleteCount < children.length) { // siblings exist after the deleted children
                setActiveChild(noodel, parent, index + deleteCount); // set next sibling active
            }
            else { // no siblings exist after deleted children
                setActiveChild(noodel, parent, index - 1); // set prev sibling active        
            }

            // change focal parent if current focal branch is being deleted
            if (parent.level < noodel.focalLevel - 1 && parent.isActiveLineage) {
                finalizePan(noodel);
                setFocalParent(noodel, parent);
            }
        }

        // update sibling indices
        for (let i = index; i < children.length; i++) {
            children[i].index -= deleteCount;
        }

        // update parent's active child index to match state after delete
        if (parent.activeChildIndex > index) {
            parent.activeChildIndex -= deleteCount;
        }
    }

    // do delete
    let deletedNodes = children.splice(index, deleteCount);

    // adjust properties of the deleted nodes
    deletedNodes.forEach(n => {
        n.parent = null;
        n.index = 0;
        n.isActive = false;
        traverseDescendants(n, desc => desc.isDeleted = true, true);
    });

    return deletedNodes;
}
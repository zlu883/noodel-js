/* Module for handling mutations of the noodel tree. */

import NodeState from '../types/NodeState';
import { isBranchVisible, isPanningBranch } from './getters';
import NoodelState from '../types/NoodelState';
import { updateOffsetsBeforeNodeDelete } from './alignment';
import { forceReflow } from './transition';
import { finalizePan } from './pan';
import { registerNodeSubtree } from './identity';
import NodeDefinition from '../types/NodeDefinition';
import { createNodeState } from './setup';
import { setActiveChild, setFocalParent } from './navigate';

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

    // register new children and their descendents
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

    // Allows resize sensors for the new nodes to be attached properly.
    // Will be toggled back off at node mount.
    parent.isBranchTransparent = true;

    // to ensure smooth animations
    if (isBranchVisible(noodel, parent)) {
        forceReflow();
    }

    return children;
}

/**
 * Delete children from a parent at a particular index, always keeping the
 * active child unless it is to be deleted.
 */
export function deleteChildren(noodel: NoodelState, parent: NodeState, index: number, deleteCount: number): NodeState[] {

    // first adjust sibling offsets
    for (let i = index; i < index + deleteCount; i++) {
        updateOffsetsBeforeNodeDelete(parent.children[i]);
    }

    if (parent.isFocalParent && isPanningBranch(noodel)) {
        finalizePan(noodel);
    }

    // if deletion includes active child, change the active child as appropriate
    if (parent.activeChildIndex >= index && parent.activeChildIndex < index + deleteCount) {

        // changing active child should happen before changing focal branch
        // to prevent events sending twice
        if (parent.children.length === deleteCount) { // all children deleted
            setActiveChild(noodel, parent, null); // this will not trigger event even if parent is focal
        }
        else if (index + deleteCount < parent.children.length) { // siblings exist after the deleted children
            setActiveChild(noodel, parent, index + deleteCount); // set next sibling active
        }
        else { // no siblings exist after deleted children
            setActiveChild(noodel, parent, index - 1); // set prev sibling active        
        }

        // change focal parent if current focal branch is being deleted
        if (parent.level <= noodel.focalLevel && parent.isActiveLineage) {

            finalizePan(noodel);

            if (parent.children.length === deleteCount) { // if deleting the whole branch
                if (parent.r.isRoot) { // if emptying the noodel
                    setFocalParent(noodel, parent);
                }
                else {
                    setFocalParent(noodel, parent.parent);
                }
            }
            else {
                // if deleting the active child from a visible ancestor
                if (parent.level < noodel.focalLevel) {
                    setFocalParent(noodel, parent);
                }               
            }
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

    // to ensure smooth animations
    if (isBranchVisible(noodel, parent)) {
        forceReflow();
    }

    return deletedNodes;
}
/* Module for handling mutations of the noodel tree. */

import NodeState from '../types/NodeState';
import { getActualOffsetBranch, getBranchDirection, getOrientation, isPanningBranch } from './getters';
import NoodelState from '../types/NoodelState';
import { updateNodeSize } from './alignment';
import { finalizePan } from './pan';
import { registerNodeSubtree } from './identity';
import NodeDefinition from '../types/NodeDefinition';
import { createNodeState } from './setup';
import { setActiveChild, setFocalParent } from './navigate';
import { traverseDescendants } from './traverse';
import { nextTick } from 'vue';

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
        parent.forceVisible = true;
    }

    return children;
}

/**
 * Delete children from a parent at a particular index, always keeping the
 * active child unless it is to be deleted.
 */
export function deleteChildren(noodel: NoodelState, parent: NodeState, index: number, deleteCount: number): NodeState[] {

    let siblings = parent.children;

    // first, tag the nodes to delete with required properties
    for (let i = index; i < index + deleteCount; i++) {
        siblings[i].r.isDetached = true;
        traverseDescendants(siblings[i], desc => desc.r.isDeleted = true, true);
    }

    // The logic differs depending on whether all children are deleted
    if (siblings.length === deleteCount) {

        // In this situation, setFocalParent must come before setActiveChild
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
        // capture current branch offset, and apply fade-out offsets on next tick
        if (parent.r.lastBranchOffset === null) {
            parent.r.lastBranchOffset = getActualOffsetBranch(noodel, parent);
            nextTick(() => applyFadeOutOffset(noodel, parent));
        }

        for (let i = index; i < index + deleteCount; i++) {
            // set the size of the nodes to delete to 0
            // which will align the branch as appropriate
            updateNodeSize(noodel, siblings[i], 0, 0);

            // also add nodes to delete buffer
            parent.r.deletedChildBuffer.push(siblings[i]);
        }

        if (parent.isFocalParent && isPanningBranch(noodel)) {
            finalizePan(noodel);
        }

        // if deletion includes active child, change the active child as appropriate
        if (parent.activeChildIndex >= index && parent.activeChildIndex < index + deleteCount) {

            // In this situation, setActiveChild must come before setFocalParent
            // for correct event emitting

            if (index + deleteCount < parent.children.length) { // siblings exist after the deleted children
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
        for (let i = index; i < parent.children.length; i++) {
            parent.children[i].index -= deleteCount;
        }

        // update parent's active child index to match state after delete
        if (parent.activeChildIndex > index) {
            parent.activeChildIndex -= deleteCount;
        }
    }

    // do delete
    return parent.children.splice(index, deleteCount);
}

/**
 * Apply offsets to deleted nodes so that they are at the right positions
 * when fading out.
 */
function applyFadeOutOffset(noodel: NoodelState, parent: NodeState) {

    if (parent.children.length > 0) {
        let branchOffsetDiff = getActualOffsetBranch(noodel, parent) - parent.r.lastBranchOffset;

        parent.r.deletedChildBuffer.forEach(node => {
            let orientation = getOrientation(noodel);
            let branchDirection = getBranchDirection(noodel);
            let offset = (node.branchRelativeOffset - branchOffsetDiff) + "px";
            let el = node.r.el;
            
            if (orientation === "ltr" || orientation === "rtl") {
                if (branchDirection === "normal") {
                    el.style.top = offset;
                } else {
                    el.style.bottom = offset;
                }
            } else {
                if (branchDirection === "normal") {
                    el.style.left = offset;
                } else {
                    el.style.right = offset;
                }
            }
    
            //node.r.el = null;
        });
    }

    parent.r.lastBranchOffset = null;
    parent.r.deletedChildBuffer = [];
}
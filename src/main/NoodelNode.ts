import NodeState from '../types/NodeState';
import NodeDefinition from '../types/NodeDefinition';
import { setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { parseAndApplyNodeOptions, parseContent } from '../controllers/noodel-setup';
import { getPath as _getPath } from '../controllers/getters';
import { alignBranchToIndex, updateNodeSize, updateBranchSize } from '../controllers/noodel-align';
import { shiftFocalNode, doJumpNavigation } from '../controllers/noodel-navigate';
import NoodelState from '../types/NoodelState';
import { changeNodeId, unregisterNodeSubtree } from '../controllers/id-register';
import NodeOptions from '../types/NodeOptions';
import ComponentContent from '../types/ComponentContent';
import { nextTick } from 'vue';
import { traverseDescendents } from '../controllers/noodel-traverse';
import NodeCss from '../types/NodeCss';
import NodeEventMap from '../types/NodeEventMap';
import { serializeNodeDeep, serializeContent, serializeNode } from '../controllers/noodel-serialize';

/**
 * The view model of a node in a noodel. Has 2-way binding with the view.
 */
export default class NoodelNode {

    private state: NodeState;
    private noodelState: NoodelState;

    /**
     * Internal use only. To get the view model for specific nodes, use methods on the Noodel class instead.
     */
    private constructor(state: NodeState, noodelState: NoodelState) { // set to private to avoid including internal types in the declarations
        this.state = state;
        this.noodelState = noodelState;
    }

    private throwErrorIfDeleted() {
        if (this.isDeleted()) {
            throw new Error("Invalid operation because this node has been deleted from its noodel.");
        }
    }

    // GETTERS

    /**
     * Get the nd-node element associated with this node. Return null if
     * noodel is not mounted.
     */
    getEl(): HTMLDivElement {
        return this.state.r.el;
    }

    /**
     * Get the nd-branch element associated with this node's child branch. Return null if
     * noodel is not mounted or branch does not exist.
     */
    getBranchEl(): HTMLDivElement {
        return this.state.r.branchEl;
    }

    /**
     * Get the parent of this node. Return null if this is the root or
     * if this is detached from its parent by a delete operation.
     */
    getParent(): NoodelNode {
        if (!this.state.parent) return null;
        return this.state.parent.r.vm;
    }

    /**
     * Get the path (an array of zero-based indices counting from the root) of this node.
     */
    getPath(): number[] {
        if (!this.noodelState) return null;
        return _getPath(this.state);
    }

    /**
     * Extract the definition of this node, returning a NodeDefinition object containing this
     * node's base properties. Useful for serialization or cloning.
     * @param deep whether to extract a deep definition tree including descendants, default false
     */
    extractDefinition(deep = false): NodeDefinition {
        return deep ? serializeNodeDeep(this.state) : serializeNode(this.state);
    }

    /**
     * Get the child of this node at the given index. Return null if does not exist.
     * @param index 0-based index of the child
     */
    getChild(index: number): NoodelNode {
        if (index < 0 || index >= this.state.children.length) {
            return null;
        }

        return this.state.children[index].r.vm;
    }

    /**
     * Get the index of the active child of this node. Return null if there's no children.
     */
    getActiveChildIndex(): number {
        return this.state.activeChildIndex;
    }

    /**
     * Get the active child of this node. Return null if there's no children.
     */
    getActiveChild(): NoodelNode {
        let index = this.state.activeChildIndex;

        if (index === null) return null;
        return this.state.children[index].r.vm;
    }

    /**
     * Get a copied array of this node's list of children.
     */
    getChildren(): NoodelNode[] {
        return this.state.children.map(c => c.r.vm);
    }

    /**
     * Get the number of children of this node.
     */
    getChildCount(): number {
        return this.state.children.length;
    }

    /**
     * Get the ID of this node.
     */
    getId(): string {
        return this.state.id;
    }

    /**
     * Get the content of this node. If content is a ComponentContent object,
     * will return a deeply cloned object except the 'component' property which is
     * shallowly copied.
     */
    getContent(): string | ComponentContent {
        return serializeContent(this.state.content);
    }

    /**
     * Get a cloned object containing the custom CSS classes applied to this node.
     */
    getClassNames(): NodeCss {
        return {
            ...this.state.classNames
        };
    }

    /**
     * Get a cloned object containing the custom styles applied to this node.
     */
    getStyles(): NodeCss {
        return {
            ...this.state.styles
        };
    }

    /**
     * Get a cloned object containing the options applied to this node.
     */
    getOptions(): NodeOptions {
        return {
            ...this.state.options
        };
    }

    /**
     * Get the 0-based index (position among siblings) of this node.
     * Will return 0 if detached from its parent by a delete operation.
     */
    getIndex(): number {
        return this.state.index;
    }

    /**
     * Get the level of this node. The root has level 0,
     * children of the root has level 1, and so on.
     * If this node has been deleted, will return null.
     */
    getLevel(): number {
        if (this.isDeleted()) return null;
        return this.state.level;
    }

    /**
     * Check whether this node is the root.
     */
    isRoot(): boolean {
        return this.state.r.isRoot;
    }

    /**
     * Check whether this node is active.
     */
    isActive(): boolean {
        return this.state.isActive;
    }

    /**
     * Check whether this node is the parent of the focal branch.
     */
    isFocalParent(): boolean {
        if (this.isDeleted()) return false;
        return this.state.isFocalParent;
    }

    /**
     * Check whether this node is inside the focal branch.
     */
    isInFocalBranch(): boolean {
        if (this.isDeleted()) return false;
        if (this.isRoot()) return false;
        return this.state.parent.isFocalParent;
    }

    /**
     * Check whether this node is the focal node.
     */
    isFocalNode(): boolean {
        return this.isActive() && this.isInFocalBranch();
    }

    /**
     * Check whether this node is logically visible (i.e is part of the active tree 
     * in display).
     */
    isVisible(): boolean {
        if (this.isDeleted()) return false;
        if (this.isRoot()) return false;
        return this.state.parent.isBranchVisible;
    }

    /**
     * Check whether this node's child branch is logically visible (i.e is part of the active tree 
     * in display).
     */
    isChildrenVisible(): boolean {
        if (this.isDeleted()) return false;
        return this.state.isBranchVisible;
    }

    /**
     * Check whether this node has been deleted from its noodel.
     */
    isDeleted(): boolean {
        return !this.noodelState;
    }

    // MUTATERS

    /**
     * Set the ID of this node.
     * @param id new ID for this node, should not start with '_'
     */
    setId(id: string) {
        this.throwErrorIfDeleted();

        if (id === this.state.id) return;
        changeNodeId(this.noodelState, this.state.id, id);
    }

    /**
     * Set the content of this node.
     * @param content new content for this node, either an HTML string or Vue component wrapper
     */
    setContent(content: string | ComponentContent) {
        this.throwErrorIfDeleted();

        this.state.content = parseContent(content);
    }

    /**
     * Set the custom class names for this node. Properties of the provided object
     * will be merged into the existing object.
     * @param classNames
     */
    setClassNames(classNames: NodeCss) {
        this.throwErrorIfDeleted();

        this.state.classNames = {
            ...this.state.classNames,
            ...classNames
        }
    }

    /**
     * Set the custom inline styles for this node. Properties of the provided object
     * will be merged into the existing object.
     * @param styles
     */
    setStyles(styles: NodeCss) {
        this.throwErrorIfDeleted();

        this.state.classNames = {
            ...this.state.styles,
            ...styles
        }
    }

    /**
     * Set the options for this node. Properties of the provided object
     * will be merged into the existing object.
     * @param options
     */
    setOptions(options: NodeOptions) {
        this.throwErrorIfDeleted();

        parseAndApplyNodeOptions(this.noodelState, options, this.state);
    }

    /**
     * Change the active child of this node. If doing so will toggle
     * the visibility of the focal branch (i.e this node is an ancestor
     * of the focal branch), the view will jump to focus on the new active child.
     * @param index 0-based index of the new active child
     */
    setActiveChild(index: number) {
        this.throwErrorIfDeleted();

        if (index < 0 || index >= this.state.children.length) {
            throw new Error("Cannot set active child: node has no children or invalid index");
        }

        if (this.state.isFocalParent) {
            shiftFocalNode(this.noodelState, index - this.state.activeChildIndex);
        }
        else if (this.state.isBranchVisible && (this.state.level + 1) < this.noodelState.focalLevel) {
            doJumpNavigation(this.noodelState, this.state.children[index]);
        }
        else {
            setActiveChild(this.state, index);
            alignBranchToIndex(this.state, index);
        }
    }

    /**
     * Perform a navigational jump to focus on this node.
     * Cannot jump to the root.
     */
    jumpToFocus() {
        this.throwErrorIfDeleted();

        if (this.state.r.isRoot) {
            throw new Error("Cannot jump to focus: target is root");
        }

        doJumpNavigation(this.noodelState, this.state);
    }

    /**
     * Insert one or more new nodes (and their descendents) as children of this node.
     * Will always preserve the current active child if possible. Return the 
     * list of inserted nodes.
     * @param defs definition trees of the new node(s)
     * @param index index to insert at, will append to the end of existing children if omitted
     */
    insertChildren(defs: NodeDefinition[], index?: number): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (index === undefined) {
            index = this.state.children.length;
        }

        if (index < 0 || index > this.state.children.length) {
            throw new Error("Cannot insert children: invalid index");
        }

        if (defs.length === 0) return [];

        return insertChildren(this.noodelState, this.state, index, defs).map(n => n.r.vm);
    }

    /**
     * Convenience method for inserting sibling node(s) before this node. 
     * Return the list of inserted nodes.
     * @param defs node definitions to add
     */
    insertBefore(defs: NodeDefinition[]): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot insert sibling nodes before root");
        }

        return this.getParent().insertChildren(defs, this.getIndex());
    }

    /**
     * Convenience method for inserting sibling node(s) after this node.
     * Return the list of inserted nodes.
     * @param defs node definitions to add
     */
    insertAfter(defs: NodeDefinition[]): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot insert sibling nodes after root");
        }

        return this.getParent().insertChildren(defs, this.getIndex() + 1);
    }

    /**
     * Delete one or more children (and their descendents) of this node.
     * If the active child is removed, will set the next child active,
     * unless the child is the last in the list, where the previous child
     * will be set active. If the focal branch is deleted, will move focus
     * to the nearest ancestor branch. Return the list of deleted nodes.
     * @param index index to start the deletion from
     * @param count number of children to delete, will adjust to maximum if greater than possible range
     */
    deleteChildren(index: number, count: number): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (index < 0 || count < 0 || index >= this.state.children.length) {
            throw new Error("Cannot delete child node(s): invalid index or count");
        }

        if (index + count > this.state.children.length) {
            count = this.state.children.length - index;
        }

        if (count <= 0) return;

        let deletedNodes = deleteChildren(this.noodelState, this.state, index, count);

        // unregister
        deletedNodes.forEach(node => {
            node.parent = null;
            unregisterNodeSubtree(this.noodelState, node);
        });

        return deletedNodes.map(n => n.r.vm);
    }

    /**
     * Convenience method for deleting sibling node(s) before this node. 
     * Return the list of deleted nodes.
     * @param count number of nodes to remove, will adjust to maximum if greater than possible range
     */
    deleteBefore(count: number): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (count < 0) {
            throw new Error("Cannot delete before: invalid count");
        }

        if (this.isRoot()) return [];

        let targetIndex = this.getIndex() - count;

        if (targetIndex < 0) targetIndex = 0;

        let targetCount = this.getIndex() - targetIndex;

        if (targetCount <= 0) return [];

        return this.getParent().deleteChildren(targetIndex, targetCount);
    }

    /**
     * Convenience method for deleting sibling node(s) after this node.
     * Return the list of deleted nodes.
     * @param count number of nodes to remove, will adjust to maximum if greater than possible range
     */
    deleteAfter(count: number): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (count < 0) {
            throw new Error("Cannot delete after: invalid count");
        }

        if (this.isRoot()) return [];

        if (this.getIndex() === this.getParent().getChildCount() - 1) return [];

        return this.getParent().deleteChildren(this.getIndex() + 1, count);
    }

    /**
     * Convenience method for deleting this node itself. 
     */
    deleteSelf() {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot delete the root");
        }

        this.getParent().deleteChildren(this.getIndex(), 1);
    }

    // TRAVERSAL

    /**
     * Do a preorder traversal of this node's subtree and perform the specified action
     * on each descendent.
     * @param func the action to perform
     * @param includeSelf whether to include this node in the traversal
     */
    traverseSubtree(func: (node: NoodelNode) => any, includeSelf: boolean) {
        traverseDescendents(this.state, desc => func(desc.r.vm), includeSelf);
    }

    // ALIGNMENT
    
    /**
     * Asynchronous method to capture the length of this node (on the branch axis) and adjust 
     * the branch's position if necessary. Use when resize detection is disabled to manually
     * trigger realignment on node resize. Fails silently if this is root or noodel is not mounted.
     */
    realign() {
        this.throwErrorIfDeleted();
        if (!this.noodelState.isMounted) return;
        if (!this.state.parent) return;

        this.state.parent.isBranchTransparent = true;

        nextTick(() => {
            let rect = this.state.r.el.getBoundingClientRect();
            
            updateNodeSize(this.noodelState, this.state, rect.height, rect.width);
            this.state.parent.isBranchTransparent = false;
        });
    }

    /**
     * Asynchronous method to capture the length of this node's child branch (on the trunk axis) and adjust 
     * the trunk's position if necessary. Use when resize detection is disabled to manually
     * trigger realignment on branch resize. Fails silently if this has no children or noodel is not mounted.
     */
    realignBranch() {
        this.throwErrorIfDeleted();
        if (!this.noodelState.isMounted) return;
        if (this.state.children.length === 0) return;

        this.state.isBranchTransparent = true;

        nextTick(() => {
            let rect = this.state.r.branchSliderEl.getBoundingClientRect();

            updateBranchSize(this.noodelState, this.state, rect.height, rect.width);
            this.state.isBranchTransparent = false;
        });
    }

    // EVENT

    /**
     * Attach an event listener on this node.
     * @param ev event name
     * @param listener event listener to attach
     */
    on<E extends keyof NodeEventMap>(ev: E, listener: NodeEventMap[E]) {
        this.state.r.eventListeners.get(ev).push(listener);
    }

    /**
     * Remove an event listener from this node.
     * @param ev event name
     * @param listener the event listener to remove, by reference comparison
     */
    off<E extends keyof NodeEventMap>(ev: E, listener: NodeEventMap[E]) {
        let handlers = this.state.r.eventListeners.get(ev);
        let index = handlers.indexOf(listener);

        if (index > -1) handlers.splice(index, 1);
    }
}
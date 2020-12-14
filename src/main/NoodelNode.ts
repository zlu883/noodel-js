import NodeState from '../types/NodeState';
import NodeDefinition from '../types/NodeDefinition';
import { deleteChildren, insertChildren } from '../controllers/mutate';
import { parseAndApplyNodeOptions } from '../controllers/options';
import { getPath as _getPath, isBranchVisible } from '../controllers/getters';
import { updateNodeSize, updateBranchSize } from '../controllers/alignment';
import { shiftFocalNode, jumpTo, setActiveChild } from '../controllers/navigate';
import NoodelState from '../types/NoodelState';
import { changeNodeId, unregisterNodeSubtree } from '../controllers/identity';
import NodeOptions from '../types/NodeOptions';
import ComponentContent from '../types/ComponentContent';
import { nextTick } from 'vue';
import { traverseDescendents } from '../controllers/traverse';
import NodeCss from '../types/NodeCss';
import NodeEventMap from '../types/NodeEventMap';
import { serializeNodeDeep, serializeContent, serializeNode, parseContent, parseContentTreeDefinition } from '../controllers/serialize';
import { throwError } from '../controllers/util';

/**
 * The view model of a node in a noodel. Has 2-way binding with the view.
 */
export default class NoodelNode {

    private _s: NodeState;
    private _ns: NoodelState;

    /**
     * Internal use only. To get the view model for specific nodes, use methods on the Noodel class instead.
     */
    private constructor(state: NodeState, noodelState: NoodelState) { // set to private to avoid including internal types in the declarations
        this._s = state;
        this._ns = noodelState;
    }

    private throwErrorIfDeleted() {
        if (this.isDeleted()) {
            throwError("Invalid operation because this node has been deleted from its noodel.");
        }
    }

    // GETTERS

    /**
     * Get the nd-node element associated with this node. Return null if
     * noodel is not mounted.
     */
    getEl(): HTMLDivElement {
        return this._s.r.el;
    }

    /**
     * Get the nd-branch element associated with this node's child branch. Return null if
     * noodel is not mounted or branch does not exist.
     */
    getBranchEl(): HTMLDivElement {
        return this._s.r.branchEl;
    }

    /**
     * Get the parent of this node. Return null if this is the root or
     * if this is detached from its parent by a delete operation.
     */
    getParent(): NoodelNode {
        if (!this._s.parent) return null;
        return this._s.parent.r.vm;
    }

    /**
     * Get the path (an array of zero-based indices counting from the root) of this node.
     */
    getPath(): number[] {
        if (this.isDeleted()) return null;
        return _getPath(this._s);
    }

    /**
     * Extract the definition of this node, returning a NodeDefinition object containing this
     * node's base properties. Useful for serialization or cloning.
     * @param deep whether to extract a deep definition tree including descendants, default false
     */
    extractDefinition(deep = false): NodeDefinition {
        return deep ? serializeNodeDeep(this._s) : serializeNode(this._s);
    }

    /**
     * Get the child of this node at the given index. Return null if does not exist.
     * @param index 0-based index of the child
     */
    getChild(index: number): NoodelNode {
        if (index < 0 || index >= this._s.children.length) {
            return null;
        }

        return this._s.children[index].r.vm;
    }

    /**
     * Get the index of the active child of this node. Return null if there's no children.
     */
    getActiveChildIndex(): number {
        return this._s.activeChildIndex;
    }

    /**
     * Get the active child of this node. Return null if there's no children.
     */
    getActiveChild(): NoodelNode {
        let index = this._s.activeChildIndex;

        if (index === null) return null;
        return this._s.children[index].r.vm;
    }

    /**
     * Get a copied array of this node's list of children.
     */
    getChildren(): NoodelNode[] {
        return this._s.children.map(c => c.r.vm);
    }

    /**
     * Get the number of children of this node.
     */
    getChildCount(): number {
        return this._s.children.length;
    }

    /**
     * Get the ID of this node.
     */
    getId(): string {
        return this._s.id;
    }

    /**
     * Get the content of this node. If content is a ComponentContent object,
     * will return a deeply cloned object except the 'component' property which is
     * shallowly copied.
     */
    getContent(): string | ComponentContent {
        return serializeContent(this._s.content);
    }

    /**
     * Get the branch content of this node. If content is a ComponentContent object,
     * will return a deeply cloned object except the 'component' property which is
     * shallowly copied.
     */
    getBranchContent(): string | ComponentContent {
        return serializeContent(this._s.branchContent);
    }

    /**
     * Get a cloned object containing the custom CSS classes applied to this node.
     */
    getClassNames(): NodeCss {
        return {
            ...this._s.classNames
        };
    }

    /**
     * Get a cloned object containing the custom styles applied to this node.
     */
    getStyles(): NodeCss {
        return {
            ...this._s.styles
        };
    }

    /**
     * Get a cloned object containing the options applied to this node.
     */
    getOptions(): NodeOptions {
        return {
            ...this._s.options
        };
    }

    /**
     * Get the 0-based index (position among siblings) of this node.
     * Will return 0 if detached from its parent by a delete operation.
     */
    getIndex(): number {
        return this._s.index;
    }

    /**
     * Get the level of this node. The root has level 0,
     * children of the root has level 1, and so on.
     * If this node has been deleted, will return null.
     */
    getLevel(): number {
        if (this.isDeleted()) return null;
        return this._s.level;
    }

    /**
     * Check whether this node is the root.
     */
    isRoot(): boolean {
        return this._s.r.isRoot;
    }

    /**
     * Check whether this node is active.
     */
    isActive(): boolean {
        return this._s.isActive;
    }

    /**
     * Check whether this node is the parent of the focal branch.
     */
    isFocalParent(): boolean {
        if (this.isDeleted()) return false;
        return this._s.isFocalParent;
    }

    /**
     * Check whether this node is inside the focal branch.
     */
    isInFocalBranch(): boolean {
        if (this.isDeleted()) return false;
        if (this.isRoot()) return false;
        return this._s.parent.isFocalParent;
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
        return isBranchVisible(this._ns, this._s.parent);
    }

    /**
     * Check whether this node's child branch is logically visible (i.e is part of the active tree 
     * in display).
     */
    isChildrenVisible(): boolean {
        if (this.isDeleted()) return false;
        return isBranchVisible(this._ns, this._s);
    }

    /**
     * Check whether this node has been deleted from its noodel.
     */
    isDeleted(): boolean {
        return this._s.isDeleted;
    }

    // MUTATERS

    /**
     * Set the ID of this node.
     * @param id new ID for this node, should not start with '_'
     */
    setId(id: string) {
        this.throwErrorIfDeleted();

        if (id === this._s.id) return;
        changeNodeId(this._ns, this._s.id, id);
    }

    /**
     * Set the content of this node.
     * @param content new content for this node, either an HTML string or Vue component wrapper
     */
    setContent(content: string | ComponentContent) {
        this.throwErrorIfDeleted();

        this._s.content = parseContent(content);
    }

    /**
     * Set the custom class names for this node. Properties of the provided object
     * will be merged into the existing object.
     * @param classNames
     */
    setClassNames(classNames: NodeCss) {
        this.throwErrorIfDeleted();

        this._s.classNames = {
            ...this._s.classNames,
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

        this._s.styles = {
            ...this._s.styles,
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

        parseAndApplyNodeOptions(this._ns, options, this._s);
    }

    /**
     * Change the active child of this node. If doing so will toggle
     * the visibility of the focal branch (i.e this node is an ancestor
     * of the focal branch), the view will jump to focus on the new active child.
     * @param index 0-based index of the new active child
     */
    setActiveChild(index: number) {
        this.throwErrorIfDeleted();

        if (index < 0 || index >= this._s.children.length) {
            throwError("Cannot set active child: node has no children or invalid index");
        }

        if (this._s.isFocalParent) {
            shiftFocalNode(this._ns, index - this._s.activeChildIndex);
        }
        else if (this._s.isActiveLineage && this._s.level < this._ns.focalLevel) {
            jumpTo(this._ns, this._s.children[index]);
        }
        else {
            setActiveChild(this._ns, this._s, index);
        }
    }

    /**
     * Perform a navigational jump to focus on this node.
     * Cannot jump to the root.
     */
    jumpToFocus() {
        this.throwErrorIfDeleted();

        if (this._s.r.isRoot) {
            throwError("Cannot jump to focus: target is root");
        }

        jumpTo(this._ns, this._s);
    }

    /**
     * Insert one or more new nodes (and their descendents) as children of this node.
     * Will always preserve the current active child if possible. Return the 
     * list of inserted nodes.
     * @param defs definition trees of the new node(s)
     * @param index index to insert at, will append to the end of existing children if omitted
     */
    insertChildren(defs: NodeDefinition[] | string | Element, index?: number): NoodelNode[] {
        this.throwErrorIfDeleted();

        let newDefs = parseContentTreeDefinition(defs);

        if (index === undefined) {
            index = this._s.children.length;
        }

        if (index < 0 || index > this._s.children.length) {
            throwError("Cannot insert children: invalid index");
        }

        if (newDefs.length === 0) return [];

        return insertChildren(this._ns, this._s, index, newDefs).map(n => n.r.vm);
    }

    /**
     * Convenience method for inserting sibling node(s) before this node. 
     * Return the list of inserted nodes.
     * @param defs node definitions to add
     */
    insertBefore(defs: NodeDefinition[] | string | Element): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throwError("Cannot insert before: target is root");
        }

        return this.getParent().insertChildren(defs, this.getIndex());
    }

    /**
     * Convenience method for inserting sibling node(s) after this node.
     * Return the list of inserted nodes.
     * @param defs node definitions to add
     */
    insertAfter(defs: NodeDefinition[] | string | Element): NoodelNode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throwError("Cannot insert after: target is root");
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

        if (index < 0 || count < 0 || index >= this._s.children.length) {
            throwError("Cannot delete children: invalid index or count");
        }

        if (index + count > this._s.children.length) {
            count = this._s.children.length - index;
        }

        if (count <= 0) return;

        let deletedNodes = deleteChildren(this._ns, this._s, index, count);

        // unregister
        deletedNodes.forEach(node => {
            node.parent = null;
            unregisterNodeSubtree(this._ns, node);
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
            throwError("Cannot delete before: invalid count");
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
            throwError("Cannot delete after: invalid count");
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
            throwError("Cannot delete self: target is root");
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
        traverseDescendents(this._s, desc => func(desc.r.vm), includeSelf);
    }

    // ALIGNMENT
    
    /**
     * Recapture the size of this node (on the branch axis) and adjust 
     * the branch's position if necessary. Use immediately after an operation that changes
     * the size of this node (on the branch axis). 
     * Does nothing if this is the root or noodel is not mounted.
     */
    realign() {
        this.throwErrorIfDeleted();
        if (!this._s.parent || !this._s.parent.isBranchMounted) return;

        this._s.parent.isBranchTransparent = true;

        nextTick(() => {
            let rect = this._s.r.el.getBoundingClientRect();
            
            updateNodeSize(this._ns, this._s, rect.height, rect.width);
            this._s.parent.isBranchTransparent = false;
        });
    }

    /**
     * Recapture the size of this node's child branch (on the trunk axis) and adjust 
     * the trunk's position if necessary. Use immediately after an operation that changes
     * the size of this node's child branch (on the trunk axis).
     * Does nothing if this has no children or noodel is not mounted.
     */
    realignBranch() {
        this.throwErrorIfDeleted();
        if (this._s.children.length === 0 || !this._s.isBranchMounted) return;

        this._s.isBranchTransparent = true;

        nextTick(() => {
            let rect = this._s.r.branchSliderEl.getBoundingClientRect();

            updateBranchSize(this._ns, this._s, rect.height, rect.width);
            this._s.isBranchTransparent = false;
        });
    }

    // EVENT

    /**
     * Attach an event listener on this node.
     * @param ev event name
     * @param listener event listener to attach
     */
    on<E extends keyof NodeEventMap>(ev: E, listener: NodeEventMap[E]) {
        this._s.r.eventListeners.get(ev).push(listener);
    }

    /**
     * Remove an event listener from this node.
     * @param ev event name
     * @param listener the event listener to remove, by reference comparison
     */
    off<E extends keyof NodeEventMap>(ev: E, listener: NodeEventMap[E]) {
        let handlers = this._s.r.eventListeners.get(ev);
        let index = handlers.indexOf(listener);

        if (index > -1) handlers.splice(index, 1);
    }
}
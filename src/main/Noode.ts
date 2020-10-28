import NoodeState from '../types/NoodeState';
import NoodeDefinition from '../types/NoodeDefinition';
import { setActiveChild as _setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { parseAndApplyNoodeOptions } from '../controllers/noodel-setup';
import { getPath as _getPath } from '../controllers/getters';
import { alignBranchToIndex, updateNoodeSize, updateBranchSize, checkContentOverflow } from '../controllers/noodel-align';
import { shiftFocalNoode, doJumpNavigation } from '../controllers/noodel-navigate';
import NoodelState from '../types/NoodelState';
import { changeNoodeId, unregisterNoodeSubtree } from '../controllers/id-register';
import NoodeOptions from '../types/NoodeOptions';
import ComponentContent from '../types/ComponentContent';
import { nextTick } from 'vue';
import { traverseDescendents } from '../controllers/noodel-traverse';
import NoodeSerializedCss from '../types/NoodeSerializedCss';
import NoodeEventMap from '../types/NoodeEventMap';
import { extractNoodeDefinition, parseClassName, parseStyle, serializeClassNames, serializeStyles } from '../controllers/noodel-serialize';

/**
 * The view model of a noode. Has 2-way binding with the view.
 */
export default class Noode {

    private state: NoodeState;
    private noodelState: NoodelState;

    /**
     * Internal use only. To get the view model for specific noodes, use methods on the Noodel class instead.
     */
    private constructor(state: NoodeState, noodelState: NoodelState) { // set to private to avoid including internal types in the declarations
        this.state = state;
        this.noodelState = noodelState;
    }

    private throwErrorIfDeleted() {
        if (!this.noodelState) {
            throw new Error("Invalid operation because this noode has been deleted.");
        }
    }

    // GETTERS

    /**
     * Get the parent of this noode. All noodes should have a parent
     * unless it has been deleted from its immediate parent or if it is the root.
     */
    getParent(): Noode {
        if (!this.state.parent) return null;
        return this.state.parent.r.vm;
    }

    /**
     * Get the path (an array of zero-based indices counting from the root) of this noode.
     */
    getPath(): number[] {
        if (!this.noodelState) return null;
        return _getPath(this.state);
    }

    /**
     * Extract the definition tree of this noode (including its descendants).
     * Useful for operations such as serialization or cloning.
     */
    getDefinition(): NoodeDefinition {
        return extractNoodeDefinition(this.noodelState, this.state);
    }

    /**
     * Get the child of this noode at the given index. Returns null if does not exist.
     * @param index 0-based index of the child
     */
    getChild(index: number): Noode {
        if (index < 0 || index >= this.state.children.length) {
            return null;
        }

        return this.state.children[index].r.vm;
    }

    /**
     * Get the index of the active child of this noode. Returns null if there's no children.
     */
    getActiveChildIndex(): number {
        return this.state.activeChildIndex;
    }

    /**
     * Get a copied array of this noode's list of children.
     */
    getChildren(): Noode[] {
        return this.state.children.map(c => c.r.vm);
    }

    /**
     * Get the number of children of this noode.
     */
    getChildCount(): number {
        return this.state.children.length;
    }

    /**
     * Get the ID of this noode.
     */
    getId(): string {
        return this.state.id;
    }

    /**
     * Get the content of this noode.
     */
    getContent(): string | ComponentContent {
        return this.state.content;
    }

    /**
     * Get the custom class names applied to this noode.
     * Return a cloned object.
     */
    getClassNames(): NoodeSerializedCss {
        return serializeClassNames(this.state.classNames);
    }

    /**
     * Get the custom styles applied to this noode.
     * Return a cloned object.
     */
    getStyles(): NoodeSerializedCss {
        return serializeStyles(this.state.styles);
    }

    /**
     * Get the options applied to this noode.
     * Return a cloned object.
     */
    getOptions(): NoodeOptions {
        return {
            ...this.state.options
        };
    }

    /**
     * Get the 0-based index (position among siblings) of this noode.
     * If detached from its immediate parent, index will be 0.
     */
    getIndex(): number {
        return this.state.index;
    }

    /**
     * Get the level of this noode. The root has level 0,
     * noodes in the first branch has level 1, and so on.
     * If this noode has been deleted, will return null.
     */
    getLevel(): number {
        if (!this.noodelState) return null;
        return this.state.level;
    }

    /**
     * Return true if this noode is the root.
     */
    isRoot(): boolean {
        return this.state.r.isRoot;
    }

    /**
     * Return true if this noode is active.
     */
    isActive(): boolean {
        return this.state.isActive;
    }

    /**
     * Return true if this noode is the parent of the focal branch.
     */
    isFocalParent(): boolean {
        if (!this.noodelState) return false;
        return this.state.isFocalParent;
    }

    /**
     * Return an object that specifies whether this noode has
     * content overflow in each of the 4 directions. Only valid if overflow 
     * status is detected/manually checked before hand.
     */
    hasOverflow(): {top: boolean, bottom: boolean, left: boolean, right: boolean} {
        return {
            top: this.state.hasOverflowTop,
            bottom: this.state.hasOverflowBottom,
            left: this.state.hasOverflowLeft,
            right: this.state.hasOverflowRight
        }
    }

    // MUTATERS

    /**
     * Set the ID of this noode.
     * @param id new ID for this noode, should not start with '_'
     */
    setId(id: string) {
        this.throwErrorIfDeleted();

        if (id === this.state.id) return;
        changeNoodeId(this.noodelState, this.state.id, id);
    }

    /**
     * Set the content of this noode.
     * @param content new content for this noode, either an HTML string or Vue component wrapper
     */
    setContent(content: string | ComponentContent) {
        this.throwErrorIfDeleted();

        this.state.content = content;
    }

    /**
     * Set the custom class names for this noode. Properties of the provided object
     * will be merged into the existing object.
     * @param classNames
     */
    setClassNames(classNames: NoodeSerializedCss) {
        this.throwErrorIfDeleted();

        let c = this.state.classNames;

        Object.keys(classNames).forEach(key => {
            c[key] = parseClassName(classNames[key]);
        });
    }

    /**
     * Set the custom inline styles for this noode. Properties of the provided object
     * will be merged into the existing object.
     * @param styles
     */
    setStyles(styles: NoodeSerializedCss) {
        this.throwErrorIfDeleted();

        let s = this.state.styles;
        
        Object.keys(styles).forEach(key => {
            s[key] = parseClassName(styles[key]);
        });
    }

    /**
     * Set the options for this noode. Properties of the provided object
     * will be merged into the existing object.
     * @param options
     */
    setOptions(options: NoodeOptions) {
        this.throwErrorIfDeleted();

        parseAndApplyNoodeOptions(this.noodelState, options, this.state);
    }

    /**
     * Change the active child of this noode. If doing so will toggle
     * the visibility of the focal branch (i.e this noode is an ancestor
     * of the focal branch), the view will jump to focus on the new active child.
     * @param index 0-based index of the new active child
     */
    setActiveChildIndex(index: number) {
        this.throwErrorIfDeleted();

        if (index < 0 || index >= this.state.children.length) {
            throw new Error("Cannot set active child: noode has no children or invalid index");
        }

        if (this.state.isFocalParent) {
            shiftFocalNoode(this.noodelState, index - this.state.activeChildIndex);
        }
        else if (this.state.isBranchVisible && (this.state.level + 1) < this.noodelState.focalLevel) {
            doJumpNavigation(this.noodelState, this.state.children[index]);
        }
        else {
            _setActiveChild(this.state, index);
            alignBranchToIndex(this.state, index);
        }
    }

    /**
     * Performs a navigational jump to focus on this noode.
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
     * Insert one or more new noodes (and their descendents) as children of this noode.
     * Will always preserve the current active child if possible.
     * @param defs definition trees of the new noode(s)
     * @param index index to insert at, will insert to the end of existing children if not provided
     */
    insertChildren(defs: NoodeDefinition[], index?: number) {
        this.throwErrorIfDeleted();

        if (index === undefined) {
            index = this.state.children.length;
        }

        if (index < 0 || index > this.state.children.length) {
            throw new Error("Cannot insert children: invalid index");
        }

        if (defs.length === 0) return;

        insertChildren(this.noodelState, this.state, index, defs);
    }

    /**
     * Delete one or more children (and their descendents) of this noode.
     * If the active child is removed, will set the next child active,
     * unless the child is the last in the list, where the previous child
     * will be set active. If the focal branch is deleted, will move focus
     * to the nearest ancestor branch.
     * @param index index to start the deletion from
     * @param count number of children to delete, will adjust to maximum if greater than possible range
     */
    deleteChildren(index: number, count: number) {
        this.throwErrorIfDeleted();

        if (index < 0 || count < 0 || index >= this.state.children.length) {
            throw new Error("Cannot remove child noode(s): invalid index or count");
        }

        if (index + count > this.state.children.length) {
            count = this.state.children.length - index;
        }

        if (count <= 0) return;

        let deletedNoodes = deleteChildren(this.noodelState, this.state, index, count);

        // unregister
        deletedNoodes.forEach(noode => {
            noode.parent = null;
            unregisterNoodeSubtree(this.noodelState, noode);
        });
    }

    // TRAVERSAL

    /**
     * Do a preorder traversal of this noode's subtree and perform the specified action
     * on each descendent.
     * @param func the action to perform
     * @param includeSelf whether to include this noode in the traversal
     */
    traverseSubtree(func: (noode: Noode) => any, includeSelf: boolean) {
        traverseDescendents(this.state, desc => func(desc.r.vm), includeSelf);
    }

    // ALIGNMENT
    
    /**
     * Asynchronous method to capture the length of this noode (on the branch axis) and adjust 
     * the branch's position if necessary. Use when resize detection is disabled to manually
     * trigger realignment on noode resize. Fails silently if this is root or noodel is not mounted.
     */
    realign() {
        this.throwErrorIfDeleted();
        if (!this.noodelState.r.isMounted) return;
        if (!this.state.parent) return;

        this.state.parent.isBranchTransparent = true;

        nextTick(() => {
            let rect = this.state.r.el.getBoundingClientRect();
            
            updateNoodeSize(this.noodelState, this.state, rect.height, rect.width);
            this.state.parent.isBranchTransparent = false;
        });
    }

    /**
     * Asynchronous method to capture the length of this noode's child branch (on the trunk axis) and adjust 
     * the trunk's position if necessary. Use when resize detection is disabled to manually
     * trigger realignment on branch resize. Fails silently if this has no children or noodel is not mounted.
     */
    realignBranch() {
        this.throwErrorIfDeleted();
        if (!this.noodelState.r.isMounted) return;
        if (this.state.children.length === 0) return;

        this.state.isBranchTransparent = true;

        nextTick(() => {
            let rect = this.state.r.branchEl.getBoundingClientRect();

            updateBranchSize(this.noodelState, this.state, rect.height, rect.width);
            this.state.isBranchTransparent = false;
        });
    }

    /**
     * Asynchronous method to manually check for content overflow in this noode,
     * and refresh overflow indicators if they are enabled. Use when
     * overflow detection is disabled or insufficient (e.g. when content size changed
     * but did not affect noode size). Fails silently if this is root or noodel is not mounted.
     */
    checkOverflow() {
        this.throwErrorIfDeleted();
        if (!this.noodelState.r.isMounted) return;
        if (!this.state.parent) return;

        this.state.parent.isBranchTransparent = true;
        
        nextTick(() => {
            checkContentOverflow(this.noodelState, this.state);
            this.state.parent.isBranchTransparent = false;
        });
    }

    // EVENT

    /**
     * Attach an event listener on this noode.
     * @param ev event name
     * @param listener event listener to attach
     */
    on<E extends keyof NoodeEventMap>(ev: E, listener: NoodeEventMap[E]) {
        this.state.r.eventListeners.get(ev).push(listener);
    }

    /**
     * Remove an event listener from this noode.
     * @param ev event name
     * @param listener the event listener to remove, by reference comparison
     */
    off<E extends keyof NoodeEventMap>(ev: E, listener: NoodeEventMap[E]) {
        let handlers = this.state.r.eventListeners.get(ev);
        let index = handlers.indexOf(listener);

        if (index > -1) handlers.splice(index, 1);
    }
}
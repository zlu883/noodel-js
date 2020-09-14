import NoodeView from '../types/NoodeView';
import NoodeDefinition from '../types/NoodeDefinition';
import { setActiveChild as _setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { extractNoodeDefinition, parseAndApplyNoodeOptions, parseClassName, parseStyle } from '../controllers/noodel-setup';
import { getPath as _getPath } from '../util/getters';
import { alignBranchToIndex, updateNoodeSize, updateBranchSize } from '../controllers/noodel-align';
import { shiftFocalNoode, doJumpNavigation } from '../controllers/noodel-navigate';
import NoodelView from '../types/NoodelView';
import { findNoodeViewModel, changeNoodeId, unregisterNoodeSubtree } from '../controllers/id-register';
import NoodeOptions from '../types/NoodeOptions';
import ComponentContent from '../types/ComponentContent';
import Vue from 'vue';
import { traverseActiveDescendents, traverseDescendents } from '../controllers/noodel-traverse';

/**
 * The view model of a noode. Has 2-way binding with the view.
 */
export default class Noode {

    private _v: NoodeView;
    private _nv: NoodelView;

    /**
     * Custom data associated with this noode. You can freely get/set this property.
     */
    data: any;

    /**
     * Internal use only. To get the view model for specific noodes, use methods on the Noodel class instead.
     */
    constructor(v, nv, data?: any) { // types omitted to avoid including internal types in the declarations
        this._v = v;
        this._nv = nv;
        this.data = data;
    }

    private setDeleted() {
        this._nv = null;
    }

    private throwErrorIfDeleted() {
        if (!this._nv) {
            throw new Error("Invalid operation because this noode has been deleted from its noodel.")
        }
    }

    // GETTERS

    /**
     * Returns true if this noode has been deleted from its noodel.
     * Most operations on a deleted noode will throw an error.
     */
    isDeleted(): boolean {
        return !this._nv;
    }

    /**
     * Gets the parent of this noode. All noodes should have a parent
     * except the root, which will return null.
     */
    getParent(): Noode {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return null;
        return findNoodeViewModel(this._nv, this._v.id);
    }

    /**
     * Gets the previous sibling, or null if this is already the first.
     */
    getPrev(): Noode {
        if (this.isRoot()) return null;
        return this.getParent().getChild(this.getIndex() - 1);
    }

    /**
     * Gets the next sibling, or null if this is already the last.
     */
    getNext(): Noode {
        if (this.isRoot()) return null;
        return this.getParent().getChild(this.getIndex() + 1);
    }

    /**
     * Gets the path (an array of zero-based indices counting from the root) of this noode.
     */
    getPath(): number[] {
        this.throwErrorIfDeleted();
        return _getPath(this._v);
    }

    /**
     * Extracts the definition tree of this noode (including its descendents).
     * Useful if you want to perform your own operations on the content tree.
     */
    getDefinition(): NoodeDefinition {
        this.throwErrorIfDeleted();
        return extractNoodeDefinition(this._nv, this._v);
    }

    /**
     * Gets the container element of this noode (i.e. nd-noode-box) if it is mounted,
     * or null otherwise.
     */
    getEl(): HTMLDivElement {
        return this._v.el as HTMLDivElement || null;
    }

    /**
     * Gets the container element of the branch containing this noode's children
     * (i.e. nd-branch-box) if it has children and is mounted, or null otherwise.
     */
    getChildBranchEl(): HTMLDivElement {
        return this._v.branchBoxEl as HTMLDivElement || null;
    }

    /**
     * Gets the child at the given index. Returns null if does not exist.
     */
    getChild(index: number): Noode {
        this.throwErrorIfDeleted();
        if (typeof index !== "number" || index < 0 || index >= this._v.children.length) {
            return null;
        }

        return findNoodeViewModel(this._nv, this._v.children[index].id);
    }

    /**
     * Gets a mapped array of this noode's list of children.
     */
    getChildren(): Noode[] {
        this.throwErrorIfDeleted();
        return this._v.children.map(c => findNoodeViewModel(this._nv, c.id));
    }

    /**
     * Gets the number of children of this noode.
     */
    getChildCount(): number {
        return this._v.children.length;
    }

    /**
     * Gets the ID of this noode.
     */
    getId(): string {
        return this._v.id;
    }

    /**
     * Gets the content of this noode.
     */
    getContent(): string | ComponentContent {
        return this._v.content;
    }

    /**
     * Gets the custom class names for this noode.
     */
    getClass(): string[] {
        return this._v.className;
    }

    /**
     * Gets the custom styles for this noode.
     */
    getStyle(): object {
        return this._v.style;
    }

    /**
     * Gets the 0-based index (position among siblings) of this noode.
     */
    getIndex(): number {
        this.throwErrorIfDeleted();
        return this._v.index;
    }

    /**
     * Gets the level of this noode. The root has level 0,
     * the first branch has level 1, and so on.
     */
    getLevel(): number {
        this.throwErrorIfDeleted();
        return this._v.level;
    }

    /**
     * Gets the active child index. Returns null if there's no active child.
     */
    getActiveChildIndex(): number {
        return this._v.activeChildIndex;
    }

    /**
     * Gets the current active child. Returns null if does not exist.
     */
    getActiveChild(): Noode {
        this.throwErrorIfDeleted();
        if (this._v.activeChildIndex === null) return null;
        return findNoodeViewModel(this._nv, this._v.children[this._v.activeChildIndex].id);
    }

    /**
     * Returns true if this noode is the root.
     */
    isRoot(): boolean {
        this.throwErrorIfDeleted();
        return this._v.parent === null;
    }

    /**
     * Returns true if this noode is active.
     */
    isActive(): boolean {
        return this._v.isActive;
    }

    /**
     * Returns true if this noode is logically visible (i.e even when rendered beyond 
     * canvas boundary). Note that visibility may be delayed due to debounce effects.
     */
    isVisible(): boolean {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return false;
        return this._v.parent.isChildrenVisible;
    }

    /**
     * Returns true if this noode's children is logically visible (i.e even when rendered beyond 
     * canvas boundary). Note that visibility may be delayed due to debounce effects.
     */
    isChildrenVisible(): boolean {
        this.throwErrorIfDeleted();
        return this._v.isChildrenVisible;
    }

    /**
     * Returns true if this noode is inside the focal branch.
     */
    isInFocalBranch(): boolean {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return false;
        return this._v.parent.isFocalParent;
    }

    /**
     * Returns true if this noode is the parent of the focal branch.
     */
    isFocalParent(): boolean {
        this.throwErrorIfDeleted();
        return this._v.isFocalParent;
    }

    /**
     * Returns true if this noode is the focal noode.
     */
    isFocalNoode(): boolean {
        this.throwErrorIfDeleted();
        return this.isActive() && this.isInFocalBranch();
    }

    // MUTATERS

    /**
     * Sets the ID of this noode.
     */
    setId(id: string) {
        this.throwErrorIfDeleted();
        if (id === this._v.id) return;
        changeNoodeId(this._nv, this._v.id, id);
    }

    /**
     * Replaces the content of this noode.
     */
    setContent(content: string | ComponentContent) {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return; // should not set content on root

        this._v.content = content;
        
        Vue.nextTick(() => {
            if (this._v.parent.isChildrenVisible) {
                updateNoodeSize(this._nv, this._v);
                updateBranchSize(this._nv, this._v.parent);
            }
        });
    }

    /**
     * Replaces the custom class names for this noode. Can be an array or a space-delimited string.
     */
    setClass(className: string | string[]) {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return; // should not set class on root

        this._v.className = parseClassName(className);
    }

    /**
     * Replaces the custom inline styles for this noode. Can be a string or an object of property-value
     * pairs.
     */
    setStyle(style: string | object) {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return; // should not set style on root

        this._v.style = parseStyle(style);
    }

    /**
     * Changes the options for this noode. Properties of the given object
     * will be merged into the existing options.
     */
    setOptions(options: NoodeOptions) {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return; // should not set options on root

        parseAndApplyNoodeOptions(options, this._v);
    }

    /**
     * Changes the active child of this noode. If doing so will toggle
     * the visibility of the focal branch (i.e this noode is an ancestor
     * of the focal branch), a jump to the new active child will be triggered.
     */
    setActiveChild(index: number) {
        this.throwErrorIfDeleted();

        if (typeof index !== "number" || index < 0 || index >= this._v.children.length) {
            throw new Error("Cannot set active child: noode has no children or invalid index");
        }

        if (this._v.isFocalParent) {
            shiftFocalNoode(this._nv, index - this._v.activeChildIndex);
        }
        else if (this._v.isChildrenVisible && (this._v.level + 1) < this._nv.focalLevel) {
            doJumpNavigation(this._nv, this._v.children[index]);
        }
        else {
            _setActiveChild(this._nv, this._v, index);
            alignBranchToIndex(this._v, index);
        }
    }

    /**
     * Performs a navigational jump to focus on this noode.
     * Cannot jump to the root.
     */
    jumpToFocus() {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot jump to root noode");
        }

        doJumpNavigation(this._nv, this._v);
    }

    /**
     * Inserts a child noode (and its descendents) at the given index.
     * Will always preserve the current active child. Returns the inserted
     * child.
     * @param childDef definition tree of the child
     * @param index if not provided, will append to the end of the children
     */
    addChild(childDef: NoodeDefinition, index?: number): Noode {
        this.throwErrorIfDeleted();

        return this.addChildren([childDef], index)[0] || null;
    }

    /**
     * Inserts a list of child noodes (and their descendents) at the given index.
     * Will always preserve the current active child. Returns the inserted
     * children.
     * @param childDefs definition trees of the children
     * @param index if not provided, will append to the end of the children
     */
    addChildren(childDefs: NoodeDefinition[], index?: number): Noode[] {
        this.throwErrorIfDeleted();

        if (typeof index === "number" && (index < 0 || index > this._v.children.length)) {
            throw new Error("Cannot add child noode(s): invalid index");
        }

        if (typeof index !== "number") {
            index = this._v.children.length;
        }

        if (childDefs.length === 0) return [];

        return insertChildren(this._nv, this._v, index, childDefs).map(c => findNoodeViewModel(this._nv, c.id));
    }

    /**
     * Syntax sugar for adding sibling noode(s) before this noode. 
     * @param defs noode definitions to add
     */
    addBefore(...defs: NoodeDefinition[]): Noode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot add sibling noodes before root");
        }

        return this.getParent().addChildren(defs, this.getIndex());
    }

    /**
     * Syntax sugar for adding sibling noode(s) after this noode. 
     * @param defs noode definitions to add
     */
    addAfter(...defs: NoodeDefinition[]): Noode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot add sibling noodes after root");
        }

        return this.getParent().addChildren(defs, this.getIndex() + 1);
    }

    /**
     * Removes a child noode (and its descendents) at the given index.
     * If the active child is removed, will set the next child active,
     * unless the child is the last in the list, where the previous child
     * will be set active. If the focal branch is deleted, will jump
     * to the nearest ancestor branch. Returns the definition of the deleted noode.
     */
    removeChild(index: number): NoodeDefinition {
        this.throwErrorIfDeleted();

        return this.removeChildren(index, 1)[0] || null;
    }

    /**
     * Removes children noodes (and their descendents) at the given index.
     * If the active child is removed, will set the next child active,
     * unless the child is the last in the list, where the previous child
     * will be set active. If the focal branch is deleted, will jump
     * to the nearest ancestor branch. Returns the definitions of the deleted noodes.
     * @param count number of children to remove, will adjust to maximum if greater than possible range
     */
    removeChildren(index: number, count: number): NoodeDefinition[] {
        this.throwErrorIfDeleted();

        if (typeof index !== "number" || typeof count !== "number" || index < 0 || count < 0 || index >= this._v.children.length) {
            throw new Error("Cannot remove child noode(s): invalid index or count");
        }

        if (index + count > this._v.children.length) {
            count = this._v.children.length - index;
        }

        if (count <= 0) return [];

        for (let i = index; i < index + count; i++) {
            traverseDescendents(this._v.children[i], desc => {
                findNoodeViewModel(this._nv, desc.id).setDeleted();
            }, true);
        }

        let deletedNoodes = deleteChildren(this._nv, this._v, index, count);

        // extract definitions, this must happen before unregistering
        let defs = deletedNoodes.map(n => extractNoodeDefinition(this._nv, n));

        // unregister
        deletedNoodes.forEach(noode => {
            noode.parent = null;
            unregisterNoodeSubtree(this._nv, noode);
        });

        return defs;
    }

    /**
     * Syntax sugar for removing sibling noode(s) before this noode. 
     * @param count number of noodes to remove, will adjust to maximum if greater than possible range
     */
    removeBefore(count: number): NoodeDefinition[] {
        this.throwErrorIfDeleted();

        if (typeof count !== 'number' || count < 0) {
            throw new Error("Cannot remove before: invalid count");
        }

        if (this.isRoot()) return [];

        let targetIndex = this.getIndex() - count;

        if (targetIndex < 0) targetIndex = 0;

        let targetCount = this.getIndex() - targetIndex;

        if (targetCount <= 0) return [];

        return this.getParent().removeChildren(targetIndex, targetCount);
    }

    /**
     * Syntax sugar for removing sibling noode(s) after this noode. 
     * @param count number of noodes to remove, will adjust to maximum if greater than possible range
     */
    removeAfter(count: number): NoodeDefinition[] {
        this.throwErrorIfDeleted();

        if (typeof count !== 'number' || count < 0) {
            throw new Error("Cannot remove after: invalid count");
        }

        if (this.isRoot()) return [];

        if (this.getIndex() === this.getChildCount() - 1) return [];

        return this.getParent().removeChildren(this.getIndex() + 1, count);
    }

    /**
     * Syntax sugar for removing this noode from the tree. 
     */
    removeSelf(): NoodeDefinition {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot remove the root");
        }

        return this.getParent().removeChild(this.getIndex());
    }

    // TRAVERSAL

    /**
     * Do a preorder traversal of this noode's subtree and perform the specified action
     * on each descendent.
     * @param func the action to perform
     * @param includeSelf whether to include this noode in the traversal
     */
    traverseSubtree(func: (noode: Noode) => any, includeSelf: boolean) {
        traverseDescendents(this._v, desc => {
            func(findNoodeViewModel(this._nv, desc.id));
        }, includeSelf);
    }
}
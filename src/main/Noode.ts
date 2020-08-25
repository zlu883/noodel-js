import NoodeView from '../types/NoodeView';
import NoodeDefinition from '../types/NoodeDefinition';
import { setActiveChild as _setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { extractNoodeDefinition, parseAndApplyNoodeOptions, parseClassName, parseStyle } from '../controllers/noodel-setup';
import { getPath as _getPath } from '../util/getters';
import { alignBranchToIndex, updateNoodeSize, updateBranchSize } from '../controllers/noodel-align';
import { shiftFocalNoode, doJumpNavigation } from '../controllers/noodel-navigate';
import NoodelView from '../types/NoodelView';
import { findNoodeViewModel, changeNoodeId } from '../controllers/id-register';
import NoodeOptions from '../types/NoodeOptions';
import ComponentContent from '../types/ComponentContent';
import Vue from 'vue';
import { traverseDescendents } from '../controllers/noodel-traverse';

/**
 * The view model of a noode. Has 2-way binding with the view.
 */
export default class Noode {

    private _v: NoodeView;
    private _nv: NoodelView;

    /**
     * Internal use only. To get the view model for specific noodes, use methods on the Noodel class instead.
     */
    constructor(v: NoodeView, nv: NoodelView) {
        this._v = v;
        this._nv = nv;
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
     * Gets the parent of this noode. All noodes should have a parent
     * except the root, which will return null.
     */
    getParent(): Noode {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return null;
        return findNoodeViewModel(this._nv, this._v.id);
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
        return extractNoodeDefinition(this._v);
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
     * Gets the level of this noode. The root has level 1.
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

    isRoot(): boolean {
        this.throwErrorIfDeleted();
        return this._v.parent === null;
    }

    isActive(): boolean {
        return this._v.isActive;
    }

    isInFocalBranch(): boolean {
        this.throwErrorIfDeleted();
        if (this.isRoot()) return false;
        return this._v.parent.isFocalParent;
    }

    isFocalParent(): boolean {
        this.throwErrorIfDeleted();
        return this._v.isFocalParent;
    }

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
        else if (this._v.isChildrenVisible && this._v.level < this._nv.focalLevel) {
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
     * Add a sibling noode before this noode. 
     * Will always preserve the current active child. Returns the inserted
     * child.
     */
    addNoodeBefore(def: NoodeDefinition): Noode {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot add sibling noode before root");
        }

        return this.getParent().addChild(def, this.getIndex());
    }

    /**
     * Add a list of sibling noodes before this noode.
     * Will always preserve the current active child. Returns the inserted
     * children.
     */
    addNoodesBefore(defs: NoodeDefinition[]): Noode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot add sibling noodes before root");
        }

        return this.getParent().addChildren(defs, this.getIndex());
    }

    /**
     * Add a sibling noode after this noode.
     * Will always preserve the current active child. Returns the inserted
     * child.
     */
    addNoodeAfter(def: NoodeDefinition): Noode {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot add sibling noode after root");
        }

        return this.getParent().addChild(def, this.getIndex() + 1);
    }

    /**
     * Add a list of sibling noodes after this noode.
     * Will always preserve the current active child. Returns the inserted
     * children.
     */
    addNoodesAfter(defs: NoodeDefinition[]): Noode[] {
        this.throwErrorIfDeleted();

        if (this.isRoot()) {
            throw new Error("Cannot add sibling noodes after root");
        }

        return this.getParent().addChildren(defs, this.getIndex() + 1);
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
     * @param count number of children to remove
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
        
        return deletedNoodes.map(n => extractNoodeDefinition(n));
    }
}
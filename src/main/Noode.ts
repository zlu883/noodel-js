import NoodeView from '../types/NoodeView';
import NoodeDefinition from '../types/NoodeDefinition';
import { setActiveChild as _setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { extractNoodeDefinition, parseAndApplyNoodeOptions, parseClassName, parseStyle } from '../controllers/noodel-setup';
import { getPath as _getPath } from '../util/getters';
import { alignBranchToIndex, updateNoodeSize, updateBranchSize } from '../controllers/noodel-align';
import { shiftFocalNoode, doJumpNavigation } from '../controllers/noodel-navigate';
import NoodelView from '../types/NoodelView';
import { registerNoode, unregisterNoode, findNoode } from '../controllers/id-register';
import NoodeOptions from '../types/NoodeOptions';
import ComponentContent from '../types/ComponentContent';
import Vue from 'vue';

/**
 * The view model of a noode. Has 2-way binding with the view.
 */
export default class Noode {

    _v: NoodeView;
    _nv: NoodelView;

    /**
     * Internal use only. To get the view model for specific noodes, use methods on the Noodel class instead.
     */
    constructor(v: NoodeView, nv: NoodelView) {
        this._v = v;
        this._nv = nv;
    }

    // GETTERS

    /**
     * Gets the parent of this noode. All noodes should have a parent
     * except the root, which will return null.
     */
    getParent(): Noode {
        if (this.isRoot()) return null;
        return findNoode(this._nv, this._v.id);
    }

    /**
     * Gets the path (an array of zero-based indices counting from the root) of this noode.
     */
    getPath(): number[] {
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
     * Gets the container element of this noode (i.e. nd-noode-box), if mounted.
     */
    getEl(): HTMLDivElement {
        return this._v.el as HTMLDivElement;
    }

    /**
     * Gets the container element of the branch containing this noode's children
     * (i.e. nd-branch-box), if it has children and is mounted.
     */
    getChildBranchEl(): HTMLDivElement {
        return this._v.branchBoxEl as HTMLDivElement;
    }

    /**
     * Gets the child at the given index. Returns null if does not exist.
     */
    getChild(index: number): Noode {
        if (typeof index !== "number" || index < 0 || index >= this._v.children.length) {
            return null;
        }

        return findNoode(this._nv, this._v.children[index].id);
    }

    /**
     * Gets a mapped array of this noode's list of children.
     */
    getChildren(): Noode[] {
        return this._v.children.map(c => findNoode(this._nv, c.id));
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
        return this._v.index;
    }

    /**
     * Gets the level of this noode. The root has level 1.
     */
    getLevel(): number {
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
        if (this._v.activeChildIndex === null) return null;
        return findNoode(this._nv, this._v.children[this._v.activeChildIndex].id);
    }

    isRoot(): boolean {
        return this._v.parent === null;
    }

    isActive(): boolean {
        return this._v.isActive;
    }

    isInFocalBranch(): boolean {
        if (this.isRoot()) return false;
        return this._v.parent.isFocalParent;
    }

    isFocalParent(): boolean {
        return this._v.isFocalParent;
    }

    isFocalNoode(): boolean {
        return this.isActive() && this.isInFocalBranch();
    }

    // MUTATERS

    /**
     * Sets the ID of this noode.
     */
    setId(id: string) {
        if (id === this._v.id) return;
        unregisterNoode(this._nv, this._v.id);
        this._v.id = id;
        registerNoode(this._nv, id, this, this._v);
    }

    /**
     * Replaces the content of this noode.
     */
    setContent(content: string | ComponentContent) {
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
        if (this.isRoot()) return; // should not set class on root

        this._v.className = parseClassName(className);
    }

    /**
     * Replaces the custom inline styles for this noode. Can be a string or an object of property-value
     * pairs.
     */
    setStyle(style: string | object) {
        if (this.isRoot()) return; // should not set style on root

        this._v.style = parseStyle(style);
    }

    /**
     * Changes the options for this noode. Properties of the given object
     * will be merged into the existing options.
     */
    setOptions(options: NoodeOptions) {
        if (this.isRoot()) return; // should not set options on root

        parseAndApplyNoodeOptions(options, this._v);
    }

    /**
     * Changes the active child of this noode. If doing so will toggle
     * the visibility of the focal branch (i.e this noode is an ancestor
     * of the focal branch), a jump to the new active child will be triggered.
     */
    setActiveChild(index: number) {
        if (typeof index !== "number" || index < 0 || index >= this._v.children.length) {
            console.warn("Cannot set active child: noode has no children or invalid index");
            return;
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
     * Add a sibling noode before this noode.
     */
    addNoodeBefore(def: NoodeDefinition): Noode {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noode before root");
            return null;
        }

        return this.getParent().addChild(def, this.getIndex());
    }

    /**
     * Add a list of sibling noodes before this noode.
     */
    addNoodesBefore(defs: NoodeDefinition[]): Noode[] {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noodes before root");
            return [];
        }

        return this.getParent().addChildren(defs, this.getIndex());
    }

    /**
     * Add a sibling noode after this noode.
     */
    addNoodeAfter(def: NoodeDefinition): Noode {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noode after root");
            return null;
        }

        return this.getParent().addChild(def, this.getIndex() + 1);
    }

    /**
     * Add a list of sibling noodes after this noode.
     */
    addNoodesAfter(defs: NoodeDefinition[]): Noode[] {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noodes after root");
            return [];
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
        if (typeof index === "number" && (index < 0 || index > this._v.children.length)) {
            console.warn("Cannot add child noode(s): invalid index");
            return [];
        }

        if (typeof index !== "number") {
            index = this._v.children.length;
        }

        return insertChildren(this._nv, this._v, index, childDefs).map(c => findNoode(this._nv, c.id));
    }

    /**
     * Removes a child noode (and its descendents) at the given index.
     * If the active child is removed, will set the next child active,
     * unless the child is the last in the list, where the previous child
     * will be set active. If the focal branch is deleted, will jump
     * to the nearest ancestor branch. Returns the definition of the deleted noode.
     */
    removeChild(index: number): NoodeDefinition {
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
        if (typeof index !== "number" || typeof count !== "number" || index < 0 || count < 0 || index >= this._v.children.length) {
            console.warn("Cannot remove child noode(s): invalid index or count");
            return [];
        }

        if (index + count > this._v.children.length) {
            count = this._v.children.length - index;
        }

        if (count <= 0) return [];

        let deletedNoodes = deleteChildren(this._nv, this._v, index, count);
        
        return deletedNoodes.map(n => extractNoodeDefinition(n));
    }
}
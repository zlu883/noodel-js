import NoodeView from '@/types/NoodeView';
import NoodeDefinition from '@/types/NoodeDefinition';
import { setActiveChild as _setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { extractNoodeDefinition, parseAndApplyNoodeOptions, parseClassName, parseStyle } from '@/controllers/noodel-setup';
import { getPath as _getPath } from '@/util/getters';
import { alignBranchToIndex, updateNoodeSize, updateBranchSize } from '@/controllers/noodel-align';
import { shiftFocalNoode, doJumpNavigation } from '@/controllers/noodel-navigate';
import NoodelView from '@/types/NoodelView';
import { registerNoode, unregisterNoode } from '@/controllers/id-register';
import NoodeOptions from '@/types/NoodeOptions';
import ComponentContent from '@/types/ComponentContent';
import Vue from 'vue';

export default class Noode {

    _v: NoodeView;
    _nv: NoodelView;

    constructor(view: NoodeView, noodelView: NoodelView) {
        this._v = view;
        this._nv = noodelView;
    }

    // GETTERS

    getParent(): Noode {
        if (this.isRoot()) return null;
        return new Noode(this._v.parent, this._nv);
    }

    getPath(): number[] {
        return _getPath(this._v);
    }

    getDefinition(): NoodeDefinition {
        return extractNoodeDefinition(this._v);
    }

    getEl(): HTMLDivElement {
        return this._v.el as HTMLDivElement;
    }

    getChildBranchEl(): HTMLDivElement {
        return this._v.branchBoxEl as HTMLDivElement;
    }

    getChild(index: number): Noode {
        if (typeof index !== "number" || index < 0 || index >= this._v.children.length) {
            return null;
        }

        return new Noode(this._v.children[index], this._nv);
    }

    getChildren(): Noode[] {
        return this._v.children.map(c => new Noode(c, this._nv));
    }

    getChildCount(): number {
        return this._v.children.length;
    }

    getId(): string {
        return this._v.id;
    }

    getContent(): string | ComponentContent {
        return this._v.content;
    }

    getClass(): string[] {
        return this._v.className;
    }

    getStyle(): object {
        return this._v.style;
    }

    getIndex(): number {
        return this._v.index;
    }

    getLevel(): number {
        return this._v.level;
    }

    getActiveChildIndex(): number {
        return this._v.activeChildIndex;
    }

    getActiveChild(): Noode {
        if (this._v.activeChildIndex === null) return null;
        return new Noode(this._v.children[this._v.activeChildIndex], this._nv);
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

    setId(id: string) {
        if (id === this._v.id) return;
        unregisterNoode(this._nv, this._v.id);
        this._v.id = id;
        registerNoode(this._nv, id, this._v);
    }

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

    setClass(className: string | string[]) {
        if (this.isRoot()) return; // should not set class on root

        this._v.className = parseClassName(className);
    }

    setStyle(style: string | object) {
        if (this.isRoot()) return; // should not set style on root

        this._v.style = parseStyle(style);
    }

    setOptions(options: NoodeOptions) {
        if (this.isRoot()) return; // should not set options on root

        parseAndApplyNoodeOptions(options, this._v);
    }

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

    addNoodeBefore(def: NoodeDefinition): Noode {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noode before root");
            return null;
        }

        return this.getParent().addChild(def, this.getIndex());
    }

    addNoodesBefore(defs: NoodeDefinition[]): Noode[] {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noodes before root");
            return [];
        }

        return this.getParent().addChildren(defs, this.getIndex());
    }

    addNoodeAfter(def: NoodeDefinition): Noode {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noode after root");
            return null;
        }

        return this.getParent().addChild(def, this.getIndex() + 1);
    }

    addNoodesAfter(defs: NoodeDefinition[]): Noode[] {
        if (this.isRoot()) {
            console.warn("Cannot add sibling noodes after root");
            return [];
        }

        return this.getParent().addChildren(defs, this.getIndex() + 1);
    }

    addChild(childDef: NoodeDefinition, index?: number): Noode {
        return this.addChildren([childDef], index)[0] || null;
    }

    addChildren(childDefs: NoodeDefinition[], index?: number): Noode[] {
        if (typeof index === "number" && (index < 0 || index > this._v.children.length)) {
            console.warn("Cannot add child noode(s): invalid index");
            return [];
        }

        if (typeof index !== "number") {
            index = this._v.children.length;
        }

        return insertChildren(this._nv, this._v, index, childDefs).map(c => new Noode(c, this._nv));
    }

    removeChild(index: number): NoodeDefinition {
        return this.removeChildren(index, 1)[0] || null;
    }

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
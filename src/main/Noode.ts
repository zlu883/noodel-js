import NoodeView from '@/types/NoodeView';
import NoodeDefinition from '@/types/NoodeDefinition';
import { setActiveChild as _setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { extractNoodeDefinition, parseAndApplyNoodeOptions, parseClassName, parseStyle } from '@/controllers/noodel-setup';
import { getPath as _getPath } from '@/util/getters';
import { alignBranchToIndex } from '@/controllers/noodel-align';
import { shiftFocalNoode, alignNoodelOnJump } from '@/controllers/noodel-navigate';
import NoodelView from '@/types/NoodelView';
import { registerNoode, unregisterNoode } from '@/controllers/id-register';
import NoodeOptions from '@/types/NoodeOptions';

export default class Noode {

    _v: NoodeView;
    _nv: NoodelView;

    constructor(view: NoodeView, noodelView: NoodelView) {
        this._v = view;
        this._nv = noodelView;
    }

    // GETTERS

    getParent(): Noode {
        if (!this._v.parent) return null;
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
        return this._v.childBranchEl as HTMLDivElement;
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

    getId(): string {
        return this._v.id;
    }

    getContent(): string {
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

    // MUTATERS

    setId(id: string) {
        if (id === this._v.id) return;
        unregisterNoode(this._nv, this._v.id);
        this._v.id = id;
        registerNoode(this._nv, id, this._v);
    }

    setContent(content: string) {
        this._v.content = content;
    }

    setClass(className: string | string[]) {
        this._v.className = parseClassName(className);
    }

    setStyle(style: string | object) {
        this._v.style = parseStyle(style);
    }

    setOptions(options: NoodeOptions) {
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
            alignNoodelOnJump(this._nv, this._v.children[index]);
        }
        else {
            _setActiveChild(this._nv, this._v, index);
            alignBranchToIndex(this._v, index);
        }
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
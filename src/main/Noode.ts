import NoodeView from '@/model/NoodeView';
import NoodeDefinition from '@/model/NoodeDefinition';
import Noodel from './Noodel';
import { setActiveChild as _setActiveChild, deleteChildren, insertChildren } from '../controllers/noodel-mutate';
import { buildNoodeView, extractNoodeDefinition } from '@/controllers/noodel-setup';
import { getPath as _getPath } from '@/util/getters';
import { alignBranchToIndex } from '@/controllers/noodel-align';
import { shiftFocalNoode, jumpToNoode } from '@/controllers/noodel-navigate';

export default class Noode {

    view: NoodeView;
    noodel: Noodel;

    constructor(view: NoodeView, noodel: Noodel) {
        this.view = view;
        this.noodel = noodel;
    }

    getParent(): Noode {
        if (!this.view.parent) return null;
        return new Noode(this.view.parent, this.noodel);
    }

    getPath(): number[] {
        return _getPath(this.view);
    }

    getDefinition(): NoodeDefinition {
        return extractNoodeDefinition(this.view);
    }

    getChild(index: number): Noode {
        if (typeof index !== "number" || index < 0 || index >= this.view.children.length) {
            return null;
        }

        return new Noode(this.view.children[index], this.noodel);
    }

    getChildren(): Noode[] {
        return this.view.children.map(c => new Noode(c, this.noodel));
    }

    getId(): string {
        return this.view.id;
    }

    setId(id: string) {
        if (id === this.view.id) return;
        this.noodel.idRegister.registerNoode(id, this.view);
        this.noodel.idRegister.unregisterNoode(this.view.id);
        this.view.id = id;
    }

    getContent(): string {
        return this.view.content;
    }

    setContent(content: string) {
        this.view.content = content;
    }

    getIndex(): number {
        return this.view.index;
    }

    getLevel(): number {
        return this.view.level;
    }

    getActiveChildIndex(): number {
        return this.view.activeChildIndex;
    }

    getActiveChild(): Noode {
        if (this.view.activeChildIndex === null) return null;
        return new Noode(this.view.children[this.view.activeChildIndex], this.noodel);
    }

    setActiveChild(index: number) {
        if (typeof index !== "number" || index < 0 || index >= this.view.children.length) {
            console.warn("Cannot set active child: noode has no children or invalid index");
            return;
        }

        if (this.view.isFocalParent) {
            shiftFocalNoode(this.noodel.store, index - this.view.activeChildIndex);
        }
        else if (this.view.isChildrenVisible && this.view.level < this.noodel.store.focalLevel) {
            jumpToNoode(this.noodel.store, this.view.children[index]);
        }
        else {
            _setActiveChild(this.noodel.store, this.view, index);
            alignBranchToIndex(this.view, index);
        }
    }

    addChild(childDef: NoodeDefinition, index?: number): Noode {
        return this.addChildren([childDef], index)[0] || null;
    }

    addChildren(childDefs: NoodeDefinition[], index?: number): Noode[] {
        if (typeof index === "number" && (index < 0 || index > this.view.children.length)) {
            console.warn("Cannot add child noode(s): invalid index");
            return [];
        }

        if (typeof index !== "number") {
            index = this.view.children.length;
        }

        let children = childDefs.map((def, pos) => {
            let child = buildNoodeView(
                this.noodel.idRegister,
                def,
                this.view.level + 1,
                index + pos,
                this.view
            )

            child.trunkRelativeOffset = this.view.trunkRelativeOffset + this.view.branchSize;
            child.branchRelativeOffset = index > 0 ? 
                this.view.children[index - 1].branchRelativeOffset + this.view.children[index - 1].size :
                0;

            return child;
        });

        insertChildren(this.noodel.store, this.view, index, children);

        return children.map(c => new Noode(c, this.noodel));
    }

    removeChild(index: number): NoodeDefinition {
        return this.removeChildren(index, 1)[0] || null;
    }

    removeChildren(index: number, count: number): NoodeDefinition[] {
        if (typeof index !== "number" || typeof count !== "number" || index < 0 || count < 0 || index >= this.view.children.length) {
            console.warn("Cannot remove child noode(s): invalid index or count");
            return [];
        }

        if (index + count > this.view.children.length) {
            count = this.view.children.length - index;
        }

        if (count <= 0) return [];

        let deletedNoodes: NoodeView[] = deleteChildren(this.noodel.store, this.view, index, count);

        deletedNoodes.forEach(n => this.noodel.idRegister.unregisterNoode(n.id));
        
        return deletedNoodes.map(n => extractNoodeDefinition(n));
    }
}
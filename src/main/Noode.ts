import NoodeView from '@/model/NoodeView';
import NoodeDefinition from '@/model/NoodeDefinition';
import Noodel from './Noodel';
import { setActiveChild as _setActiveChild, setActiveSubtreeVisibility } from '../controllers/noodel-mutate';
import { buildNoodeView } from '@/controllers/noodel-setup';
import { isRoot } from '@/util/getters';

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
            console.warn("Cannot set active child: invalid index");
            return;
        }
        
        _setActiveChild(this.view, index);
    }

    addChild(childDef: NoodeDefinition, index?: number): Noode {
        if (typeof index === "number" && (index < 0 || index > this.view.children.length)) {
            console.warn("Cannot add child: invalid index");
            return;
        }
       
        let child = buildNoodeView(
            this.noodel.idRegister, 
            childDef, 
            this.view.level + 1, 
            typeof index === 'number' ? index : this.view.children.length,
            this.view
        );

        child.offset = this.view.offset + this.view.branchSize;

        if (typeof index !== 'number') {
            this.view.children.push(child);
        }
        else {
            this.view.children.splice(index, 0, child);

            if (this.view.activeChildIndex !== null && index <= this.view.activeChildIndex) {
                this.view.activeChildIndex++;
            }

            for (let i = index + 1; i < this.view.children.length; i++) {
                this.view.children[i].index++;
            }
        }

        if (this.view.children.length === 1) {
            _setActiveChild(this.view, 0);
        }

        if (this.view.isActive && (isRoot(this.view) || this.view.parent.isChildrenVisible)) {
            setActiveSubtreeVisibility(this.noodel.getFocalParent().view, true, this.noodel.store.options.visibleSubtreeDepth);
        }

        return new Noode(child, this.noodel);
    }

    addChildren(childDefs: NoodeDefinition[], index?: number): Noode {
        if (typeof index === "number" && (index < 0 || index > this.view.children.length)) {
            console.warn("Cannot add child: invalid index");
            return;
        }

        let children = childDefs.map((def, index) => {
            let child = buildNoodeView(
                this.noodel.idRegister, 
                def, 
                this.view.level + 1, 
                typeof index === 'number' ? index : this.view.children.length,
                this.view
            )
    
            child.offset = this.view.offset + this.view.branchSize;
            return child;
        });

        if (typeof index !== 'number') {
            this.view.children.push(...children);
        }
        else {
            this.view.children.splice(index, 0, ...children);

            if (this.view.activeChildIndex !== null && index <= this.view.activeChildIndex) {
                this.view.activeChildIndex += children.length;
            }

            for (let i = index + 1; i < this.view.children.length; i++) {
                this.view.children[i].index += children.length;
            }
        }
       
        if (this.view.children.length === childDefs.length) {
            _setActiveChild(this.view, 0);
        }

        if (this.view.isActive && (isRoot(this.view) || this.view.parent.isChildrenVisible)) {
            setActiveSubtreeVisibility(this.noodel.getFocalParent().view, true, this.noodel.store.options.visibleSubtreeDepth);
        }
    }

    removeChild(index: number) {
        // TODO
        return null;
    }

    removeChildren(index: number, count: number) {
        // TODO
        return null;
    }
}
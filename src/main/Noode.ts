import NoodeView from '@/model/NoodeView';
import NoodeDefinition from '@/model/NoodeDefinition';
import Noodel from './Noodel';
import { setActiveChild as _setActiveChild } from '../controllers/noodel-mutate';

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

    addChild(child: NoodeDefinition, index?: number) {
        // TODO
        return null;
    }

    addChildren(children: NoodeDefinition[], index?: number) {
        // TODO
        return null;
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
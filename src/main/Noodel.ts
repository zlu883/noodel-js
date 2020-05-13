import NoodeDefinition from '@/model/NoodeDefinition';
import NoodelOptions from '@/model/NoodelOptions';
import { setupNoodel, parseHTMLToNoode, mergeOptions } from '@/controllers/noodel-setup';
import NoodelTrunk from '@/view/NoodelTrunk.vue';
import Vue from 'vue';
import NoodelView from '@/model/NoodelView';
import Noode from './Noode';
import IdRegister from './IdRegister';
import { getActiveChild } from '@/util/getters';
import { jumpToNoode, shiftFocalLevel, shiftFocalNoode } from '@/controllers/noodel-navigate';
import { findNoodeByPath as _findNoodeByPath } from '@/controllers/noodel-traverse';

export default class Noodel {

    store: NoodelView;
    idRegister = new IdRegister();
    vueRoot: Element = null;
    vueInstance: Vue = null;

    constructor(root?: NoodeDefinition | Element | string, options?: NoodelOptions) {
        if (!root) {
            root = {};
        } 

        if (typeof root === "string") {
            root = document.querySelector(root);
        }

        if (typeof root !== "object") {
            throw new Error("Cannot render noodel: invalid root object or element");
        }

        if (root instanceof Element) {
            root = parseHTMLToNoode(root);
        }

        this.store = setupNoodel(this.idRegister, root, options);
    }

    mount(el: string | Element) {
        Vue.config.productionTip = false;
    
        this.vueInstance = new Vue({
            render: h => h(NoodelTrunk, { props: { store: this.store }}),
            data: this.store
        }).$mount(el);

        this.vueRoot = this.vueInstance.$el;
    }

    unmount() {
        if (this.vueInstance) this.vueInstance.$destroy();
        if (this.vueRoot) this.vueRoot.remove();
        this.vueInstance = null;
        this.vueRoot = null;
        this.store.isFirstRenderDone = false;
    }

    setOptions(options: NoodelOptions) {
        mergeOptions(options, this.store);
    }

    getFocalLevel(): number {
        return this.store.focalLevel;
    }

    setFocalLevel(level: number) {
        if (typeof level !== 'number' || level < 0 || level >= this.getActiveLevelCount()) {
            console.warn("Cannot set focal level: invalid level");
            return;
        }

        shiftFocalLevel(this.store, level - this.store.focalLevel);
    }

    getActiveLevelCount(): number {
        let count = 0;
        let currentParent = this.store.root;

        while (currentParent.activeChildIndex !== null) {
            count++;
            currentParent = getActiveChild(currentParent);
        }

        return count;
    }

    getRoot(): Noode {
        return new Noode(this.store.root, this);
    }

    getFocalParent(): Noode {
        return new Noode(this.store.focalParent, this);
    }

    getFocalNoode(): Noode {
        let focalNoode = getActiveChild(this.store.focalParent);
        return focalNoode ? new Noode(focalNoode, this) : null;
    }

    findNoodeByPath(path: number[]): Noode {
        if (!Array.isArray(path)) {
            console.warn("Cannot find noode: invalid path");
            return null;
        }

        let target = _findNoodeByPath(this.store, path);
        
        return target ? new Noode(target, this) : null;
    }

    findNoodeById(id: string): Noode {
        if (typeof id !== 'string') {
            console.warn("Cannot find noode: invalid id");
            return null;
        }

        let target = this.idRegister.findNoode(id);
        
        return target ? new Noode(target, this) : null;
    }

    moveIn(levelCount: number = 1) {
        shiftFocalLevel(this.store, levelCount);
    }

    moveOut(levelCount: number = 1) {
        shiftFocalLevel(this.store, -levelCount);
    }

    moveForward(noodeCount: number = 1) {
        shiftFocalNoode(this.store, noodeCount);
    }

    moveBack(noodeCount: number = 1) {
        shiftFocalNoode(this.store, -noodeCount);
    }

    jumpTo(noode: Noode) {
        if (!(noode instanceof Noode)) {
            console.warn("Cannot jump to noode: invalid target");
            return;
        }

        if (!noode.getParent()) {
            console.warn("Cannot jump to noode: target is root");
            return;
        }

        jumpToNoode(this.store, noode.view);
    }
}
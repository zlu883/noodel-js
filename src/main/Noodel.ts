import NoodeDefinition from '@/model/NoodeDefinition';
import NoodelOptions from '@/model/NoodelOptions';
import { setupNoodel, parseHTMLToNoode, parseAndApplyOptions } from '@/controllers/noodel-setup';
import NoodelTrunk from '@/view/NoodelTrunk.vue';
import Vue from 'vue';
import NoodelView from '@/model/NoodelView';
import Noode from './Noode';
import { getActiveChild } from '@/util/getters';
import { jumpToNoode, shiftFocalLevel, shiftFocalNoode } from '@/controllers/noodel-navigate';
import { findNoodeByPath as _findNoodeByPath } from '@/controllers/noodel-traverse';
import { findNoode } from '@/controllers/id-register';

export default class Noodel {

    store: NoodelView;
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

        if (typeof options !== "object") {
            options = {};
        }

        this.store = setupNoodel(root, options);
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
        parseAndApplyOptions(options, this.store);
    }

    getFocalLevel(): number {
        return this.store.focalLevel;
    }

    setFocalLevel(level: number) {
        if (typeof level !== 'number' || level < 1 || level > this.getActiveTreeHeight()) {
            console.warn("Cannot set focal level: invalid level");
            return;
        }

        shiftFocalLevel(this.store, level - this.store.focalLevel);
    }

    getActiveTreeHeight(): number {
        let count = 0;
        let currentParent = this.store.root;

        while (currentParent.activeChildIndex !== null) {
            count++;
            currentParent = getActiveChild(currentParent);
        }

        return count;
    }

    getRoot(): Noode {
        return new Noode(this.store.root, this.store);
    }

    getFocalParent(): Noode {
        return new Noode(this.store.focalParent, this.store);
    }

    getFocalNoode(): Noode {
        let focalNoode = getActiveChild(this.store.focalParent);
        return focalNoode ? new Noode(focalNoode, this.store) : null;
    }

    findNoodeByPath(path: number[]): Noode {
        if (!Array.isArray(path)) {
            console.warn("Cannot find noode: invalid path");
            return null;
        }

        let target = _findNoodeByPath(this.store, path);
        
        return target ? new Noode(target, this.store) : null;
    }

    findNoodeById(id: string): Noode {
        if (typeof id !== 'string') {
            console.warn("Cannot find noode: invalid id");
            return null;
        }

        let target = findNoode(this.store, id);
        
        return target ? new Noode(target, this.store) : null;
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
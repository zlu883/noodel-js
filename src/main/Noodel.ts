import NoodeDefinition from '@/model/NoodeDefinition';
import NoodelOptions from '@/model/NoodelOptions';
import { setupNoodel, parseHTMLToNoode, parseAndApplyOptions } from '@/controllers/noodel-setup';
import NoodelTrunk from '@/view/NoodelTrunk.vue';
import Vue from 'vue';
import NoodelView from '@/model/NoodelView';
import Noode from './Noode';
import { getActiveChild } from '@/util/getters';
import { doJumpNavigation, shiftFocalLevel, shiftFocalNoode } from '@/controllers/noodel-navigate';
import { findNoodeByPath as _findNoodeByPath, traverseDescendents } from '@/controllers/noodel-traverse';
import { findNoode } from '@/controllers/id-register';
import { handleFocalNoodeChange } from '@/controllers/noodel-mutate';

export default class Noodel {

    _v: NoodelView;
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

        this._v = setupNoodel(root, options);

        handleFocalNoodeChange(this._v, null, getActiveChild(this._v.focalParent));
    }

    mount(el: string | Element) {
        Vue.config.productionTip = false;
    
        this.vueInstance = new Vue({
            render: h => h(NoodelTrunk, { props: { store: this._v }}),
            data: this._v
        }).$mount(el);

        this.vueRoot = this.vueInstance.$el;
    }

    unmount() {
        if (this.vueInstance) this.vueInstance.$destroy();
        if (this.vueRoot) this.vueRoot.remove();
        this.vueInstance = null;
        this.vueRoot = null;
        this._v.isFirstRenderDone = false;
        this._v.canvasEl = undefined;
        this._v.trunkEl = undefined;
        this._v.focalBranchEl = undefined;
        traverseDescendents(this._v.root, (noode) => {
            noode.childBranchEl = undefined;
            noode.el = undefined;
        }, true);
    }

    getEl(): HTMLDivElement {
        return this._v.canvasEl as HTMLDivElement;
    }

    setOptions(options: NoodelOptions) {
        parseAndApplyOptions(options, this._v);
    }

    getFocalLevel(): number {
        return this._v.focalLevel;
    }

    setFocalLevel(level: number) {
        if (typeof level !== 'number' || level < 1 || level > this.getActiveTreeHeight()) {
            console.warn("Cannot set focal level: invalid level");
            return;
        }

        shiftFocalLevel(this._v, level - this._v.focalLevel);
    }

    getActiveTreeHeight(): number {
        let count = 0;
        let currentParent = this._v.root;

        while (currentParent.activeChildIndex !== null) {
            count++;
            currentParent = getActiveChild(currentParent);
        }

        return count;
    }

    getRoot(): Noode {
        return new Noode(this._v.root, this._v);
    }

    getFocalParent(): Noode {
        return new Noode(this._v.focalParent, this._v);
    }

    getFocalNoode(): Noode {
        let focalNoode = getActiveChild(this._v.focalParent);
        return focalNoode ? new Noode(focalNoode, this._v) : null;
    }

    findNoodeByPath(path: number[]): Noode {
        if (!Array.isArray(path)) {
            console.warn("Cannot find noode: invalid path");
            return null;
        }

        let target = _findNoodeByPath(this._v, path);
        
        return target ? new Noode(target, this._v) : null;
    }

    findNoodeById(id: string): Noode {
        if (typeof id !== 'string') {
            console.warn("Cannot find noode: invalid id");
            return null;
        }

        let target = findNoode(this._v, id);
        
        return target ? new Noode(target, this._v) : null;
    }

    moveIn(levelCount: number = 1) {
        shiftFocalLevel(this._v, levelCount);
    }

    moveOut(levelCount: number = 1) {
        shiftFocalLevel(this._v, -levelCount);
    }

    moveForward(noodeCount: number = 1) {
        shiftFocalNoode(this._v, noodeCount);
    }

    moveBack(noodeCount: number = 1) {
        shiftFocalNoode(this._v, -noodeCount);
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

        doJumpNavigation(this._v, noode._v);
    }
}
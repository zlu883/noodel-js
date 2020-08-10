import NoodeDefinition from '@/types/NoodeDefinition';
import NoodelOptions from '@/types/NoodelOptions';
import { setupNoodel, parseHTMLToNoode, parseAndApplyOptions } from '@/controllers/noodel-setup';
import NoodelCanvas from '@/view/NoodelCanvas.vue';
import Vue from 'vue';
import NoodelView from '@/types/NoodelView';
import Noode from './Noode';
import { getActiveChild } from '@/util/getters';
import { doJumpNavigation, shiftFocalLevel, shiftFocalNoode } from '@/controllers/noodel-navigate';
import { findNoodeByPath as _findNoodeByPath } from '@/controllers/noodel-traverse';
import { findNoode } from '@/controllers/id-register';
import { handleFocalNoodeChange } from '@/controllers/noodel-mutate';
import { enterInspectMode, exitInspectMode } from '@/controllers/inspect-mode';

export default class Noodel {

    static VueComponent = Vue.extend({
        props: ['noodel'],
        render: function(h) {
            return h(NoodelCanvas, { props: { store: this.noodel._v }})
        }
    });

    _v: NoodelView;
    vueRoot: Element;
    vueInstance: Vue;

    constructor(root?: NoodeDefinition | Element | string, options?: NoodelOptions) {
        if (!root) {
            root = {};
        } 

        if (typeof root === "string") {
            root = document.querySelector(root);
        }

        if (!root || typeof root !== "object") {
            throw new Error("Cannot create noodel: invalid root param");
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

    // LIFECYCLE

    mount(el: string | Element) {
        Vue.config.productionTip = false;
    
        this.vueInstance = new Vue({
            render: h => h(NoodelCanvas, { props: { store: this._v }}),
            data: this._v
        }).$mount(el);

        this.vueRoot = this.vueInstance.$el;
    }

    unmount() {
        if (this.vueInstance) this.vueInstance.$destroy();
        if (this.vueRoot) this.vueRoot.remove();
        delete this.vueInstance;
        delete this.vueRoot;
    }

    // GETTERS

    getEl(): HTMLDivElement {
        return this._v.canvasEl as HTMLDivElement;
    }

    getFocalLevel(): number {
        return this._v.focalLevel;
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

    // MUTATERS

    setOptions(options: NoodelOptions) {
        parseAndApplyOptions(options, this._v);
    }
    
    setFocalLevel(level: number) {
        if (typeof level !== 'number' || level < 1 || level > this.getActiveTreeHeight()) {
            console.warn("Cannot set focal level: invalid level");
            return;
        }

        shiftFocalLevel(this._v, level - this._v.focalLevel);
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

    toggleInspectMode(on: boolean) {
        if (on) {
            enterInspectMode(this._v);
        }
        else {
            exitInspectMode(this._v);
        }
    }
}
import NoodeDefinition from '@/model/NoodeDefinition';
import NoodelOptions from '@/model/NoodelOptions';
import { setupNoodel, parseHTMLToNoode, mergeOptions } from '@/controllers/noodel-setup';
import NoodelTrunk from '@/view/NoodelTrunk.vue';
import Vue from 'vue';
import NoodelView from '@/model/NoodelView';
import Noode from './Noode';
import IdRegister from './IdRegister';
import { getActiveChild } from '@/util/getters';
import { alignTrunkToLevel, shiftRight, shiftLeft, shiftDown, shiftUp, jumpToNoode as _jumpToNoode } from '@/controllers/noodel-navigate';

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
    }

    setOptions(options: NoodelOptions) {
        mergeOptions(options, this.store);
    }

    getFocalLevel(): number {
        return this.store.focalLevel;
    }

    setFocalLevel(level: number) {
        let levelCount = this.getActiveLevelCount();

        if (level < 0) level = 0;
        if (level > levelCount - 1) level = levelCount - 1;
        alignTrunkToLevel(this.store, level);
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

    findNoode(selector: number[] | string): Noode {
        if (typeof selector === 'string') {
            let target = this.idRegister.findNoode(selector);
            return target ? new Noode(target, this) : null;
        }
        else if (Array.isArray(selector)) {
            let target = this.store.root;

            for (let i = 0; i < selector.length; i++) {
                target = target.children[selector[i]];
                if (!target) return null;
            }

            return new Noode(target, this);
        }
        else {
            return null;
        }
    }

    shiftTrunk(levelDiff: number, animate = true, onComplete?: () => any) {
        if (animate) {
            if (levelDiff > 0) {
                shiftRight(this.store, levelDiff);
            }
            else if (levelDiff < 0) {
                shiftLeft(this.store, levelDiff);
            }
        }
        else {
            this.setFocalLevel(this.store.focalLevel + levelDiff);
        }
    }

    shiftBranch(indexDiff: number, animate = true, onComplete?: () => any) {
        if (animate) {
            if (indexDiff > 0) {
                shiftDown(this.store, indexDiff);
            }
            else if (indexDiff < 0) {
                shiftUp(this.store, indexDiff);
            }
        }
        else {
            new Noode(this.store.focalParent, this).setActiveChild(this.store.focalParent.activeChildIndex + indexDiff);
        }
    }

    jumpToNoode(selector: number[] | string, animate = true, onComplete?: () => any) {
        if (animate) {
            let target = this.findNoode(selector);             

            if (target) {
                _jumpToNoode(this.store, target.getPath());
            }
            else {
                console.warn("Cannot jump to noode: invalid selector");
            }
        }
        else {
            //TODO
        }
    }
}
import NoodeDefinition from '../types/NoodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import { setupNoodel, parseHTMLToNoode, parseAndApplyOptions } from '../controllers/noodel-setup';
import NoodelCanvas from '../view/NoodelCanvas.vue';
import Vue from 'vue';
import NoodelState from '../types/NoodelState';
import Noode from './Noode';
import { getActiveChild } from '../util/getters';
import { shiftFocalLevel, shiftFocalNoode } from '../controllers/noodel-navigate';
import { findNoodeByPath as _findNoodeByPath } from '../controllers/noodel-traverse';
import { findNoodeViewModel } from '../controllers/id-register';
import { enterInspectMode, exitInspectMode } from '../controllers/inspect-mode';
import { handleFocalNoodeChange } from '../controllers/event-emit';

/**
 * The view model of a noodel. Has 2-way binding with the view.
 */
export default class Noodel {

    /**
     * A Vue component (in constructor form) for Noodel ready to be used in a Vue project.
     * Takes a single prop, 'noodel', which should be a Noodel instance registered as
     * data in your Vue instance. 
     */
    static VueComponent = Vue.extend({
        props: ['noodel'],
        render: function(h) {
            return h(NoodelCanvas, { props: { noodel: this.noodel._v }})
        }
    });

    private _v: NoodelState;
    private vueRoot: Element;
    private vueInstance: Vue;

    /**
     * Creates the view model of a noodel based on the given content tree.
     * @param contentTree Initial content tree for the noodel. Can be an array of NoodeDefinition
     * objects that specify noodes on the first level, an HTMLElement that contain templates for noodes on 
     * the first level, or a selector string for such an element. If nothing is provided, will create an empty
     * noodel with just the root.
     * @param options Global options for the noodel
     */
    constructor(contentTree?: NoodeDefinition[] | Element | string, options?: NoodelOptions) {
        let root: NoodeDefinition = null;
    
        if (Array.isArray(contentTree)) {
            root = {
                children: contentTree
            };
        }
        else if (typeof contentTree === "string") {
            let el = document.querySelector(contentTree);
            
            if (!el) throw new Error("Cannot create noodel: invalid root param");
            root = parseHTMLToNoode(el);
        }
        else if (contentTree instanceof Element) {
            root = parseHTMLToNoode(contentTree);
        } 
        else if (contentTree && typeof contentTree === 'object') {
            root = (contentTree as any);
        }
        else {
            root = {};
        }

        if (!options) {
            options = {};
        }

        this._v = setupNoodel(root, options);

        handleFocalNoodeChange(this._v, null, getActiveChild(this._v.focalParent));
    }

    // LIFECYCLE

    /**
     * Mounts the noodel's view at the target element, replacing it.
     */
    mount(el: string | Element) {
        if (typeof el === "string") {
            el = document.querySelector(el);
        }

        if (!(el instanceof Element)) {
            throw new Error("Cannot mount noodel: invalid target element");
        }

        Vue.config.productionTip = false;

        this.vueInstance = new Vue({
            render: h => h(NoodelCanvas, { props: { noodel: this._v }}),
            data: this._v
        }).$mount(el);

        this.vueRoot = this.vueInstance.$el;
    }

    /**
     * Destroys the noodel's view and removes it from the DOM,
     * but keeping the current state of the view model.
     */
    unmount() {
        if (this.vueInstance) this.vueInstance.$destroy();
        if (this.vueRoot) this.vueRoot.remove();
        delete this.vueInstance;
        delete this.vueRoot;
    }

    /**
     * Schedules a callback function to be called after Noodel's current DOM update cycle.
     * Use this if you need to access DOM elements after performing an update.
     */
    nextTick(callback: () => any) {
        // double Vue nextTick because some changes may take two update cycles to settle
        Vue.nextTick(() => {
            Vue.nextTick(callback);
        });
    }

    // GETTERS

    /**
     * Gets the container element of this noodel (i.e. nd-canvas), if mounted.
     */
    getEl(): HTMLDivElement {
        return this._v.canvasEl as HTMLDivElement;
    }

    /**
     * Gets the level of the current focal branch. The first branch has level 1.
     */
    getFocalLevel(): number {
        return this._v.focalLevel;
    }

    /**
     * Gets the height (total number of levels) in the current active tree.
     */
    getActiveTreeHeight(): number {
        let count = 0;
        let currentParent = this._v.root;

        while (currentParent.activeChildIndex !== null) {
            count++;
            currentParent = getActiveChild(currentParent);
        }

        return count;
    }

    /**
     * Gets the number of noodes in this noodel (excluding the root).
     */
    getNoodeCount(): number {
        return this._v.idMap.size - 1;
    }

    /**
     * Gets the root noode. The root is an invisible noode
     * that serves as the parent of the topmost branch, and always exists.
     */
    getRoot(): Noode {
        return findNoodeViewModel(this._v, this._v.root.id);
    }

    /**
     * Gets the parent noode of the current focal branch.
     */
    getFocalParent(): Noode {
        return findNoodeViewModel(this._v, this._v.focalParent.id);
    }

    /**
     * Gets the current focal noode.
     */
    getFocalNoode(): Noode {
        let focalNoode = getActiveChild(this._v.focalParent);
        return focalNoode ? findNoodeViewModel(this._v, focalNoode.id) : null;
    }

    /**
     * Gets the noode at the given path, an array of 0-based indices
     * starting from the root (e.g [0, 2] gets the 3rd child of the first child
     * of the root). Returns null if no noode exists on that path.
     */
    findNoodeByPath(path: number[]): Noode {
        if (!Array.isArray(path)) {
            console.warn("Cannot find noode: invalid path");
            return null;
        }

        let target = _findNoodeByPath(this._v, path);
        
        return target ? findNoodeViewModel(this._v, target.id) : null;
    }

    /**
     * Gets the noode with the given ID. Returns null if does not exist.
     */
    findNoodeById(id: string): Noode {
        if (typeof id !== 'string') {
            console.warn("Cannot find noode: invalid id");
            return null;
        }
        
        return findNoodeViewModel(this._v, id);
    }

    // MUTATERS

    /**
     * Changes the options of the noodel. Properties of the given object
     * will be merged into the current options.
     */
    setOptions(options: NoodelOptions) {
        parseAndApplyOptions(options, this._v);
    }
    
    /**
     * Navigates the noodel to focus on the branch at the given level of
     * the current active tree. If the level is greater or smaller than
     * the possible limits, will navigate to the furthest level in that direction.
     */
    setFocalLevel(level: number) {
        shiftFocalLevel(this._v, level - this._v.focalLevel);
    }

    /**
     * Navigates towards the child branches of the current
     * focal noode.
     * @param levelCount number of levels to move, defaults to 1
     */
    moveIn(levelCount: number = 1) {
        shiftFocalLevel(this._v, levelCount);
    }

    /**
     * Navigates towards the parent branches of the current
     * focal noode.
     * @param levelCount number of levels to move, defaults to 1
     */
    moveOut(levelCount: number = 1) {
        shiftFocalLevel(this._v, -levelCount);
    }

    /**
     * Navigates towards the next siblings of the current
     * focal noode.
     * @param noodeCount number of noodes to move, defaults to 1
     */
    moveForward(noodeCount: number = 1) {
        shiftFocalNoode(this._v, noodeCount);
    }

    /**
     * Navigates towards the previous siblings of the current
     * focal noode.
     * @param noodeCount number of noodes to move, defaults to 1
     */
    moveBack(noodeCount: number = 1) {
        shiftFocalNoode(this._v, -noodeCount);
    }

    /**
     * Performs a navigational jump to focus on the given noode.
     * Cannot jump to the root.
     * @param noode the noode to jump to, must be a Noode instance obtained from the noodel
     * @deprecated use Noode.jumpToFocus() instead
     */
    jumpTo(noode: Noode) {
        noode.jumpToFocus();
    }

    /**
     * Turns inspect mode on/off.
     */
    toggleInspectMode(on: boolean) {
        if (on) {
            enterInspectMode(this._v);
        }
        else {
            exitInspectMode(this._v);
        }
    }
}
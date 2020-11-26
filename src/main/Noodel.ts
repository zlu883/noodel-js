import NodeDefinition from '../types/NodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import { createNoodelState } from '../controllers/setup';
import Canvas from '../view/Canvas.vue';
import { nextTick as vueNextTick, createApp } from 'vue';
import NoodelState from '../types/NoodelState';
import NoodelNode from './NoodelNode';
import { getActiveChild, getFocalNode } from '../controllers/getters';
import { shiftFocalLevel, shiftFocalNode } from '../controllers/navigate';
import { findNodeByPath as _findNodeByPath } from '../controllers/identity';
import { enterInspectMode, exitInspectMode } from '../controllers/inspect-mode';
import { findNode } from '../controllers/identity';
import NoodelEventMap from '../types/NoodelEventMap';
import { parseContentTreeDefinition, parseHTMLToNode } from '../controllers/serialize';
import { parseAndApplyOptions } from '../controllers/options';

/**
 * The view model of a noodel. Has 2-way binding with the view.
 */
export default class Noodel {

    private _s: NoodelState;

    static VueComponent: object = Canvas;

    /**
     * Creates the view model of a noodel based on the given content tree.
     * @param contentTree Initial content tree for the noodel. Can be an array of NodeDefinition
     * objects that specify nodes on the first level, an HTMLElement that contain templates for nodes on 
     * the first level, or a selector string for such an element. If nothing is provided, will create an empty
     * noodel with just the root.
     * @param options Global options for the noodel
     */
    constructor(contentTree?: NodeDefinition[] | Element | string, options?: NoodelOptions) {
        let root: NodeDefinition = {
            children: parseContentTreeDefinition(contentTree)
        }

        if (!options) {
            options = {};
        }

        this._s = createNoodelState(root, options);
    }

    // LIFECYCLE

    /**
     * Mounts the noodel's view into the target container element.
     */
    mount(el: string | Element) {
        if (typeof el === "string") {
            el = document.querySelector(el);
        }

        if (!(el instanceof Element)) {
            throw new Error("Cannot mount noodel: invalid container element");
        }

        this._s.r.containerEl = el;
        this._s.r.vueInstance = createApp(Canvas as any, {noodel: this._s});
        this._s.r.vueInstance.mount(el);
    }

    /**
     * Destroys the noodel's view and removes it from the DOM,
     * but keeping the current state of the view model.
     */
    unmount() {
        let vueInstance = this._s.r.vueInstance;
        let containerEl = this._s.r.containerEl;

        if (vueInstance) {
            vueInstance.unmount(containerEl);
        }
        
        this._s.r.vueInstance = null;
        this._s.r.containerEl = null;
    }

    /**
     * Schedules a callback function to be called after Noodel's current DOM update cycle.
     * Use this to wait to DOM updates to complete after mutating the view model.
     */
    nextTick(callback: () => any) {
        // double Vue nextTick because some changes may take two update cycles to settle
        vueNextTick(() => {
            vueNextTick(callback);
        });
    }

    // GETTERS

    /**
     * Get the internal reactive state tree of this noodel. Only intended to be used
     * as props to the Vue component in a Vue app. Should not be modified directly.
     */
    getState(): NoodelState {
        return this._s;
    }

    /**
     * Get the DOM element of the noodel's outmost container, i.e. nd-canvas.
     */
    getEl(): HTMLDivElement {
        return this._s.r.canvasEl;
    }

    /**
     * Get the options applied to this node.
     * Return a cloned object.
     */
    getOptions(): NoodelOptions {
        return {
            ...this._s.options
        };
    }

    /**
     * Get the level of the current focal branch. The first branch has level 1.
     */
    getFocalLevel(): number {
        return this._s.focalLevel;
    }

    /**
     * Get the height (total number of levels) in the current active tree,
     * excluding the root.
     */
    getActiveTreeHeight(): number {
        let count = 0;
        let currentParent = this._s.root;

        while (currentParent.activeChildIndex !== null) {
            count++;
            currentParent = getActiveChild(currentParent);
        }

        return count;
    }

    /**
     * Get the number of nodes in this noodel (excluding the root).
     */
    getNodeCount(): number {
        return this._s.r.idMap.size - 1;
    }

    /**
     * Get the root node. The root is an invisible node
     * that serves as the parent of the topmost branch, and always exists.
     */
    getRoot(): NoodelNode {
        return this._s.root.r.vm;
    }

    /**
     * Get the parent node of the current focal branch. Return the root
     * if there's no focal branch (i.e. noodel is empty).
     */
    getFocalParent(): NoodelNode {
        return this._s.focalParent.r.vm;
    }

    /**
     * Get the focal node. Return null if noodel is empty.
     */
    getFocalNode(): NoodelNode {
        let focalNode =  getFocalNode(this._s);
        
        return focalNode ? focalNode.r.vm : null;
    }

    /**
     * Get the node at the given path, an array of 0-based indices
     * starting from the root. Return null if no such node exist.
     */
    findNodeByPath(path: number[]): NoodelNode {
        let target = _findNodeByPath(this._s, path);
        
        return target ? target.r.vm : null;
    }

    /**
     * Get the node with the given ID. Return null if no such node exist.
     */
    findNodeById(id: string): NoodelNode {
        let target = findNode(this._s, id);
        
        return target ? target.r.vm : null;
    }

    /**
     * Check if this noodel is in inspect mode.
     */
    isInInspectMode(): boolean {
        return this._s.isInInspectMode;
    }

    // MUTATERS

    /**
     * Change the options of the noodel. Properties of the given object
     * will be merged into the current options.
     */
    setOptions(options: NoodelOptions) {
        parseAndApplyOptions(options, this._s);
    }
    
    /**
     * Navigate the noodel to focus on the branch at the given level of
     * the active tree. If the level is greater or smaller than
     * the possible limits, will navigate to the furthest level in that direction.
     */
    setFocalLevel(level: number) {
        shiftFocalLevel(this._s, level - this._s.focalLevel);
    }

    /**
     * Navigate towards the child branches of the current
     * focal node.
     * @param levelCount number of levels to move, defaults to 1
     */
    moveIn(levelCount: number = 1) {
        shiftFocalLevel(this._s, levelCount);
    }

    /**
     * Navigate towards the parent branches of the current
     * focal node.
     * @param levelCount number of levels to move, defaults to 1
     */
    moveOut(levelCount: number = 1) {
        shiftFocalLevel(this._s, -levelCount);
    }

    /**
     * Navigate towards the next siblings of the current
     * focal node.
     * @param nodeCount number of nodes to move, defaults to 1
     */
    moveForward(nodeCount: number = 1) {
        shiftFocalNode(this._s, nodeCount);
    }

    /**
     * Navigate towards the previous siblings of the current
     * focal node.
     * @param nodeCount number of nodes to move, defaults to 1
     */
    moveBack(nodeCount: number = 1) {
        shiftFocalNode(this._s, -nodeCount);
    }

    /**
     * Turn inspect mode on/off.
     */
    toggleInspectMode(on: boolean) {
        if (on) {
            enterInspectMode(this._s);
        }
        else {
            exitInspectMode(this._s);
        }
    }

    // EVENT

    /**
     * Attach an event listener on this noodel.
     * @param ev event name
     * @param listener event listener to attach
     */
    on<E extends keyof NoodelEventMap>(ev: E, listener: NoodelEventMap[E]) {
        this._s.r.eventListeners.get(ev).push(listener);
    }

    /**
     * Remove an event listener from this noodel.
     * @param ev event name
     * @param listener the event listener to remove, by reference comparison
     */
    off<E extends keyof NoodelEventMap>(ev: E, listener: NoodelEventMap[E]) {
        let handlers = this._s.r.eventListeners.get(ev);
        let index = handlers.indexOf(listener);

        if (index > -1) handlers.splice(index, 1);
    }
}
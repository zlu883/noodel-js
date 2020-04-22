import Noode from '../model/Noode';
import NoodelOptions from '../model/NoodelOptions';
import NoodeView from '../model/NoodeView';
import NoodelView from '@/model/NoodelView';
import { getActiveChild } from '@/getters/getters';
import { ResizeSensor } from 'css-element-queries';
import { setActiveSubtreeVisibility, setActiveChild } from './noodel-mutate';
import { traverseDescendents } from './noodel-traverse';

export function setupNoodel(idCounter: {n: number}, root: Noode, options?: NoodelOptions): NoodelView {

    let rootNoode = buildNoodeView(idCounter, root);
    let noodelOptions = buildOptions(options);
    let focalParent = rootNoode;
    let focalLevel = 0;

    traverseDescendents(rootNoode, noode => setActiveChild(noode, noode.activeChildIndex), true);

    if (noodelOptions.initialPath && noodelOptions.initialPath.length > 0) {
        for (let i = 0; i < noodelOptions.initialPath.length; i++) {
            let nextIndex = noodelOptions.initialPath[i];
    
            if (typeof nextIndex !== "number" || nextIndex < 0 || nextIndex > focalParent.children.length) {
                throw new Error("Invalid initial path at index " + i);
            }
    
            setActiveChild(focalParent, nextIndex);

            if (i < noodelOptions.initialPath.length - 1) { // only when not in last iteration
                focalParent = getActiveChild(focalParent);
            }          
        }
    
        focalLevel = noodelOptions.initialPath.length - 1;       
    }

    focalParent.isFocalParent = true;
    setActiveSubtreeVisibility(rootNoode, true, focalLevel + noodelOptions.visibleSubtreeDepth);
    
    return {
        root: rootNoode,
        focalParent: focalParent,
        focalLevel: focalLevel,
        
        trunkOffset: 0,
        trunkOffsetOrigin: 0,
        trunkRelativeOffset: 0,
    
        showLimits: {
            top: false,
            bottom: false,
            left: false,
            right: false
        },
        movingAxis: null,
        hasPress: false,
        hasSwipe: false,

        lastSwipeDelta: 0,
        totalSwipeDelta: 0,

        containerSize: {
            x: 0,
            y: 0
        },
        
        options: noodelOptions
    }
}

/**
 * Recursively parses the given HTML element into a noode tree. 
 */
export function parseHTMLToNoode(el: Element): Noode {

    let id = el.getAttribute('data-id');
    let activeChildIndex = 0;
    let content = '';
    let noodeCount = 0;
    let children: Noode[] = [];

    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent; // Depends on css white-space property for ignoring white spaces
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName === "DIV" && (node as Element).className.split(' ').some(c => c === 'noode')) {
                noodeCount++;

                if ((node as Element).hasAttribute('data-active')) {
                    activeChildIndex = noodeCount - 1;
                }

                children.push(parseHTMLToNoode(node as Element));
            }
            else {
                content += (node as Element).outerHTML; // Depends on css white-space property for ignoring white spaces
            }
        }
    }

    return {
        id: id,
        content: content,
        activeChildIndex: children.length > 0 ? activeChildIndex : null,
        children: children
    };
}

export function setupContainer(el: Element, noodel: NoodelView) {

    let rect = el.getBoundingClientRect();

    noodel.containerSize.x = rect.width;
    noodel.containerSize.y = rect.height;

    new ResizeSensor(el, (size) => {
        noodel.containerSize.x = size.width,
        noodel.containerSize.y = size.height
    });
}

/**
 * Recursively parses the input noode tree and adds properties to 
 * each noode to make it into a NoodeView. Necessary before initializing Vue
 * as Vue will not bind undefined properties.
 */
function buildNoodeView(idCounter: {n: number}, noode: Noode): NoodeView {
    let noodeView = noode as NoodeView;
    
    if (typeof noodeView.id !== 'string') {
        noodeView.id = generateNoodeId(idCounter);
    }

    if (!Array.isArray(noodeView.children)) {
        noodeView.children = [];
    }

    if (typeof noodeView.activeChildIndex !== 'number') {
        noodeView.activeChildIndex = noodeView.children.length > 0 ? 0 : null;
    }
    else if (noodeView.activeChildIndex < 0 || noodeView.activeChildIndex >= noodeView.children.length) {
        console.warn("Invalid initial active child index for noode ID " + noodeView.id);

        noodeView.activeChildIndex = noodeView.children.length > 0 ? 0 : null;
    }

    if (!noodeView.content) {
        noodeView.content = null;
    }

    noodeView.isChildrenVisible = false;
    noodeView.isFocalParent = false;
    noodeView.isActive = false;
    noodeView.size = 0;
    noodeView.branchOffset = 0;
    noodeView.branchOffsetOrigin = 0;
    noodeView.branchRelativeOffset = 0;
    noodeView.branchSize = 0;

    noodeView.children.forEach(child => {
        child.parent = noodeView;
        buildNoodeView(idCounter, child);
    });

    return noodeView;
}

/**
 * Parses the options object and adds undefined properties that should be reactive. 
 * Necessary before initializing Vue as Vue will not bind undefined properties.
 */
function buildOptions(options?: NoodelOptions): NoodelOptions {
    if (!options) options = {};

    if (typeof options.visibleSubtreeDepth !== "number") {
        options.visibleSubtreeDepth = 1;
    }

    if (typeof options.snapDuration !== "number") {
        options.snapDuration = 600;
    }

    return options;
}

function generateNoodeId(idCounter: {n: number}) {
    idCounter.n++;
    return 'n_' + idCounter.n.toString();
}